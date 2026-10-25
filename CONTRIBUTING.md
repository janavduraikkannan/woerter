# Contributing to Wörter

Thanks for wanting to help! Wörter is a personal project run by one student, so please read this first.

## The short version

**Issues and pull requests are welcome, but neither is guaranteed to be read, answered, merged or fixed.** Anything submitted may be checked and manually approved at the owner's sole discretion, on the owner's own schedule, or not at all. The owner may close any issue or pull request without explanation.

## Reporting a bug or suggesting an idea (issues)

1. Search the [existing issues](https://github.com/janavduraikkannan/palabras/issues) first, in case it's already been reported.
2. Open a new issue and include:
   - what you did and what you expected to happen;
   - what actually happened, with the exact German sentence and your answer if it's about grading;
   - your browser and device, and a screenshot if it helps.
3. For German mistakes, such as a wrong verb form, wrong vocabulary or a grammar topic in the wrong course, say what you think is right and where it comes from (your textbook or class notes) if you can.

**Never include an account key, an AI key, or personal details in an issue.** Issues are public. If a screenshot shows a key, cover it before uploading.

## Making changes (pull requests)

1. Fork the repository and make your changes on a new branch.
2. Keep each pull request to one fix or one feature, and explain what it changes and why.
3. Test your change by opening `index.html` in a browser: try both exercise directions, light and dark mode, and a phone-sized window.
4. Keep Wörter's rules in mind:
   - **It must stay free to run.** No paid services, servers or build steps.
   - **Keep AI requests to a minimum.** Don't ask the AI for anything the site can work out in code.
   - **Respect privacy.** Don't add tracking, analytics, ads or new ways of collecting information. Any change to what Wörter stores must update [PRIVACY.md](PRIVACY.md).
   - **Credit and license any outside artwork or code**, and use only things you're allowed to share.
   - Topics and expected answers should match how the course teaches them.
5. Changes to `firestore.rules` affect everyone's accounts on both Wörter and Verba, so they get extra careful review and may simply not be accepted.

By submitting a pull request, you confirm the work is yours to share and you agree it can be used in Wörter under whatever license the owner chooses.

## Security problems

If you find a way to read or change other people's accounts or leaderboard entries, please don't post the details publicly. Open an issue saying only that you found a security problem and asking how to share it privately.
