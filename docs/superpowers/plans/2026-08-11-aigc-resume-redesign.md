# AIGC Resume Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the opaque static bundle with a maintainable React/Vite resume portfolio, add Supabase-backed content and GitHub repository synchronization, and ship a colorful animated single-page experience plus a strict one-page A4 print view.

**Architecture:** A React/Vite/TypeScript client reads published resume content from Supabase when configured and uses a checked-in fallback dataset for local/offline rendering. Supabase Postgres stores structured resume content and GitHub metadata; an Edge Function periodically upserts public repositories while permanently excluding `zeroaigen-auto-mention`. The public page remains one route with semantic sections, a Three.js/CSS-canvas visual layer, restrained GSAP/Intersection Observer motion, and a separate print component.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Playwright, Supabase JS, Supabase Postgres/RLS, Supabase Edge Functions, GSAP ScrollTrigger, Three.js, Lucide React, CSS media queries.

## Global Constraints

- Do not use a black main background; use a light paper base with a red/yellow/green/blue Chromatic Flow Field and editorial grid accents.
- Keep all current resume content: hero, quantified impact, full experience/SOP, skills, education, awards, contact, and projects.
- Display all visible GitHub projects from the sync cache on the main page; `zeroaigen-auto-mention` is always excluded.
- Do not add a video player, autoplay video, or fabricated work imagery.
- Keep native browser scrolling and keyboard navigation; do not scroll-jack.
- All content must exist in the DOM without animation; honor `prefers-reduced-motion`.
- Print output must be exactly one A4 page (`210mm x 297mm`) with no animated/background layers.
- Never expose GitHub tokens or Supabase service-role keys to the browser.
- Do not commit `.codegraph/`, `.env*`, Supabase secrets, or generated screenshots.

---

## File Map

Create a source tree with focused responsibilities:

- `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`: project tooling and scripts.
- `src/main.tsx`, `src/App.tsx`: application bootstrap and route selection.
- `src/types/content.ts`: shared public content contracts.
- `src/data/profile.ts`: complete local fallback content migrated from the current resume.
- `src/data/github.ts`: GitHub repository filtering and display mapping.
- `src/lib/supabase.ts`, `src/lib/contentRepository.ts`: optional remote data access with fallback behavior.
- `src/components/layout/SiteHeader.tsx`, `src/components/layout/SectionNav.tsx`: navigation and active section state.
- `src/components/visual/ChromaticFlowField.tsx`, `src/components/visual/EditorialGrid.tsx`: animated background and static fallback.
- `src/components/sections/HeroSection.tsx`, `ImpactSection.tsx`, `ExperienceSection.tsx`, `ProjectsSection.tsx`, `SkillsSection.tsx`, `EducationSection.tsx`, `ContactSection.tsx`: one section per content concern.
- `src/components/projects/ProjectCard.tsx`, `ProjectGrid.tsx`, `ProjectDetails.tsx`: all synced project rendering and accessible expansion.
- `src/components/print/PrintableResume.tsx`: independent A4 print layout.
- `src/components/admin/AdminPage.tsx`, `src/components/admin/AdminProjects.tsx`, `src/components/admin/AdminContentForm.tsx`: owner-only content controls.
- `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/print.css`: visual tokens, layout, motion, responsive, and print rules.
- `supabase/migrations/001_initial_schema.sql`: schema, indexes, RLS, seed exclusions.
- `supabase/functions/sync-github-projects/index.ts`, `supabase/functions/_shared/github.ts`: scheduled/manual GitHub sync.
- `tests/contentRepository.test.ts`, `tests/github.test.ts`, `tests/printableResume.test.ts`: unit tests for contracts and data behavior.
- `tests/smoke.spec.ts`: browser smoke and interaction coverage.

---

### Task 1: Scaffold the Maintainable Client

**Files:** Create the tooling and bootstrap files listed in the File Map; remove the old `assets/index-*.js` and `assets/index-*.css` only after the new app builds successfully.

**Interfaces:** `src/main.tsx` mounts `<App />`; `App` accepts no props and chooses public or admin surface from `window.location.pathname`.

- [ ] **Step 1: Add the package manifest and scripts.**

Define `dev`, `build`, `preview`, `typecheck`, `test`, `test:watch`, and `test:e2e` scripts. Pin dependencies for React, Vite, TypeScript, Supabase JS, GSAP, Three.js, Lucide React, Vitest, Testing Library, and Playwright.

- [ ] **Step 2: Add Vite/TypeScript/Vitest/Playwright configuration.**

Use strict TypeScript, browser `jsdom` for unit tests, and a web server command that serves the built app on an available local port for smoke tests.

- [ ] **Step 3: Add a minimal `App` shell and global styles.**

Render a visible heading and the section landmarks before adding visual polish. Define CSS custom properties for paper, ink, red, yellow, green, blue, spacing, motion durations, and content width.

- [ ] **Step 4: Run the baseline checks.**

Run `npm install`, `npm run typecheck`, `npm test -- --run`, and `npm run build`. The expected result is a successful empty shell build with no test failures.

- [ ] **Step 5: Commit the scaffold.**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts playwright.config.ts src tests
git commit -m "feat: scaffold maintainable resume app"
```

### Task 2: Model Resume Content and Remote Fallbacks

**Files:** Create `src/types/content.ts`, `src/data/profile.ts`, `src/data/github.ts`, `src/lib/supabase.ts`, `src/lib/contentRepository.ts`, and `tests/contentRepository.test.ts`.

**Interfaces:**

```ts
export type ResumeContent = {
  profile: Profile;
  impact: ImpactMetric[];
  experience: Experience[];
  skills: SkillGroup[];
  education: Education[];
  awards: Award[];
};

export type Project = {
  githubId: number;
  name: string;
  description: string;
  htmlUrl: string;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  updatedAt: string;
  visible: boolean;
  featuredRank: number | null;
  manualTitle: string | null;
  manualDescription: string | null;
};

export interface ContentRepository {
  getResume(): Promise<ResumeContent>;
  getProjects(): Promise<Project[]>;
}
```

- [ ] **Step 1: Write failing tests for the repository fallback.**

Cover remote success, remote failure returning local data, and preserving all current sections in the result.

- [ ] **Step 2: Write failing tests for GitHub project filtering.**

Assert that `zeroaigen-auto-mention`, forks, and archived repositories are excluded; ordinary repositories are retained and sorted by `featuredRank` then `updatedAt`.

- [ ] **Step 3: Port the current resume data into typed fallback data.**

Keep the complete job duties, SOP steps, all current projects, skills, education, honors, contact details, and PDF data. Do not invent missing media.

- [ ] **Step 4: Implement the Supabase repository with an environment guard.**

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are absent, return fallback data without throwing. When present, query only published/visible rows and map database records to the shared contracts.

- [ ] **Step 5: Run focused tests and typecheck.**

Run `npm test -- --run tests/contentRepository.test.ts tests/github.test.ts` and `npm run typecheck`; expected result is all focused tests passing.

- [ ] **Step 6: Commit the content layer.**

```bash
git add src/types src/data src/lib tests/contentRepository.test.ts tests/github.test.ts
git commit -m "feat: add typed resume content repository"
```

### Task 3: Add Supabase Schema, RLS, and GitHub Sync

**Files:** Create `supabase/migrations/001_initial_schema.sql`, `supabase/functions/_shared/github.ts`, `supabase/functions/sync-github-projects/index.ts`, and a deployment README at `supabase/README.md`.

**Interfaces:**

```ts
export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
  archived: boolean;
};

export type ProjectInsert = {
  githubId: number;
  name: string;
  description: string;
  htmlUrl: string;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  updatedAt: string;
  source: "github";
};

export type SyncRunResult = {
  status: "success" | "error";
  fetched: number;
  written: number;
  filtered: number;
  error: string | null;
};

export function shouldSyncRepository(repo: GitHubRepository, exclusions: Set<number | string>): boolean;
export function mapRepository(repo: GitHubRepository): ProjectInsert;
```

- [ ] **Step 1: Write SQL assertions in a migration test fixture.**

Document and test the required unique `github_id`, visible/published filters, exclusion seed for `zeroaigen-auto-mention`, and owner-only write policies.

- [ ] **Step 2: Create normalized tables and indexes.**

Use typed columns for fields queried by the public page; use `text[]` for Topics; add indexes on `published`, `visible`, `featured_rank`, and `updated_at`; keep `github_id` unique.

- [ ] **Step 3: Add RLS policies.**

Allow anonymous reads only for published profile content and visible projects. Restrict inserts, updates, deletes, and sync-run writes to the authenticated owner role used by the Edge Function/admin flow.

- [ ] **Step 4: Implement paginated GitHub fetch and filtering.**

Fetch `crazyzhang277` public repositories page by page, exclude forks, archived repos, the exact excluded slug, and stable IDs from `project_exclusions`, then upsert by `github_id` while preserving manual fields.

- [ ] **Step 5: Implement failure-safe sync logging.**

Write `sync_runs` only after collecting counts and errors; mark missing historical repos stale/hidden instead of deleting them; return a structured JSON result for manual admin calls.

- [ ] **Step 6: Document Supabase deployment and secrets.**

List the migration command, Edge Function deployment command, required `GITHUB_TOKEN`, `SUPABASE_URL`, and service-role secret names, and the daily schedule configuration without including real values.

- [ ] **Step 7: Commit the backend foundation.**

```bash
git add supabase
git commit -m "feat: add Supabase content schema and GitHub sync"
```

### Task 4: Implement the Colorful Motion Shell

**Files:** Create `src/components/layout/SiteHeader.tsx`, `SectionNav.tsx`, `src/components/visual/ChromaticFlowField.tsx`, `EditorialGrid.tsx`, `src/styles/tokens.css`, `global.css`, and the relevant section component files.

**Interfaces:**

```ts
export function ChromaticFlowField({ reducedMotion }: { reducedMotion: boolean }): JSX.Element;
export function useActiveSection(sectionIds: string[]): string;
export function Reveal({ children, delayMs }: { children: React.ReactNode; delayMs?: number }): JSX.Element;
```

- [ ] **Step 1: Write a component test for section landmarks and reduced-motion behavior.**

Assert that all seven section IDs render, the canvas has an accessible hidden/decorative role, and reduced motion does not remove content.

- [ ] **Step 2: Implement light paper tokens and the Chromatic Flow Field.**

Use a fixed canvas/WebGL layer with low-frequency red/yellow/green/blue flow. Pause when hidden, avoid continuous expensive DOM updates, and fall back to a static four-color editorial grid if initialization fails or motion is reduced.

- [ ] **Step 3: Implement header, active-section progress, and semantic section layout.**

Use real anchor links, visible keyboard focus, a mobile menu that does not lock page scrolling, and a thin progress indicator driven by the active section.

- [ ] **Step 4: Implement reveal and scroll-linked motion.**

Use Intersection Observer for one-time reveals and GSAP ScrollTrigger only for Hero depth, the section progress line, and one project-region scrub. Do not make content visibility depend on those effects.

- [ ] **Step 5: Run component tests and typecheck.**

Run `npm test -- --run tests/visualShell.test.tsx` and `npm run typecheck`; expected result is zero failures.

- [ ] **Step 6: Commit the motion shell.**

```bash
git add src/components/layout src/components/visual src/styles tests/visualShell.test.tsx
git commit -m "feat: add colorful motion shell"
```

### Task 5: Build the Resume Sections and Project Experience

**Files:** Create/update the seven section components, `src/components/projects/ProjectCard.tsx`, `ProjectGrid.tsx`, `ProjectDetails.tsx`, and `tests/resumeSections.test.tsx`.

**Interfaces:**

```tsx
export function ProjectsSection({ projects }: { projects: Project[] }): JSX.Element;
export function ProjectCard({ project, expanded, onToggle }: ProjectCardProps): JSX.Element;
```

- [ ] **Step 1: Write section tests for complete content.**

Assert the Hero role, four quantified impact values, full experience headings, all skill groups, education/award headings, and all supplied visible project names are present.

- [ ] **Step 2: Implement Hero and Impact sections.**

Use concise hierarchy, visible text before any animation, metric counters with static fallback values, copy buttons with success states, and CTA links that target real sections.

- [ ] **Step 3: Implement Experience and SOP sections.**

Render every current duty in semantic list content, pair it with the animated timeline, and keep the four SOP steps readable on mobile.

- [ ] **Step 4: Implement all GitHub project cards.**

Render every visible synced repository rather than a curated hard-coded subset. Include language, Topics, Star/Fork, updated date, external link, and an accessible details expansion. Avoid any video placeholder.

- [ ] **Step 5: Implement Skills, Education, Contact, and PDF actions.**

Keep category switching keyboard accessible, render all education/award facts, and provide copy/contact/print actions with status feedback.

- [ ] **Step 6: Run focused section tests.**

Run `npm test -- --run tests/resumeSections.test.tsx` and `npm run typecheck`; expected result is all sections passing.

- [ ] **Step 7: Commit the resume experience.**

```bash
git add src/components/sections src/components/projects tests/resumeSections.test.tsx src/App.tsx
git commit -m "feat: build complete animated resume experience"
```

### Task 6: Add Admin Editing and Sync Controls

**Files:** Create `src/components/admin/AdminPage.tsx`, `AdminProjects.tsx`, `AdminContentForm.tsx`, `src/lib/adminRepository.ts`, and `tests/admin.test.tsx`.

**Interfaces:**

```ts
export interface AdminRepository {
  saveResume(content: ResumeContent): Promise<void>;
  updateProjectVisibility(githubId: number, visible: boolean, featuredRank: number | null): Promise<void>;
  triggerGitHubSync(): Promise<SyncRunResult>;
}
```

- [ ] **Step 1: Write tests for unauthenticated redirect and owner controls.**

Assert that unauthenticated users see a login prompt, authenticated owners can edit content and project visibility, and the sync result renders success/error status.

- [ ] **Step 2: Implement Supabase Auth guard and admin data access.**

Use the anon client for browser auth, query/update only through RLS-protected operations, and never import a service-role credential.

- [ ] **Step 3: Implement structured resume editing.**

Provide focused forms for profile, experiences, skills, education, awards, and manual project overrides; preserve ordering fields and validation.

- [ ] **Step 4: Implement project visibility and sync controls.**

Show last sync time, counts, errors, a manual sync button, and per-project visible/hidden/featured controls. Make the permanent ZeroAIGen exclusion read-only in the UI.

- [ ] **Step 5: Run admin tests and typecheck.**

Run `npm test -- --run tests/admin.test.tsx` and `npm run typecheck`; expected result is zero failures.

- [ ] **Step 6: Commit admin controls.**

```bash
git add src/components/admin src/lib/adminRepository.ts tests/admin.test.tsx
git commit -m "feat: add Supabase-backed admin controls"
```

### Task 7: Implement the One-Page A4 Print View

**Files:** Create `src/components/print/PrintableResume.tsx`, `src/styles/print.css`, and `tests/printableResume.test.tsx`.

- [ ] **Step 1: Write a print test for one page and priority content.**

Assert that the print root declares A4 dimensions, hides the animated shell, contains AI animation role/work experience/metrics, and renders GitHub as compact proof.

- [ ] **Step 2: Implement a separate print layout.**

Use one A4 root, compact typography, controlled spacing, no animated canvas, no screen-only navigation, and a predictable section order. Keep all essential facts in normal DOM order.

- [ ] **Step 3: Add print-specific CSS.**

Use `@page { size: A4 portrait; margin: 8mm 10mm; }`, disable shadows/background animation, prevent accidental page breaks, and verify content fits exactly one page.

- [ ] **Step 4: Run unit tests and a browser print preview check.**

Run `npm test -- --run tests/printableResume.test.tsx`; use Playwright to emulate print and verify one page with no overflow.

- [ ] **Step 5: Commit the print view.**

```bash
git add src/components/print src/styles/print.css tests/printableResume.test.tsx
git commit -m "feat: add strict one-page A4 resume view"
```

### Task 8: Run Full QA and Prepare Handoff

**Files:** Modify `tests/smoke.spec.ts`, `playwright.config.ts`, and documentation only when verification exposes a reproducible issue.

- [ ] **Step 1: Run the full unit/type/build checks.**

Run `npm test -- --run`, `npm run typecheck`, and `npm run build`; record the exact pass/fail counts.

- [ ] **Step 2: Start the local server.**

Run `npm run dev -- --host 127.0.0.1 --port 4175` from the worktree and use the Browser plugin first for validation.

- [ ] **Step 3: Verify desktop flow.**

Check page identity, nonblank content, no framework overlay, no console errors, Hero motion fallback, anchor navigation, project expansion, GitHub links, copy feedback, and admin route behavior.

- [ ] **Step 4: Verify mobile flow.**

Check 375px width for no horizontal overflow, complete text wrapping, usable navigation, disabled high-cost 3D, project cards, and visible contact/PDF actions.

- [ ] **Step 5: Verify reduced-motion and print flows.**

Emulate reduced motion and print media; confirm content appears immediately, the canvas is removed/degraded, and the PDF is one A4 page.

- [ ] **Step 6: Fix discovered issues and rerun the exact failing checks.**

Keep a short mismatch ledger from screenshots and console output; do not claim completion until the same checks pass after fixes.

- [ ] **Step 7: Commit the verified implementation.**

```bash
git add .
git commit -m "feat: ship redesigned AIGC resume site"
```

## Plan Self-Review

- Spec coverage: visual direction, complete resume content, all synced GitHub projects, permanent ZeroAIGen exclusion, Supabase schema/RLS, failure-safe sync, admin controls, motion/reduced-motion, responsive layout, and one-page A4 output each have dedicated tasks.
- Type consistency: `Project`, `ResumeContent`, `ContentRepository`, `AdminRepository`, `GitHubRepository`, and `SyncRunResult` are defined before use; the implementation must export them from the files named above.
- Verification gates: every task ends with focused tests or type/build checks, and Task 8 repeats the full rendered browser flows.
