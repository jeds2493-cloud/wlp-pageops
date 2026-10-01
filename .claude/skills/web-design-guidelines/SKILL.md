---
name: web-design-guidelines
description: Review UI for Vercel's Web Interface Guidelines — accessibility, focus states, forms, animation, typography, images, touch targets, navigation, copy and anti-patterns. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", "check my site against best practices", or as the technical guardrail after a design pass (e.g. after impeccable). Works on source files or on a rendered page.
metadata:
  author: vercel (adapted locally)
  version: "1.0.0-local"
  source: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
  argument-hint: <file-or-pattern | URL>
---

# Web Interface Guidelines

Review UI for compliance with Vercel's Web Interface Guidelines.

## Rules

The rules live in [references/command.md](references/command.md), a reviewed local copy of
`vercel-labs/web-interface-guidelines/main/command.md` taken on 2026-09-28. Read that file; do **not** fetch
the rules from the internet at review time (the original skill did, which lets remote text change the
instructions unseen). To refresh the rules, download the file, review it, and replace the local copy.

## How it works

1. Read `references/command.md`.
2. Pick the target:
   - **Source files** (a file or pattern): read them and report in `file:line` format, as the rules say.
   - **A live page** (URL, e.g. a WordPress page): inspect the rendered DOM and computed styles in the
     browser at desktop and mobile widths; report by section and element (block uniqueId or selector)
     instead of `file:line`.
3. Check every rule; flag the anti-patterns. Skip rules that do not apply to the stack (hydration, React
   state, `useState`/URL sync on static pages) instead of reporting them.
4. Output terse findings, grouped, with the fix when it is not obvious. No preamble.

If no target is given, ask which files or page to review.

## Project rules win

When a project has its own measured rules, they override these guidelines. For We Love Paving (WordPress +
GeneratePress + GenerateBlocks + WP Rocket), follow `lead-ui-ux-designer`:

- **Images:** do not recommend `loading="lazy"` on GenerateBlocks images; there WordPress adds `sizes="auto"`
  and WP Rocket's lazy-load makes Chrome download the largest file. Use `loading="auto"` as the project does.
  The LCP image goes as `<img>` with `fetchpriority="high"`, `no-lazy skip-lazy` and a matching preload.
- **Copy:** the site copy is owned by the SEO/Marketing team and the form is another team's shortcode; report
  copy issues as suggestions, never flag the form's texts or fields.
- **Preconnect / font preload:** global head changes are the admin's; report them as requests.
