import SwiftUI

// Native iOS 26 TabView — gets the Liquid Glass tab bar and a floating search
// tab for free. Mirrors the web bottom nav (Home / People / Sessions / Projects)
// and promotes global search to the dedicated search role.
struct RootView: View {
    var body: some View {
        TabView {
            Tab("Home", systemImage: "house") {
                NavStack { HomeView() }
            }
            Tab("People", systemImage: "person.2") {
                NavStack { PeopleView() }
            }
            Tab("Sessions", systemImage: "calendar") {
                NavStack { SessionsView() }
            }
            Tab("Projects", systemImage: "square.grid.2x2") {
                NavStack { ProjectsView() }
            }
            Tab(role: .search) {
                NavStack { SearchView() }
            }
        }
    }
}

#Preview {
    RootView()
}
