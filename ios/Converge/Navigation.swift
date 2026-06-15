import SwiftUI

// Typed navigation values. Screens push these and the shared destinations
// modifier resolves them — so Home can push a session, a person can push a
// project, etc., without each stack re-declaring every destination.

struct SessionRoute: Hashable { let slug: String }
struct ProjectRoute: Hashable { let slug: String }
struct DiscussionRoute: Hashable { let id: String }

/// Value used to navigate to a 1:1 conversation.
struct MessageTarget: Hashable {
    let userId: String
    let name: String
}

/// Secondary, full-screen destinations that aren't a single entity.
enum HubRoute: Hashable {
    case discussions, messages, moments, connections, tasks, profile, settings
}

/// One navigation stack per tab, with every Converge destination registered.
struct NavStack<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        NavigationStack { content.convergeDestinations() }
    }
}

extension View {
    /// Registers every Converge navigation destination on an enclosing
    /// `NavigationStack`. Applied once per tab by `NavStack`.
    func convergeDestinations() -> some View {
        self
            .navigationDestination(for: Person.self) { PersonDetailView(person: $0) }
            .navigationDestination(for: Project.self) { ProjectDetailView(project: $0) }
            .navigationDestination(for: ProjectRoute.self) { ProjectDetailLoader(slug: $0.slug) }
            .navigationDestination(for: SessionRoute.self) { SessionDetailView(slug: $0.slug) }
            .navigationDestination(for: DiscussionRoute.self) { DiscussionDetailView(id: $0.id) }
            .navigationDestination(for: MessageTarget.self) {
                ConversationView(otherUserId: $0.userId, otherName: $0.name)
            }
            .navigationDestination(for: HubRoute.self) { route in
                switch route {
                case .discussions: DiscussionsView()
                case .messages: MessagesView()
                case .moments: MomentsLibraryView()
                case .connections: ConnectionsView()
                case .tasks: TasksView()
                case .profile: ProfileView()
                case .settings: SettingsView()
                }
            }
    }
}
