import SwiftUI

enum LoadState: Equatable {
    case loading
    case loaded
    case failed(String)
}

/// Standard centered states for a screen that's loading or errored.
struct StateOverlay: View {
    let state: LoadState
    var retry: (() -> Void)? = nil

    var body: some View {
        switch state {
        case .loading:
            ProgressView().tint(Palette.mist)
                .frame(maxWidth: .infinity, minHeight: 240)
        case let .failed(message):
            VStack(spacing: 12) {
                Text("Couldn't load")
                    .font(TypeRamp.body().weight(.semibold))
                    .foregroundStyle(Palette.ink)
                Text(message)
                    .font(TypeRamp.caption())
                    .foregroundStyle(Palette.mist)
                    .multilineTextAlignment(.center)
                if let retry {
                    Button("Try again", action: retry)
                        .font(TypeRamp.note().weight(.medium))
                        .foregroundStyle(Palette.ink)
                        .padding(.horizontal, 16).padding(.vertical, 8)
                        .background(Palette.pillow, in: .capsule)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 240)
            .padding(24)
        case .loaded:
            EmptyView()
        }
    }
}

/// Horizontally scrolling selectable filter chips.
struct FilterChips: View {
    let options: [String]
    @Binding var selection: String?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip("All", active: selection == nil) { selection = nil }
                ForEach(options, id: \.self) { option in
                    chip(option, active: selection == option) {
                        selection = selection == option ? nil : option
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 2)
        }
        .scrollClipDisabled()
    }

    private func chip(_ label: String, active: Bool, _ tap: @escaping () -> Void) -> some View {
        Button(action: tap) {
            Text(label)
                .font(TypeRamp.caption().weight(.medium))
                .foregroundStyle(active ? Palette.surface : Palette.inkSoft)
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(active ? Palette.ink : Palette.pillow, in: .capsule)
        }
        .buttonStyle(.plain)
    }
}
