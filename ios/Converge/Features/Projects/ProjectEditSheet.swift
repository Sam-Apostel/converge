import SwiftUI

struct ProjectEditSheet: View {
    @Environment(\.dismiss) private var dismiss
    /// nil → create a new project; non-nil → edit.
    let existing: Project?
    let onSaved: (Project) -> Void

    @State private var name = ""
    @State private var tagline = ""
    @State private var category = ""
    @State private var description = ""
    @State private var techStack = ""
    @State private var lookingFor = ""
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Project") {
                    TextField("Name", text: $name)
                    TextField("Tagline", text: $tagline)
                    TextField("Category (startup, side-project…)", text: $category)
                }
                Section("About") {
                    TextField("Description", text: $description, axis: .vertical).lineLimit(3...10)
                }
                Section("Tech stack (comma separated)") {
                    TextField("Swift, Postgres, TanStack", text: $techStack, axis: .vertical)
                }
                Section("Looking for (comma separated)") {
                    TextField("co-founder, users, feedback", text: $lookingFor, axis: .vertical)
                }
                if let error {
                    Text(error).font(TypeRamp.caption()).foregroundStyle(Palette.danger)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Palette.canvas)
            .navigationTitle(existing == nil ? "New project" : "Edit project")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .fontWeight(.semibold)
                        .disabled(saving || name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear(perform: populate)
        }
    }

    private func populate() {
        guard let p = existing else { return }
        name = p.name
        tagline = p.tagline ?? ""
        category = p.category ?? ""
        description = p.description ?? ""
        techStack = (p.techStack ?? []).joined(separator: ", ")
        lookingFor = (p.lookingFor ?? []).joined(separator: ", ")
    }

    private func split(_ s: String) -> [String] {
        s.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
    }

    private func clean(_ s: String) -> String? {
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }

    private struct Payload: Encodable {
        var id: String?
        var name: String
        var tagline: String?
        var description: String?
        var category: String?
        var techStack: [String]
        var lookingFor: [String]
    }

    private func save() {
        saving = true
        error = nil
        let payload = Payload(
            id: existing?.id,
            name: name.trimmingCharacters(in: .whitespaces),
            tagline: clean(tagline),
            description: clean(description),
            category: clean(category),
            techStack: split(techStack),
            lookingFor: split(lookingFor)
        )
        Task {
            do {
                let saved: Project = try await APIClient.shared.send(
                    "/api/projects", method: existing == nil ? "POST" : "PATCH", body: payload
                )
                onSaved(saved)
                dismiss()
            } catch {
                self.error = (error as? APIClient.APIError)?.message ?? error.localizedDescription
            }
            saving = false
        }
    }
}
