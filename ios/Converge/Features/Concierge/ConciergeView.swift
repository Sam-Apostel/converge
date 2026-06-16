import Observation
import SwiftUI

struct ChatMessage: Identifiable, Hashable {
    let id = UUID()
    let role: String // "user" | "assistant"
    var content: String
}

@MainActor
@Observable
final class ConciergeModel {
    var messages: [ChatMessage] = []
    var draft = ""
    var thinking = false
    var error: String?

    func send() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !thinking else { return }
        messages.append(ChatMessage(role: "user", content: text))
        draft = ""
        thinking = true
        error = nil

        struct Wire: Encodable { let role: String; let content: String }
        struct Body: Encodable { let messages: [Wire] }
        struct Reply: Decodable { let text: String?; let error: String? }

        let payload = Body(messages: messages.map { Wire(role: $0.role, content: $0.content) })
        do {
            let reply: Reply = try await APIClient.shared.send("/api/concierge/ask", method: "POST", body: payload)
            if let text = reply.text, !text.isEmpty {
                messages.append(ChatMessage(role: "assistant", content: text))
            } else {
                error = reply.error ?? "No response."
            }
        } catch {
            self.error = conciergeError(error)
        }
        thinking = false
    }

    private func conciergeError(_ error: Error) -> String {
        let raw = (error as? APIClient.APIError)?.message ?? error.localizedDescription
        if raw.contains("Ollama") || raw.contains("502") || raw.lowercased().contains("provider") || raw.lowercased().contains("key") {
            return "The concierge needs an AI provider. Add a key in Settings → AI."
        }
        return raw.count > 160 ? "The concierge is unavailable right now." : raw
    }
}

struct ConciergeView: View {
    @State private var model = ConciergeModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            if model.messages.isEmpty { intro }
                            ForEach(model.messages) { m in
                                ChatRow(message: m).id(m.id)
                            }
                            if model.thinking {
                                HStack(spacing: 8) {
                                    ProgressView().tint(Palette.mist)
                                    Text("Thinking…").font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                                }
                            }
                            if let error = model.error {
                                Text(error).font(TypeRamp.caption()).foregroundStyle(Palette.danger)
                            }
                        }
                        .padding(20)
                    }
                    .onChange(of: model.messages.count) {
                        if let last = model.messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                    }
                }
                composer
            }
        }
        .navigationTitle("Concierge")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var intro: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) { ConvergeLogo(size: 20); Text("Concierge").eyebrow() }
                Text("Ask who to meet, what to see next, or which projects match what you're building.")
                    .font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft)
                VStack(alignment: .leading, spacing: 6) {
                    suggestion("Who should I meet about local-first apps?")
                    suggestion("What talks are coming up on AI agents?")
                }
            }
        }
    }

    private func suggestion(_ text: String) -> some View {
        Button { model.draft = text } label: {
            Text(text).font(TypeRamp.caption()).foregroundStyle(Palette.slate)
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background(Palette.pillow, in: .capsule)
        }
        .buttonStyle(.plain)
    }

    private var composer: some View {
        HStack(spacing: 8) {
            GlassField(radius: 18) {
                TextField("Ask the concierge…", text: $model.draft, axis: .vertical)
                    .font(TypeRamp.body())
            }
            Button { Task { await model.send() } } label: {
                Image(systemName: "arrow.up").foregroundStyle(Palette.ink)
                    .frame(width: 40, height: 40).background(Palette.lime, in: .circle)
            }
            .buttonStyle(.plain)
            .disabled(model.thinking || model.draft.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(.bar)
    }
}

struct ChatRow: View {
    let message: ChatMessage
    private var mine: Bool { message.role == "user" }

    var body: some View {
        HStack {
            if mine { Spacer(minLength: 40) }
            Text(message.content)
                .font(TypeRamp.reading())
                .foregroundStyle(Palette.ink)
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(mine ? Palette.lime.opacity(0.85) : Palette.surface, in: .rect(cornerRadius: 18))
                .frame(maxWidth: .infinity, alignment: mine ? .trailing : .leading)
            if !mine { Spacer(minLength: 40) }
        }
    }
}
