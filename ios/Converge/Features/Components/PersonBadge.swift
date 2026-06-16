import SwiftUI

/// Vertical "badge" card for a person: a theme-coloured cover strip with the
/// avatar inset over it, name + role below, in a tinted glass frame. Mirrors the
/// web person card (per-person palette hue + cover strip + top-inset avatar).
struct PersonBadge: View {
    let person: Person
    var compact: Bool = false

    var body: some View {
        let color = personColor(person.id)
        VStack(spacing: 0) {
            ZStack(alignment: .bottom) {
                LinearGradient(
                    colors: [color.opacity(0.95), color.opacity(0.5)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
                .frame(height: 50)
                Avatar(name: person.name, image: person.image, size: 56)
                    .overlay(Circle().strokeBorder(Palette.surface, lineWidth: 3))
                    .offset(y: 26)
            }
            VStack(spacing: 3) {
                Text(person.name)
                    .font(TypeRamp.body().weight(.semibold))
                    .foregroundStyle(Palette.ink)
                    .lineLimit(1)
                if let role = person.roleLine {
                    Text(role)
                        .font(TypeRamp.caption())
                        .foregroundStyle(Palette.mist)
                        .lineLimit(compact ? 1 : 2)
                        .multilineTextAlignment(.center)
                }
                if let intent = person.intents.first {
                    Pill(text: intent, tone: .lime).padding(.top, 2)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 34)
            .padding(.horizontal, 12)
            .padding(.bottom, 14)
            .background(Palette.surface)
        }
        .clipShape(.rect(cornerRadius: 18))
        .modifier(GlassFrame(innerRadius: 18, inset: 8, tint: color))
    }
}
