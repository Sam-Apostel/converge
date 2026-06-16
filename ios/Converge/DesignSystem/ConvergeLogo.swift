import SwiftUI

/// Converge brand mark: a glassy, brand-yellow "C" ring with a person (head +
/// shoulders) inside, sitting on the branded blue tile with faint radar rings.
/// Geometry mirrors `src/components/converge-logo.tsx` (64×64 design space).
struct ConvergeLogo: View {
    var size: CGFloat = 64
    var showsTile: Bool = true

    static let arc = "M51.447,50.491c0.556,0.528 0.839,1.282 0.767,2.046c-0.071,0.763 -0.489,1.452 -1.134,1.867c-4.262,2.604 -9.307,4.126 -14.715,4.126c-15.117,0 -27.39,-11.888 -27.39,-26.53c0,-14.642 12.273,-26.53 27.39,-26.53c5.408,-0 10.453,1.522 14.701,4.147c0.638,0.411 1.052,1.093 1.123,1.849c0.071,0.756 -0.209,1.502 -0.759,2.025c-1.905,1.845 -4.633,4.438 -6.227,5.953c-0.756,0.719 -1.88,0.892 -2.817,0.435c-1.815,-0.873 -3.861,-1.351 -6.021,-1.351c-7.677,-0 -13.909,6.037 -13.909,13.472c0,7.435 6.232,13.472 13.909,13.472c2.16,0 4.206,-0.478 6.03,-1.331c0.93,-0.453 2.043,-0.281 2.792,0.431c1.61,1.499 4.338,4.092 6.26,5.919Z"
    static let shoulders = "M51.481,50.523c0.547,0.52 0.826,1.262 0.756,2.014c-0.07,0.751 -0.48,1.43 -1.114,1.84c-4.271,2.621 -9.331,4.153 -14.758,4.153c-5.428,0 -10.488,-1.532 -14.746,-4.174c-0.627,-0.406 -1.034,-1.077 -1.103,-1.822c-0.069,-0.744 0.207,-1.479 0.749,-1.994c1.914,-1.852 4.678,-4.479 6.279,-6.001c0.746,-0.709 1.854,-0.879 2.779,-0.427c1.82,0.878 3.873,1.36 6.042,1.36c2.168,0 4.221,-0.482 6.051,-1.34c0.916,-0.449 2.014,-0.28 2.754,0.423c1.616,1.506 4.38,4.133 6.311,5.968Z"

    static let brand = Color(hex: 0xFFDF00)

    private var scale: CGFloat { size / 64 }

    var body: some View {
        ZStack {
            if showsTile {
                RadialGradient(
                    colors: [Color(hex: 0x7E9CE4), Color(hex: 0x4A6FCF), Color(hex: 0x2A4EAC), Color(hex: 0x1F3F97)],
                    center: UnitPoint(x: 0.22, y: 0.14), startRadius: 0, endRadius: size * 1.15
                )
                Canvas { ctx, _ in
                    let rings = [20.0, 34.0, 48.0]
                    let c = CGPoint(x: 22 * scale, y: 28 * scale)
                    for r in rings {
                        let rect = CGRect(x: c.x - r * scale, y: c.y - r * scale, width: 2 * r * scale, height: 2 * r * scale)
                        ctx.stroke(Path(ellipseIn: rect), with: .color(.white.opacity(0.12)), lineWidth: 0.4 * scale)
                    }
                }
            }

            // Glassy yellow C: translucent fill + top sheen + crisp edge.
            SVGShape(d: Self.arc).fill(Self.brand.opacity(0.30))
            SVGShape(d: Self.arc).fill(
                LinearGradient(
                    colors: [.white.opacity(0.5), .white.opacity(0.06), .white.opacity(0)],
                    startPoint: .top, endPoint: .bottom
                )
            )
            SVGShape(d: Self.arc).stroke(Color(hex: 0xFFE865).opacity(0.7), lineWidth: 0.6 * scale)

            // Person, solid brand yellow.
            SVGShape(d: Self.shoulders).fill(Self.brand)
            Circle()
                .fill(Self.brand)
                .frame(width: 12 * scale, height: 12 * scale)
                .position(x: 36.365 * scale, y: 32 * scale)
        }
        .frame(width: size, height: size)
        .clipShape(.rect(cornerRadius: size * 0.22))
    }
}

#Preview {
    HStack(spacing: 20) {
        ConvergeLogo(size: 96)
        ConvergeLogo(size: 44)
    }
    .padding()
    .background(Palette.canvas)
}
