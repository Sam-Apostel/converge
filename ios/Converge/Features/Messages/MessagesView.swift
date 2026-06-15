import Observation
import SwiftUI

struct MessageThread: Identifiable {
    let otherId: String
    let name: String
    let image: String?
    let last: MessageRow
    let unread: Int
    var id: String { otherId }
}

@MainActor
@Observable
final class MessagesModel {
    var threads: [MessageThread] = []
    var state: LoadState = .loading

    func load(me: String) async {
        if threads.isEmpty { state = .loading }
        do {
            async let msgs: [MessageRow] = APIClient.shared.get("/api/messages")
            async let people: [Person] = APIClient.shared.get("/api/people")
            let (messages, directory) = try await (msgs, people)
            let byId = Dictionary(uniqueKeysWithValues: directory.map { ($0.id, $0) })

            var latest: [String: MessageRow] = [:]
            var unread: [String: Int] = [:]
            for m in messages {
                let other = m.fromUserId == me ? m.toUserId : m.fromUserId
                if let cur = latest[other], cur.createdAt > m.createdAt {} else { latest[other] = m }
                if m.toUserId == me && m.readAt == nil { unread[other, default: 0] += 1 }
            }
            threads = latest.map { other, last in
                MessageThread(
                    otherId: other,
                    name: byId[other]?.name ?? "Unknown",
                    image: byId[other]?.image,
                    last: last,
                    unread: unread[other] ?? 0
                )
            }
            .sorted { $0.last.createdAt > $1.last.createdAt }
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }
}

struct MessagesView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = MessagesModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            if model.state == .loaded { list } else {
                StateOverlay(state: model.state) { Task { await reload() } }
            }
        }
        .navigationTitle("Messages")
        .task { await reload() }
    }

    private func reload() async {
        guard let me = session.currentUser?.id else { return }
        await model.load(me: me)
    }

    private var list: some View {
        ScrollView {
            VStack(spacing: 10) {
                ForEach(model.threads) { thread in
                    NavigationLink(value: MessageTarget(userId: thread.otherId, name: thread.name)) {
                        ThreadRow(thread: thread)
                    }
                    .buttonStyle(.plain)
                }
                if model.threads.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "envelope").font(.system(size: 28)).foregroundStyle(Palette.faint)
                        Text("No messages yet.").font(TypeRamp.note()).foregroundStyle(Palette.mist)
                        Text("Message someone from their profile.")
                            .font(TypeRamp.caption()).foregroundStyle(Palette.faint)
                    }
                    .frame(maxWidth: .infinity).padding(.top, 60)
                }
            }
            .padding(.horizontal, 20).padding(.bottom, 24)
        }
        .refreshable { await reload() }
    }
}

struct ThreadRow: View {
    let thread: MessageThread
    var body: some View {
        SoftCard {
            HStack(spacing: 12) {
                Avatar(name: thread.name, image: thread.image, size: 46)
                VStack(alignment: .leading, spacing: 3) {
                    Text(thread.name).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink)
                    Text(thread.last.body).font(TypeRamp.caption()).foregroundStyle(Palette.mist).lineLimit(1)
                }
                Spacer(minLength: 0)
                VStack(alignment: .trailing, spacing: 4) {
                    Text(Format.relative(thread.last.createdAt)).font(TypeRamp.tiny()).foregroundStyle(Palette.faint)
                    if thread.unread > 0 {
                        Text("\(thread.unread)").font(TypeRamp.tiny().weight(.bold)).foregroundStyle(Palette.ink)
                            .padding(.horizontal, 7).padding(.vertical, 2)
                            .background(Palette.lime, in: .capsule)
                    }
                }
            }
        }
    }
}
