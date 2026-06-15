import Foundation

/// Talks to the Converge REST API (the same `/api/*` routes the web app uses).
///
/// Auth is better-auth's cookie session: we let the shared `HTTPCookieStorage`
/// persist the session cookie across launches, and send an `Origin` header that
/// matches the base URL so better-auth treats requests as same-origin (trusted).
final class APIClient {
    static let shared = APIClient()

    /// Where the backend lives. Defaults to the deployed instance; overridable
    /// (e.g. point at a LAN dev server) via Settings.
    static let defaultBaseURL = "https://converge.sams.land"

    private let baseURLKey = "converge.baseURL"

    var baseURL: URL {
        let raw = UserDefaults.standard.string(forKey: baseURLKey) ?? Self.defaultBaseURL
        return URL(string: raw) ?? URL(string: Self.defaultBaseURL)!
    }

    func setBaseURL(_ value: String) {
        UserDefaults.standard.set(value, forKey: baseURLKey)
    }

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpCookieAcceptPolicy = .always
        config.httpShouldSetCookies = true
        config.waitsForConnectivity = true
        config.timeoutIntervalForRequest = 30
        return URLSession(configuration: config)
    }()

    let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .custom { decoder in
            let raw = try decoder.singleValueContainer().decode(String.self)
            if let date = ISO8601.parse(raw) { return date }
            throw DecodingError.dataCorrupted(
                .init(codingPath: decoder.codingPath, debugDescription: "Bad date: \(raw)")
            )
        }
        return d
    }()

    struct APIError: LocalizedError {
        let status: Int
        let message: String
        var errorDescription: String? { message }
    }

    // MARK: - Requests

    func get<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        try await request(path, method: "GET", query: query, body: Optional<Int>.none)
    }

    @discardableResult
    func send<Body: Encodable, T: Decodable>(
        _ path: String, method: String, body: Body? = nil, query: [URLQueryItem] = []
    ) async throws -> T {
        try await request(path, method: method, query: query, body: body)
    }

    /// POST/PATCH/DELETE where the response body is ignored.
    func fire<Body: Encodable>(_ path: String, method: String, body: Body? = nil) async throws {
        _ = try await rawData(path, method: method, query: [], body: body)
    }

    private func request<Body: Encodable, T: Decodable>(
        _ path: String, method: String, query: [URLQueryItem], body: Body?
    ) async throws -> T {
        let data = try await rawData(path, method: method, query: query, body: body)
        if T.self == EmptyResponse.self { return EmptyResponse() as! T }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            let snippet = String(data: data.prefix(300), encoding: .utf8) ?? ""
            throw APIError(status: -1, message: "Decode \(T.self) failed: \(error). Body: \(snippet)")
        }
    }

    /// Upload a file as `multipart/form-data` (e.g. an avatar to `/api/documents`).
    func upload(
        _ path: String, fileData: Data, filename: String, mime: String, fields: [String: String]
    ) async throws -> Data {
        let base = baseURL
        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()
        func append(_ s: String) { body.append(s.data(using: .utf8)!) }
        for (key, value) in fields {
            append("--\(boundary)\r\n")
            append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n")
            append("\(value)\r\n")
        }
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n")
        append("Content-Type: \(mime)\r\n\r\n")
        body.append(fileData)
        append("\r\n--\(boundary)--\r\n")

        var req = URLRequest(url: base.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.setValue(base.absoluteString, forHTTPHeaderField: "Origin")
        req.httpBody = body
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let code = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw APIError(status: code, message: String(data: data, encoding: .utf8) ?? "Upload failed")
        }
        return data
    }

    func rawData<Body: Encodable>(
        _ path: String, method: String, query: [URLQueryItem], body: Body?
    ) async throws -> Data {
        let base = baseURL
        var comps = URLComponents(url: base.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { comps.queryItems = query }
        var req = URLRequest(url: comps.url!)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        // Same-origin marker so better-auth trusts state-changing requests.
        req.setValue(base.absoluteString, forHTTPHeaderField: "Origin")
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONEncoder().encode(body)
        }
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(status: -1, message: "No HTTP response")
        }
        guard (200..<300).contains(http.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "HTTP \(http.statusCode)"
            throw APIError(status: http.statusCode, message: msg.isEmpty ? "HTTP \(http.statusCode)" : msg)
        }
        return data
    }
}

/// Placeholder for endpoints with no meaningful response body.
struct EmptyResponse: Decodable {}

/// Tolerant ISO-8601 parsing — the API emits JS `Date.toISOString()`
/// (`2026-06-15T09:00:00.000Z`), sometimes without fractional seconds.
enum ISO8601 {
    private static let withFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let plain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static func parse(_ s: String) -> Date? {
        withFraction.date(from: s) ?? plain.date(from: s)
    }
}
