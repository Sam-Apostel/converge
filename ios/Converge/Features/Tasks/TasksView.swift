import Observation
import SwiftUI

@MainActor
@Observable
final class TasksModel {
    var tasks: [TaskRow] = []
    var state: LoadState = .loading
    var draft = ""

    func load() async {
        if tasks.isEmpty { state = .loading }
        do {
            tasks = try await APIClient.shared.get("/api/tasks")
            state = .loaded
        } catch {
            state = .failed((error as? APIClient.APIError)?.message ?? error.localizedDescription)
        }
    }

    func add() async {
        let title = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }
        struct Body: Encodable { let title: String }
        do {
            let created: TaskRow = try await APIClient.shared.send("/api/tasks", method: "POST", body: Body(title: title))
            tasks.insert(created, at: 0)
            draft = ""
        } catch {}
    }

    func toggle(_ task: TaskRow) async {
        struct Body: Encodable { let id: String; let done: Bool }
        let newDone = !task.done
        if let idx = tasks.firstIndex(where: { $0.id == task.id }) { tasks[idx].done = newDone }
        try? await APIClient.shared.fire("/api/tasks", method: "PATCH", body: Body(id: task.id, done: newDone))
    }
}

struct TasksView: View {
    @State private var model = TasksModel()

    var body: some View {
        ZStack {
            CanvasBackground()
            VStack(spacing: 0) {
                if model.state == .loaded { list } else {
                    StateOverlay(state: model.state) { Task { await model.load() } }
                }
                composer
            }
        }
        .navigationTitle("Tasks")
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load() }
    }

    private var list: some View {
        ScrollView {
            VStack(spacing: 8) {
                ForEach(model.tasks) { task in
                    Button { Task { await model.toggle(task) } } label: {
                        GlassCard {
                            HStack(spacing: 12) {
                                Image(systemName: task.done ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 20))
                                    .foregroundStyle(task.done ? Palette.limeDeep : Palette.faint)
                                Text(task.title)
                                    .font(TypeRamp.body())
                                    .foregroundStyle(task.done ? Palette.mist : Palette.ink)
                                    .strikethrough(task.done)
                                Spacer(minLength: 0)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
                if model.tasks.isEmpty {
                    Text("No tasks yet.").font(TypeRamp.note()).foregroundStyle(Palette.mist).padding(.top, 60)
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
        }
    }

    private var composer: some View {
        HStack(spacing: 8) {
            GlassField {
                TextField("Add a task…", text: $model.draft)
                    .font(TypeRamp.body())
                    .onSubmit { Task { await model.add() } }
            }
            Button { Task { await model.add() } } label: {
                Image(systemName: "plus").foregroundStyle(Palette.ink)
                    .frame(width: 40, height: 40).background(Palette.lime, in: .circle)
            }
            .buttonStyle(.plain)
            .disabled(model.draft.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(.bar)
    }
}
