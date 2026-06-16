import Observation
import SwiftUI

@MainActor
@Observable
final class DiscussionsModel {
    var discussions: [DiscussionSummary] = []
    var state: LoadState = .loading

    func load() async {
        if discussions.isEmpty { state = .loading }
        do {
            discussions = try await APIClient.shared.get("/api/discussions")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }

    func start(title: String, body: String) async -> String? {
        struct Body: Encodable { let title: String; let body: String }
        struct Created: Decodable { let id: String }
        do {
            let created: Created = try await APIClient.shared.send(
                "/api/discussions", method: "POST", body: Body(title: title, body: body)
            )
            await load()
            return created.id
        } catch { return nil }
    }
}

struct DiscussionsView: View {
    @State private var model = DiscussionsModel()
    @State private var composing = false

    var body: some View {
        ZStack {
            CanvasBackground()
            if model.state == .loaded { list } else {
                StateOverlay(state: model.state) { Task { await model.load() } }
            }
        }
        .navigationTitle("Discussions")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { composing = true } label: { Image(systemName: "square.and.pencil") }
            }
        }
        .sheet(isPresented: $composing) {
            NewDiscussionSheet { title, body in
                Task { _ = await model.start(title: title, body: body); composing = false }
            }
        }
        .task { await model.load() }
    }

    private var list: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(model.discussions) { d in
                    NavigationLink(value: DiscussionRoute(id: d.id)) { DiscussionRow(discussion: d) }
                        .buttonStyle(.plain)
                }
                if model.discussions.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "bubble.left.and.bubble.right")
                            .font(.system(size: 28)).foregroundStyle(Palette.faint)
                        Text("No discussions yet — start one.")
                            .font(TypeRamp.note()).foregroundStyle(Palette.mist)
                    }
                    .frame(maxWidth: .infinity).padding(.top, 60)
                }
            }
            .padding(.horizontal, 16).padding(.bottom, 24)
        }
        .refreshable { await model.load() }
    }
}

struct DiscussionRow: View {
    let discussion: DiscussionSummary
    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 6) {
                if let topic = discussion.topic { Pill(text: topic) }
                Text(discussion.title).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink)
                HStack(spacing: 10) {
                    Label("\(discussion.postCount)", systemImage: "text.bubble")
                        .font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                    if let author = discussion.authorName {
                        Text("· \(author)").font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                    }
                }
            }
        }
    }
}

struct NewDiscussionSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var message = ""
    let onCreate: (String, String) -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                CanvasBackground()
                VStack(alignment: .leading, spacing: 14) {
                    TextField("Title", text: $title)
                        .font(TypeRamp.body().weight(.semibold))
                        .padding(12).background(Palette.surface, in: .rect(cornerRadius: 12))
                    TextField("What's on your mind?", text: $message, axis: .vertical)
                        .font(TypeRamp.body()).lineLimit(4...10)
                        .padding(12).background(Palette.surface, in: .rect(cornerRadius: 12))
                    Spacer()
                }
                .padding(16)
            }
            .navigationTitle("New discussion")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Post") { onCreate(title, message) }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty
                                  || message.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
