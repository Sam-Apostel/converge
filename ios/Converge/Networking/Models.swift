import Foundation

// Codable mirrors of the Converge domain rows as serialized by the REST API.
// Field names match the JSON (camelCase) exactly; timestamps arrive as ISO strings.

struct Profile: Codable, Hashable {
    var userId: String
    var handle: String? = nil
    var headline: String? = nil
    var company: String? = nil
    var title: String? = nil
    var bio: String? = nil
    var location: String? = nil
    var intents: [String]? = nil
    var currentFocus: String? = nil
    var interestedTopics: [String]? = nil
    var notInterestedTopics: [String]? = nil
    var availability: String? = nil
    var socials: [String: String]? = nil
}

struct Person: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var image: String?
    var profile: Profile?

    var headline: String? { profile?.headline }
    var company: String? { profile?.company }
    var title: String? { profile?.title }
    var location: String? { profile?.location }
    var intents: [String] { profile?.intents ?? [] }

    /// "Title at Company", "Title", or "Company" — whichever is available.
    var roleLine: String? {
        switch (title, company) {
        case let (t?, c?): "\(t) at \(c)"
        case let (t?, nil): t
        case let (nil, c?): c
        default: nil
        }
    }
}

struct Session: Codable, Identifiable, Hashable {
    var id: String
    var slug: String
    var conferenceId: String
    var roomId: String?
    var title: String
    var abstract: String?
    var track: String?
    var startsAt: Date?
    var endsAt: Date?
    var livestreamUrl: String?
    var transcriptUrl: String?
    var aiSummary: String?
    var createdAt: Date?
    var updatedAt: Date?
    var speakers: [Speaker] = []

    var isLiveNow: Bool {
        guard let startsAt, let endsAt else { return false }
        let now = Date()
        return now >= startsAt && now <= endsAt
    }
}

struct Project: Codable, Identifiable, Hashable {
    var id: String
    var slug: String
    var ownerId: String
    var name: String
    var tagline: String?
    var description: String?
    var category: String?
    var techStack: [String]?
    var lookingFor: [String]?
    var screenshots: [String]?
    var links: [String: String]?
    var trendingScore: Int
    var createdAt: Date?
    var updatedAt: Date?
}
