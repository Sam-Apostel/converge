import Observation
import SwiftUI

@MainActor
@Observable
final class AiSettingsModel {
    var provider = "ollama"
    var modelName = ""
    var baseURL = ""
    var apiKeyInput = ""
    var hasKey = false
    var state: LoadState = .loading
    var saving = false
    var saved = false

    func load() async {
        do {
            let s: AiSettings = try await APIClient.shared.get("/api/ai-settings")
            provider = s.provider
            modelName = s.model ?? ""
            baseURL = s.baseUrl ?? ""
            hasKey = s.hasKey
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }

    func save() async {
        saving = true
        saved = false
        struct Body: Encodable {
            let provider: String
            let model: String?
            let apiKey: String?
            let baseUrl: String?
        }
        let key = apiKeyInput.trimmingCharacters(in: .whitespaces)
        let body = Body(
            provider: provider,
            model: modelName.trimmingCharacters(in: .whitespaces).isEmpty ? nil : modelName,
            apiKey: key.isEmpty ? nil : key,
            baseUrl: baseURL.trimmingCharacters(in: .whitespaces).isEmpty ? nil : baseURL
        )
        do {
            let s: AiSettings = try await APIClient.shared.send("/api/ai-settings", method: "PATCH", body: body)
            hasKey = s.hasKey
            apiKeyInput = ""
            saved = true
        } catch {}
        saving = false
    }
}

struct AiSettingsView: View {
    @State private var model = AiSettingsModel()
    @AppStorage("converge.useOnDeviceAI") private var useOnDevice = true

    private let providers = ["ollama", "openai", "anthropic", "openrouter"]

    var body: some View {
        Form {
            Section("Engine") {
                Toggle("On-device (Apple Intelligence)", isOn: $useOnDevice)
                    .disabled(!OnDeviceConcierge.isAvailable)
                if let reason = OnDeviceConcierge.unavailableReason {
                    Text(reason).font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                } else {
                    Text("Runs locally on your iPhone — no API key, works offline. Falls back to the provider below.")
                        .font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                }
            }
            Section("Provider (fallback)") {
                Picker("Provider", selection: $model.provider) {
                    ForEach(providers, id: \.self) { Text(label($0)).tag($0) }
                }
                TextField("Model (e.g. claude-opus-4-8)", text: $model.modelName)
                    .textInputAutocapitalization(.never).autocorrectionDisabled()
            }
            if model.provider != "ollama" {
                Section("API key") {
                    SecureField(model.hasKey ? "•••••• (leave blank to keep)" : "Paste your key", text: $model.apiKeyInput)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    if model.hasKey {
                        Text("A key is stored (encrypted).").font(TypeRamp.caption()).foregroundStyle(Palette.limeDeep)
                    }
                }
            } else {
                Section("Ollama") {
                    TextField("Base URL (optional)", text: $model.baseURL)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    Text("Falls back to a local Ollama server — usually not reachable from a phone on the deployed backend.")
                        .font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                }
            }
            Section {
                Button(action: { Task { await model.save() } }) {
                    HStack { if model.saving { ProgressView() }; Text("Save") }
                }
                .disabled(model.saving)
                if model.saved {
                    Text("Saved.").font(TypeRamp.caption()).foregroundStyle(Palette.limeDeep)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Palette.canvas)
        .navigationTitle("AI concierge")
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load() }
    }

    private func label(_ id: String) -> String {
        switch id {
        case "openai": "OpenAI"
        case "anthropic": "Anthropic"
        case "openrouter": "OpenRouter"
        default: "Ollama (local)"
        }
    }
}
