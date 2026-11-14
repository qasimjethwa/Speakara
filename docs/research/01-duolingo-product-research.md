# Duolingo product research

Scope and evidence tags are defined in [research-evidence.md](research-evidence.md). Read every statement with its tag.

## 1. Positioning (logged-out site)

- **[V E2]** Homepage headline: "The most fun way to learn languages, chess, and more!" with two calls to action: **GET STARTED** and **I ALREADY HAVE AN ACCOUNT**, and a third "TRY 1 WEEK FREE" promotion for the paid tier.
- **[V E2]** Footer groups: About us, Products, Apps, Help and support, Privacy and terms, Social. Products listed: Duolingo, Duolingo for Schools, Duolingo English Test, Podcast, Duolingo for Business, Super Duolingo, Gift Super Duolingo, Duolingo Max.
- **[V E2]** The site ships in 29 interface languages (language picker lists Arabic … Urdu).
- **[V B5]** Since 2023 the product is multi-subject (languages, Math, Music); the homepage now also names Chess **[V E2]**.

## 2. Registration and onboarding

- **[V E3]** `/register` does not start with a form. It opens on "**I want to learn…**" — a grid of courses, each with a learner count (e.g. Spanish 41.9M, French 22.6M, English 19.1M, Japanese 17.7M, Hindi 13.6M). The page title is "Learning Goal - Duolingo".
- **[I]** Account creation is deferred until after the learner has invested in choosing (and probably trying) a course — a well-known "delayed sign-up" pattern. Speakara copies the *idea* (guest mode first) not the implementation.
- **[U]** The exact step order after course choice (motivation, daily goal, placement) for the current web flow was not observed. Speakara's onboarding order is our own design.

## 3. Course catalogue

- **[V E4]** `/courses` is "Courses for English Speakers" with an "I SPEAK ENGLISH" selector; 40+ language courses plus Chess and Math, each showing learner counts.
- **[V E6]** Route patterns include `/course/:learningLanguageId/:fromLanguageId?/:slug?`, confirming courses are keyed by *(learning language, from language)* pairs. Speakara uses the same pairing concept (`es-en`, `en-hi`, …).

## 4. Learning path

- **[V user screenshot]** A single vertical path of round level nodes under a coloured **unit header** (title, skill description, guidebook button). States: completed = gold, current = unit colour with a START tooltip, locked = grey. Stories and a unit review sit *in* the path. Top bar: course flag, streak, gems, hearts.
- **[V B1]** Duolingo describes "7 lesson types" for varying practice and mentions Stories, leaderboards and chests along the course. The list items themselves were rendered outside the text we could extract — **[U]** for the exact seven.

## 5. Lessons and exercises

- **[V user screenshots]** Word-bank translation: character + speech bubble with audio, answer lines, tile bank, a keyboard toggle, a full-width CHECK button fixed at the bottom, progress bar and close button at the top. Speaking: prompt with audio button, a large circular microphone, "I can't use a microphone right now", Continue.
- **[V B2]** Speaking is present "from your very first lesson": repeat words, translate aloud, bite-sized dialogues; many writing exercises can be *spoken* instead; there are speaking-only practice sessions, pronunciation activities for new writing systems (sound drills, minimal pairs) and Flashcards.
- **[P]** Other exercise families (matching pairs, listening tap/type, fill-in-the-blank, multiple choice) are long-standing and widely documented; their current exact UI was not re-verified.

## 6. Monetisation and free boundaries

- **[V E5]** `/super` comparison table, Free vs Super: *Learning content* (both), *Unlimited Hearts*, *Skills practice*, *Mistakes review*, *Free challenge entry*, *No ads* (Super). Marketing chips: UNLIMITED MISTAKES, NO ADS, PERSONALIZED PRACTICE, UNLIMITED LEGENDARY. Trial timeline: today → day 5 reminder → day 7 charge. A "Super Family" plan covers up to 6 accounts.
- **[V B3]** Max is a tier above Super adding **Video Call** and **Roleplay**; Super benefits are described there as "unlimited **energy**, no ads, and personalized review through the Practice Hub".
- **[I]** The `/super` page (hearts) and the updated Max post (energy) disagree, which suggests the mistake-limiting mechanic is in transition or differs by platform. Either way, **free learners are throttled by a depleting resource, and mistakes review / personalised practice are paid** — these are exactly the boundaries Speakara removes.

## 7. AI features

- **[V B3]** *Video Call*: real-time spoken conversation with the character Lily, usually starting from a recently studied topic. *Roleplay*: scenario chats with characters, earn XP, appear beside the path as "Side Quests". Both launched on GPT-4. The post says humans review content and discusses AI mistakes.
- **[V B3]** Availability at last update: 188 countries, iOS and Android. **[U]** current web availability.
- **[P]** "Explain My Answer" was part of the original Max launch; the March 2026 revision of B3 no longer lists it as a headline Max feature. **[U]** whether it is now free, renamed or removed.

## 8. Gamification

- **[V B5]** One streak across subjects: any lesson in any subject keeps it alive; XP is shared across subjects.
- **[V B4]** Leaderboards group users into **cohorts**; XP comes from completing sessions; a session-end card shows the new standing.
- **[V E6]** Routes exist for `/streak-revival`, `/weekly-report`, `/year-in-review`, `/store`, `/show_store`, `/words` — evidence of re-engagement, reporting, shop and vocabulary surfaces. **[U]** their contents.
- **[P]** Gems, streak freezes, daily and friends quests, weekly leagues with promotion/demotion and achievement badges are widely documented; exact numbers are **[U]** and deliberately not copied.

## 9. What this means for Speakara

1. Keep: one obvious next step on a vertical path; five-minute sessions; instant feedback; delayed sign-up; one shared streak.
2. Remove: hearts/energy, paid mistakes review, paid personalised practice, ads, paid AI conversation.
3. Do differently: publish the XP formula; make leagues derive from learning only; never sell gems; label bots as bots.
