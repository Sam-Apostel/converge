import Observation
import SwiftUI

@MainActor
@Observable
final class PersonDetailModel {
    var projects: [Project] = []
    var connectState: ConnectState = .idle

    enum ConnectState: Equatable { case idle, requesting, requested, failed(String) }

    func loadProjects(ownerId: String) async {
        let all: [Project]? = try? await APIClient.shared.get("/api/projects")
        projects = (all ?? []).filter { $0.ownerId == ownerId }
    }

    /// Resolve the full person record (with profile) when we were handed a
    /// partial one — e.g. from search or the home "people to meet" list.
    func fetchFull(id: String) async -> Person? {
        let all: [Person]? = try? await APIClient.shared.get("/api/people")
        return all?.first { $0.id == id }
    }

    func connect(to userId: String) async {
        connectState = .requesting
        struct Body: Encodable { let toUserId: String }
        do {
            try await APIClient.shared.fire("/api/connections", method: "POST", body: Body(toUserId: userId))
            connectState = .requested
        } catch {
            connectState = .failed((error as? APIClient.APIError)?.message ?? "Failed")
        }
    }
}

struct PersonDetailView: View {
    @State private var person: Person
    @State private var model = PersonDetailModel()

    init(person: Person) { _person = State(initialValue: person) }

    var body: some View {
        ZStack {
            CanvasBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    actions
                    if let bio = person.profile?.bio, !bio.isEmpty {
                        section("Why I'm here") {
                            Text(bio).font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft)
                        }
                    }
                    if let focus = person.profile?.currentFocus, !focus.isEmpty {
                        section("Current focus") {
                            Text(focus).font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft)
                        }
                    }
                    if !person.intents.isEmpty {
                        section("Here for") { WrapPills(items: person.intents, tone: .lime) }
                    }
                    if let topics = person.profile?.interestedTopics, !topics.isEmpty {
                        section("Interested in") { WrapPills(items: topics) }
                    }
                    if !model.projects.isEmpty {
                        section("Projects") {
                            VStack(spacing: 10) {
                                ForEach(model.projects) { project in
                                    NavigationLink(value: project) {
                                        ProjectRow(project: project)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }
                .padding(16)
            }
        }
        .navigationTitle(person.name)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await model.loadProjects(ownerId: person.id)
            if person.profile == nil, let full = await model.fetchFull(id: person.id) {
                person = full
            }
        }
    }

    private var header: some View {
        Spotlight {
            HStack(spacing: 14) {
                Avatar(name: person.name, image: person.image, size: 72)
                VStack(alignment: .leading, spacing: 5) {
                    Text(person.name).font(TypeRamp.title()).foregroundStyle(.white)
                    if let role = person.roleLine {
                        Text(role).font(TypeRamp.note()).foregroundStyle(Palette.frost)
                    }
                    if let loc = person.location, !loc.isEmpty {
                        Label(loc, systemImage: "mappin.and.ellipse")
                            .font(TypeRamp.caption())
                            .foregroundStyle(Palette.frost)
                    }
                    HStack(spacing: 6) {
                        AvailabilityDot(availability: person.profile?.availability)
                        Text(availabilityLabel).font(TypeRamp.tiny()).foregroundStyle(Palette.frost)
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    private var actions: some View {
        HStack(spacing: 10) {
            Button(action: { Task { await model.connect(to: person.id) } }) {
                Text(connectLabel)
                    .font(TypeRamp.body().weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .foregroundStyle(Palette.ink)
                    .background(Palette.lime, in: .capsule)
            }
            .buttonStyle(.plain)
            .disabled(model.connectState == .requesting || model.connectState == .requested)

            NavigationLink(value: MessageTarget(userId: person.id, name: person.name)) {
                Image(systemName: "bubble.left")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(Palette.ink)
                    .frame(width: 46, height: 46)
                    .background(Palette.pillow, in: .circle)
            }
            .buttonStyle(.plain)
        }
    }

    private var connectLabel: String {
        switch model.connectState {
        case .idle, .failed: "Connect"
        case .requesting: "Requesting…"
        case .requested: "Requested ✓"
        }
    }

    private var availabilityLabel: String {
        switch person.profile?.availability {
        case "busy": "Busy"
        case "dnd": "Do not disturb"
        default: "Open to meet"
        }
    }

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).eyebrow()
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension Person {
    /// Build a partial Person from a home "people to meet" lite record so we can
    /// reuse the full detail screen (which fetches the rest by id).
    init(lite: HomeSummary.PersonLite) {
        self.init(
            id: lite.id,
            name: lite.name,
            image: lite.image,
            profile: lite.headline.map { Profile(userId: lite.id, headline: $0) }
        )
    }
}

/// Lightweight flowing pill layout.
struct WrapPills: View {
    let items: [String]
    var tone: Pill.Tone = .neutral

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(items, id: \.self) { Pill(text: $0, tone: tone) }
        }
    }
}

/// Simple flow layout that wraps its children onto multiple lines.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout Void) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0; y += rowHeight + spacing; rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout Void) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX; y += rowHeight + spacing; rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
