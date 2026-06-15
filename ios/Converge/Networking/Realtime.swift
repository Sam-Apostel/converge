import Foundation

/// Minimal Server-Sent Events client over `URLSession.bytes`, used to consume
/// `/api/stream`. Reconnects with a short backoff until disconnected.
///
/// Channels mirror the server: `session:<id>`, `discussion:<id>`, `user:<id>`.
@MainActor
final class Realtime {
    private var task: Task<Void, Never>?

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.timeoutIntervalForRequest = .infinity // long-lived stream
        config.timeoutIntervalForResource = .infinity
        return URLSession(configuration: config)
    }()

    /// Connect to `channel` and invoke `onEvent(type, data)` on the main actor
    /// for each event. Safe to call again — it cancels any prior connection.
    func connect(channel: String, onEvent: @escaping (String, Data) -> Void) {
        disconnect()
        task = Task { [weak self] in
            while !Task.isCancelled {
                await self?.streamOnce(channel: channel, onEvent: onEvent)
                if Task.isCancelled { break }
                try? await Task.sleep(for: .seconds(3))
            }
        }
    }

    func disconnect() {
        task?.cancel()
        task = nil
    }

    private func streamOnce(channel: String, onEvent: @escaping (String, Data) -> Void) async {
        let base = APIClient.shared.baseURL
        var comps = URLComponents(url: base.appendingPathComponent("/api/stream"), resolvingAgainstBaseURL: false)!
        comps.queryItems = [URLQueryItem(name: "channel", value: channel)]
        guard let url = comps.url else { return }
        var req = URLRequest(url: url)
        req.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        req.setValue(base.absoluteString, forHTTPHeaderField: "Origin")

        do {
            let (bytes, response) = try await session.bytes(for: req)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return }
            var event = "message"
            var data = ""
            for try await line in bytes.lines {
                if line.isEmpty {
                    if !data.isEmpty { onEvent(event, Data(data.utf8)) }
                    event = "message"; data = ""
                } else if line.hasPrefix("event:") {
                    event = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
                } else if line.hasPrefix("data:") {
                    data += String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
                }
                // lines starting with ":" are heartbeats — ignore.
            }
        } catch {
            // Connection dropped — the caller loop will reconnect.
        }
    }

    deinit { task?.cancel() }
}
