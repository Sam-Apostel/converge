import Observation
import SwiftUI

@MainActor
@Observable
final class MomentsLibraryModel {
    var moments: [MyMoment] = []
    var state: LoadState = .loading

    /// Grouped by session, preserving newest-first order of sessions.
    var groups: [(slug: String, title: String, moments: [MyMoment])] {
        var order: [String] = []
        var bySlug: [String: [MyMoment]] = [:]
        for m in moments {
            if bySlug[m.sessionSlug] == nil { order.append(m.sessionSlug) }
            bySlug[m.sessionSlug, default: []].append(m)
        }
        return order.map { slug in
            let items = (bySlug[slug] ?? []).sorted { $0.timestampMs < $1.timestampMs }
            return (slug, items.first?.sessionTitle ?? "Session", items)
        }
    }

    func load() async {
        if moments.isEmpty { state = .loading }
        do {
            moments = try await APIClient.shared.get("/api/moments/mine")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }
}

struct MomentsLibraryView: View {
    @State private var model = MomentsLibraryModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            if model.state == .loaded { list } else {
                StateOverlay(state: model.state) { Task { await model.load() } }
            }
        }
        .navigationTitle("My moments")
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load() }
    }

    private var list: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ForEach(model.groups, id: \.slug) { group in
                    VStack(alignment: .leading, spacing: 8) {
                        NavigationLink(value: SessionRoute(slug: group.slug)) {
                            HStack {
                                Text(group.title).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink)
                                Spacer()
                                Image(systemName: "chevron.right").font(.caption).foregroundStyle(Palette.faint)
                            }
                        }
                        .buttonStyle(.plain)
                        ForEach(group.moments) { moment in MomentCard(moment: moment) }
                    }
                }
                if model.moments.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "bookmark").font(.system(size: 28)).foregroundStyle(Palette.faint)
                        Text("No moments captured yet.").font(TypeRamp.note()).foregroundStyle(Palette.mist)
                        Text("Tap “Capture this moment” during a talk.").font(TypeRamp.caption()).foregroundStyle(Palette.faint)
                    }
                    .frame(maxWidth: .infinity).padding(.top, 60)
                }
            }
            .padding(.horizontal, 20).padding(.bottom, 24)
        }
        .refreshable { await model.load() }
    }
}

struct MomentCard: View {
    let moment: MyMoment
    var body: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text(timestamp).font(TypeRamp.mono(12)).foregroundStyle(Palette.slate)
                    if moment.aiHighlight {
                        Text("AI highlight").font(TypeRamp.micro().weight(.bold)).foregroundStyle(Palette.ink)
                            .padding(.horizontal, 6).padding(.vertical, 2).background(Palette.lime, in: .capsule)
                    }
                }
                if let snippet = moment.transcriptSnippet, !snippet.isEmpty {
                    Text(snippet).font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft).lineLimit(3)
                }
                if let note = moment.note, !note.isEmpty {
                    Text(note).font(TypeRamp.caption()).foregroundStyle(Palette.mist).italic()
                }
            }
        }
    }

    private var timestamp: String {
        let total = moment.timestampMs / 1000
        return String(format: "%d:%02d", total / 60, total % 60)
    }
}
