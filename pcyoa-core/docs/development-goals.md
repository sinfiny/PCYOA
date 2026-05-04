# Initial Development Goals

This document describes the intended direction for `pcyoa-core`.

## Goal One: Keep Rules Separate From Presentation

The core should remain headless.

No Svelte, CSS, DOM APIs, cards, dialogs, or layout templates should enter `src/core`.

The core should produce Play Snapshots. Viewer Implementations should decide how to present those snapshots.

## Goal Two: Make Play State Small And Replayable

Play State should store only the facts needed to replay a player's path.

It should not store point totals, row availability, choice availability, or weighted matrix output. Those belong in Play Snapshot because they can be derived.

This makes saves simpler and simulations easier.

## Goal Three: Build Mechanics As Source-Native Concepts

When porting legacy mechanics, do not copy the old Svelte store mutation structure.

Instead, design a source-native concept and then map old source package data into it.

For example:

- Old selected maps become selected choice counts in Play State.
- Old point mutations become point effects derived from selected choices.
- Old hidden or disabled card styling becomes Choice Availability in Play Snapshot.
- Old game balancing hints become Game Mode Interpretation output.

## Goal Four: Fail Closed During Migration

Unsupported mechanics must not silently become allowed.

If the adapter cannot understand a legacy or source-package rule, it should create a warning and an `unsupported` requirement.

That requirement should make the related choice unavailable until the mechanic is implemented.

This protects authored intent.

## Goal Five: Make Game Modes Pluggable

Game Mode Interpretation is the intended seam for alternate play philosophies.

The first adapter is the Weighted Matrix. Future adapters may include:

- Classic deterministic mode.
- Story-forward recommendation mode.
- Budget challenge mode.
- Simulation mode.
- Author balancing report mode.

Game modes should read Loaded CYOA, Play State, and Play Snapshot. They should not mutate core legality.

## Goal Six: Understand Interfaces Before Choosing The Viewer

The visual framework is intentionally deferred.

The immediate work is to make each Interface understandable:

- What is inputted?
- What is outputted?
- Which data stream is moving?
- Which Module owns the decision?

A future Viewer Implementation should be thin because these Interfaces are already clear.

## Near-Term Milestones

1. Extract and preserve this folder as a standalone package.
2. Keep `docs/rewrite-architecture.md` current as Interfaces evolve.
3. Keep the minimal demo UI honest: it may render snapshots and emit Player Actions, but it must not calculate legality.
4. Add source package loading from filesystem JSON fixtures.
5. Add explicit source-native schemas for mechanics currently represented by legacy-ish requirement fields.
6. Model multi-select choices more fully.
7. Model expression score behavior in a pure, testable way.
8. Model random score behavior with injectable randomness so tests stay deterministic.
9. Model discounts as a pure derived point-effect transformation.
10. Add a tiny CLI that loads a JSON fixture, applies actions, and prints a snapshot.

## Current Known Gaps

The following behavior is not complete:

- Discounts.
- Random scores.
- Expression scores.
- Activate other choice.
- Deactivate other choice.
- Duplicate row.
- Add to allowed choices.
- Multiply point type.
- Divide point type.
- Set point type.
- Addons.
- Backpack.
- Result rows.
- Search.
- Audio.
- Production template rendering.
- Production styling.

This is expected. The package is a foundation, not a finished replacement.

## Test Strategy

Tests should prefer public interfaces:

- `sourcePackageToLoadedCyoa`
- `createInitialPlayState`
- `derivePlaySnapshot`
- `advanceAvailability`
- `createWeightedMatrixGameMode`
- `evaluateWeightedMatrix`

Tests should avoid locking onto helper function internals unless a helper is exported as part of the interface.

Each new mechanic should have tests for:

- Initial availability.
- Accepted actions.
- Rejected actions.
- Point totals or derived state.
- Explanation reasons when unavailable.
- Adapter warnings for unsupported or lossy cases.
