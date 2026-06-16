import FoundationModels
import Foundation

// On-device concierge powered by Apple Intelligence (FoundationModels). Runs the
// same kind of tool-use loop as the server concierge, but locally — no API key,
// works offline. The tools read the Converge REST API (the surface the MCP tools
// also expose), so answers are grounded in real conference data.

enum OnDeviceConcierge {
    /// Whether the on-device model is usable right now on this device.
    static var availability: SystemLanguageModel.Availability {
        SystemLanguageModel.default.availability
    }
    static var isAvailable: Bool { SystemLanguageModel.default.isAvailable }

    static var unavailableReason: String? {
        switch availability {
        case .available: return nil
        case .unavailable(.deviceNotEligible): return "This device doesn't support Apple Intelligence."
        case .unavailable(.appleIntelligenceNotEnabled): return "Turn on Apple Intelligence in Settings."
        case .unavailable(.modelNotReady): return "The on-device model is still downloading."
        case .unavailable: return "On-device AI is unavailable right now."
        }
    }

    private static let instructions = """
    You are the Converge concierge — a warm, concise guide for attendees of the \
    co-located Amsterdam conferences (JSNation + React Summit). Converge is \
    people-first: people and the projects they build are the primary objects. \
    Use the tools to answer questions about people, sessions and projects rather \
    than guessing, and mention people/sessions/projects by name. Keep answers \
    short and conversational. You cannot make changes on the user's behalf.
    """

    /// Answer the conversation on-device. The whole transcript is rendered into
    /// the prompt so context carries across turns without retaining a session.
    static func answer(messages: [ChatMessage]) async throws -> String {
        let session = LanguageModelSession(
            tools: [FindPeopleTool(), PeopleToMeetTool(), FindSessionsTool(), FindProjectsTool()],
            instructions: instructions
        )
        let prompt = messages
            .map { "\($0.role == "user" ? "User" : "Assistant"): \($0.content)" }
            .joined(separator: "\n")
        let response = try await session.respond(to: prompt)
        return response.content
    }
}

// MARK: - Tools

struct FindPeopleTool: Tool {
    let name = "find_people"
    let description = "Search conference attendees by name, company, role, or interest."

    @Generable
    struct Arguments {
        @Guide(description: "A name, company, role, topic or interest to search for")
        var query: String
    }

    func call(arguments: Arguments) async throws -> String {
        let people: [Person] = (try? await APIClient.shared.get("/api/people")) ?? []
        let q = arguments.query.lowercased()
        let hits = people.filter { p in
            let hay: [String?] = [p.name, p.company, p.headline, p.title,
                                  (p.profile?.interestedTopics ?? []).joined(separator: " ")]
            return hay.compactMap { $0?.lowercased() }.contains { $0.contains(q) }
        }.prefix(8)
        if hits.isEmpty { return "No attendees match \"\(arguments.query)\"." }
        return hits.map { p in
            var line = p.name
            if let role = p.roleLine { line += " — \(role)" }
            if !p.intents.isEmpty { line += " (here for: \(p.intents.joined(separator: ", ")))" }
            return line
        }.joined(separator: "\n")
    }
}

struct PeopleToMeetTool: Tool {
    let name = "people_to_meet"
    let description = "Suggest attendees the user should meet, ranked for them."

    @Generable
    struct Arguments {
        @Guide(description: "Optional interest to bias suggestions toward; empty for general picks")
        var topic: String
    }

    func call(arguments: Arguments) async throws -> String {
        let summary: HomeSummary? = try? await APIClient.shared.get("/api/home")
        let people = summary?.peopleToMeet ?? []
        if people.isEmpty { return "No suggestions available right now." }
        return people.map { p in
            var line = p.name
            if let h = p.headline { line += " — \(h)" }
            return line
        }.joined(separator: "\n")
    }
}

struct FindSessionsTool: Tool {
    let name = "find_sessions"
    let description = "Find conference sessions/talks by title, track, or topic."

    @Generable
    struct Arguments {
        @Guide(description: "A talk title, track, speaker topic, or keyword; empty lists upcoming talks")
        var query: String
    }

    func call(arguments: Arguments) async throws -> String {
        let sessions: [Session] = (try? await APIClient.shared.get("/api/sessions")) ?? []
        let q = arguments.query.lowercased()
        let hits = (q.isEmpty ? Array(sessions) : sessions.filter { s in
            let hay: [String?] = [s.title, s.abstract, s.track]
            return hay.compactMap { $0?.lowercased() }.contains { $0.contains(q) }
        }).prefix(8)
        if hits.isEmpty { return "No sessions match \"\(arguments.query)\"." }
        return hits.map { s in
            var line = s.title
            if let track = s.track { line += " [\(track)]" }
            if s.isLiveNow { line += " (LIVE now)" }
            return line
        }.joined(separator: "\n")
    }
}

struct FindProjectsTool: Tool {
    let name = "find_projects"
    let description = "Find projects people are building by name, tech stack, or category."

    @Generable
    struct Arguments {
        @Guide(description: "A project name, technology, category, or keyword")
        var query: String
    }

    func call(arguments: Arguments) async throws -> String {
        let projects: [Project] = (try? await APIClient.shared.get("/api/projects")) ?? []
        let q = arguments.query.lowercased()
        let hits = (q.isEmpty ? Array(projects) : projects.filter { p in
            let hay: [String?] = [p.name, p.tagline, p.description, p.category,
                                  (p.techStack ?? []).joined(separator: " ")]
            return hay.compactMap { $0?.lowercased() }.contains { $0.contains(q) }
        }).prefix(8)
        if hits.isEmpty { return "No projects match \"\(arguments.query)\"." }
        return hits.map { p in
            var line = p.name
            if let t = p.tagline { line += " — \(t)" }
            return line
        }.joined(separator: "\n")
    }
}
