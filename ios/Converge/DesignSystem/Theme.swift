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

/// Deterministic per-person theme colour (for badge cover strips / tints),
/// mirroring the web's per-person palette hue.
func personColor(_ seed: String) -> Color {
    var hash: UInt64 = 5381
    for b in seed.utf8 { hash = (hash &* 33) ^ UInt64(b) }
    let hue = Double(hash % 360) / 360.0
    return Color(hue: hue, saturation: 0.5, brightness: 0.95)
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

// Type ramp from `--text-*` tokens, using the bundled brand typeface Geist
// (Geist Mono for eyebrow labels / timestamps). Sizes scale with Dynamic Type.
enum TypeRamp {
    private static let sans = "Geist"
    private static let monoFamily = "Geist Mono"

    static func micro() -> Font { .custom(sans, size: 10).weight(.medium) }
    static func tiny() -> Font { .custom(sans, size: 11).weight(.medium) }
    static func caption() -> Font { .custom(sans, size: 12) }
    static func note() -> Font { .custom(sans, size: 13) }
    static func body() -> Font { .custom(sans, size: 14) }
    static func reading() -> Font { .custom(sans, size: 15) }
    static func title() -> Font { .custom(sans, size: 22).weight(.semibold) }

    // Mono eyebrow — uppercased, wide tracking, used for labels/timestamps.
    static func eyebrow() -> Font { .custom(monoFamily, size: 11).weight(.semibold) }
    static func mono(_ size: CGFloat = 12) -> Font { .custom(monoFamily, size: size) }
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
