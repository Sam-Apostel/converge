import Observation
import SwiftUI

@MainActor
@Observable
final class ProjectsModel {
    var projects: [Project] = []
    var state: LoadState = .loading
    var search = ""
    var category: String?

    var categories: [String] {
        Set(projects.compactMap(\.category)).sorted()
    }

    var filtered: [Project] {
        projects.filter { project in
            (category == nil || project.category == category) && matches(project)
        }
    }

    private func matches(_ p: Project) -> Bool {
        guard !search.isEmpty else { return true }
        let q = search.lowercased()
        let hay: [String?] = [p.name, p.tagline, p.description, (p.techStack ?? []).joined(separator: " ")]
        return hay.compactMap { $0?.lowercased() }.contains { $0.contains(q) }
    }

    func load() async {
        if projects.isEmpty { state = .loading }
        do {
            projects = try await APIClient.shared.get("/api/projects")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }
}

struct ProjectsView: View {
    @State private var model = ProjectsModel()
    @State private var creating = false

    var body: some View {
        ZStack {
            CanvasBackground()
            if model.state == .loaded {
                list
            } else {
                StateOverlay(state: model.state) { Task { await model.load() } }
            }
        }
        .navigationTitle("Projects")
        .searchable(text: $model.search, prompt: "Projects, tech, ideas…")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { creating = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $creating) {
            ProjectEditSheet(existing: nil) { _ in Task { await model.load() } }
        }
        .task { await model.load() }
    }

    private var list: some View {
        ScrollView {
            VStack(spacing: 12) {
                if !model.categories.isEmpty {
                    FilterChips(options: model.categories, selection: $model.category)
                        .padding(.bottom, 4)
                }
                ForEach(model.filtered) { project in
                    NavigationLink(value: project) { ProjectRow(project: project) }
                        .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
        .refreshable { await model.load() }
    }
}

struct ProjectRow: View {
    let project: Project

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    if let category = project.category {
                        Pill(text: category)
                    }
                    Spacer(minLength: 0)
                    if project.trendingScore > 0 {
                        Label("\(project.trendingScore)", systemImage: "flame.fill")
                            .font(TypeRamp.tiny().weight(.semibold))
                            .foregroundStyle(Palette.limeDeep)
                    }
                }
                Text(project.name)
                    .font(TypeRamp.body().weight(.semibold))
                    .foregroundStyle(Palette.ink)
                if let tagline = project.tagline {
                    Text(tagline)
                        .font(TypeRamp.caption())
                        .foregroundStyle(Palette.mist)
                        .lineLimit(2)
                }
                if let tech = project.techStack, !tech.isEmpty {
                    HStack(spacing: 6) {
                        ForEach(tech.prefix(3), id: \.self) { Pill(text: $0) }
                    }
                }
            }
        }
    }
}

#Preview { ProjectsView() }
