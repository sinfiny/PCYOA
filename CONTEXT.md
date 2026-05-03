# PCYOA Domain Context

## Glossary

**Project File** is the current legacy CYOA data format used by Interactive CYOA Creator Plus. Runtime architecture work must keep existing Project File loading and visible behavior stable unless a separate issue explicitly changes it.

**Loaded CYOA** is a Project File after it has been loaded into the application runtime. Current Loaded CYOA data is still stored in Svelte global maps and app state.

**Loaded CYOA runtime state** is the activation-facing seam over a Loaded CYOA. It exposes the rows, choices, groups, point types, variables, words, global requirements, and activation entries needed by gameplay interpretation without exposing the full global store as the module interface.

**Svelte Loaded CYOA runtime adapter** is the current adapter from Svelte global maps to Loaded CYOA runtime state. It lets the codebase migrate gradually while preserving Creator and Viewer behavior.

**CYOA Outline** is a clean, non-interactive page structure derived from a Loaded CYOA. It describes sections, items, media, placement, and stable CYOA Targets without exposing raw legacy row/template fields to Viewer layout work.

**CYOA Target** is a stable address inside a CYOA Outline for a meaningful place that Viewer behavior may style, reveal, hide, scroll to, activate, replace, or otherwise affect. Avoid using DOM selectors, CSS classes, element IDs, or raw object IDs as the module interface.

**Presentation Style Map** is a Viewer-owned mapping from CYOA Targets to concrete presentation decisions such as CSS classes, inline style strings, resolved colors, spacing, typography, filters, and media sizing. It stays separate from the CYOA Outline.

**Choice Activation** is the module that interprets selecting, deselecting, checking requirements for, scoring, and applying activation-related effects for choices and choice-like selectable addons.

**Game Mode Interpretation** is the broader gameplay layer that Choice Activation belongs to. It translates Loaded CYOA state plus player actions into activation state, score changes, variable changes, row-button activation, and explicit UI/media effect requests.

**Activation Effects** are explicit descriptions of UI or media work requested by activation, such as text-entry prompts, image-upload prompts, scroll requests, fade transitions, BGM changes, and sound effects. Core Choice Activation should describe these effects; Svelte adapters decide how to perform them.

**Game Mode Effect** is a target-keyed behavioral outcome produced by a Game Mode Interpretation, such as selected, disabled, hidden, score changed, scroll requested, media replaced, or dialog requested. It is the CYOA Target-oriented form of an Activation Effect.

**Rule Module** is future-facing language for declarative gameplay rules. Current Choice Activation work should make Game Mode Interpretation easier to identify without introducing a new rules language yet.

**Viewer Implementation** is a concrete user-facing renderer/player for a Loaded CYOA. Choice Activation should not depend on one Viewer Implementation's DOM or Svelte component shape.

**Source Project Package**, **Project File Decomposition**, and **Source Project Compilation** name source-native authoring/package work. Runtime state and Choice Activation should remain compatible with the current Project File while leaving room for those source-native paths later.

## Architecture Notes

- `ICCPlus/src/lib/runtime/loaded-cyoa-runtime.ts` defines the Loaded CYOA runtime state seam.
- `ICCPlus/src/lib/runtime/svelte-loaded-cyoa-runtime.ts` adapts the current Svelte global maps to that seam.
- `ICCPlus/src/lib/runtime/choice-activation.ts` contains Choice Activation / Game Mode Interpretation helpers that can be tested without Svelte components, DOM APIs, IndexedDB, file dialogs, or media players.
- `ICCPlus/src/lib/runtime/loaded-cyoa-runtime-fixtures.ts` provides pure in-memory test fixtures for runtime and activation behavior.
- A CYOA Outline should provide CYOA Targets for rows, choices, addons, point bars, result rows, and media slots that Viewer behavior may affect.
- A Presentation Style Map should apply concrete styling by CYOA Target instead of attaching styling directly to CYOA Outline nodes.
- A Game Mode Interpretation may keep legacy mutation behind an adapter, but the seam should expose Game Mode Effects keyed by CYOA Target.

The runtime seam should stay narrow. Add lookups or mutations when Choice Activation needs them; do not turn it into a second global store.
