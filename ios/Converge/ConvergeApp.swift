import SwiftUI

@main
struct ConvergeApp: App {
    @State private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            AppGate()
                .environment(session)
                .tint(Palette.ink)
                .task { await session.bootstrap() }
        }
    }
}

/// Routes between the loading splash, sign-in, and the signed-in app.
struct AppGate: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        switch session.state {
        case .loading:
            SplashView()
        case .signedOut:
            LoginView()
                .transition(.opacity)
        case .signedIn:
            RootView()
                .transition(.opacity)
        }
    }
}

struct SplashView: View {
    var body: some View {
        ZStack {
            CanvasBackground()
            VStack(spacing: 16) {
                ConvergeLogo(size: 34)
                ProgressView().tint(Palette.mist)
            }
        }
    }
}
