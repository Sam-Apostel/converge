import SwiftUI

struct SettingsView: View {
    @Environment(SessionStore.self) private var session
    @State private var baseURL = APIClient.shared.baseURL.absoluteString
    @State private var saved = false

    var body: some View {
        Form {
            Section("Server") {
                TextField("Base URL", text: $baseURL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                Button("Use this server") {
                    APIClient.shared.setBaseURL(baseURL.trimmingCharacters(in: .whitespaces))
                    saved = true
                    Task { await session.bootstrap() }
                }
                if saved {
                    Text("Saved. Re-checking session…").font(TypeRamp.caption()).foregroundStyle(Palette.limeDeep)
                }
                Button("Reset to default") {
                    APIClient.shared.setBaseURL(APIClient.defaultBaseURL)
                    baseURL = APIClient.defaultBaseURL
                }
            }
            Section("Concierge") {
                NavigationLink(value: HubRoute.aiSettings) {
                    Label("AI provider", systemImage: "sparkles")
                }
            }
            Section("Account") {
                if let user = session.currentUser {
                    LabeledContent("Signed in", value: user.email)
                }
                Button("Sign out", role: .destructive) { Task { await session.signOut() } }
            }
            Section {
                LabeledContent("App", value: "Converge for iOS")
                LabeledContent("Version", value: "0.1.0")
            }
        }
        .scrollContentBackground(.hidden)
        .background(Palette.canvas)
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}
