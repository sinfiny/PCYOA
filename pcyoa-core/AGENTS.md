# pcyoa-core Agent Notes

This directory is intended to become a standalone TypeScript package. Treat it as an extracted project, even while it still lives inside the larger PCYOA repository.

## Purpose

`pcyoa-core` is a headless rules package for interactive CYOA play.

The `demo/` directory is allowed to use the DOM. It is a minimal Viewer Implementation used to feel the core reacting. Keep that demo thin: it renders Play Snapshots and emits Player Actions, but it must not calculate legality.

It should answer questions such as:

- What has the player selected?
- What choices are available now?
- Why is a choice unavailable?
- What are the current point totals?
- What does a Game Mode Interpretation say about the current play path?

It should not answer questions such as:

- How should a card look?
- Which CSS class should a choice use?
- Which Svelte store should update?
- Which legacy Project File field should be mutated?

## Important Language

First read `docs/semantic-translation.md`. Use it when explaining concepts to the user. Lead with an intuitive domain such as literature, soft RPGs, music theory, philosophical math, human behavior science, AI/ML, microbiology, science, or magic systems. Then attach the formal project term in parentheses.

Use these terms consistently:

- Loaded CYOA: clean runtime game data consumed by the core.
- Play State: persisted player progress, small enough to save and replay.
- Player Action: an intentional game event, such as selecting a choice.
- Play Snapshot: derived current truth, such as points and availability.
- Choice Availability: whether a choice is available, selected, or unavailable, with reasons.
- Availability State Machine: the pure module that accepts a Loaded CYOA, Play State, and Player Action, then returns a transition.
- Game Mode Interpretation: optional opinionated interpretation layered on top of the rules.
- Balancing Algorithm: pure algorithm used by a Game Mode Interpretation.
- Weighted Matrix: first Balancing Algorithm, using choice signals and result weights.

## Architecture Rules

- Keep this package free of Svelte, DOM, CSS, browser stores, and app layout.
- Keep source package types in `src/source-package`. Do not import legacy `ICCPlus/src/lib/store/types.ts`.
- Prefer fail-closed behavior when adapting unsupported legacy mechanics. Unsupported rules should produce warnings and unavailable requirements instead of silently becoming legal.
- Do not copy old Svelte store behavior directly into the core. Translate behavior into small source-native concepts first.
- Add tests for each new behavior in `tests/`.
- Keep interfaces boring and stable. Prefer pure functions over classes.
- Before changing behavior, describe the Interface in plain terms: inputs, outputs, data stream, and owning Module.
- Do not choose or optimize around a visual framework until the relevant Interface is clear.

## Rewrite Map

Read `docs/rewrite-architecture.md` before starting architectural changes. It preserves the original eight-Module rewrite map and explains the data streams this package is trying to protect.

## Verification

From this directory, after installing dependencies:

```sh
npm run test
```

From the parent worktree without installing inside this package, current development can also use the already installed ICCPlus tooling:

```sh
../ICCPlus/node_modules/.bin/tsc -p tsconfig.json
../ICCPlus/node_modules/.bin/tsx tests/availability.test.ts
../ICCPlus/node_modules/.bin/tsx tests/source-package-adapter.test.ts
```

## Original Project References

The extraction was started from the larger PCYOA repo:

- Original Svelte-heavy runtime: `../ICCPlus/src/lib/store/store.svelte.ts`
- Old runtime types: `../ICCPlus/src/lib/store/types.ts`
- First in-repo pure core seed: `../ICCPlus/src/lib/core/`
- First in-repo source package adapter seed: `../ICCPlus/tools/core/source-package-adapter.ts`
- Domain glossary: `../CONTEXT.md`
