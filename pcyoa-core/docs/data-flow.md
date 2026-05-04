# Data Flow And Interfaces

This document is a compact reference for the runtime flow.

For a lower-cognitive-load vocabulary bridge, see `docs/semantic-translation.md`.

For the full rewrite map, including all eight Modules and the named data streams, see `docs/rewrite-architecture.md`.

## What Interface Means Here

An Interface is a conceptual handoff before it is a code signature.

For every Interface, ask:

- What is inputted?
- What is outputted?
- Which data stream does it belong to?
- Which Module is allowed to own the decision?

The current focus is these streams and handoffs, not the final visual framework.

## Data Flow

```text
Loaded Source Project Package
  -> sourcePackageToLoadedCyoa
  -> Loaded CYOA
  -> createInitialPlayState
  -> Play State
  -> derivePlaySnapshot
  -> Play Snapshot
```

When the player acts:

```text
Loaded CYOA + Play State + Player Action
  -> advanceAvailability
  -> Availability Transition
```

If the transition is accepted:

```text
Availability Transition
  -> next Play State
  -> next Play Snapshot
```

If the transition is rejected:

```text
Availability Transition
  -> unchanged Play State
  -> current Play Snapshot
  -> rejection reason
```

## Public Interfaces

### `sourcePackageToLoadedCyoa(pkg)`

Converts a Loaded Source Project Package into a Loaded CYOA.

Returns:

- `cyoa`: the clean runtime model.
- `warnings`: adapter warnings, usually for unsupported mechanics.

### `createInitialPlayState(cyoa)`

Creates a fresh Play State.

The initial Play State has:

- no selected choices,
- variables set to their initial values,
- empty action history.

### `derivePlaySnapshot(cyoa, state, options)`

Derives current game truth.

The snapshot includes:

- point totals,
- row states,
- choice states,
- Game Mode Interpretation output.

### `advanceAvailability(cyoa, state, action, options)`

Attempts to apply a Player Action.

Returns an Availability Transition.

Accepted transitions include the next Play State and next Play Snapshot.

Rejected transitions include the unchanged Play State, current Play Snapshot, and a rejection.

### `createWeightedMatrixGameMode(matrix)`

Creates a Game Mode Interpretation from a Weighted Matrix.

This can be passed into `derivePlaySnapshot` or `advanceAvailability` through options.

### `evaluateWeightedMatrix(cyoa, state, matrix)`

Evaluates weighted matrix output directly.

Useful for tests, simulations, and balancing tools.

## Interface Stability Notes

The core should keep these public interfaces small. Internal helper functions can change. The tests should mostly exercise the public interfaces.
