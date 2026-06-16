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
        .padding(.horizontal, 20).padding(.top, 56).padding(.bottom, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        // White inner box — shorter than the frame, leaving a frosted gap on top.
        .background(Palette.surface, in: .rect(cornerRadius: 22))
        .padding(EdgeInsets(top: 22, leading: 8, bottom: 8, trailing: 8))
        .background {
            ZStack {
                RoundedRectangle(cornerRadius: 28).fill(.ultraThinMaterial)
                RoundedRectangle(cornerRadius: 28).fill(.white.opacity(0.32))
            }
        }
        .overlay { RoundedRectangle(cornerRadius: 28).strokeBorder(.white.opacity(0.6), lineWidth: 1) }
        .shadow(color: Color(hex: 0x28326E, alpha: 0.07), radius: 13, x: 0, y: 10)
        .shadow(color: Color(hex: 0x28326E, alpha: 0.06), radius: 1.5, x: 0, y: 1)
        // Avatar straddles the white box's top edge but stays inside the frame.
        .overlay(alignment: .topLeading) {
            Avatar(name: person.name, image: person.image, size: 76)
                .overlay(Circle().strokeBorder(Palette.surface, lineWidth: 4))
                .padding(.leading, 20)
                .padding(.top, 2)
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
