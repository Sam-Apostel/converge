import SwiftUI

struct LoginView: View {
    @Environment(SessionStore.self) private var session

    @State private var mode: Mode = .signIn
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var error: String?
    @State private var busy = false

    enum Mode { case signIn, signUp }

    var body: some View {
        ZStack {
            CanvasBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 10) {
                            ConvergeLogo(size: 26)
                            Text("Converge").eyebrow()
                        }
                        Text(mode == .signIn ? "Welcome back" : "Join the room")
                            .font(TypeRamp.title())
                            .foregroundStyle(Palette.ink)
                        Text("The conference companion that makes the people around you visible.")
                            .font(TypeRamp.note())
                            .foregroundStyle(Palette.mist)
                    }
                    .padding(.top, 48)

                    GlassCard(padding: 20) {
                        VStack(alignment: .leading, spacing: 14) {
                            if mode == .signUp {
                                Field(title: "Name", text: $name, content: .name)
                            }
                            Field(title: "Email", text: $email, content: .email)
                            Field(title: "Password", text: $password, content: .password)

                            if let error {
                                Text(error)
                                    .font(TypeRamp.caption())
                                    .foregroundStyle(Palette.danger)
                            }

                            Button(action: submit) {
                                HStack {
                                    if busy { ProgressView().tint(Palette.ink) }
                                    Text(mode == .signIn ? "Sign in" : "Create account")
                                        .font(TypeRamp.body().weight(.semibold))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .foregroundStyle(Palette.ink)
                                .background(Palette.lime, in: .capsule)
                            }
                            .buttonStyle(.plain)
                            .disabled(busy || !isValid)
                            .opacity(isValid ? 1 : 0.5)
                        }
                    }

                    HStack(spacing: 10) {
                        Rectangle().fill(Palette.edge).frame(height: 1)
                        Text("or").font(TypeRamp.caption()).foregroundStyle(Palette.faint)
                        Rectangle().fill(Palette.edge).frame(height: 1)
                    }

                    Button(action: signInGitHub) {
                        Label("Continue with GitHub", systemImage: "chevron.left.forwardslash.chevron.right")
                            .font(TypeRamp.body().weight(.semibold))
                            .frame(maxWidth: .infinity).padding(.vertical, 12)
                            .foregroundStyle(Palette.surface)
                            .background(Palette.ink, in: .capsule)
                    }
                    .buttonStyle(.plain)

                    Button(action: signInPasskey) {
                        Label("Sign in with a passkey", systemImage: "person.badge.key")
                            .font(TypeRamp.body().weight(.medium))
                            .frame(maxWidth: .infinity).padding(.vertical, 12)
                            .foregroundStyle(Palette.ink)
                            .background(Palette.pillow, in: .capsule)
                    }
                    .buttonStyle(.plain)

                    Button {
                        withAnimation { mode = mode == .signIn ? .signUp : .signIn; error = nil }
                    } label: {
                        Text(mode == .signIn
                             ? "New here? Create an account"
                             : "Already have an account? Sign in")
                            .font(TypeRamp.note())
                            .foregroundStyle(Palette.slate)
                    }
                    .frame(maxWidth: .infinity)
                }
                .padding(24)
            }
        }
    }

    private var isValid: Bool {
        email.contains("@") && password.count >= 8 && (mode == .signIn || !name.isEmpty)
    }

    private func submit() {
        busy = true
        error = nil
        Task {
            do {
                if mode == .signIn {
                    try await session.signIn(email: email, password: password)
                } else {
                    try await session.signUp(name: name, email: email, password: password)
                }
            } catch {
                self.error = friendly(error)
            }
            busy = false
        }
    }

    private func signInGitHub() {
        busy = true; error = nil
        Task {
            do { try await NativeAuth.shared.signInWithGitHub(); await session.refresh() }
            catch { self.error = friendly(error) }
            busy = false
        }
    }

    private func signInPasskey() {
        busy = true; error = nil
        Task {
            do { try await NativeAuth.shared.signInWithPasskey(); await session.refresh() }
            catch { self.error = friendly(error) }
            busy = false
        }
    }

    private func friendly(_ error: Error) -> String {
        let raw = (error as? APIClient.APIError)?.message ?? error.localizedDescription
        if raw.contains("INVALID") || raw.lowercased().contains("password") || raw.lowercased().contains("credential") {
            return "Wrong email or password."
        }
        if raw.lowercased().contains("exist") { return "An account with that email already exists." }
        return raw.count > 140 ? "Something went wrong. Please try again." : raw
    }
}

/// Small labeled input with the Converge field styling.
private struct Field: View {
    let title: String
    @Binding var text: String
    var content: Kind

    enum Kind { case name, email, password }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).eyebrow()
            GlassField {
                Group {
                    switch content {
                    case .password: SecureField("", text: $text)
                    case .email:
                        TextField("", text: $text)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    case .name:
                        TextField("", text: $text)
                            .textContentType(.name)
                    }
                }
                .font(TypeRamp.body())
                .foregroundStyle(Palette.ink)
            }
        }
    }
}

#Preview {
    LoginView().environment(SessionStore())
}
