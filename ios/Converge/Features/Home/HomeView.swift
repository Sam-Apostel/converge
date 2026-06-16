import Observation
import SwiftUI

@MainActor
@Observable
final class HomeModel {
    var summary: HomeSummary?
    var state: LoadState = .loading

    func load() async {
        if summary == nil { state = .loading }
        do {
            summary = try await APIClient.shared.get("/api/home")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }
}

struct HomeView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = HomeModel()

    var body: some View {
        Group {
            if let summary = model.summary {
                content(summary)
            } else {
                StateOverlay(state: model.state) { Task { await model.load() } }
            }
        }
        .background(Palette.canvas, ignoresSafeAreaEdges: .all)
        .navigationTitle("Converge")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                NavigationLink(value: HubRoute.profile) {
                    Avatar(name: session.currentUser?.name ?? "Me",
                           image: session.currentUser?.image, size: 30)
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: HubRoute.messages) { Image(systemName: "bubble.left.and.bubble.right") }
            }
        }
        .task { await model.load() }
    }

    private func content(_ s: HomeSummary) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let next = s.nextSession { nextCard(next).padding(.horizontal, 16) }
                if !s.peopleToMeet.isEmpty { peopleToMeet(s.peopleToMeet) }
                if let trending = s.trendingProject { trendingCard(trending).padding(.horizontal, 16) }
                hub.padding(.horizontal, 16)
                counts(s.counts).padding(.horizontal, 16)
            }
            .padding(.vertical, 16)
        }
        .refreshable { await model.load() }
    }

    private func nextCard(_ n: HomeSummary.NextSession) -> some View {
        NavigationLink(value: SessionRoute(slug: n.slug)) {
            Spotlight(beam: true) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Next session")
                            .font(TypeRamp.eyebrow()).textCase(.uppercase).tracking(1.2)
                            .foregroundStyle(Palette.lime)
                        Spacer()
                        if let start = n.startsAt {
                            Text(Format.relative(start)).font(TypeRamp.caption()).foregroundStyle(Palette.frost)
                        }
                    }
                    Text(n.title).font(TypeRamp.title()).foregroundStyle(.white)
                    HStack(spacing: 10) {
                        if let speaker = n.speakerName {
                            Label(speaker, systemImage: "person.fill").font(TypeRamp.caption()).foregroundStyle(Palette.frost)
                        }
                        if let room = n.roomName {
                            Label(room, systemImage: "mappin").font(TypeRamp.caption()).foregroundStyle(Palette.frost)
                        }
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func peopleToMeet(_ people: [HomeSummary.PersonLite]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("People to meet").eyebrow().padding(.horizontal, 16)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(people) { p in
                        NavigationLink(value: Person(lite: p)) {
                            PersonBadge(person: Person(lite: p), compact: true)
                                .frame(width: 168)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 2)
            }
            .scrollClipDisabled()
        }
    }

    private func trendingCard(_ p: HomeSummary.TrendingProject) -> some View {
        NavigationLink(value: ProjectRoute(slug: p.slug)) {
            GlassCard {
                VStack(alignment: .leading, spacing: 6) {
                    HStack { Text("Trending project").eyebrow(); Spacer()
                        Label("\(p.trendingScore)", systemImage: "flame.fill")
                            .font(TypeRamp.tiny().weight(.semibold)).foregroundStyle(Palette.limeDeep) }
                    Text(p.name).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink)
                    if let tagline = p.tagline {
                        Text(tagline).font(TypeRamp.caption()).foregroundStyle(Palette.mist).lineLimit(2)
                    }
                    if let owner = p.ownerName {
                        Text("by \(owner)").font(TypeRamp.tiny()).foregroundStyle(Palette.faint)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var hub: some View {
        VStack(spacing: 10) {
            NavigationLink(value: HubRoute.concierge) {
                GlassCard {
                    HStack(spacing: 10) {
                        ConvergeLogo(size: 20)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Ask the concierge").font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink)
                            Text("Who to meet · what to see next").font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                        }
                        Spacer()
                        Image(systemName: "sparkles").foregroundStyle(Palette.limeDeep)
                    }
                }
            }
            .buttonStyle(.plain)
            HStack(spacing: 10) {
                hubTile("Discussions", "bubble.left.and.bubble.right", .discussions)
                hubTile("My moments", "bookmark", .moments)
            }
            HStack(spacing: 10) {
                hubTile("Network", "person.2", .connections)
                hubTile("Tasks", "checklist", .tasks)
            }
        }
    }

    private func hubTile(_ title: String, _ icon: String, _ route: HubRoute) -> some View {
        NavigationLink(value: route) {
            HStack(spacing: 10) {
                Image(systemName: icon).font(.system(size: 16, weight: .medium)).foregroundStyle(Palette.ink)
                Text(title).font(TypeRamp.note().weight(.medium)).foregroundStyle(Palette.ink)
                Spacer()
            }
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(Palette.pillow, in: .rect(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }

    private func counts(_ c: HomeSummary.Counts) -> some View {
        HStack(spacing: 0) {
            countCell("\(c.people)", "people")
            Divider().frame(height: 28)
            countCell("\(c.projects)", "projects")
            Divider().frame(height: 28)
            countCell("\(c.sessions)", "sessions")
        }
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity)
        .background(Palette.surface, in: .rect(cornerRadius: 18))
    }

    private func countCell(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(TypeRamp.title()).foregroundStyle(Palette.ink)
            Text(label).eyebrow()
        }
        .frame(maxWidth: .infinity)
    }
}
