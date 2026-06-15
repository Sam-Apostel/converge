import SwiftUI

// Converge design tokens, mirrored from the web app's `src/styles.css`
// (the "Soft Periwinkle Studio" palette). Lime is a fills-only delight accent.
extension Color {
    init(hex: UInt32, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

enum Palette {
    // Ink / text
    static let ink = Color(hex: 0x13141D)
    static let ink2 = Color(hex: 0x16172A)
    static let inkSoft = Color(hex: 0x3A3E54)

    // Muted greys
    static let slate = Color(hex: 0x52566C)
    static let mist = Color(hex: 0x72768E)
    static let muted = Color(hex: 0x8186A0)
    static let faint = Color(hex: 0x9398B2)
    static let frost = Color(hex: 0xC9CEE0)

    // Surfaces
    static let canvas = Color(hex: 0xE9EBF7)
    static let surface = Color(hex: 0xFFFFFF)
    static let inner = Color(hex: 0xF6F7FC)
    static let pillow = Color(hex: 0xEEF0F8)
    static let pillowDeep = Color(hex: 0xE3E7F2)
    static let tag = Color(hex: 0xF1F3FA)

    // Accent (fills only — live / delight)
    static let lime = Color(hex: 0x99FF00)
    static let limeDeep = Color(hex: 0x7BDB00)

    // Status
    static let danger = Color(hex: 0xFF4D3D)

    // Edges
    static let edge = Color(hex: 0x7882B4, alpha: 0.16)
}

// Type ramp from `--text-*` tokens. Geist isn't bundled yet, so we lean on the
// system rounded face which carries a similar friendly-geometric feel; swap to
// Geist in a later polish pass.
enum TypeRamp {
    static func micro() -> Font { .system(size: 10, weight: .medium) }
    static func tiny() -> Font { .system(size: 11, weight: .medium) }
    static func caption() -> Font { .system(size: 12) }
    static func note() -> Font { .system(size: 13) }
    static func body() -> Font { .system(size: 14) }
    static func reading() -> Font { .system(size: 15) }
    static func title() -> Font { .system(size: 22, weight: .semibold) }

    // Mono eyebrow — small caps, wide tracking, used for labels/timestamps.
    static func eyebrow() -> Font { .system(size: 11, weight: .semibold, design: .monospaced) }
    static func mono(_ size: CGFloat = 12) -> Font { .system(size: size, design: .monospaced) }
}

extension Text {
    /// Mono, uppercased, wide-tracked label — the web "eyebrow" treatment.
    func eyebrow() -> some View {
        self
            .font(TypeRamp.eyebrow())
            .textCase(.uppercase)
            .tracking(1.2)
            .foregroundStyle(Palette.mist)
    }
}
