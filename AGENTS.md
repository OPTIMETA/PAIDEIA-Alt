# AGENTS.md

Guidance for coding agents working on this Alt plugin project.

## What This Is

This is a static Alt plugin template built with React, Vite+, Tailwind CSS, shadcn/ui-style components, and `alt-plugin-sdk`.

The final artifact is the `dist/` directory. Alt imports `dist/manifest.json`, loads `dist/index.html`, and serves all plugin assets through the `alt-plugin://` protocol inside a sandboxed `WebContentsView`.

## Commands

Use `pnpm`.

```bash
pnpm install
pnpm dev
pnpm build
pnpm check
pnpm typecheck
```

`pnpm build` must leave a valid `dist/manifest.json` at the build root.

## Runtime Constraints

Plugins are sandboxed. Do not add code that depends on:

- Electron APIs
- Node.js APIs in browser code
- filesystem access
- secrets or environment variables
- direct internet access
- host app internals

Use `alt-plugin-sdk` for host interactions. The only expected global from Alt is `window.alt`, exposed by the plugin preload.

## Project Structure

- `manifest.json`: install-time plugin metadata and permissions.
- `src/App.tsx`: main plugin UI. Replace the sample SDK checks with the real feature.
- `src/components/ui/`: local shadcn/ui-style primitives. Add new primitives here.
- `src/lib/utils.ts`: shared utility helpers.
- `src/index.css`: Tailwind v4 import and CSS variable tokens.
- `scripts/copy-manifest.mjs`: build helper that copies the manifest to `dist/`.

## Implementation Guidelines

- Keep the plugin framework-agnostic at the SDK boundary. React should stay an implementation detail of this UI.
- Request the smallest permission set needed in `manifest.json`.
- Treat SDK TypeScript types as developer ergonomics, not security. Alt validates calls at runtime.
- Make SDK calls from user actions or effects that can handle failure.
- Keep local browser preview useful, but do not mock security-sensitive host behavior as if it were real.
- Prefer shadcn/ui-style components from `src/components/ui` before adding bespoke controls.
- Keep UI dense, clear, and app-like. This plugin runs inside a desktop app, not a marketing page.
- Avoid hardcoded colors in JSX. Use Tailwind tokens and CSS variables from `src/index.css`.
- Do not introduce a router unless the plugin genuinely needs multiple screens.
- Do not add state management libraries until local React state becomes insufficient.

## Adding SDK Features

When adding a host capability:

1. Add the permission to `manifest.json`.
2. Call the capability through `alt-plugin-sdk`.
3. Handle rejected promises and missing runtime state.
4. Add UI copy that explains the result, not implementation details.
5. Rebuild and import `dist/` into Alt for manual verification.

## Build Expectations

Before handing off changes:

```bash
pnpm typecheck
pnpm build
```

Run `pnpm check` when touching formatting, lint-sensitive code, or shared project config.
