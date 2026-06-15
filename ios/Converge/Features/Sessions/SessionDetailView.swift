import Observation
import SwiftUI

@MainActor
@Observable
final class SessionDetailModel {
    var detail: SessionDetail?
    var questions: [SessionQuestion] = []
    var moments: [MomentRow] = []
    var state: LoadState = .loading
    var draftQuestion = ""
    var posting = false
    let realtime = Realtime()

    func load(slug: String) async {
        if detail == nil { state = .loading }
        do {
            let detail: SessionDetail = try await APIClient.shared.get("/api/sessions/\(slug)")
            self.detail = detail
            state = .loaded
            await refreshLive(sessionId: detail.id)
            // Live updates: new questions / moments land without a refresh.
            realtime.connect(channel: "session:\(detail.id)") { [weak self] _, _ in
                Task { await self?.refreshLive(sessionId: detail.id) }
            }
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }

    func stop() { realtime.disconnect() }

    func refreshLive(sessionId: String) async {
        async let q: [SessionQuestion] = (try? APIClient.shared.get(
            "/api/questions", query: [.init(name: "sessionId", value: sessionId)]
        )) ?? []
        async let m: [MomentRow] = (try? APIClient.shared.get(
            "/api/moments", query: [.init(name: "sessionId", value: sessionId)]
        )) ?? []
        questions = await q
        moments = await m
    }

    func ask(sessionId: String) async {
        let text = draftQuestion.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        posting = true
        struct Body: Encodable { let sessionId: String; let body: String }
        do {
            let created: SessionQuestion = try await APIClient.shared.send(
                "/api/questions", method: "POST", body: Body(sessionId: sessionId, body: text)
            )
            draftQuestion = ""
            questions.insert(created, at: 0)
            await refreshLive(sessionId: sessionId)
        } catch {}
        posting = false
    }

    func toggleVote(_ question: SessionQuestion) async {
        struct VoteResult: Decodable { let voteCount: Int; let hasVoted: Bool }
        do {
            let result: VoteResult = try await APIClient.shared.send(
                "/api/questions/\(question.id)/vote", method: "POST", body: Optional<Int>.none
            )
            if let idx = questions.firstIndex(where: { $0.id == question.id }) {
                questions[idx].upvotes = result.voteCount
                questions[idx].hasVoted = result.hasVoted
            }
            questions.sort { $0.upvotes > $1.upvotes }
        } catch {}
    }

    func promote(_ question: SessionQuestion) async {
        struct Result: Decodable { let discussionId: String }
        if let result: Result = try? await APIClient.shared.send(
            "/api/questions/\(question.id)/promote", method: "POST", body: Optional<Int>.none
        ), let idx = questions.firstIndex(where: { $0.id == question.id }) {
            questions[idx].promotedDiscussionId = result.discussionId
        }
    }

    func captureMoment(session: SessionDetail) async {
        let elapsed: Int
        if let start = session.startsAt {
            elapsed = max(0, Int(Date().timeIntervalSince(start) * 1000))
        } else {
            elapsed = 0
        }
        struct Body: Encodable { let sessionId: String; let timestampMs: Int }
        do {
            let created: MomentRow = try await APIClient.shared.send(
                "/api/moments", method: "POST", body: Body(sessionId: session.id, timestampMs: elapsed)
            )
            moments.append(created)
            moments.sort { $0.timestampMs < $1.timestampMs }
        } catch {}
    }
}

struct SessionDetailView: View {
    let slug: String
    @State private var model = SessionDetailModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            if let detail = model.detail {
                content(detail)
            } else {
                StateOverlay(state: model.state) { Task { await model.load(slug: slug) } }
            }
        }
        .navigationTitle("Session")
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load(slug: slug) }
        .onDisappear { model.stop() }
    }

    private func content(_ detail: SessionDetail) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header(detail)
                if let url = detail.livestreamUrl.flatMap(URL.init) {
                    Link(destination: url) {
                        Label("Open livestream", systemImage: "play.circle.fill")
                            .font(TypeRamp.body().weight(.semibold))
                            .frame(maxWidth: .infinity).padding(.vertical, 12)
                            .foregroundStyle(Palette.ink)
                            .background(Palette.lime, in: .capsule)
                    }
                }
                captureBar(detail)
                if !detail.speakers.isEmpty { speakers(detail) }
                if let summary = detail.aiSummary, !summary.isEmpty {
                    section("AI summary") { Text(summary).font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft) }
                }
                if let abstract = detail.abstract, !abstract.isEmpty {
                    section("Abstract") { Text(abstract).font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft) }
                }
                if !detail.resources.isEmpty { resources(detail) }
                if let related = detail.relatedDiscussion {
                    NavigationLink(value: DiscussionRoute(id: related.id)) {
                        HStack {
                            Label("Discussion: \(related.title)", systemImage: "bubble.left.and.bubble.right")
                                .font(TypeRamp.note().weight(.medium)).foregroundStyle(Palette.ink)
                            Spacer()
                            Image(systemName: "chevron.right").font(.caption).foregroundStyle(Palette.faint)
                        }
                        .padding(14).background(Palette.pillow, in: .rect(cornerRadius: 14))
                    }
                    .buttonStyle(.plain)
                }
                qanda(detail)
            }
            .padding(20)
        }
        .refreshable { await model.refreshLive(sessionId: detail.id) }
    }

    private func header(_ d: SessionDetail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                if let track = d.track { Pill(text: track) }
                if d.isLiveNow {
                    HStack(spacing: 5) {
                        LiveDot()
                        Text("LIVE NOW").font(TypeRamp.tiny().weight(.bold)).foregroundStyle(Palette.limeDeep)
                    }
                }
            }
            Text(d.title).font(TypeRamp.title()).foregroundStyle(Palette.ink)
            HStack(spacing: 10) {
                Text(Format.timeRange(d.startsAt, d.endsAt)).font(TypeRamp.mono(13)).foregroundStyle(Palette.slate)
                if let room = d.roomName {
                    Label(room, systemImage: "mappin.and.ellipse").font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                }
            }
        }
    }

    private func captureBar(_ d: SessionDetail) -> some View {
        Button { Task { await model.captureMoment(session: d) } } label: {
            HStack(spacing: 8) {
                Image(systemName: "bookmark.fill")
                Text("Capture this moment").font(TypeRamp.body().weight(.semibold))
                Spacer()
                if !model.moments.isEmpty {
                    Text("\(model.moments.count)").font(TypeRamp.caption().weight(.bold))
                        .foregroundStyle(Palette.ink)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Palette.lime, in: .capsule)
                }
            }
            .foregroundStyle(Palette.ink)
            .padding(14)
        }
        .buttonStyle(.plain)
        .glassEffect(.regular, in: .rect(cornerRadius: 16))
    }

    private func speakers(_ d: SessionDetail) -> some View {
        section("Speakers") {
            VStack(spacing: 10) {
                ForEach(d.speakers) { sp in
                    NavigationLink(value: Person(
                        id: sp.id, name: sp.name, image: sp.image,
                        profile: Profile(userId: sp.id, headline: sp.headline, company: sp.company, title: sp.title)
                    )) {
                        HStack(spacing: 12) {
                            Avatar(name: sp.name, image: sp.image, size: 42)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(sp.name).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink)
                                if let line = sp.headline ?? sp.title {
                                    Text(line).font(TypeRamp.caption()).foregroundStyle(Palette.mist)
                                }
                            }
                            Spacer(minLength: 0)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func resources(_ d: SessionDetail) -> some View {
        section("Resources") {
            VStack(spacing: 8) {
                ForEach(d.resources) { res in
                    if let url = URL(string: res.url) {
                        Link(destination: url) {
                            HStack {
                                Text(res.label).font(TypeRamp.note().weight(.medium)).foregroundStyle(Palette.ink)
                                Spacer()
                                Image(systemName: "arrow.up.right").font(.caption).foregroundStyle(Palette.faint)
                            }
                            .padding(.horizontal, 14).padding(.vertical, 11)
                            .background(Palette.inner, in: .rect(cornerRadius: 12))
                        }
                    }
                }
            }
        }
    }

    private func qanda(_ d: SessionDetail) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Q&A").eyebrow()
            HStack(spacing: 8) {
                TextField("Ask the speaker…", text: $model.draftQuestion, axis: .vertical)
                    .font(TypeRamp.body())
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .background(Palette.surface, in: .rect(cornerRadius: 12))
                Button { Task { await model.ask(sessionId: d.id) } } label: {
                    Image(systemName: "paperplane.fill").foregroundStyle(Palette.ink)
                        .frame(width: 40, height: 40).background(Palette.lime, in: .circle)
                }
                .buttonStyle(.plain)
                .disabled(model.posting || model.draftQuestion.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            ForEach(model.questions) { q in
                QuestionCard(
                    question: q,
                    onVote: { Task { await model.toggleVote(q) } },
                    onPromote: { Task { await model.promote(q) } }
                )
            }
            if model.questions.isEmpty {
                Text("No questions yet — be the first to ask.")
                    .font(TypeRamp.caption()).foregroundStyle(Palette.mist).padding(.vertical, 8)
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

struct QuestionCard: View {
    let question: SessionQuestion
    let onVote: () -> Void
    var onPromote: (() -> Void)? = nil

    var body: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top, spacing: 12) {
                    Button(action: onVote) {
                        VStack(spacing: 2) {
                            Image(systemName: question.hasVoted ? "arrowtriangle.up.fill" : "arrowtriangle.up")
                            Text("\(question.upvotes)").font(TypeRamp.caption().weight(.bold))
                        }
                        .foregroundStyle(question.hasVoted ? Palette.limeDeep : Palette.mist)
                        .frame(width: 36)
                    }
                    .buttonStyle(.plain)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(question.body).font(TypeRamp.reading()).foregroundStyle(Palette.ink)
                        HStack(spacing: 6) {
                            Avatar(name: question.authorName, image: question.authorImage, size: 18)
                            Text(question.authorName).font(TypeRamp.tiny()).foregroundStyle(Palette.mist)
                            if question.status == "answered" {
                                Text("answered").font(TypeRamp.tiny().weight(.semibold)).foregroundStyle(Palette.limeDeep)
                            }
                        }
                    }
                }
                ForEach(question.answers) { a in
                    HStack(alignment: .top, spacing: 8) {
                        Rectangle().fill(Palette.edge).frame(width: 2)
                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: 5) {
                                Text(a.authorName).font(TypeRamp.tiny().weight(.semibold)).foregroundStyle(Palette.slate)
                                if a.fromSpeaker {
                                    Text("SPEAKER").font(TypeRamp.micro().weight(.bold)).foregroundStyle(Palette.ink)
                                        .padding(.horizontal, 5).padding(.vertical, 1)
                                        .background(Palette.lime, in: .capsule)
                                }
                            }
                            Text(a.body).font(TypeRamp.caption()).foregroundStyle(Palette.inkSoft)
                        }
                    }
                    .padding(.leading, 48)
                }
                if let discussionId = question.promotedDiscussionId {
                    NavigationLink(value: DiscussionRoute(id: discussionId)) {
                        Label("View discussion", systemImage: "arrow.turn.up.right")
                            .font(TypeRamp.caption().weight(.medium)).foregroundStyle(Palette.limeDeep)
                    }
                    .buttonStyle(.plain)
                } else if let onPromote {
                    Button(action: onPromote) {
                        Label("Continue as discussion", systemImage: "bubble.left.and.bubble.right")
                            .font(TypeRamp.caption().weight(.medium)).foregroundStyle(Palette.slate)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}
