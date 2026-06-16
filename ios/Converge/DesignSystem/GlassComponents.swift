import SwiftUI

// Reusable surfaces mirroring the web primitives. The two centerpieces of the
// visual identity are the GlassCard (a frosted translucent frame wrapping an
// opaque white inner) and the Spotlight (the dark ink hero card with a lime
// glow). Search/text fields carry the same glassy frame.

/// Opaque soft card — the web `Card` (white surface, soft shadow, no border).
struct SoftCard<Content: View>: View {
    var padding: CGFloat = 16
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: .rect(cornerRadius: 20))
            .shadow(color: .black.opacity(0.06), radius: 18, x: 0, y: 10)
            .shadow(color: .black.opacity(0.04), radius: 2, x: 0, y: 1)
    }
}

/// The signature card: a translucent frosted frame wrapping an opaque white
/// inner, matching the web `GlassCard` (frame `bg-white/32` + `border-white/60`
/// + `shadow-card`; inner pure white). The frame reads in the gap around the
/// content — milky over the periwinkle canvas, frosted over richer backdrops.
struct GlassFrame: ViewModifier {
    var innerRadius: CGFloat = 18
    var inset: CGFloat = 8
    /// Optional per-item hue washed through the frosted frame (web `tint`).
    var tint: Color? = nil

    func body(content: Content) -> some View {
        content
            .background(Palette.surface, in: .rect(cornerRadius: innerRadius))
            .padding(inset)
            .background {
                let r = innerRadius + inset
                ZStack {
                    RoundedRectangle(cornerRadius: r).fill(.ultraThinMaterial)
                    if let tint {
                        RoundedRectangle(cornerRadius: r).fill(
                            LinearGradient(colors: [tint.opacity(0.55), .white.opacity(0.34)],
                                           startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                    } else {
                        RoundedRectangle(cornerRadius: r).fill(.white.opacity(0.32))
                    }
                }
            }
            .overlay {
                RoundedRectangle(cornerRadius: innerRadius + inset)
                    .strokeBorder(.white.opacity(0.6), lineWidth: 1)
            }
            // --shadow-card: two soft drops in rgb(40,50,110).
            .shadow(color: Color(hex: 0x28326E, alpha: 0.07), radius: 13, x: 0, y: 10)
            .shadow(color: Color(hex: 0x28326E, alpha: 0.06), radius: 1.5, x: 0, y: 1)
    }
}

struct GlassCard<Content: View>: View {
    var padding: CGFloat = 16
    var inset: CGFloat = 8
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .modifier(GlassFrame(innerRadius: 18, inset: inset))
    }
}

/// The dark "hero" surface — ink gradient with a lime radial glow. Used for the
/// next-session card, top matches, and other spotlight moments.
struct Spotlight<Content: View>: View {
    var padding: CGFloat = 18
    var beam: Bool = false
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                ZStack {
                    LinearGradient(
                        colors: [Palette.ink, Color(hex: 0x1C1E2E)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                    RadialGradient(
                        colors: [Palette.lime.opacity(0.22), .clear],
                        center: UnitPoint(x: 0.95, y: 0.1), startRadius: 0, endRadius: 220
                    )
                }
            }
            .clipShape(.rect(cornerRadius: 22))
            .overlay {
                RoundedRectangle(cornerRadius: 22)
                    .strokeBorder(.white.opacity(0.08), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.18), radius: 22, x: 0, y: 14)
    }
}

/// Glassy-framed wrapper for search / text inputs — mirrors the GlassCard frame
/// at field scale so inputs sit inside the same frosted identity.
struct GlassField<Content: View>: View {
    var radius: CGFloat = 14
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .frame(maxWidth: .infinity, alignment: .leading)
            .modifier(GlassFrame(innerRadius: radius, inset: 5))
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
