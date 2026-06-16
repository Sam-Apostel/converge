import SwiftUI

struct ProjectDetailView: View {
    @Environment(SessionStore.self) private var session
    @State private var project: Project
    @State private var full: ProjectFull?
    @State private var editing = false

    init(project: Project) { _project = State(initialValue: project) }

    private var isOwner: Bool { session.currentUser?.id == project.ownerId }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                ProjectCover(project: project, height: 200)
                    .clipShape(.rect(cornerRadius: 18))
                Spotlight {
                    VStack(alignment: .leading, spacing: 8) {
                        if let category = project.category { Pill(text: category) }
                        Text(project.name).font(TypeRamp.title()).foregroundStyle(.white)
                        if let tagline = project.tagline {
                            Text(tagline).font(TypeRamp.reading()).foregroundStyle(Palette.frost)
                        }
                    }
                }

                if let team = teamMembers, !team.isEmpty {
                    section("Team") {
                        VStack(spacing: 10) {
                            ForEach(team) { member in
                                NavigationLink(value: member.asPerson) {
                                    HStack(spacing: 12) {
                                        Avatar(name: member.name, image: member.image, size: 40)
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(member.name).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink)
                                            if let line = member.role ?? member.headline {
                                                Text(line).font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                                            }
                                        }
                                        Spacer(minLength: 0)
                                        Image(systemName: "chevron.right").font(.caption).foregroundStyle(Palette.faint)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }

                if let description = project.description, !description.isEmpty {
                        section("About") {
                            Text(description).font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft)
                        }
                    }
                    if let tech = project.techStack, !tech.isEmpty {
                        section("Built with") { WrapPills(items: tech) }
                    }
                    if let looking = project.lookingFor, !looking.isEmpty {
                        section("Looking for") { WrapPills(items: looking, tone: .lime) }
                    }
                    if let links = project.links, !links.isEmpty {
                        section("Links") {
                            VStack(spacing: 8) {
                                ForEach(links.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
                                    linkRow(label: key, urlString: value)
                                }
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(Palette.canvas, ignoresSafeAreaEdges: .all)
            .navigationTitle(project.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if isOwner {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Edit") { editing = true }
                    }
                }
            }
            .sheet(isPresented: $editing) {
                ProjectEditSheet(existing: project) { updated in project = updated }
            }
            .task {
                full = try? await APIClient.shared.get("/api/projects/\(project.slug)")
            }
    }

    private var teamMembers: [ProjectFull.TeamMember]? {
        guard let full else { return nil }
        var seen = Set<String>()
        return ([full.owner].compactMap { $0 } + full.members).filter { seen.insert($0.id).inserted }
    }

    private func linkRow(label: String, urlString: String) -> some View {
        Group {
            if let url = URL(string: urlString) {
                Link(destination: url) {
                    HStack {
                        Text(label.capitalized)
                            .font(TypeRamp.note().weight(.medium))
                            .foregroundStyle(Palette.ink)
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Palette.faint)
                    }
                    .padding(.horizontal, 14).padding(.vertical, 11)
                    .background(Palette.inner, in: .rect(cornerRadius: 12))
                }
            }
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

extension ProjectFull.TeamMember {
    var asPerson: Person {
        Person(id: id, name: name, image: image,
               profile: headline.map { Profile(userId: id, headline: $0) })
    }
}
