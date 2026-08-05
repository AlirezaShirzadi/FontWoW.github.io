---
name: pr-auto-review
description: Automatically review open GitHub PRs on this repo (FontWoW.github.io) — inspect the diff for correctness, security, scope, and code-quality issues, then approve clean PRs or leave a Persian, Rick Sanchez-toned "request changes" review listing concrete problems. Trigger on "بررسی PR", "پول ریکوئست رو چک کن", "ریویو PR", "auto review this PR", or when the user asks to check/approve/review a pull request on this project.
---

# PR Auto Review

Automates what a careful human reviewer does on this repo's PRs: read the real diff, judge it on
its own merits, and leave a review that is either an approval or a clear, actionable list of
problems — never a rubber stamp.

## When to use

- User asks to check/review/approve a PR (by number, or "the PR someone opened").
- User asks to run this on all open PRs.
- No PR number given and more than one is open → ask which one, or offer to review all.

## Workflow

1. **Find the PR(s).**
   ```bash
   gh pr list
   ```
   If the user named a number, use it. If they said "the PR" and only one is open, use that one.
   If several are open and unspecified, ask (or, if told to do all, loop over each).

2. **Gather full context per PR** — do NOT review from the title/description alone:
   ```bash
   gh pr view <N> --json title,body,author,files,additions,deletions,commits
   gh pr diff <N> > /tmp/pr<N>.diff
   gh pr checks <N>          # CI status, ignore "no checks reported" errors
   ```

3. **Size-gate the review:**
   - Diff **roughly ≤ 300 lines**: read it directly yourself with Read/Bash, no subagent needed.
   - Diff **larger**: spawn a single Agent (general-purpose, foreground) to do the deep read.
     Prompt it explicitly to:
     - Diff the actual before/after logic, not just line-count churn — large diffs are often
       mostly reformatting (indent/quote-style changes); call that out separately from real
       behavior changes.
     - Check for correctness bugs, security issues (XSS via unescaped user input rendered as
       HTML/CSS, `eval`, unsafe `innerHTML`/`dangerouslySetInnerHTML`, injection via generated
       code strings, clipboard misuse).
     - Check whether the PR guts or silently breaks existing functionality (large deletion counts
       demand this check specifically).
     - Check code quality: dead code/unused state, structural bloat, i18n gaps (hardcoded strings
       when `strings.js`/`t()` keys already exist for that string).
     - Check scope: does the diff actually match what the PR description claims, and is unrelated
       drive-by work (e.g. a full-file reformat bundled into a feature PR) worth flagging even if
       harmless?
     - Return a verdict (approve / request changes / reject) with concrete file/line-referenced
       issues, capped at ~500 words.

4. **Decide.**
   - **Approve** when: the diff does what it claims, no security/correctness issues, no silently
     broken existing behavior, reasonable scope. Minor nitpicks alone don't block approval — use
     judgment; this repo favors shipping over bikeshedding for genuinely clean fixes.
   - **Request changes** when: any real correctness/security issue, gutted functionality, or scope
     so tangled it can't be reviewed responsibly (e.g. unrelated full-file reformat bundled with a
     feature — ask for a split).

5. **Post the review** via `gh pr review <N> --approve|--request-changes --body "..."`.
   - **Approve body**: short, factual, Persian, plain tone — state what was checked and why it's
     fine. No need for Rick Sanchez flavor on approvals; keep it professional and brief.
   - **Request-changes body**: written in **Persian, in Rick Sanchez's voice** (Rick and Morty) —
     sarcastic, brilliant, impatient, calls the contributor "Morty"/"-y" nicknames, drops
     signature verbal tics (`*بارپ*`, `Wubba lubba dub dub`, `اینتردایمنشنال`, etc.) but the
     substance underneath must be a genuinely useful, specific, technically accurate list of
     issues with file/line references — the jokes are seasoning, not a replacement for real
     feedback. Always end constructively (what to fix, and that it's mergeable once fixed).
   - Use a heredoc (`$(cat <<'EOF' ... EOF)`) to avoid shell-quoting problems with Persian text
     and special characters.

6. **Report back to the user** in a short summary: which PR(s), verdict, and the top issues (if
   any) — don't just say "done," name what you found.

## Guardrails

- Never approve a PR you have not actually read the diff of (or had a subagent read it for large
  diffs) — no rubber-stamping based on title/description alone.
- Never silently merge — this skill only reviews/comments; merging is a separate, explicit user
  request (posting a review is reversible feedback, merging is not).
- If the diff touches CI/workflow files, secrets, dependency lockfiles with unfamiliar packages,
  or anything with supply-chain risk, flag that specifically regardless of otherwise-clean code.
- If `gh` isn't authenticated or the repo has no `origin` remote pointing to GitHub, stop and tell
  the user rather than guessing.
