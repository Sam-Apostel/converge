import Observation
import SwiftUI

struct ChatMessage: Identifiable, Hashable {
    let id = UUID()
    let role: String // "user" | "assistant"
    var content: String
    // Entities the assistant referenced, rendered as tappable cards inline.
    var people: [Person] = []
    var sessions: [Session] = []
    var projects: [Project] = []

    var hasEntities: Bool { !people.isEmpty || !sessions.isEmpty || !projects.isEmpty }
}

@MainActor
@Observable
final class ConciergeModel {
    var messages: [ChatMessage] = []
    var draft = ""
    var thinking = false
    var error: String?

    /// Whether the concierge is currently running on-device (Apple Intelligence).
    var usingOnDevice: Bool {
        onDevicePreferred && OnDeviceConcierge.isAvailable
    }

    private var onDevicePreferred: Bool {
        if let v = UserDefaults.standard.object(forKey: "converge.useOnDeviceAI") as? Bool { return v }
        return OnDeviceConcierge.isAvailable
    }

    func send() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !thinking else { return }
        messages.append(ChatMessage(role: "user", content: text))
        draft = ""
        thinking = true
        error = nil

        do {
            if usingOnDevice {
                let reply = try await OnDeviceConcierge.answer(messages: messages)
                await appendReply(reply)
            } else {
                try await askServer()
            }
        } catch {
            self.error = conciergeError(error)
        }
        thinking = false
    }

    private func askServer() async throws {
        struct Wire: Encodable { let role: String; let content: String }
        struct Body: Encodable { let messages: [Wire] }
        struct Reply: Decodable { let text: String?; let error: String? }

        let payload = Body(messages: messages.map { Wire(role: $0.role, content: $0.content) })
        let reply: Reply = try await APIClient.shared.send("/api/concierge/ask", method: "POST", body: payload)
        if let text = reply.text, !text.isEmpty {
            await appendReply(text)
        } else {
            error = reply.error ?? "No response."
        }
    }

    private func appendReply(_ text: String) async {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean.isEmpty { error = "No response."; return }
        let (people, sessions, projects) = await matchEntities(in: clean)
        messages.append(ChatMessage(
            role: "assistant", content: clean,
            people: people, sessions: sessions, projects: projects
        ))
    }

    // Cached directories used to turn entity names mentioned in a reply into
    // tappable cards (the concierge is prompted to mention people/sessions/
    // projects by name — the same mechanism the web UI uses).
    private var dirPeople: [Person]?
    private var dirSessions: [Session]?
    private var dirProjects: [Project]?

    private func matchEntities(in text: String) async -> ([Person], [Session], [Project]) {
        if dirPeople == nil { dirPeople = (try? await APIClient.shared.get("/api/people")) ?? [] }
        if dirSessions == nil { dirSessions = (try? await APIClient.shared.get("/api/sessions")) ?? [] }
        if dirProjects == nil { dirProjects = (try? await APIClient.shared.get("/api/projects")) ?? [] }
        let t = text.lowercased()
        let people = (dirPeople ?? []).filter { $0.name.count >= 4 && t.contains($0.name.lowercased()) }.prefix(4)
        let sessions = (dirSessions ?? []).filter { $0.title.count >= 4 && t.contains($0.title.lowercased()) }.prefix(4)
        let projects = (dirProjects ?? []).filter { $0.name.count >= 3 && t.contains($0.name.lowercased()) }.prefix(4)
        return (Array(people), Array(sessions), Array(projects))
    }

    private func conciergeError(_ error: Error) -> String {
        let raw = (error as? APIClient.APIError)?.message ?? error.localizedDescription
        if raw.contains("Ollama") || raw.contains("502") || raw.lowercased().contains("provider") || raw.lowercased().contains("key") {
            return "The concierge needs an AI provider. Add a key in Settings → AI."
        }
        return raw.count > 160 ? "The concierge is unavailable right now." : raw
    }
}

struct ConciergeView: View {
    @State private var model = ConciergeModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            if model.messages.isEmpty { intro }
                            ForEach(model.messages) { m in
                                ChatRow(message: m).id(m.id)
                            }
                            if model.thinking {
                                HStack(spacing: 8) {
                                    ProgressView().tint(Palette.mist)
                                    Text("Thinking…").font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                                }
                            }
                            if let error = model.error {
                                Text(error).font(TypeRamp.caption()).foregroundStyle(Palette.danger)
                            }
                        }
                        .padding(16)
                    }
                    .onChange(of: model.messages.count) {
                        if let last = model.messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                    }
                }
                composer
            }
        }
        .navigationTitle("Concierge")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var intro: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    ConvergeLogo(size: 20)
                    Text("Concierge").eyebrow()
                    Spacer()
                    if model.usingOnDevice {
                        Label("On-device", systemImage: "cpu")
                            .font(TypeRamp.tiny().weight(.semibold)).foregroundStyle(Palette.limeDeep)
                    }
                }
                Text("Ask who to meet, what to see next, or which projects match what you're building.")
                    .font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft)
                VStack(alignment: .leading, spacing: 6) {
                    suggestion("Who should I meet about local-first apps?")
                    suggestion("What talks are coming up on AI agents?")
                }
            }
        }
    }

    private func suggestion(_ text: String) -> some View {
        Button { model.draft = text } label: {
            Text(text).font(TypeRamp.caption()).foregroundStyle(Palette.slate)
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background(Palette.pillow, in: .capsule)
        }
        .buttonStyle(.plain)
    }

    private var composer: some View {
        HStack(spacing: 8) {
            GlassField(radius: 18) {
                TextField("Ask the concierge…", text: $model.draft, axis: .vertical)
                    .font(TypeRamp.body())
            }
            Button { Task { await model.send() } } label: {
                Image(systemName: "arrow.up").foregroundStyle(Palette.ink)
                    .frame(width: 40, height: 40).background(Palette.lime, in: .circle)
            }
            .buttonStyle(.plain)
            .disabled(model.thinking || model.draft.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(.bar)
    }
}

struct ChatRow: View {
    let message: ChatMessage
    private var mine: Bool { message.role == "user" }

    var body: some View {
        VStack(alignment: mine ? .trailing : .leading, spacing: 8) {
            HStack {
                if mine { Spacer(minLength: 40) }
                Text(message.content)
                    .font(TypeRamp.reading())
                    .foregroundStyle(Palette.ink)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(mine ? Palette.lime.opacity(0.85) : Palette.surface, in: .rect(cornerRadius: 18))
                if !mine { Spacer(minLength: 40) }
            }
            if !mine && message.hasEntities {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(message.people) { person in
                        NavigationLink(value: person) {
                            EntityChip(title: person.name, subtitle: person.roleLine, systemImage: "person.fill",
                                       avatarName: person.name, avatarImage: person.image)
                        }.buttonStyle(.plain)
                    }
                    ForEach(message.sessions) { session in
                        NavigationLink(value: SessionRoute(slug: session.slug)) {
                            EntityChip(title: session.title, subtitle: session.track, systemImage: "calendar")
                        }.buttonStyle(.plain)
                    }
                    ForEach(message.projects) { project in
                        NavigationLink(value: ProjectRoute(slug: project.slug)) {
                            EntityChip(title: project.name, subtitle: project.tagline, systemImage: "square.grid.2x2.fill")
                        }.buttonStyle(.plain)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}

/// Compact, tappable card for an entity the concierge referenced.
struct EntityChip: View {
    let title: String
    var subtitle: String? = nil
    let systemImage: String
    var avatarName: String? = nil
    var avatarImage: String? = nil

    var body: some View {
        HStack(spacing: 10) {
            if let avatarName {
                Avatar(name: avatarName, image: avatarImage, size: 30)
            } else {
                Image(systemName: systemImage)
                    .font(.system(size: 13, weight: .medium)).foregroundStyle(Palette.slate)
                    .frame(width: 30, height: 30).background(Palette.pillow, in: .circle)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(TypeRamp.note().weight(.semibold)).foregroundStyle(Palette.ink).lineLimit(1)
                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle).font(TypeRamp.caption()).foregroundStyle(Palette.mist).lineLimit(1)
                }
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold)).foregroundStyle(Palette.faint)
        }
        .padding(.horizontal, 12).padding(.vertical, 9)
        .frame(maxWidth: .infinity)
        .background(Palette.surface, in: .rect(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Palette.edge, lineWidth: 1))
    }
}
