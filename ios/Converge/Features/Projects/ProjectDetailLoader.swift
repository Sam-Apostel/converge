import SwiftUI

/// Resolves a project by slug (there's no single-project REST route, so we pull
/// the list and pick), then shows the normal detail view.
struct ProjectDetailLoader: View {
    let slug: String
    @State private var project: Project?
    @State private var state: LoadState = .loading

    var body: some View {
        Group {
            if let project {
                ProjectDetailView(project: project)
            } else {
                ZStack {
                    CanvasBackground()
                    StateOverlay(state: state) { Task { await load() } }
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        do {
            let all: [Project] = try await APIClient.shared.get("/api/projects")
            if let match = all.first(where: { $0.slug == slug }) {
                project = match
            } else {
                state = .failed("Project not found")
            }
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }
}
