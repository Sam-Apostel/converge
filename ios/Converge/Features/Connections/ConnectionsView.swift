import Observation
import SwiftUI

@MainActor
@Observable
final class ConnectionsModel {
    var connections: [ConnectionRow] = []
    var state: LoadState = .loading

    var accepted: [ConnectionRow] { connections.filter { $0.status == "accepted" } }
    var pending: [ConnectionRow] { connections.filter { $0.status == "pending" } }

    func load() async {
        if connections.isEmpty { state = .loading }
        do {
            connections = try await APIClient.shared.get("/api/connections")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }
}

struct ConnectionsView: View {
    @State private var model = ConnectionsModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            if model.state == .loaded { list } else {
                StateOverlay(state: model.state) { Task { await model.load() } }
            }
        }
        .navigationTitle("Network")
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load() }
    }

    private var list: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if !model.pending.isEmpty {
                    group("Pending", model.pending)
                }
                group("Connected", model.accepted)
                if model.connections.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "person.2").font(.system(size: 28)).foregroundStyle(Palette.faint)
                        Text("No connections yet.").font(TypeRamp.note()).foregroundStyle(Palette.mist)
                        Text("Tap Connect on someone's profile.").font(TypeRamp.caption()).foregroundStyle(Palette.faint)
                    }
                    .frame(maxWidth: .infinity).padding(.top, 60)
                }
            }
            .padding(.horizontal, 20).padding(.bottom, 24)
        }
        .refreshable { await model.load() }
    }

    private func group(_ title: String, _ rows: [ConnectionRow]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            if !rows.isEmpty { Text(title).eyebrow() }
            ForEach(rows) { row in
                SoftCard {
                    HStack(spacing: 12) {
                        NavigationLink(value: row.person) {
                            HStack(spacing: 12) {
                                Avatar(name: row.person.name, image: row.person.image, size: 44)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(row.person.name).font(TypeRamp.body().weight(.semibold)).foregroundStyle(Palette.ink)
                                    if let role = row.person.roleLine {
                                        Text(role).font(TypeRamp.caption()).foregroundStyle(Palette.mist).lineLimit(1)
                                    }
                                }
                                Spacer(minLength: 0)
                            }
                        }
                        .buttonStyle(.plain)
                        if row.status == "pending" {
                            Text("pending").font(TypeRamp.tiny().weight(.semibold)).foregroundStyle(Palette.mist)
                        } else {
                            NavigationLink(value: MessageTarget(userId: row.person.id, name: row.person.name)) {
                                Image(systemName: "bubble.left").foregroundStyle(Palette.ink)
                                    .frame(width: 36, height: 36).background(Palette.pillow, in: .circle)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }
}
