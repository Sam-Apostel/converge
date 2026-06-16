import AuthenticationServices
import Foundation
import UIKit

private extension Data {
    var base64url: String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
    init?(base64url s: String) {
        var b = s.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        while b.count % 4 != 0 { b += "=" }
        self.init(base64Encoded: b)
    }
}

/// Native sign-in ceremonies: GitHub OAuth via `ASWebAuthenticationSession`
/// (the session cookie is bridged back through the deep-link `?cookie=` param),
/// and passkeys via `ASAuthorization` against the better-auth passkey endpoints.
@MainActor
final class NativeAuth: NSObject {
    static let shared = NativeAuth()

    enum AuthError: LocalizedError {
        case cancelled, badResponse(String)
        var errorDescription: String? {
            switch self {
            case .cancelled: "Cancelled."
            case let .badResponse(m): m
            }
        }
    }

    private var webSession: ASWebAuthenticationSession?
    private var passkeyContinuation: CheckedContinuation<ASAuthorization, Error>?

    // MARK: - GitHub OAuth

    func signInWithGitHub() async throws {
        struct Req: Encodable { let provider = "github"; let callbackURL = "converge://auth" }
        struct Resp: Decodable { let url: String? }
        let resp: Resp = try await APIClient.shared.send("/api/auth/sign-in/social", method: "POST", body: Req())
        guard let urlString = resp.url, let url = URL(string: urlString) else {
            throw AuthError.badResponse("GitHub sign-in isn't configured on the server.")
        }
        let callback = try await runWebAuth(url: url, scheme: "converge")
        injectCookie(from: callback)
    }

    private func runWebAuth(url: URL, scheme: String) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { callback, error in
                if let callback { continuation.resume(returning: callback) }
                else { continuation.resume(throwing: error ?? AuthError.cancelled) }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            webSession = session
            session.start()
        }
    }

    /// Bridge the better-auth session cookie carried on the deep-link callback
    /// into the shared cookie store so subsequent API calls are authenticated.
    private func injectCookie(from callback: URL) {
        guard
            let items = URLComponents(url: callback, resolvingAgainstBaseURL: false)?.queryItems,
            let cookieHeader = items.first(where: { $0.name == "cookie" })?.value
        else { return }
        let cookies = HTTPCookie.cookies(
            withResponseHeaderFields: ["Set-Cookie": cookieHeader],
            for: APIClient.shared.baseURL
        )
        cookies.forEach { HTTPCookieStorage.shared.setCookie($0) }
    }

    // MARK: - Passkeys

    private var rpID: String { APIClient.shared.baseURL.host ?? "converge.sams.land" }

    /// Register a passkey for the signed-in user.
    func registerPasskey(displayName: String) async throws {
        struct Options: Decodable {
            struct User: Decodable { let id: String; let name: String }
            let challenge: String
            let user: User
        }
        let options: Options = try await APIClient.shared.send(
            "/api/auth/passkey/generate-register-options", method: "POST", body: Optional<Int>.none
        )
        guard let challenge = Data(base64url: options.challenge),
              let userID = Data(base64url: options.user.id) else {
            throw AuthError.badResponse("Bad registration options.")
        }

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rpID)
        let request = provider.createCredentialRegistrationRequest(
            challenge: challenge, name: options.user.name, userID: userID
        )
        let auth = try await performAuthorization(request)
        guard let reg = auth.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration,
              let attestation = reg.rawAttestationObject else {
            throw AuthError.badResponse("Registration failed.")
        }

        struct Inner: Encodable { let clientDataJSON: String; let attestationObject: String }
        struct Body: Encodable {
            let id: String; let rawId: String; let type = "public-key"
            let authenticatorAttachment = "platform"
            let response: Inner
            let name: String
        }
        let credID = reg.credentialID.base64url
        try await APIClient.shared.fire("/api/auth/passkey/verify-registration", method: "POST", body: Body(
            id: credID, rawId: credID,
            response: Inner(clientDataJSON: reg.rawClientDataJSON.base64url, attestationObject: attestation.base64url),
            name: displayName
        ))
    }

    /// Sign in with a passkey (discoverable credential).
    func signInWithPasskey() async throws {
        struct Options: Decodable {
            struct Cred: Decodable { let id: String }
            let challenge: String
            let allowCredentials: [Cred]?
        }
        let options: Options = try await APIClient.shared.send(
            "/api/auth/passkey/generate-authenticate-options", method: "POST", body: Optional<Int>.none
        )
        guard let challenge = Data(base64url: options.challenge) else {
            throw AuthError.badResponse("Bad authentication options.")
        }

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rpID)
        let request = provider.createCredentialAssertionRequest(challenge: challenge)
        if let creds = options.allowCredentials, !creds.isEmpty {
            request.allowedCredentials = creds.compactMap { Data(base64url: $0.id) }
                .map { ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: $0) }
        }
        let auth = try await performAuthorization(request)
        guard let assertion = auth.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion else {
            throw AuthError.badResponse("Authentication failed.")
        }

        struct Inner: Encodable {
            let clientDataJSON: String; let authenticatorData: String
            let signature: String; let userHandle: String?
        }
        struct Body: Encodable {
            let id: String; let rawId: String; let type = "public-key"
            let authenticatorAttachment = "platform"
            let response: Inner
        }
        let credID = assertion.credentialID.base64url
        try await APIClient.shared.fire("/api/auth/passkey/verify-authentication", method: "POST", body: Body(
            id: credID, rawId: credID,
            response: Inner(
                clientDataJSON: assertion.rawClientDataJSON.base64url,
                authenticatorData: assertion.rawAuthenticatorData.base64url,
                signature: assertion.signature.base64url,
                userHandle: assertion.userID.base64url
            )
        ))
    }

    private func performAuthorization(_ request: ASAuthorizationRequest) async throws -> ASAuthorization {
        try await withCheckedThrowingContinuation { continuation in
            passkeyContinuation = continuation
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }
}

extension NativeAuth: ASWebAuthenticationPresentationContextProviding, ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor { anchor() }
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor { anchor() }

    private func anchor() -> ASPresentationAnchor {
        let scene = UIApplication.shared.connectedScenes.first { $0.activationState == .foregroundActive } as? UIWindowScene
        return scene?.keyWindow ?? ASPresentationAnchor()
    }
}

extension NativeAuth: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        passkeyContinuation?.resume(returning: authorization)
        passkeyContinuation = nil
    }
    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        passkeyContinuation?.resume(throwing: error)
        passkeyContinuation = nil
    }
}
