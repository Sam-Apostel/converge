import SwiftUI

/// Resolve an API image reference (absolute URL or a relative `/api/documents/…`
/// path) against the configured base URL.
func resolveImageURL(_ raw: String?) -> URL? {
    guard var raw, !raw.isEmpty else { return nil }
    // AsyncImage can't decode SVG — dicebear serves the same avatar as PNG.
    if raw.contains("api.dicebear.com") {
        raw = raw.replacingOccurrences(of: "/svg", with: "/png")
    }
    if raw.hasPrefix("http") { return URL(string: raw) }
    return URL(string: raw, relativeTo: APIClient.shared.baseURL)
}

/// Circular avatar with an initials fallback, matching the web Avatar primitive.
struct Avatar: View {
    let name: String
    var image: String? = nil
    var size: CGFloat = 44

    var body: some View {
        ZStack {
            Circle().fill(Palette.pillowDeep)
            Text(initials)
                .font(.system(size: size * 0.4, weight: .semibold))
                .foregroundStyle(Palette.slate)
            if let url = resolveImageURL(image) {
                AsyncImage(url: url) { phase in
                    if let img = phase.image {
                        img.resizable().scaledToFill()
                    }
                }
            }
        }
        .frame(width: size, height: size)
        .clipShape(.circle)
        .overlay(Circle().strokeBorder(Palette.edge, lineWidth: 1))
    }

    private var initials: String {
        let parts = name.split(separator: " ").prefix(2)
        return parts.compactMap { $0.first.map(String.init) }.joined().uppercased()
    }
}

/// Overlapping avatar stack — speakers on a session card, a project's team, etc.
struct AvatarStack: View {
    let items: [(name: String, image: String?)]
    var size: CGFloat = 26
    var max: Int = 4

    var body: some View {
        HStack(spacing: -size * 0.34) {
            ForEach(Array(items.prefix(max).enumerated()), id: \.offset) { _, item in
                Avatar(name: item.name, image: item.image, size: size)
                    .overlay(Circle().strokeBorder(Palette.surface, lineWidth: 1.5))
            }
            if items.count > max {
                Text("+\(items.count - max)")
                    .font(.system(size: size * 0.38, weight: .semibold))
                    .foregroundStyle(Palette.slate)
                    .frame(width: size, height: size)
                    .background(Palette.pillow, in: .circle)
                    .overlay(Circle().strokeBorder(Palette.surface, lineWidth: 1.5))
            }
        }
    }
}

/// Availability dot (open / busy / dnd).
struct AvailabilityDot: View {
    let availability: String?
    var body: some View {
        Circle()
            .fill(color)
            .frame(width: 8, height: 8)
    }
    private var color: Color {
        switch availability {
        case "busy": Palette.frost
        case "dnd": Palette.danger
        default: Palette.limeDeep
        }
    }
}
