import Observation
import SwiftUI

@MainActor
@Observable
final class SearchModel {
    var query = ""
    var results: [SearchResult] = []
    var searching = false
    private var task: Task<Void, Never>?

    func onQueryChange() {
        task?.cancel()
        let q = query.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2 else { results = []; return }
        task = Task {
            try? await Task.sleep(for: .milliseconds(250))
            if Task.isCancelled { return }
            searching = true
            let hits: [SearchResult] = (try? await APIClient.shared.get(
                "/api/search", query: [.init(name: "q", value: q)]
            )) ?? []
            if !Task.isCancelled { results = hits; searching = false }
        }
    }
}

struct SearchView: View {
    @State private var model = SearchModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            ScrollView {
                VStack(spacing: 10) {
                    ForEach(model.results) { result in
                        destination(for: result) { SearchRow(result: result) }
                    }
                    if model.results.isEmpty && model.query.count >= 2 && !model.searching {
                        Text("Nothing found.").font(TypeRamp.note()).foregroundStyle(Palette.mist).padding(.top, 40)
                    }
                }
                .padding(.horizontal, 16).padding(.vertical, 12)
            }
        }
        .navigationTitle("Search")
        .searchable(text: $model.query, prompt: "People, projects, sessions, discussions")
        .onChange(of: model.query) { model.onQueryChange() }
    }

    @ViewBuilder
    private func destination(for result: SearchResult, @ViewBuilder label: () -> some View) -> some View {
        switch result.type {
        case "person": NavigationLink(value: Person(id: result.id, name: result.title, image: nil, profile: nil)) { label() }.buttonStyle(.plain)
        case "project": NavigationLink(value: ProjectRoute(slug: result.id)) { label() }.buttonStyle(.plain)
        case "session": NavigationLink(value: SessionRoute(slug: result.id)) { label() }.buttonStyle(.plain)
        case "discussion": NavigationLink(value: DiscussionRoute(id: result.id)) { label() }.buttonStyle(.plain)
        default: label()
        }
    }
}

struct SearchRow: View {
    let result: SearchResult
    var body: some View {
        GlassCard {
            HStack(spacing: 12) {
                if result.type == "person" {
                    Avatar(name: result.title, size: 34)
                } else {
                    Image(systemName: icon)
                        .font(.system(size: 15, weight: .medium)).foregroundStyle(Palette.slate)
                        .frame(width: 34, height: 34).background(Palette.pillow, in: .circle)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(result.title).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink).lineLimit(1)
                    if let subtitle = result.subtitle {
                        Text(subtitle).font(TypeRamp.caption()).foregroundStyle(Palette.mist).lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
                Text(result.type).eyebrow()
            }
        }
    }

    private var icon: String {
        switch result.type {
        case "person": "person.fill"
        case "project": "square.grid.2x2.fill"
        case "session": "calendar"
        case "discussion": "bubble.left.and.bubble.right.fill"
        default: "magnifyingglass"
        }
    }
}
