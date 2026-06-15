import Observation
import SwiftUI

@MainActor
@Observable
final class ConversationModel {
    var messages: [MessageRow] = []
    var state: LoadState = .loading
    var draft = ""
    let realtime = Realtime()

    func load(with other: String, me: String) async {
        if messages.isEmpty { state = .loading }
        do {
            messages = try await APIClient.shared.get("/api/messages", query: [.init(name: "with", value: other)])
            state = .loaded
            struct Mark: Encodable { let with: String }
            try? await APIClient.shared.fire("/api/messages", method: "PATCH", body: Mark(with: other))
            realtime.connect(channel: "user:\(me)") { [weak self] _, _ in
                Task { await self?.refresh(with: other) }
            }
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }

    private func refresh(with other: String) async {
        if let rows: [MessageRow] = try? await APIClient.shared.get(
            "/api/messages", query: [.init(name: "with", value: other)]
        ) { messages = rows }
    }

    func stop() { realtime.disconnect() }

    func send(to other: String) async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        struct Body: Encodable { let toUserId: String; let body: String }
        do {
            let sent: MessageRow = try await APIClient.shared.send(
                "/api/messages", method: "POST", body: Body(toUserId: other, body: text)
            )
            messages.append(sent)
            draft = ""
        } catch {}
    }
}

struct ConversationView: View {
    let otherUserId: String
    let otherName: String
    @Environment(SessionStore.self) private var session
    @State private var model = ConversationModel()

    private var me: String { session.currentUser?.id ?? "" }

    var body: some View {
        ZStack {
            CanvasBackground()
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(model.messages) { m in
                                MessageBubble(message: m, mine: m.fromUserId == me)
                                    .id(m.id)
                            }
                        }
                        .padding(.horizontal, 16).padding(.vertical, 14)
                    }
                    .onChange(of: model.messages.count) {
                        if let last = model.messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                    }
                }
                composer
            }
        }
        .navigationTitle(otherName)
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load(with: otherUserId, me: me) }
        .onDisappear { model.stop() }
    }

    private var composer: some View {
        HStack(spacing: 8) {
            TextField("Message…", text: $model.draft, axis: .vertical)
                .font(TypeRamp.body())
                .padding(.horizontal, 12).padding(.vertical, 10)
                .background(Palette.surface, in: .rect(cornerRadius: 18))
            Button { Task { await model.send(to: otherUserId) } } label: {
                Image(systemName: "paperplane.fill").foregroundStyle(Palette.ink)
                    .frame(width: 40, height: 40).background(Palette.lime, in: .circle)
            }
            .buttonStyle(.plain)
            .disabled(model.draft.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(.bar)
    }
}

struct MessageBubble: View {
    let message: MessageRow
    let mine: Bool
    var body: some View {
        HStack {
            if mine { Spacer(minLength: 40) }
            Text(message.body)
                .font(TypeRamp.reading())
                .foregroundStyle(mine ? Palette.ink : Palette.ink)
                .padding(.horizontal, 14).padding(.vertical, 9)
                .background(mine ? Palette.lime.opacity(0.85) : Palette.surface,
                            in: .rect(cornerRadius: 18))
            if !mine { Spacer(minLength: 40) }
        }
    }
}
