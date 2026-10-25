# Wörter

**German sentence practice from German I through AP German Language, with Fröhlix the tutor cat.**

**Not published yet.** When it has a GitHub repository, it will live at `https://janavduraikkannan.github.io/woerter/`.

Part of **[Linguae](https://janavduraikkannan.github.io/linguae/)**, the home page for every language site, with one account for all of them.

Wörter is the German sister site of [Verba](https://janavduraikkannan.github.io/verba/) (Latin) and [Palabras](https://janavduraikkannan.github.io/palabras/) (Spanish). It builds fresh German sentences from the topics you pick, then has you translate the whole sentence, English to German or German to English. It checks your answer, tells you exactly what went wrong (a wrong case or ending, a missing umlaut, the verb in the wrong place), and lets you ask Fröhlix, an AI tutor, questions about the grammar along the way.

> **Privacy, in short:** Wörter has no server of its own. Your practice runs in your browser, your AI key goes straight from your browser to the AI company you chose, and nothing is saved anywhere else unless you make an account. If you do, your account and anything you put on the leaderboard are stored with Google Firebase, are **not encrypted**, and **are not private**. Read the full [Privacy Statement](https://github.com/janavduraikkannan/Verba/blob/main/PRIVACY.md) before making an account.

## What it does

- **Topics by course.** Grammar topics grouped under German I, German II, German III, German IV and AP German Language: from articles, cases and the present tense, through the dative, two-way prepositions and the perfect tense, to modal verbs, subordinate clauses, adjective endings, the subjunctive II and the passive.
- **Build your own sentence type.** Pick a main structure (statement, negative, question, modal verb, weil or dass clause, command) and what goes inside it (adjectives, possessives, pronouns, an indirect object, places, time expressions, a tense).
- **Focus.** Press Focus on any topic and every sentence will practice it, mixing in your other ticked topics.
- **Whole-sentence translation**, checked first by the site and then, if needed, by the AI. Other correct word orders are accepted (Heute spiele ich … as well as Ich spiele heute …).
- **The site explains mistakes itself**: a wrong article or adjective ending (with the gender and case it needed), a wrong verb form, a missing umlaut, or the right words in the wrong order.
- **Identify the case.** See a highlighted phrase and name why it's in that case: subject, direct object, indirect object, after an accusative or dative preposition, a two-way preposition (wo? or wohin?), a dative verb, possession, and more. Typed for full XP, or multiple choice for half.
- **Extra credit** after a translation. Opening that case's chart voids it.
- **Fair umlaut checking.** ae, oe, ue and ss count as ä, ö, ü and ß. A missing umlaut is pointed out but still counts as correct, unless it changes the word (schon / schön, hatte / hätte). Lowercase nouns are pointed out too. Type umlauts with the buttons, or type `a:` for ä.
- **Fröhlix, the AI tutor cat.** Fēlix's German cousin. Before you answer, he judges whether a question gives away too much; after you answer, you can ask anything.
- **Charts for each sentence** (articles, adjective endings, pronouns, prepositions, the tenses it uses) and a vocabulary list, shown by default and easy to hide.
- **Sie optional.** du and ihr are always used; tick "Use Sie" to practice the formal you too.
- **XP, levels and streaks**, from Schüler to Legende, and a Kranz for finishing AP German.

## Accounts are shared with Verba and Palabras

One account works on both sites. Your **account key, username, password, profile and saved AI key** are shared. Your **XP, levels, streaks, topics and course are separate for each language**, and each site has its own leaderboard. German progress is saved in its own part of the same account document (`de`), so saving on one site never erases the other.

## How it works

Wörter is a static website hosted on GitHub Pages, with no server and no build step.

| Path | What it is |
| --- | --- |
| `index.html` | The whole app: the German sentence engine, answer checker, interface and account code |
| `getkey.html` | Guide to getting a free Groq key |
| `keys.html` | Every AI provider that works, with free limits |
| `firestore.rules` | Security rules shared with Verba and Palabras: accounts, every leaderboard (the German one is `boardde`), usernames and password logins. The `boardde` rules must be published in the Firebase console before the German leaderboard can save. |
| `img/frohlix/` | Fröhlix, in every mood (drawn by Linguae's `tools/rig.py`) |
| `img/icons/` | Interface icons |
| `media/` | The key tutorial video, its captions and poster |
| `tools/engine.js` | The German sentence engine; `tools/convert-ui.py` pastes it into `index.html` |
| `tools/test-engine.js`, `tools/test-grade.js` | Tests: every topic generates correct, self-checking sentences; the checker handles typical mistakes |

## Contributing and issues

Suggestions, bug reports and pull requests are welcome, but none are guaranteed to be read, answered or accepted. See **[Contributing](CONTRIBUTING.md)**. **Never post an account key, a password or an AI key in an issue or pull request.**

## Credits

- Icons by Lorc and Delapouite from [game-icons.net](https://game-icons.net), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) (see `img/icons/LICENSE-game-icons.txt`), including the castle (Delapouite).
- Day and night switch after Adam Argyle, "Building a theme switch component" ([web.dev](https://web.dev/articles/building/a-theme-switch-component), Apache 2.0), with a sun from [Feather Icons](https://feathericons.com) (MIT) and easings from [Open Props](https://open-props.style) (MIT).
- Confetti by [canvas-confetti](https://github.com/catdad/canvas-confetti) (ISC).
- Profile pictures come from [Wikimedia Commons](https://commons.wikimedia.org); each picture's author and license are shown on the site.
- Fonts: Fraunces, Figtree and Gentium Book Plus, from [Google Fonts](https://fonts.google.com) (SIL Open Font License).
- Fröhlix was drawn for Linguae, from Verba's Fēlix.

## License

No license has been chosen yet, so all rights are reserved by the owner. The third-party pieces listed under Credits keep their own licenses.
