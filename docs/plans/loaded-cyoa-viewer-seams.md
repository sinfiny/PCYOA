# Loaded CYOA Viewer Seams Plan

## Goal

Reduce Viewer cognitive load by introducing the first deep Modules around a Loaded CYOA:

- Project File Hydration hands off a Loaded CYOA.
- A CYOA Outline Module produces clean, non-interactive structure.
- A Presentation Style Module produces a Presentation Style Map keyed by CYOA Target.
- A Game Mode Interpretation Module produces Game Mode Effects keyed by CYOA Target.

The first implementation may delegate to legacy store behavior internally. The important outcome is that future layout, taste, and game-mode work can happen through small seams instead of editing legacy Viewer files in place.

## Non-Goals

- Do not replace the legacy Project File shape.
- Do not rewrite selection, score, randomization, or requirement logic in the first slice.
- Do not move music, autosave, dialogs, image export, or custom CSS into the core architecture.
- Do not make Creator and Viewer separation a major concern for this slice.
- Do not attach concrete styling directly to CYOA Outline nodes.

## Proposed Module Layout

Create the new Modules under `ICCPlus/src/lib/loaded-cyoa/` first:

- `types.ts`
  - Defines `LoadedCyoa`, `CyoaOutline`, `CyoaTarget`, `CyoaOutlineNode`, `PresentationStyleMap`, and `GameModeEffect`.
- `project-file-hydration.ts`
  - Owns the Project File Hydration seam.
  - Initially delegates to existing parsing, validation, legacy migration, and store initialization behavior.
- `cyoa-outline.ts`
  - Builds a CYOA Outline from a Loaded CYOA.
  - Hides legacy row/template fields from layout callers.
- `presentation-style-map.ts`
  - Resolves concrete Viewer styling by CYOA Target.
  - Initially delegates to `getStyling`, `hexToRgba`, and existing CSS-string logic where needed.
- `game-mode-interpretation.ts`
  - Exposes target-keyed Game Mode Effects.
  - Initially delegates selection and mutation to legacy functions such as `selectObject`, `deselectObject`, `selectedOneMore`, `selectedOneLess`, and row-button behavior.
- `legacy-loaded-cyoa-adapter.ts`
  - The first Adapter over existing `app`, `rowMap`, `choiceMap`, `pointTypeMap`, `groupMap`, and related stores.

The names can move if implementation reveals a better local fit, but the seams should remain.

## First Interfaces

Keep the first external interfaces deliberately small.

Project File Hydration:

- Input: a parsed Project File.
- Output: a Loaded CYOA handle.
- Responsibility: normalize enough state for Viewer behavior and expose adapters for outline, style, and game mode work.

CYOA Outline:

- Input: Loaded CYOA.
- Output: ordered CYOA Outline nodes.
- Responsibility: expose sections, items, media slots, point bars, result rows, and stable CYOA Targets without leaking raw legacy template fields to layout callers.

Presentation Style Map:

- Input: Loaded CYOA and CYOA Outline.
- Output: target-keyed concrete style data.
- Responsibility: resolve current Viewer styling choices separately from structure.

Game Mode Interpretation:

- Input: player action plus CYOA Target.
- Output: Game Mode Effects.
- Responsibility: describe behavioral outcomes by target while legacy mutation remains behind the first Adapter.

## Implementation Phases

### Phase 1: Type Surface Only

Add `types.ts` and model the minimal target vocabulary:

- `cyoa`
- `row`
- `choice`
- `addon`
- `point-bar`
- `result-row`
- `media-slot`

Acceptance criteria:

- TypeScript compiles.
- No Viewer behavior changes.
- The target shape can represent every place currently reached through row IDs, choice IDs, addon IDs, point bars, result rows, and images.

### Phase 2: Legacy Loaded CYOA Adapter

Add `legacy-loaded-cyoa-adapter.ts`.

The Adapter should wrap the existing global store and expose:

- access to rows, choices, addons, points, groups, requirements, and active selections;
- lookup by CYOA Target;
- a narrow way to call legacy mutation where the first Game Mode Interpretation needs it.

Acceptance criteria:

- Existing `initializeApp` can remain in place.
- The Adapter can be instantiated after current Project File Hydration.
- Unit tests can build a small fake Loaded CYOA without rendering Svelte.

### Phase 3: CYOA Outline Builder

Add `cyoa-outline.ts`.

The first builder should translate legacy rows and choices into clean outline nodes:

- rows become section nodes;
- choices and selectable addons become item nodes;
- images become media-slot nodes;
- result rows and group rows become explicit outline sections;
- every meaningful node gets a CYOA Target.

Acceptance criteria:

- Layout callers no longer need to know whether a node came from `row.template`, `row.isResultRow`, `row.isGroupRow`, or raw `choice.objectWidth`.
- A test can assert outline order, target stability, result-row contents, group-row contents, and media-slot presence.

### Phase 4: Presentation Style Map Adapter

Add `presentation-style-map.ts`.

Start by moving style resolution out of the Viewer in thin vertical slices:

- global Viewer background and point-bar style;
- row container, row title, row text, row image;
- choice container, choice title, choice text, choice image;
- addon container, addon title, addon text, addon image.

Acceptance criteria:

- The CYOA Outline remains style-free.
- Style lookup is by CYOA Target.
- Existing style precedence stays unchanged.
- Tests cover private styling, design group styling, requirement-gated styling, and fallback styling.

### Phase 5: Game Mode Effects Adapter

Add `game-mode-interpretation.ts`.

Start with a small action vocabulary:

- `select`
- `deselect`
- `increment`
- `decrement`
- `activate-row-button`
- `clear-selection`
- `scroll-to-target`

The first Adapter may call legacy mutation internally, then report effects such as:

- `selected`
- `deselected`
- `disabled`
- `hidden`
- `score-changed`
- `scroll-requested`
- `dialog-requested`
- `media-replaced`

Acceptance criteria:

- Viewer event handlers can call the Game Mode Interpretation through CYOA Targets.
- Legacy selection behavior remains unchanged.
- Tests assert effects for simple select/deselect, multi-select, requirement failure, random row-button behavior, and scroll requests.

### Phase 6: Viewer Vertical Slice

Refactor one narrow Viewer path before touching all markup:

1. Build the CYOA Outline in `ViewerMain.svelte`.
2. Use CYOA Targets for row and choice rendering in one path.
3. Resolve style through the Presentation Style Map for that same path.
4. Route one player action through Game Mode Interpretation.

Recommended first path:

- a normal row with normal choices;
- no addons;
- no result row;
- no group row;
- no music or image export.

Acceptance criteria:

- Existing Viewer behavior stays visually equivalent for the chosen path.
- The chosen path has no direct calls to `getStyling`, `checkRequirements`, `selectObject`, or `deselectObject` from markup-level code.
- The legacy path remains available for features not yet migrated.

## Testing Plan

Add focused TypeScript tests before broad Svelte refactors:

- CYOA Target stability tests.
- CYOA Outline shape tests.
- Presentation Style Map precedence tests.
- Game Mode Effect tests using a tiny fake Loaded CYOA.
- One integration test for Project File Hydration to Loaded CYOA to CYOA Outline.

Use the interface as the test surface. Avoid tests that assert internal helper ordering inside the legacy Adapter.

## Migration Order

Migrate the Viewer in this order:

1. Normal row and normal choice rendering.
2. Choice images and media slots.
3. Addons.
4. Result rows and group rows.
5. Point bar.
6. Row buttons and random activation.
7. Search, backpack, build form, and dialogs.
8. Optional runtime effects such as music and image export.

Stop after each step when the seam is deeper and the legacy code behind it is still callable.

## Risks

- The legacy store mutates many objects directly, so the first Adapter must avoid pretending the implementation is pure.
- Style behavior is broad and easy to regress; migrate in visible vertical slices.
- Result rows and group rows are projections, not ordinary source rows, so they need explicit CYOA Targets.
- If the CYOA Outline grows to include every styling and behavior detail, it becomes shallow. Keep structure, style, and behavior separate.

## Done Definition

The first architecture slice is done when:

- Project File Hydration returns or installs a Loaded CYOA through a named seam.
- Viewer layout can consume a CYOA Outline without reading raw legacy template fields.
- Concrete styling is available through a Presentation Style Map keyed by CYOA Target.
- Player actions can be routed through a Game Mode Interpretation that reports Game Mode Effects keyed by CYOA Target.
- Legacy implementation remains behind Adapters instead of being spread through new Viewer code.
