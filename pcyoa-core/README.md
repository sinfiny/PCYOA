# pcyoa-core

`pcyoa-core` is the start of a standalone, headless TypeScript core for PCYOA.

It is not a production viewer, editor, Svelte app, or styling system. It is the rules layer that a future viewer, editor, CLI, simulation tool, or balancing tool can call.

The package currently provides:

- A clean `LoadedCyoa` model.
- A small persisted `PlayState` model.
- Player actions such as select, deselect, set count, set variable, and reset.
- A derived `PlaySnapshot` with point totals, row states, choice states, and game mode output.
- Requirement evaluation.
- An Availability State Machine.
- A Weighted Matrix Game Mode Interpretation.
- A Source Project Package adapter with source-native types.
- A minimal vanilla TypeScript demo UI that shows the core reacting.

## Why This Exists

The original PCYOA app keeps game rules, Svelte reactivity, layout, styling, legacy save data, and viewer behavior very close together. That makes the point system and availability behavior hard to understand or replace.

This package separates the inner game rules from presentation. A UI should be able to render snapshots from this package without owning the rules.

## Current Status

This is a standalone library seed with a small demo UI, not a finished standalone application.

It is far enough separated that it can be moved out of the larger PCYOA repo as its own package. It is not yet complete enough to replace the old viewer.

## Directory Map

- `src/core/types.ts`: core data and interface types.
- `src/core/requirements.ts`: requirement evaluation.
- `src/core/availability.ts`: player action transitions and snapshot derivation.
- `src/core/weighted-matrix.ts`: first Balancing Algorithm and Game Mode Interpretation.
- `src/source-package/types.ts`: source-native package types, independent from the legacy Svelte app.
- `src/source-package/adapter.ts`: Source Project Package to Loaded CYOA adapter.
- `demo/`: minimal reactive card UI over the core.
- `tests/`: focused behavior tests.
- `docs/`: onboarding, development goals, interface maps, and references.

## Architecture Briefs

Start with these documents when re-entering the rewrite:

- `docs/semantic-translation.md`: the low-cognitive-load vocabulary bridge for explaining the architecture.
- `docs/rewrite-architecture.md`: the original eight-Module rewrite map, with inputs, outputs, and data streams.
- `docs/onboarding.md`: a longer listening-friendly explanation of what has been built.
- `docs/data-flow.md`: compact runtime flow and public Interface reference.
- `docs/development-goals.md`: next goals and known gaps.

## Main Flow

The intended runtime flow is:

```text
Source Project Package
  -> sourcePackageToLoadedCyoa
  -> Loaded CYOA
  -> createInitialPlayState
  -> Play State
  -> derivePlaySnapshot
  -> Play Snapshot for a viewer
```

When the player acts:

```text
Loaded CYOA + Play State + Player Action
  -> advanceAvailability
  -> accepted or rejected transition
  -> next Play State and next Play Snapshot
```

## Usage Sketch

```ts
import {
  advanceAvailability,
  createInitialPlayState,
  derivePlaySnapshot
} from '@pcyoa/core';

const state = createInitialPlayState(cyoa);
const snapshot = derivePlaySnapshot(cyoa, state);

const transition = advanceAvailability(cyoa, state, {
  type: 'select-choice',
  choiceId: 'brave'
});

if (transition.accepted) {
  console.log(transition.snapshot.pointTotals);
} else {
  console.log(transition.rejection.message);
}
```

## Development

After installing dependencies:

```sh
npm run test
```

To run the demo UI:

```sh
npm run demo
```

The package has no runtime dependencies right now. Development uses TypeScript and `tsx`.

## Known Gaps

The package does not yet model the full legacy PCYOA mechanic set. Still missing or incomplete:

- Discount mechanics.
- Random score values.
- Expression score values.
- Activate or deactivate other choices.
- Multiply, divide, and set point effects beyond the simple `set` operation.
- Full multi-select semantics.
- Backpack behavior.
- Addons.
- Result rows.
- Production template or presentation rendering.
- Source package loading from disk or ZIP files.

See `docs/development-goals.md` for the recommended path forward.
