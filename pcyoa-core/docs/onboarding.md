# Onboarding Essay

This document explains what `pcyoa-core` is, why it exists, what has been built, how the data flows, and how a future agent should continue the work.

It is written to be understandable when read aloud. The goal is not to sound clever. The goal is to make the project peaceful to re-enter.

If the formal vocabulary starts to feel heavy, read `docs/semantic-translation.md` first. That document explains the same architecture through domains such as literature, soft RPGs, music theory, philosophical math, human behavior, AI/ML, microbiology, science, and magic systems.

## The Problem This Package Solves

The original PCYOA project is a working Svelte application, but its core game behavior is difficult to separate from the application around it.

In the old application, several different concerns live close together. The code that tracks selected choices sits near the code that mutates point totals. Requirement checks depend on Svelte maps and app-global state. Choice rendering depends on whether a choice is selected or unavailable. Styling fields live on rows and choices. The viewer layout reads game state directly and mixes it with templates, images, score display, and CSS strings.

That means a developer cannot easily ask, "What are the rules of the game?" without also asking, "How does this Svelte component render?" or "Which global store field is being mutated?"

The purpose of `pcyoa-core` is to create a clean center. The core should know the game. It should not know the user interface.

This package is the first extracted version of that center.

## The Original Rewrite Map

The work started from a larger rewrite map.

That map has eight Modules:

- Source Project Package Module.
- Loaded CYOA Module.
- Availability State Machine Module.
- Game Mode Interpretation Module.
- Balancing Algorithm Module.
- Presentation Template Module.
- Viewer Implementation Module.
- Legacy Compatibility Module.

The current package is mainly the beginning of the Loaded CYOA Module, Availability State Machine Module, Game Mode Interpretation Module, and Balancing Algorithm Module. It also includes the first source package adapter for the Source Project Package Module.

The visual framework is not the priority yet. The priority is understanding the Interfaces. In this project, an Interface means a high-level handoff: what goes in, what comes out, which data stream is moving, and which Module is responsible for the decision.

The full map is preserved in `docs/rewrite-architecture.md`.

## What The Code Is

The code is a headless TypeScript library.

"Headless" means there is no UI. There are no Svelte components. There is no CSS. There are no cards, buttons, dialogs, or layout templates. There is just data and behavior.

The main code lives in `src/core`.

The file `src/core/types.ts` defines the vocabulary of the core. It defines rows, choices, points, variables, groups, requirements, player actions, play state, snapshots, and game mode output.

The file `src/core/requirements.ts` evaluates requirements. It can answer questions such as whether a choice is selected, whether a point total is high enough, whether a row has enough selected choices, whether a group has enough selected choices, or whether any item in a list of requirements passes.

The file `src/core/availability.ts` is the current heart of the system. It accepts a Loaded CYOA, a Play State, and a Player Action. It returns a transition. A transition says either, "yes, this action is accepted, here is the next state," or "no, this action is rejected, here is why."

The file `src/core/weighted-matrix.ts` contains the first game mode interpretation. It reads signals from selected choices, compares them against result weights, and ranks likely results.

The directory `src/source-package` contains a small source-native package model and an adapter. The adapter turns a Loaded Source Project Package into a Loaded CYOA. This lets the core consume authored source data without depending on the old Svelte app's store types.

## What The Core Does Not Try To Be

The core is not a full application.

It does not load ZIP files. It does not render a viewer. It does not edit content. It does not compile to the old Project File format. It does not replace the old app yet.

It is also not a direct clone of the old point system.

This is intentional. The old point system is one of the things that needed to be rethought. The new core starts from a simpler rule: selected choices produce derived point totals. Point totals should be calculated from the Play State and Loaded CYOA, rather than being pushed around by UI code.

## The Main Data Types

The most important type is `LoadedCyoa`.

A Loaded CYOA is the clean runtime representation of a CYOA. It contains rows, choices, points, variables, groups, and global requirements. It is the thing the core reads.

A row is a container for choices. It may have an allowed choice count. It may have requirements. It may list choice IDs in authored order.

A choice belongs to a row. It may have requirements. It may have point effects. It may belong to groups. It may have signals for the weighted matrix. It may be selectable or not selectable.

A point definition describes a point type. It has an ID, optional label, initial value, optional floor, and optional precision.

A variable definition describes a boolean variable. Variables are intentionally simple right now.

A group definition can reference choice IDs and row IDs. Groups let requirements refer to collections.

A requirement is a declarative rule. The core currently supports several requirement kinds: choice selected, point threshold, variable value, row selection count, group selection count, generic selection count, global requirement, conditional requirement, all, any, and unsupported.

The `unsupported` requirement is important. It lets the adapter fail closed. If old source data contains a requirement kind the new core does not understand yet, the adapter can preserve that fact by making the requirement unavailable and reporting a warning. This is safer than accidentally treating an unknown rule as legal.

## Play State And Play Snapshot

The core separates two ideas that were previously easy to blur.

The first idea is Play State.

Play State is the minimal persisted player progress. It records selected choice counts, variable values, and action history. It is small. It is the thing a future app should save.

The second idea is Play Snapshot.

Play Snapshot is the derived current truth. It contains current point totals, row states, choice states, and game mode output. It is larger. It is the thing a future app should render.

This separation matters.

If a player selects a choice that gives two courage, the core does not need to mutate a courage counter somewhere in a global store. Instead, the Play State says the choice is selected. Then the snapshot calculation derives that courage is now two.

That makes the system easier to test. It also makes it easier to rebuild state, inspect state, simulate state, and save state.

## Player Actions

A Player Action is an intentional game event.

The current actions are:

- Select a choice.
- Deselect a choice.
- Set a choice count.
- Set a variable.
- Reset.

These are not browser click events. A click is a UI event. A Player Action is a game event.

This distinction is one of the main architectural wins. A button, keyboard shortcut, command line script, or automated simulation can all produce the same Player Action. The core does not care where the action came from.

## The Availability State Machine

The main interface is `advanceAvailability`.

It receives three important inputs: a Loaded CYOA, a Play State, and a Player Action.

It returns an Availability Transition.

If the action is legal, the transition is accepted. It includes the next Play State and the next Play Snapshot.

If the action is not legal, the transition is rejected. It includes the unchanged Play State, the current Play Snapshot, and a rejection reason.

The current legality checks include:

- The selected choice must exist.
- The choice's row must exist.
- The row must be available.
- The choice must be selectable.
- The choice requirements must be satisfied.
- The row must have remaining capacity.
- The choice must not exceed its maximum selection count.
- The resulting point totals must not violate point floors.

These checks are intentionally central. A future viewer should not reimplement them.

## Requirement Evaluation

Requirements are evaluated in `src/core/requirements.ts`.

Requirement evaluation receives a context. That context includes the Loaded CYOA, an index of rows and choices, the current Play State, and current point totals.

The requirement evaluator then returns a result. The result says whether the requirement is satisfied and, if not, which reasons explain the failure.

This is what lets a Play Snapshot explain availability. A choice is not simply disabled. It can say why it is unavailable.

That is useful for UI, but the explanation is not UI-specific. A viewer can show the reason as text, hide it, translate it, or turn it into a tooltip.

## Weighted Matrix Behavior

The weighted matrix is the first Game Mode Interpretation.

A Game Mode Interpretation is optional behavior layered on top of the core rules. It does not decide basic legality. It interprets the current state in an opinionated way.

The weighted matrix uses choice signals.

For example, a choice might have signals like this:

```ts
signals: {
  bold: 2,
  gentle: -1
}
```

A possible result might have weights like this:

```ts
weights: {
  bold: 2,
  gentle: -1
}
```

When the player selects choices, the weighted matrix collects the selected signals and scores each result. It can then rank which result the player is drifting toward.

It also produces choice biases. A choice bias says which currently available choices would contribute to the leading result.

This is the beginning of the user's original vision: a weighted matrix that can push toward certain results as a player makes certain kinds of choices.

## Source Package Adapter

The adapter lives in `src/source-package/adapter.ts`.

Its job is to translate a Loaded Source Project Package into a Loaded CYOA.

The source package types live in `src/source-package/types.ts`. These types are deliberately source-native. They do not import the old Svelte app's store types.

The adapter currently maps:

- Canonical and draft row objects to core rows.
- Canonical and draft choice objects to core choices.
- Row allowed choice counts.
- Choice requireds.
- Choice scores to point effects.
- Choice groups.
- Choice `isNotSelectable`.
- Presentation hint signals to weighted matrix signals.
- Infrastructure points.
- Infrastructure variables.
- Infrastructure groups.
- Infrastructure global requirements.

The adapter also produces warnings.

Warnings are important because some old mechanics are not modeled yet. When an unsupported requirement appears, the adapter returns a warning and creates an `unsupported` core requirement. That requirement fails closed, meaning the choice will not accidentally become available.

## Data Flow

The preferred data flow is:

First, a Source Project Package is loaded by some outer tool.

Then `sourcePackageToLoadedCyoa` turns it into a Loaded CYOA.

Then `createInitialPlayState` creates an empty Play State.

Then `derivePlaySnapshot` creates the first Play Snapshot.

Then a viewer renders the snapshot.

When the player acts, the viewer creates a Player Action.

Then `advanceAvailability` receives the Loaded CYOA, current Play State, and Player Action.

Then the core accepts or rejects the action.

If accepted, the viewer stores the next Play State and renders the next Play Snapshot.

If rejected, the viewer keeps the old Play State and can show the rejection reason.

This loop is the clean center of the future application.

## Main Interfaces

The first interface is `createInitialPlayState(cyoa)`.

Use it when starting a playthrough.

The second interface is `derivePlaySnapshot(cyoa, state, options)`.

Use it when you need to know current point totals, row states, choice states, and game mode output.

The third interface is `advanceAvailability(cyoa, state, action, options)`.

Use it when the player tries to do something.

The fourth interface is `sourcePackageToLoadedCyoa(pkg)`.

Use it when source-native authoring data needs to enter the core.

The fifth interface is `createWeightedMatrixGameMode(matrix)`.

Use it when a viewer or simulation wants weighted matrix output inside snapshots.

## What Has Been Achieved

The project now has a separable core directory.

It contains no Svelte code. It contains no styling code. It contains no dependency on the old `ICCPlus/src/lib/store/types.ts` file.

It has its own `package.json`, TypeScript config, source files, tests, README, agent instructions, and docs.

It can be moved to a separate repository or package more peacefully than the first in-repo prototype could.

This is a real milestone.

It is still early, but it is not only an idea anymore. There is now executable, tested TypeScript code that embodies the separation between rules and presentation.

## What Is Still Missing

The core does not yet model every legacy PCYOA feature.

Missing or incomplete areas include discounts, random scores, expression scores, activation side effects, deactivation side effects, point multiply and divide mechanics, full multi-select semantics, addons, backpacks, result rows, loading from ZIP files, template rendering, and a standalone viewer.

Those should not all be added at once.

The right next step is to choose one mechanic, define it source-natively, add tests, and then implement it behind a small interface.

## How To Continue

When continuing, do not ask, "How did the old Svelte store mutate this?"

Ask, "What source-native rule should represent this mechanic?"

Then ask, "What should the Play State store?"

Then ask, "What should the Play Snapshot derive?"

Then ask, "What behavior should be tested through the public interface?"

If the answer requires layout, CSS, Svelte, or DOM access, it probably does not belong in this package.
