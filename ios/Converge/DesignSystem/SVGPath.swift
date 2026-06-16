import CoreGraphics
import SwiftUI

/// Minimal SVG path-data parser (supports M/m, L/l, C/c, Z). Enough to render
/// the Converge brand mark, whose geometry is authored in a 64×64 design space.
enum SVGPath {
    static func cgPath(_ d: String, scale: CGFloat = 1) -> CGPath {
        let tokens = tokenize(d)
        let path = CGMutablePath()
        var current = CGPoint.zero
        var start = CGPoint.zero
        var idx = 0
        var cmd: Character = " "

        func next() -> CGFloat {
            guard idx < tokens.count, let v = Double(tokens[idx]) else { return 0 }
            idx += 1
            return CGFloat(v) * scale
        }

        while idx < tokens.count {
            let token = tokens[idx]
            if token.count == 1, let c = token.first, c.isLetter {
                cmd = c
                idx += 1
            }
            switch cmd {
            case "M":
                current = CGPoint(x: next(), y: next()); start = current
                path.move(to: current); cmd = "L"
            case "m":
                current = CGPoint(x: current.x + next(), y: current.y + next()); start = current
                path.move(to: current); cmd = "l"
            case "L":
                current = CGPoint(x: next(), y: next()); path.addLine(to: current)
            case "l":
                current = CGPoint(x: current.x + next(), y: current.y + next()); path.addLine(to: current)
            case "C":
                let c1 = CGPoint(x: next(), y: next())
                let c2 = CGPoint(x: next(), y: next())
                current = CGPoint(x: next(), y: next())
                path.addCurve(to: current, control1: c1, control2: c2)
            case "c":
                let c1 = CGPoint(x: current.x + next(), y: current.y + next())
                let c2 = CGPoint(x: current.x + next(), y: current.y + next())
                current = CGPoint(x: current.x + next(), y: current.y + next())
                path.addCurve(to: current, control1: c1, control2: c2)
            case "Z", "z":
                path.closeSubpath(); current = start; cmd = " "
            default:
                idx += 1
            }
        }
        return path
    }

    private static func tokenize(_ d: String) -> [String] {
        var tokens: [String] = []
        var num = ""
        func push() { if !num.isEmpty { tokens.append(num); num = "" } }
        for ch in d {
            if ch.isLetter {
                push(); tokens.append(String(ch))
            } else if ch == "," || ch == " " || ch == "\n" || ch == "\t" {
                push()
            } else if ch == "-" {
                if !num.isEmpty, num.last != "e", num.last != "E" { push() }
                num.append(ch)
            } else if ch == "." {
                if num.contains(".") { push() }
                num.append(ch)
            } else {
                num.append(ch)
            }
        }
        push()
        return tokens
    }
}

/// A SwiftUI `Shape` from SVG path data authored in a 64×64 box.
struct SVGShape: Shape {
    let d: String
    func path(in rect: CGRect) -> Path {
        Path(SVGPath.cgPath(d, scale: rect.width / 64))
    }
}
