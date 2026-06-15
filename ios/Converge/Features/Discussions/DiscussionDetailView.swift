import Observation
import SwiftUI

@MainActor
@Observable
final class DiscussionDetailModel {
    var detail: DiscussionDetail?
    var state: LoadState = .loading
    var draft = ""
    var posting = false
    let realtime = Realtime()

    func load(id: String) async {
        if detail == nil { state = .loading }
        do {
            detail = try await APIClient.shared.get("/api/discussions/\(id)")
            state = .loaded
            realtime.connect(channel: "discussion:\(id)") { [weak self] _, _ in
                Task { await self?.refresh(id: id) }
            }
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }

    private func refresh(id: String) async {
        if let fresh: DiscussionDetail = try? await APIClient.shared.get("/api/discussions/\(id)") {
            detail = fresh
        }
    }

    func stop() { realtime.disconnect() }

    func reply(id: String) async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        posting = true
        struct Body: Encodable { let body: String }
        do {
            try await APIClient.shared.fire("/api/discussions/\(id)/posts", method: "POST", body: Body(body: text))
            draft = ""
            await load(id: id)
        } catch {}
        posting = false
    }
}

struct DiscussionDetailView: View {
    let id: String
    @State private var model = DiscussionDetailModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            if let detail = model.detail {
                VStack(spacing: 0) {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            VStack(alignment: .leading, spacing: 6) {
                                if let topic = detail.topic { Pill(text: topic) }
                                Text(detail.title).font(TypeRamp.title()).foregroundStyle(Palette.ink)
                            }
                            ForEach(detail.posts) { post in PostBubble(post: post) }
                        }
                        .padding(20)
                    }
                    composer(detail.id)
                }
            } else {
                StateOverlay(state: model.state) { Task { await model.load(id: id) } }
            }
        }
        .navigationTitle("Discussion")
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load(id: id) }
        .onDisappear { model.stop() }
    }

    private func composer(_ id: String) -> some View {
        HStack(spacing: 8) {
            TextField("Reply…", text: $model.draft, axis: .vertical)
                .font(TypeRamp.body())
                .padding(.horizontal, 12).padding(.vertical, 10)
                .background(Palette.surface, in: .rect(cornerRadius: 14))
            Button { Task { await model.reply(id: id) } } label: {
                Image(systemName: "paperplane.fill").foregroundStyle(Palette.ink)
                    .frame(width: 40, height: 40).background(Palette.lime, in: .circle)
            }
            .buttonStyle(.plain)
            .disabled(model.posting || model.draft.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(.bar)
    }
}

struct PostBubble: View {
    let post: DiscussionPost
    var body: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Avatar(name: post.authorName, image: post.authorImage, size: 24)
                    Text(post.authorName).font(TypeRamp.caption().weight(.semibold)).foregroundStyle(Palette.slate)
                    Spacer()
                    Text(Format.relative(post.createdAt)).font(TypeRamp.tiny()).foregroundStyle(Palette.faint)
                }
                Text(post.body).font(TypeRamp.reading()).foregroundStyle(Palette.ink)
            }
        }
        .padding(.leading, post.parentId == nil ? 0 : 24)
    }
}
