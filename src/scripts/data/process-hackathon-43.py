import json, re, html, unicodedata, os

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

d = json.load(open(os.path.join(DATA_DIR, "hackathon-43.raw.json")))

def strip_html(s):
    s = re.sub(r"(?i)</(p|h[1-6]|li|ul|ol|div|br)>", "\n", s)
    s = re.sub(r"(?i)<li[^>]*>", "• ", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = s.replace(" ", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n[ \t]+", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

def summarize(text, limit=600):
    """Take the opening prose as a description, trimmed to a clean sentence."""
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text[:limit]
    # back off to last sentence/paragraph boundary
    for sep in ["\n\n", ". ", "\n"]:
        i = cut.rfind(sep)
        if i > limit * 0.5:
            return cut[: i + (1 if sep == ". " else 0)].strip()
    return cut.rsplit(" ", 1)[0].strip() + "…"

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "x"

TECH = [
    "React","Next.js","TypeScript","JavaScript","Node.js","Python","FastAPI","Flask",
    "Django","Supabase","Postgres","PostgreSQL","SQLite","MongoDB","Redis","Tailwind",
    "Vite","Vue","Svelte","Angular","Express","tRPC","GraphQL","WebSocket","WebSockets",
    "OpenAI","Anthropic","Claude","Gemini","LLM","MCP","LangChain","Pinecone","Vercel",
    "Cloudflare","AWS","Docker","Kubernetes","Rust","Swift","Kotlin","Flutter","Better Auth",
    "React Native","Expo","WebRTC","WebGPU","Three.js","Drizzle","Prisma","Clerk","Golang",
    "Convex","Neon","Firebase","ElevenLabs","Whisper","KendoReact",
    "TanStack","Bun","Deno","Astro","Remix","Zustand","Twilio","Stripe",
]

def detect_tech(text):
    found = []
    low = text.lower()
    for t in TECH:
        if re.search(r"(?<![a-z])" + re.escape(t.lower()) + r"(?![a-z])", low):
            found.append(t)
    # de-dup keeping canonical
    seen, out = set(), []
    for t in found:
        k = t.lower()
        if k not in seen:
            seen.add(k); out.append(t)
    return out[:8]

# ---- people (deduped by profile_id) ----
people = {}        # profile_id -> dict
handle_taken = set()

def make_person(m, project_name):
    pid = m.get("profile_id")
    name = m["name"].strip()
    if pid in people:
        return people[pid]
    base = slugify(name)
    handle = base
    n = 2
    while handle in handle_taken:
        handle = f"{base}{n}"; n += 1
    handle_taken.add(handle)
    p = {
        "key": handle,
        "profileId": pid,
        "name": name,
        "handle": handle,
        "email": f"{handle}@hackathonparty.seed",
        "image": m.get("image_url") or None,
        "role": m.get("role") or "other",
        "project": project_name,
    }
    people[pid] = p
    return p

projects = []
winner_rank = {}
wi = 0
for r in d:
    if r.get("submission", {}).get("winner"):
        winner_rank[r["id"]] = wi; wi += 1

for r in d:
    s = r["submission"]
    team = r["team"]
    members = [make_person(m, s["name"]) for m in team]
    text = strip_html(s.get("markdown_resolved") or "")
    desc = summarize(text)
    links = {}
    if s.get("demo_url"): links["demo"] = s["demo_url"]
    if s.get("repo_url"): links["repo"] = s["repo_url"]
    if s.get("video_url"): links["video"] = s["video_url"]
    winner = bool(s.get("winner"))
    if winner:
        score = 240 - winner_rank[r["id"]] * 20
    else:
        score = 40 + len(text) // 120 + len(team) * 12
        score = min(score, 175)
    projects.append({
        "slug": slugify(s["name"]),
        "name": s["name"],
        "tagline": s.get("tagline") or "",
        "description": desc,
        "techStack": detect_tech(text),
        "links": links,
        "image": s.get("image_url") or None,
        "winner": winner,
        "challenge": s.get("challenge_title") or "",
        "trendingScore": score,
        "owner": members[0]["key"] if members else None,
        "members": [{"key": p["key"], "role": p["role"]} for p in members],
    })

print(f"people={len(people)} projects={len(projects)} winners={sum(p['winner'] for p in projects)}")

# ---- emit TS module ----
def ts(v, indent=0):
    pad = "  " * indent
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, str):
        return "'" + v.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n") + "'"
    if isinstance(v, list):
        if not v: return "[]"
        items = [ts(x, indent + 1) for x in v]
        if all(isinstance(x, (str, int, float)) for x in v) and sum(len(i) for i in items) < 90:
            return "[" + ", ".join(items) + "]"
        return "[\n" + ",\n".join("  " * (indent + 1) + i for i in items) + ",\n" + pad + "]"
    if isinstance(v, dict):
        if not v: return "{}"
        lines = []
        for k, val in v.items():
            key = k if re.match(r"^[a-zA-Z_$][\w$]*$", k) else "'" + k + "'"
            lines.append("  " * (indent + 1) + f"{key}: {ts(val, indent + 1)}")
        return "{\n" + ",\n".join(lines) + ",\n" + pad + "}"

people_list = list(people.values())
for p in people_list:
    p.pop("profileId", None)
    p.pop("project", None)

header = '''/**
 * Real seed data scraped from the "Progress x GitNation" hackathon
 * (HackathonParty hackathon #43 — React Summit / JSNation, Amsterdam, June 2026).
 *
 * Source: https://www.hackathonparty.com/hackathons/43/projects
 * Generated by src/scripts/data/scrape-hackathon-43.py (scrape) +
 * process-hackathon-43.py (transform) — do not hand-edit; re-run those to
 * refresh. Emails/handles are synthesised (no real contact details are
 * scraped); avatar image URLs come from the public project pages.
 */

export type HackathonPerson = {
  key: string
  name: string
  handle: string
  email: string
  image: string | null
  role: string
}

export type HackathonProjectMember = { key: string; role: string }

export type HackathonProject = {
  slug: string
  name: string
  tagline: string
  description: string
  techStack: string[]
  links: Record<string, string>
  image: string | null
  winner: boolean
  challenge: string
  trendingScore: number
  owner: string | null
  members: HackathonProjectMember[]
}

export const hackathon = {
  slug: 'progress-x-gitnation-2026',
  name: 'Progress x GitNation',
  tagline: 'Join online or offline at React Summit / JSNation and compete for the 10000EUR prize pool',
  description:
    'A hybrid hackathon co-located with React Summit and JSNation in Amsterdam. Teams of up to five built people-first conference tooling over two days and competed for a 10,000 EUR prize pool.',
  timezone: 'Europe/Amsterdam',
  startsAt: '2026-06-11T07:15:00.000Z',
  endsAt: '2026-06-12T10:00:00.000Z',
  venueName: 'Amsterdam (hybrid)',
} as const
'''

out = [header]
out.append("export const people: HackathonPerson[] = " + ts(people_list) + "\n")
out.append("export const projects: HackathonProject[] = " + ts(projects) + "\n")

OUT = os.path.join(DATA_DIR, "hackathon-43.ts")
open(OUT, "w").write("\n".join(out))
print("wrote " + OUT)
