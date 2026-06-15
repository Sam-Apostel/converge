import SwiftUI

// Reusable surfaces mirroring the web primitives (Card / GlassCard / Pill / Tag /
// LiveDot). On iOS 26 we lean on real Liquid Glass for the frosted surfaces and
// keep the soft neumorphic card for opaque content.

/// Opaque soft card — the web `Card` (white surface, soft shadow, no border).
struct SoftCard<Content: View>: View {
    var padding: CGFloat = 16
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: .rect(cornerRadius: 22))
            .shadow(color: .black.opacity(0.06), radius: 18, x: 0, y: 10)
            .shadow(color: .black.opacity(0.04), radius: 2, x: 0, y: 1)
    }
}

/// Frosted Liquid Glass panel — the web `GlassCard`, for floating / special UI.
struct GlassCard<Content: View>: View {
    var padding: CGFloat = 16
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassEffect(.regular, in: .rect(cornerRadius: 22))
    }
}

/// Small inline tag — `bg-pillow`, rounded-full, used for topics / tech stack.
struct Pill: View {
    let text: String
    var tone: Tone = .neutral

    enum Tone { case neutral, lime, ink }

    var body: some View {
        Text(text)
            .font(TypeRamp.caption())
            .foregroundStyle(tone == .ink ? Palette.surface : Palette.inkSoft)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(background, in: .capsule)
    }

    private var background: Color {
        switch tone {
        case .neutral: Palette.pillow
        case .lime: Palette.lime.opacity(0.22)
        case .ink: Palette.ink
        }
    }
}

/// Pulsing lime "live" indicator (the `livePulse` keyframe).
struct LiveDot: View {
    @State private var on = false

    var body: some View {
        Circle()
            .fill(Palette.lime)
            .frame(width: 8, height: 8)
            .shadow(color: Palette.lime.opacity(on ? 0.0 : 0.9), radius: on ? 9 : 0)
            .scaleEffect(on ? 1.0 : 0.85)
            .animation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true), value: on)
            .onAppear { on = true }
    }
}

/// Section heading with the mono eyebrow treatment.
struct SectionHeader: View {
    let eyebrow: String
    var title: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(eyebrow).eyebrow()
            if let title {
                Text(title)
                    .font(TypeRamp.title())
                    .foregroundStyle(Palette.ink)
            }
        }
    }
}

/// The periwinkle canvas the whole app sits on.
struct CanvasBackground: View {
    var body: some View {
        Palette.canvas.ignoresSafeArea()
    }
}
