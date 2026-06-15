import Observation
import SwiftUI

@MainActor
@Observable
final class PeopleModel {
    var people: [Person] = []
    var state: LoadState = .loading
    var search = ""
    var intent: String?

    var intents: [String] {
        Set(people.flatMap(\.intents)).sorted()
    }

    var filtered: [Person] {
        people.filter { person in
            (intent == nil || person.intents.contains(intent!)) && matches(person)
        }
    }

    private func matches(_ p: Person) -> Bool {
        guard !search.isEmpty else { return true }
        let q = search.lowercased()
        let haystack: [String?] = [
            p.name, p.company, p.location, p.headline, p.title,
            (p.profile?.interestedTopics ?? []).joined(separator: " "),
        ]
        return haystack.compactMap { $0?.lowercased() }.contains { $0.contains(q) }
    }

    func load() async {
        if people.isEmpty { state = .loading }
        do {
            people = try await APIClient.shared.get("/api/people")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }
}

struct PeopleView: View {
    @State private var model = PeopleModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            if model.state == .loaded {
                list
            } else {
                StateOverlay(state: model.state) { Task { await model.load() } }
            }
        }
        .navigationTitle("People")
        .searchable(text: $model.search, prompt: "Name, company, interests…")
        .task { await model.load() }
    }

    private var list: some View {
        ScrollView {
            VStack(spacing: 12) {
                if !model.intents.isEmpty {
                    FilterChips(options: model.intents, selection: $model.intent)
                        .padding(.bottom, 4)
                }
                ForEach(model.filtered) { person in
                    NavigationLink(value: person) {
                        PersonRow(person: person)
                    }
                    .buttonStyle(.plain)
                }
                if model.filtered.isEmpty {
                    Text("No one matches that yet.")
                        .font(TypeRamp.note())
                        .foregroundStyle(Palette.mist)
                        .padding(.top, 40)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
        .refreshable { await model.load() }
    }
}

struct PersonRow: View {
    let person: Person

    var body: some View {
        SoftCard {
            HStack(spacing: 12) {
                Avatar(name: person.name, image: person.image, size: 48)
                VStack(alignment: .leading, spacing: 3) {
                    Text(person.name)
                        .font(TypeRamp.body().weight(.semibold))
                        .foregroundStyle(Palette.ink)
                    if let role = person.roleLine {
                        Text(role)
                            .font(TypeRamp.caption())
                            .foregroundStyle(Palette.mist)
                            .lineLimit(1)
                    }
                    if !person.intents.isEmpty {
                        HStack(spacing: 6) {
                            ForEach(person.intents.prefix(2), id: \.self) { Pill(text: $0) }
                        }
                        .padding(.top, 2)
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Palette.faint)
            }
        }
    }
}

#Preview { PeopleView() }
