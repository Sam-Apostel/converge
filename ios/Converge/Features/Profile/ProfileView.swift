import Observation
import SwiftUI

@MainActor
@Observable
final class ProfileModel {
    var me: MyProfile?
    var state: LoadState = .loading

    func load() async {
        if me == nil { state = .loading }
        do {
            me = try await APIClient.shared.get("/api/profile")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }

    func save(_ patch: ProfilePatch) async -> Bool {
        do {
            me = try await APIClient.shared.send("/api/profile", method: "PATCH", body: patch)
            return true
        } catch { return false }
    }
}

struct ProfilePatch: Encodable {
    var name: String?
    var image: String?
    var headline: String?
    var title: String?
    var company: String?
    var location: String?
    var bio: String?
    var currentFocus: String?
    var availability: String?
    var intents: [String]?
    var interestedTopics: [String]?
}

struct ProfileView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = ProfileModel()
    @State private var editing = false
    @State private var passkeyNote: String?

    var body: some View {
        ZStack {
            CanvasBackground()
            if let me = model.me {
                content(me)
            } else {
                StateOverlay(state: model.state) { Task { await model.load() } }
            }
        }
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: HubRoute.settings) { Image(systemName: "gearshape") }
            }
        }
        .sheet(isPresented: $editing) {
            if let me = model.me {
                ProfileEditView(me: me) { patch in
                    Task { if await model.save(patch) { editing = false; await session.refresh() } }
                }
            }
        }
        .task { await model.load() }
    }

    private func content(_ me: MyProfile) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 14) {
                    Avatar(name: me.name, image: me.image, size: 72)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(me.name).font(TypeRamp.title()).foregroundStyle(Palette.ink)
                        if let p = me.profile {
                            if let role = roleLine(p) { Text(role).font(TypeRamp.note()).foregroundStyle(Palette.slate) }
                            if let loc = p.location { Label(loc, systemImage: "mappin.and.ellipse").font(TypeRamp.caption()).foregroundStyle(Palette.mist) }
                        }
                        Text(me.email).font(TypeRamp.caption()).foregroundStyle(Palette.faint)
                    }
                    Spacer(minLength: 0)
                }

                HStack(spacing: 10) {
                    Button { editing = true } label: {
                        Label("Edit profile", systemImage: "pencil")
                            .font(TypeRamp.body().weight(.semibold)).frame(maxWidth: .infinity)
                            .padding(.vertical, 11).foregroundStyle(Palette.ink)
                            .background(Palette.pillow, in: .capsule)
                    }
                    .buttonStyle(.plain)
                    Button(action: addPasskey) {
                        Image(systemName: "person.badge.key")
                            .font(.system(size: 16, weight: .medium)).foregroundStyle(Palette.ink)
                            .frame(width: 46, height: 46).background(Palette.pillow, in: .circle)
                    }
                    .buttonStyle(.plain)
                }
                if let passkeyNote {
                    Text(passkeyNote).font(TypeRamp.caption()).foregroundStyle(Palette.limeDeep)
                }

                if let bio = me.profile?.bio, !bio.isEmpty {
                    section("Why I'm here") { Text(bio).font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft) }
                }
                if let focus = me.profile?.currentFocus, !focus.isEmpty {
                    section("Current focus") { Text(focus).font(TypeRamp.reading()).foregroundStyle(Palette.inkSoft) }
                }
                if let intents = me.profile?.intents, !intents.isEmpty {
                    section("Here for") { WrapPills(items: intents, tone: .lime) }
                }
                if let topics = me.profile?.interestedTopics, !topics.isEmpty {
                    section("Interested in") { WrapPills(items: topics) }
                }

                Button(role: .destructive) { Task { await session.signOut() } } label: {
                    Text("Sign out").font(TypeRamp.body().weight(.medium))
                        .frame(maxWidth: .infinity).padding(.vertical, 11)
                        .foregroundStyle(Palette.danger)
                        .background(Palette.surface, in: .capsule)
                }
                .buttonStyle(.plain)
                .padding(.top, 8)
            }
            .padding(20)
        }
    }

    private func addPasskey() {
        guard let me = model.me else { return }
        passkeyNote = nil
        Task {
            do {
                try await NativeAuth.shared.registerPasskey(displayName: me.name)
                passkeyNote = "Passkey added ✓"
            } catch {
                passkeyNote = (error as? NativeAuth.AuthError)?.errorDescription ?? "Couldn't add passkey."
            }
        }
    }

    private func roleLine(_ p: Profile) -> String? {
        switch (p.title, p.company) {
        case let (t?, c?): "\(t) at \(c)"
        case let (t?, nil): t
        case let (nil, c?): c
        default: p.headline
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
