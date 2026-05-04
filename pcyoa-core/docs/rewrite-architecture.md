# Rewrite Architecture And Interface Map

This document preserves the original rewrite prompt and turns it into the working map for `pcyoa-core`.

For a lower-cognitive-load version of the same ideas, read `docs/semantic-translation.md` first.

The most important idea is that an Interface is not only a TypeScript function signature. In this rewrite, an Interface means a conceptual handoff. It answers four questions:

- What goes into this Module?
- What comes out of this Module?
- Which data stream is this Module part of?
- Which other Modules are allowed to know about this data?

The visual framework is deliberately not the focus yet. React, Preact, plain TypeScript, or another rendering layer can come later. The current work is about understanding the streams and keeping each Module honest.

## Original Rewrite Shape

The deep rewrite should have these Modules:

1. Source Project Package Module.
2. Loaded CYOA Module.
3. Availability State Machine Module.
4. Game Mode Interpretation Module.
5. Balancing Algorithm Module.
6. Presentation Template Module.
7. Viewer Implementation Module.
8. Legacy Compatibility Module.

The current `pcyoa-core` package is the beginning of Modules 1 through 5. Modules 6 through 8 are documented here so future work does not accidentally push presentation or legacy compatibility back into the core.

## The Eight Data Streams

The architecture is easier to understand when the data is described as streams.

### 1. Authoring Stream

The Authoring Stream starts with human-editable source material.

Input:

- Source Index.
- Lore Files.
- Rule Modules.
- Infrastructure Rule Modules.
- Content Media.
- Presentation Hints.
- Legacy Quarantine.

Output:

- A Loaded Source Project Package.

Current status:

- `src/source-package/types.ts` defines a first source-native package shape.
- `src/source-package/adapter.ts` consumes a Loaded Source Project Package.
- Actual filesystem or ZIP loading is not implemented inside `pcyoa-core` yet.

### 2. Normalization Stream

The Normalization Stream turns authoring material into the runtime model.

Input:

- Loaded Source Project Package.

Output:

- Loaded CYOA.
- Adapter warnings.

Current status:

- `sourcePackageToLoadedCyoa(pkg)` implements the first version.
- The output is intentionally clean runtime data, not Svelte state and not legacy Project File state.

### 3. Runtime Rules Stream

The Runtime Rules Stream carries the clean game definition through play.

Input:

- Loaded CYOA.

Output:

- Indexed rows, choices, points, variables, groups, and global requirements used by rules code.

Current status:

- `LoadedCyoa` is defined in `src/core/types.ts`.
- Requirement evaluation and snapshot derivation read from this model.
- The model is treated as read-only during play.

### 4. Player Action Stream

The Player Action Stream carries the player's intentional events.

Input:

- Current Play State.
- One Player Action.
- Loaded CYOA as the rulebook.

Output:

- Availability Transition.

Current status:

- `advanceAvailability(cyoa, state, action, options)` is the main Interface.
- It accepts or rejects the action.
- It returns either the next Play State and Play Snapshot, or the unchanged Play State with a rejection reason.

### 5. Derived Snapshot Stream

The Derived Snapshot Stream turns persisted play facts into renderable truth.

Input:

- Loaded CYOA.
- Play State.
- Optional Game Mode Interpretations.

Output:

- Play Snapshot.

The Play Snapshot includes:

- Point totals.
- Row states.
- Choice states.
- Choice Availability.
- Requirement explanations.
- Game Mode Interpretation output.

Current status:

- `derivePlaySnapshot(cyoa, state, options)` implements this stream.
- Points are derived from selected choices. They are not mutated into point definitions.

### 6. Interpretation Stream

The Interpretation Stream lets play philosophies observe the current state.

Input:

- Loaded CYOA.
- Play State.
- Base Play Snapshot.
- A Balancing Algorithm or similar interpreter.

Output:

- Game Mode Output.

Possible outputs over time:

- Result pressure.
- Choice bias.
- Recommendations.
- Warnings.
- Challenge pressure.
- Ending pressure.
- Simulation reports.

Current status:

- `GameModeInterpretation` exists as an Interface.
- `createWeightedMatrixGameMode(matrix)` is the first implementation.
- The Weighted Matrix observes player choice patterns and ranks results.
- It does not mutate source rules or decide ordinary legality.

### 7. Presentation Stream

This stream is intentionally outside the current core implementation.

It should eventually read:

- Play Snapshot.
- Presentation Hints.
- Template Pack.
- Player Presentation Choice.

Output:

- Semantic rendered shapes such as row, choice, addon, point bar, ending, requirement explanation, selected state, unavailable state, and available state.

Current status:

- A minimal demo UI exists in `demo/`.
- Production Presentation Template behavior is not implemented in `pcyoa-core`.
- Production Viewer Implementation behavior is not implemented in `pcyoa-core`.
- This stream is documented so presentation does not leak into the rules core.

### 8. Legacy Compatibility Stream

This stream is intentionally outside the current core implementation.

It should eventually read or write:

- Legacy Project File.
- Source Project Package.
- Legacy ID Map.
- Legacy Compilation Manifest.
- Legacy Quarantine.

Output:

- Project File Decomposition results.
- Source Project Compilation results.
- Legacy-compatible Project Files.

Current status:

- Legacy compatibility is referenced, but it is not the center of this package.

## Module Interfaces

This section describes the Modules as conceptual Interfaces. A future agent should read these before adding mechanics.

### Source Project Package Module

Purpose:

This Module owns the authoring format. It is where human-editable material becomes organized, source-native CYOA material.

Inputs:

- Source Index.
- Lore Files.
- Rule Modules.
- Infrastructure Rule Modules.
- Content Media.
- Presentation Hints.
- Legacy Quarantine.

Outputs:

- Loaded Source Project Package.
- Source object records with status, type, kind, parent, order, lore, rules, media, and presentation hints.

Streams:

- Authoring Stream.
- Normalization Stream.
- Legacy Compatibility Stream, but only through adapters.

Important rule:

This Module should not behave like a viewer. It should describe authored content and source rules, not calculate play legality.

### Loaded CYOA Module

Purpose:

This Module owns the pure runtime model. It is what rules code and Viewer Implementations consume.

Inputs:

- Loaded Source Project Package through `sourcePackageToLoadedCyoa`.
- Later, possibly Project File Hydration through a separate adapter.

Outputs:

- Loaded CYOA.

Streams:

- Normalization Stream.
- Runtime Rules Stream.
- Player Action Stream.
- Derived Snapshot Stream.
- Interpretation Stream.

Important rule:

A Loaded CYOA is not the player's state. It is the rulebook. It should not be mutated when the player selects a choice.

### Availability State Machine Module

Purpose:

This Module is the heart of the rewrite. It owns legal transitions.

Inputs:

- Loaded CYOA.
- Current Play State.
- Player Action.
- Optional Game Mode Interpretations.

Outputs:

- Availability Transition.
- Accepted transitions include next Play State and next Play Snapshot.
- Rejected transitions include unchanged Play State, current Play Snapshot, and rejection reason.

Streams:

- Runtime Rules Stream.
- Player Action Stream.
- Derived Snapshot Stream.

Important rule:

The Availability State Machine calculates legality. A Viewer Implementation may ask for a transition, but it must not recreate the legality rules in layout code.

### Game Mode Interpretation Module

Purpose:

This Module owns optional play philosophy. It can make the same Loaded CYOA feel classic, story-forward, challenge-oriented, simulation-oriented, or weighted-matrix driven.

Inputs:

- Loaded CYOA.
- Play State.
- Base Play Snapshot.

Outputs:

- Game Mode Output.

Streams:

- Interpretation Stream.
- Derived Snapshot Stream.

Important rule:

Game Mode Interpretation can observe, rank, recommend, pressure, or report. It should not contaminate authored source rules. If a mode later influences availability, that influence should be explicit in its output and still pass through the Availability State Machine.

### Balancing Algorithm Module

Purpose:

This Module owns deeper algorithms behind Game Mode Interpretation.

Inputs:

- Algorithm-specific configuration.
- Loaded CYOA.
- Play State.
- Current availability and point totals.

Outputs:

- Algorithm-specific interpretation data.

For the current Weighted Matrix, the output is:

- Result pressures.
- Choice biases.

Streams:

- Interpretation Stream.

Important rule:

The algorithm is not the source of truth for basic CYOA legality. It is an interpreter over the source of truth.

### Presentation Template Module

Purpose:

This future Module separates layout from reactivity. It maps semantic shapes to template packs.

Inputs:

- Play Snapshot.
- Presentation Hints.
- Template Pack.
- Viewer capabilities.

Outputs:

- Renderable semantic shapes.

Semantic shapes include:

- Row.
- Choice.
- Addon.
- Point bar.
- Ending.
- Requirement explanation.
- Selected state.
- Unavailable state.
- Available state.

Streams:

- Presentation Stream.

Important rule:

This Module may decide how a shape should be presented. It should not decide whether a choice is legal.

### Viewer Implementation Module

Purpose:

This future Module is the thin application shell.

Inputs:

- Loaded CYOA.
- Play State.
- Play Snapshot.
- Template output.
- Player events from the UI.

Outputs:

- Player Actions sent to the Availability State Machine.
- Rendered UI.
- Persisted Play State.

Streams:

- Player Action Stream.
- Derived Snapshot Stream.
- Presentation Stream.

Important rule:

The Viewer Implementation subscribes to snapshots and emits Player Actions. It does not calculate legality.

### Legacy Compatibility Module

Purpose:

This future Module fences off legacy formats.

Inputs:

- Legacy Project File.
- Source Project Package.
- Legacy ID Map.
- Legacy Compilation Manifest.

Outputs:

- Project File Decomposition.
- Source Project Compilation.
- Legacy-compatible Project File.
- Legacy Quarantine entries.

Streams:

- Legacy Compatibility Stream.
- Authoring Stream, through adapters only.

Important rule:

The legacy Project File is an adapter target. It is not the architecture's center.

## Current Implementation Map

Implemented now:

- Source-native source package types.
- Source Package to Loaded CYOA adapter.
- Loaded CYOA types.
- Play State.
- Player Action.
- Play Snapshot.
- Requirement evaluation.
- Availability State Machine.
- Game Mode Interpretation Interface.
- Weighted Matrix as first Balancing Algorithm.
- Tests for availability and source package adaptation.

Not implemented yet:

- Filesystem or ZIP Source Project Package loading.
- Full source schema validation.
- Presentation Template Module.
- Viewer Implementation Module.
- Legacy Compatibility Module inside this package.
- Full legacy mechanic coverage.

## The Interfaces To Understand First

A future agent should understand these Interfaces before changing behavior.

### `sourcePackageToLoadedCyoa(pkg)`

Input:

- One Loaded Source Project Package.

Output:

- One Loaded CYOA.
- Zero or more warnings.

Streams:

- Authoring Stream into Normalization Stream.

Question it answers:

"What is the clean runtime CYOA that should be played?"

### `createInitialPlayState(cyoa)`

Input:

- One Loaded CYOA.

Output:

- One empty Play State.

Streams:

- Runtime Rules Stream into Player Action Stream.

Question it answers:

"What is the smallest starting player state for this CYOA?"

### `derivePlaySnapshot(cyoa, state, options)`

Input:

- One Loaded CYOA.
- One Play State.
- Optional Game Mode Interpretations.

Output:

- One Play Snapshot.

Streams:

- Runtime Rules Stream.
- Derived Snapshot Stream.
- Interpretation Stream.

Question it answers:

"Given the rulebook and the player's saved facts, what is true right now?"

### `advanceAvailability(cyoa, state, action, options)`

Input:

- One Loaded CYOA.
- One current Play State.
- One Player Action.
- Optional Game Mode Interpretations.

Output:

- One Availability Transition.

Streams:

- Runtime Rules Stream.
- Player Action Stream.
- Derived Snapshot Stream.

Question it answers:

"Is this player action legal, and what state follows from it?"

### `createWeightedMatrixGameMode(matrix)`

Input:

- Weighted Matrix configuration.

Output:

- One Game Mode Interpretation.

Streams:

- Interpretation Stream.

Question it answers:

"How should weighted result pressure be attached to snapshots?"

### `evaluateWeightedMatrix(cyoa, state, matrix)`

Input:

- Loaded CYOA.
- Play State.
- Weighted Matrix configuration.

Output:

- Weighted matrix result pressures and choice biases.

Streams:

- Interpretation Stream.

Question it answers:

"What result direction is the current play path drifting toward?"

## The Main Mental Model

The whole rewrite can be understood as this loop:

```text
Authoring data
  -> Loaded Source Project Package
  -> Loaded CYOA
  -> Play State plus Player Action
  -> Availability Transition
  -> Play Snapshot
  -> Game Mode Interpretation output
  -> Viewer rendering
  -> next Player Action
```

The important split is this:

- Loaded CYOA is the rulebook.
- Play State is the saved player path.
- Player Action is one intentional event.
- Play Snapshot is what is true now.
- Game Mode Interpretation is optional pressure or interpretation.
- Presentation Template is how truth becomes visible.
- Viewer Implementation is the application shell.
- Legacy Compatibility is an adapter, not the center.
