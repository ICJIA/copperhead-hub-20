# Changelog

All notable changes to Project Copperhead (ICJIA Research Hub 2.0 public frontend) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-07-11

### Added

- Plan document, Section 7: "So, what exactly has to be done?" — the six-phase roadmap retold in plain English for non-technical managers — and "What we need from leadership" (five concrete asks: scope decision, design reviews, content freeze, cutover coordination, launch-gate agreement)

### Changed

- The plan document's Contents is now a clickable table of contents — internal bookmark links, deliberately built without a Word TOC *field* so the .docx still opens with no warning prompt
- All referenced resources in the plan document (Appendix E plus inline mentions in Sections 3–5) are live hyperlinks in both the .md and the .docx; verified 0 Word fields, 18/18 internal anchors resolved, 15 external links (all https)

## [0.1.0] - 2026-07-11

### Added

- Rewrite plan: `docs/ICJIA-Hub-20-rewrite-copperhead.md` (+ `.docx` for circulation) — Hub 1.0 parity/URL inventory, live Plausible traffic snapshot (6/12 months), full assessment of the unfinished `hub-frontend` attempt (36 major / 30 minor defects), reuse checklist, and a six-phase roadmap to launch on Nuxt 4.4.x + Nuxt UI 4.x
- Reference snapshot of the unfinished `hub-frontend` repository (`docs/icjia-hub-frontend-8a5edab282632443.txt`), the basis of the assessment
- Repository scaffolding: MIT `LICENSE`, this changelog, `.gitignore` (Nuxt), `.nvmrc` (Node 22)
- `README.md` — project overview, Hub 2.0 program status, planned architecture, and roadmap summary
