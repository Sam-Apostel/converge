import Observation
import SwiftUI

@MainActor
@Observable
final class SessionsModel {
    var sessions: [Session] = []
    var state: LoadState = .loading
    var track: String?

    var tracks: [String] {
        Set(sessions.compactMap(\.track)).sorted()
    }

    var filtered: [Session] {
        track == nil ? sessions : sessions.filter { $0.track == track }
    }

    /// Sessions grouped into day sections, preserving start-time order.
    var days: [(label: String, sessions: [Session])] {
        let groups = Dictionary(grouping: filtered) { session -> String in
            session.startsAt.map(Format.day) ?? "Unscheduled"
        }
        return groups
            .sorted { ($0.value.first?.startsAt ?? .distantFuture) < ($1.value.first?.startsAt ?? .distantFuture) }
            .map { ($0.key, $0.value) }
    }

    func load() async {
        if sessions.isEmpty { state = .loading }
        do {
            sessions = try await APIClient.shared.get("/api/sessions")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }
}

struct SessionsView: View {
    @State private var model = SessionsModel()

    var body: some View {
        Group {
            if model.state == .loaded {
                list
            } else {
                StateOverlay(state: model.state) { Task { await model.load() } }
            }
        }
        .background(Palette.canvas, ignoresSafeAreaEdges: .all)
        .navigationTitle("Sessions")
        .task { await model.load() }
    }

    private var list: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if !model.tracks.isEmpty {
                    FilterChips(options: model.tracks, selection: $model.track)
                }
                ForEach(model.days, id: \.label) { day in
                    VStack(alignment: .leading, spacing: 10) {
                        Text(day.label).eyebrow().padding(.horizontal, 16)
                        ForEach(day.sessions) { session in
                            NavigationLink(value: SessionRoute(slug: session.slug)) {
                                SessionRow(session: session)
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal, 16)
                        }
                    }
                }
                if model.filtered.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "calendar")
                            .font(.system(size: 28)).foregroundStyle(Palette.faint)
                        Text("No sessions on the schedule yet.")
                            .font(TypeRamp.note()).foregroundStyle(Palette.mist)
                    }
                    .frame(maxWidth: .infinity).padding(.top, 60)
                }
            }
            .padding(.bottom, 24)
        }
        .refreshable { await model.load() }
    }
}

struct SessionRow: View {
    let session: Session

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text(Format.timeRange(session.startsAt, session.endsAt))
                        .font(TypeRamp.mono(12))
                        .foregroundStyle(Palette.slate)
                    if let track = session.track { Pill(text: track) }
                    Spacer(minLength: 0)
                    if session.isLiveNow {
                        HStack(spacing: 5) {
                            LiveDot()
                            Text("LIVE").font(TypeRamp.tiny().weight(.bold)).foregroundStyle(Palette.limeDeep)
                        }
                    }
                }
                Text(session.title)
                    .font(TypeRamp.body().weight(.semibold))
                    .foregroundStyle(Palette.ink)
                if let abstract = session.abstract {
                    Text(abstract)
                        .font(TypeRamp.caption())
                        .foregroundStyle(Palette.mist)
                        .lineLimit(2)
                }
                if !session.speakers.isEmpty {
                    HStack(spacing: 8) {
                        AvatarStack(items: session.speakers.map { ($0.name, $0.image) }, size: 24)
                        Text(session.speakers.map(\.name).joined(separator: ", "))
                            .font(TypeRamp.caption()).foregroundStyle(Palette.slate).lineLimit(1)
                    }
                    .padding(.top, 2)
                }
            }
        }
    }
}

#Preview { SessionsView() }
