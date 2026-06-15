import Foundation

// MARK: - Home

struct HomeSummary: Codable {
    struct Counts: Codable { var people: Int; var projects: Int; var sessions: Int }
    struct NextSession: Codable {
        var id: String
        var slug: String
        var title: String
        var startsAt: Date?
        var track: String?
        var roomName: String?
        var speakerName: String?
    }
    struct PersonLite: Codable, Identifiable, Hashable {
        var id: String
        var name: String
        var image: String?
        var headline: String?
        var reason: String?
    }
    struct TrendingProject: Codable {
        var name: String
        var slug: String
        var tagline: String?
        var trendingScore: Int
        var ownerName: String?
    }
    var counts: Counts
    var nextSession: NextSession?
    var peopleToMeet: [PersonLite]
    var trendingProject: TrendingProject?
}

// MARK: - Profile

struct MyProfile: Codable {
    var id: String
    var name: String
    var email: String
    var image: String?
    var profile: Profile?
}

// MARK: - Search

struct SearchResult: Codable, Identifiable, Hashable {
    var type: String
    var id: String
    var title: String
    var subtitle: String?
    var href: String
    var rowID: String { "\(type):\(id)" }
}

// MARK: - Messages

struct MessageRow: Codable, Identifiable, Hashable {
    var id: String
    var fromUserId: String
    var toUserId: String
    var body: String
    var readAt: Date?
    var createdAt: Date
}

// MARK: - Connections

struct ConnectionRow: Codable, Identifiable {
    var id: String
    var status: String
    var note: String?
    var connectedAt: Date?
    var person: Person
}

// MARK: - Discussions

struct DiscussionSummary: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var topic: String?
    var sessionId: String?
    var projectId: String?
    var questionId: String?
    var createdAt: Date?
    var updatedAt: Date?
    var authorName: String?
    var postCount: Int
}

struct DiscussionPost: Codable, Identifiable, Hashable {
    var id: String
    var discussionId: String
    var authorId: String
    var parentId: String?
    var body: String
    var createdAt: Date
    var authorName: String
    var authorImage: String?
}

struct DiscussionDetail: Codable {
    var id: String
    var title: String
    var topic: String?
    var sessionId: String?
    var authorName: String?
    var posts: [DiscussionPost]
}

// MARK: - Session detail

struct Speaker: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var image: String?
    var headline: String?
    var title: String?
    var company: String?
}

struct SessionResource: Codable, Identifiable, Hashable {
    var id: String
    var sessionId: String
    var label: String
    var url: String
    var sortOrder: Int
}

struct RelatedDiscussion: Codable, Hashable {
    var id: String
    var title: String
}

struct SessionDetail: Codable {
    var id: String
    var slug: String
    var title: String
    var abstract: String?
    var track: String?
    var startsAt: Date?
    var endsAt: Date?
    var livestreamUrl: String?
    var transcriptUrl: String?
    var aiSummary: String?
    var roomName: String?
    var speakers: [Speaker]
    var resources: [SessionResource]
    var relatedDiscussion: RelatedDiscussion?

    var isLiveNow: Bool {
        guard let startsAt, let endsAt else { return false }
        let now = Date()
        return now >= startsAt && now <= endsAt
    }
}

// MARK: - Q&A

struct SessionAnswer: Codable, Identifiable, Hashable {
    var id: String
    var body: String
    var fromSpeaker: Bool
    var authorId: String
    var authorName: String
    var authorImage: String?
    var createdAt: Date
}

struct SessionQuestion: Codable, Identifiable, Hashable {
    var id: String
    var sessionId: String?
    var authorId: String
    var body: String
    var status: String
    var upvotes: Int
    var hasVoted: Bool
    var promotedDiscussionId: String?
    var createdAt: Date
    var authorName: String
    var authorImage: String?
    var authorCompany: String?
    var answers: [SessionAnswer]
}

// MARK: - Moments

struct MomentRow: Codable, Identifiable, Hashable {
    var id: String
    var sessionId: String
    var timestampMs: Int
    var transcriptSnippet: String?
    var slideRef: String?
    var note: String?
    var aiHighlight: Bool
    var createdAt: Date?
}

struct MyMoment: Codable, Identifiable, Hashable {
    var id: String
    var sessionId: String
    var sessionSlug: String
    var sessionTitle: String
    var timestampMs: Int
    var transcriptSnippet: String?
    var slideRef: String?
    var note: String?
    var aiHighlight: Bool
    var createdAt: Date?
}

// MARK: - AI concierge settings

struct AiSettings: Codable {
    var provider: String
    var model: String?
    var baseUrl: String?
    var hasKey: Bool
}

// MARK: - Tasks

struct TaskRow: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var done: Bool
    var dueAt: Date?
    var createdAt: Date?
}
