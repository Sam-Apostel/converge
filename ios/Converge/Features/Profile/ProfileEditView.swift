import PhotosUI
import SwiftUI

struct ProfileEditView: View {
    @Environment(\.dismiss) private var dismiss
    let me: MyProfile
    let onSave: (ProfilePatch) -> Void

    @State private var photoItem: PhotosPickerItem?
    @State private var imageURL: String?
    @State private var uploading = false
    @State private var name = ""
    @State private var headline = ""
    @State private var title = ""
    @State private var company = ""
    @State private var location = ""
    @State private var bio = ""
    @State private var currentFocus = ""
    @State private var availability = "open"
    @State private var intents = ""
    @State private var topics = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Photo") {
                    HStack(spacing: 14) {
                        Avatar(name: name.isEmpty ? me.name : name, image: imageURL ?? me.image, size: 56)
                        PhotosPicker(selection: $photoItem, matching: .images) {
                            Text(uploading ? "Uploading…" : "Change photo")
                                .font(TypeRamp.note().weight(.medium)).foregroundStyle(Palette.ink)
                        }
                        .disabled(uploading)
                    }
                }
                Section("Identity") {
                    labeled("Name", $name)
                    labeled("Headline", $headline)
                    labeled("Title", $title)
                    labeled("Company", $company)
                    labeled("Location", $location)
                }
                Section("Availability") {
                    Picker("Status", selection: $availability) {
                        Text("Open to meet").tag("open")
                        Text("Busy").tag("busy")
                        Text("Do not disturb").tag("dnd")
                    }
                }
                Section("Why I'm here") {
                    TextField("Bio", text: $bio, axis: .vertical).lineLimit(3...8)
                }
                Section("Current focus") {
                    TextField("What you're working on", text: $currentFocus, axis: .vertical).lineLimit(2...5)
                }
                Section("Here for (comma separated)") {
                    TextField("co-founder, hiring, learning AI", text: $intents, axis: .vertical)
                }
                Section("Interested topics (comma separated)") {
                    TextField("RSCs, local-first, AI agents", text: $topics, axis: .vertical)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Palette.canvas)
            .navigationTitle("Edit profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Save", action: save).fontWeight(.semibold) }
            }
            .onAppear(perform: populate)
            .onChange(of: photoItem) { Task { await uploadPhoto() } }
        }
    }

    private func uploadPhoto() async {
        guard let photoItem else { return }
        uploading = true
        defer { uploading = false }
        guard let data = try? await photoItem.loadTransferable(type: Data.self) else { return }
        if let ref: DocumentRef = try? decodeUpload(
            await APIClient.shared.upload(
                "/api/documents", fileData: data, filename: "avatar.jpg",
                mime: "image/jpeg", fields: ["kind": "avatar"]
            )
        ) {
            imageURL = ref.url
        }
    }

    private func decodeUpload(_ data: Data) throws -> DocumentRef {
        try APIClient.shared.decoder.decode(DocumentRef.self, from: data)
    }

    private func labeled(_ title: String, _ text: Binding<String>) -> some View {
        TextField(title, text: text)
    }

    private func populate() {
        name = me.name
        headline = me.profile?.headline ?? ""
        title = me.profile?.title ?? ""
        company = me.profile?.company ?? ""
        location = me.profile?.location ?? ""
        bio = me.profile?.bio ?? ""
        currentFocus = me.profile?.currentFocus ?? ""
        availability = me.profile?.availability ?? "open"
        intents = (me.profile?.intents ?? []).joined(separator: ", ")
        topics = (me.profile?.interestedTopics ?? []).joined(separator: ", ")
    }

    private func split(_ s: String) -> [String] {
        s.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
    }

    private func clean(_ s: String) -> String? {
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }

    private func save() {
        onSave(ProfilePatch(
            name: clean(name) ?? me.name,
            image: imageURL ?? me.image,
            headline: clean(headline),
            title: clean(title),
            company: clean(company),
            location: clean(location),
            bio: clean(bio),
            currentFocus: clean(currentFocus),
            availability: availability,
            intents: split(intents),
            interestedTopics: split(topics)
        ))
    }
}
