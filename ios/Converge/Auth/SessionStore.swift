import Foundation
import Observation

struct AuthUser: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var email: String
    var image: String?
}

/// Owns the signed-in state. better-auth keeps the session in a cookie that
/// `URLSession` persists, so on launch we just ask the server who we are.
@MainActor
@Observable
final class SessionStore {
    enum State: Equatable {
        case loading
        case signedOut
        case signedIn(AuthUser)
    }

    private(set) var state: State = .loading

    var currentUser: AuthUser? {
        if case let .signedIn(user) = state { return user }
        return nil
    }

    private struct SessionResponse: Decodable {
        let user: AuthUser?
    }

    /// Resolve the current session on launch (or after base-URL change).
    func bootstrap() async {
        await refresh()
    }

    func refresh() async {
        do {
            let data = try await APIClient.shared.rawData(
                "/api/auth/get-session", method: "GET", query: [], body: Optional<Int>.none
            )
            let trimmed = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed == nil || trimmed!.isEmpty || trimmed == "null" {
                state = .signedOut
                return
            }
            let res = try APIClient.shared.decoder.decode(SessionResponse.self, from: data)
            state = res.user.map(State.signedIn) ?? .signedOut
        } catch {
            state = .signedOut
        }
    }

    func signIn(email: String, password: String) async throws {
        struct Body: Encodable { let email: String; let password: String }
        try await APIClient.shared.fire(
            "/api/auth/sign-in/email", method: "POST",
            body: Body(email: email, password: password)
        )
        await refresh()
    }

    func signUp(name: String, email: String, password: String) async throws {
        struct Body: Encodable { let name: String; let email: String; let password: String }
        try await APIClient.shared.fire(
            "/api/auth/sign-up/email", method: "POST",
            body: Body(name: name, email: email, password: password)
        )
        await refresh()
    }

    func signOut() async {
        try? await APIClient.shared.fire(
            "/api/auth/sign-out", method: "POST", body: Optional<Int>.none
        )
        state = .signedOut
    }
}
