# Converge — Demo Script

Video target: ~90 seconds for the Hyperframes submission.
Record on mobile viewport (390px).

---

## Setup checklist (before recording)

- [ ] Run `bun run db:seed` to reset to clean demo data
- [ ] Log in with your account (GitHub or passkey)
- [ ] Configure AI provider in Settings (Anthropic recommended — claude-sonnet-4-6)
- [ ] Close all DevTools panels
- [ ] Set browser to mobile viewport (~390px wide)
- [ ] Navigate to `http://localhost:3000` (or deployed URL)

---

## Scene 1 — The hook (0:00–0:10)

**Show:** Home screen  
**Say / caption:** *"You're surrounded by the right people. You just can't find them."*

Point out the live "RIGHT NOW" session card and the "People to meet" strip beneath it. Don't click anything yet — let the ambient intelligence land.

---

## Scene 2 — AI search (0:10–0:28)

**Show:** Home screen, AI search bar  
**Action:** Tap the search field and type: `Who's building with AI and open to collaborating?`  
**Say / caption:** *"Ask in plain language. Converge knows the room."*

The AI responds with real attendee names, intents, and current focus from the conference. Point out that it's drawing from actual profiles — not a demo stub.

Tap one of the suggested people. Show their profile: intent tags, current project, what they want to talk about.

---

## Scene 3 — Inside a live talk (0:28–0:52)

**Navigate to:** Sessions → "Streaming LLM Responses Without Melting Your Server" (the one marked live)

**Show:** The live progress bar at the top, "Talk · live now", slide panel  
**Say / caption:** *"Stop taking notes. Just listen."*

**Action:** Tap **★ Bookmark this slide**  
The moment animates into the "Your moments" rail below. Point out the timestamp badge.

**Show:** The other moment cards already in the rail (from seeded users Theo, Finn, Imani)  
**Say / caption:** *"Three other people bookmarked this exact passage."*

Tap one of the avatar chips on a shared moment → navigates to that person's profile.

**Say / caption:** *"That's your warmest possible introduction."*

---

## Scene 4 — Q&A that doesn't die (0:52–1:10)

**Scroll down to:** "Live questions" tab on the same session  
**Show:** The 3 seeded questions with upvote counts and the SPEAKER badge on Jonas Weber's answers

**Say / caption:** *"Questions survive the talk."*

Tap the **Discussion** tab → shows the persistent thread linked to this session.

**Navigate to:** Discussions  
**Show:** The lifecycle rail — Question → Answer → Follow-up → Community → **Meetup**  
**Say / caption:** *"The best Q&A sessions end as real meetups."*

---

## Scene 5 — People discovery (1:10–1:30)

**Navigate to:** People  
**Show:** The "PEOPLE YOU SHOULD MEET" spotlight card  
**Action:** Tap a filter chip (e.g. "Co-founders")  
The list filters live.

**Tap Connect** on a person card.

**Say / caption:** *"Leave the conference with real connections, not a pile of business cards."*

---

## What to highlight in the pitch (judges)

- **Technical:** TanStack Start + TanStack DB (optimistic real-time), SSE event bus, MCP server with OAuth 2.1, KendoReact components throughout
- **Originality:** shared-moment matching as a connection signal is new — nobody else derives introductions from timestamp proximity
- **Impact:** solves all three classic conference failure modes: discovery, attention, continuity
- **Scale:** the MCP platform means external agents can act on behalf of attendees — every feature is also an API

---

## Fallback if AI isn't configured live

Skip the AI search scene. Instead open the People page, use the intent filter chips, and open the "People you should meet" spotlight card. The suggestion algorithm works without AI — it's based on shared moments and overlapping intent tags.
