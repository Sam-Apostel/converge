import Observation
import SwiftUI

@MainActor
@Observable
final class SearchModel {
    var query = ""
    var results: [SearchResult] = []
    var searching = false
    var people: [String: Person] = [:]
    private var task: Task<Void, Never>?

    /// Cache the directory so person results render with real avatars and open
    /// the real profile.
    func loadDirectory() async {
        guard people.isEmpty else { return }
        if let all: [Person] = try? await APIClient.shared.get("/api/people") {
            people = Dictionary(uniqueKeysWithValues: all.map { ($0.id, $0) })
        }
    }

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
            if model.results.isEmpty {
                emptyState
            } else {
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(model.results) { result in
                            if result.type == "person", let person = model.people[result.id] {
                                NavigationLink(value: person) {
                                    PersonResultRow(person: person, subtitle: result.subtitle)
                                }
                                .buttonStyle(.plain)
                            } else {
                                destination(for: result) { SearchRow(result: result) }
                            }
                        }
                    }
                    .padding(.horizontal, 16).padding(.vertical, 12)
                }
            }
        }
        .navigationTitle("Search")
        .searchable(text: $model.query, prompt: "People, projects, sessions, discussions")
        .onChange(of: model.query) { model.onQueryChange() }
        .task { await model.loadDirectory() }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 34, weight: .light))
                .foregroundStyle(Palette.faint)
            Text(searchedNothing ? "Nothing found." : "Find people, projects, sessions and discussions.")
                .font(TypeRamp.note())
                .foregroundStyle(Palette.mist)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var searchedNothing: Bool {
        model.query.trimmingCharacters(in: .whitespaces).count >= 2 && !model.searching
    }

    @ViewBuilder
    private func destination(for result: SearchResult, @ViewBuilder label: () -> some View) -> some View {
        switch result.type {
        case "project": NavigationLink(value: ProjectRoute(slug: result.id)) { label() }.buttonStyle(.plain)
        case "session": NavigationLink(value: SessionRoute(slug: result.id)) { label() }.buttonStyle(.plain)
        case "discussion": NavigationLink(value: DiscussionRoute(id: result.id)) { label() }.buttonStyle(.plain)
        default: label()
        }
    }
}

/// Search result row for a person, with their real avatar — a compact person card.
struct PersonResultRow: View {
    let person: Person
    var subtitle: String?

    var body: some View {
        GlassCard {
            HStack(spacing: 12) {
                Avatar(name: person.name, image: person.image, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(person.name).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink).lineLimit(1)
                    if let line = person.roleLine ?? subtitle {
                        Text(line).font(TypeRamp.caption()).foregroundStyle(Palette.mist).lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
                if !person.intents.isEmpty {
                    Pill(text: person.intents[0], tone: .lime)
                }
            }
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
