import Observation
import SwiftUI

/// Rich person card: avatar straddling the top-left of the frosted frame, name +
/// role + location, a prominent intent "status" pill with a lime dot, topic
/// tags, and a Connect button. Used as the People directory list card.
struct PersonCard: View {
    let person: Person

    @Environment(SessionStore.self) private var session
    @State private var connect: ConnectState = .idle

    enum ConnectState: Equatable { case idle, requesting, requested, failed }

    private var topics: [String] {
        let t = person.profile?.interestedTopics ?? []
        return t.isEmpty ? Array(person.intents.dropFirst()) : t
    }
    private var isSelf: Bool { session.currentUser?.id == person.id }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            NavigationLink(value: person) {
                VStack(alignment: .leading, spacing: 10) {
                    Color.clear.frame(height: 50) // room for the overlapping avatar
                    VStack(alignment: .leading, spacing: 3) {
                        Text(person.name)
                            .font(TypeRamp.title()).foregroundStyle(Palette.ink)
                            .lineLimit(1)
                        if let role = person.roleLine {
                            Text(role).font(TypeRamp.reading()).foregroundStyle(Palette.mist).lineLimit(2)
                        }
                    }
                    if let loc = person.location, !loc.isEmpty {
                        Label(loc, systemImage: "mappin.and.ellipse")
                            .font(TypeRamp.note()).foregroundStyle(Palette.mist)
                    }
                    if let intent = person.intents.first {
                        statusPill(intent).padding(.top, 2)
                    }
                    if !topics.isEmpty {
                        FlowLayout(spacing: 8) {
                            ForEach(topics.prefix(4), id: \.self) { tag($0) }
                        }
                        .padding(.top, 2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)

            if !isSelf { connectButton }
        }
        .padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .modifier(GlassFrame(innerRadius: 24, inset: 10))
        .overlay(alignment: .topLeading) {
            Avatar(name: person.name, image: person.image, size: 84)
                .overlay(Circle().strokeBorder(Palette.surface, lineWidth: 4))
                .padding(.leading, 20)
                .offset(y: -6)
        }
    }

    private func statusPill(_ text: String) -> some View {
        HStack(spacing: 8) {
            Circle().fill(Palette.lime).frame(width: 9, height: 9)
            Text(text).font(TypeRamp.reading().weight(.medium)).foregroundStyle(Palette.ink)
        }
        .padding(.horizontal, 14).padding(.vertical, 9)
        .background(Palette.pillow, in: .rect(cornerRadius: 12))
    }

    private func tag(_ text: String) -> some View {
        Text(text)
            .font(TypeRamp.caption()).foregroundStyle(Palette.slate)
            .padding(.horizontal, 12).padding(.vertical, 7)
            .background(Palette.tag, in: .capsule)
    }

    private var connectButton: some View {
        Button(action: doConnect) {
            Text(connectLabel)
                .font(TypeRamp.body().weight(.medium))
                .frame(maxWidth: .infinity).padding(.vertical, 14)
                .foregroundStyle(Palette.ink)
                .background(Palette.pillow, in: .rect(cornerRadius: 14))
        }
        .buttonStyle(.plain)
        .disabled(connect == .requesting || connect == .requested)
    }

    private var connectLabel: String {
        switch connect {
        case .idle, .failed: "Connect"
        case .requesting: "Requesting…"
        case .requested: "Requested ✓"
        }
    }

    private func doConnect() {
        connect = .requesting
        struct Body: Encodable { let toUserId: String }
        Task {
            do {
                try await APIClient.shared.fire("/api/connections", method: "POST", body: Body(toUserId: person.id))
                connect = .requested
            } catch { connect = .failed }
        }
    }
}
