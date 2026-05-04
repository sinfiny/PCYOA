# Original Project References

This package was extracted from architecture work inside the larger PCYOA repository.

Use these references when you need to understand why a concept exists. Do not treat old files as implementation instructions to copy directly.

## Domain Language

Original glossary:

- `../CONTEXT.md`

Important terms introduced during this extraction:

- Availability State Machine
- Player Action
- Play State
- Play Snapshot
- Choice Availability
- Balancing Algorithm
- Weighted Matrix

## Original Runtime And Friction

The old runtime state and much of the game behavior live here:

- `../ICCPlus/src/lib/store/store.svelte.ts`

The old app-wide types live here:

- `../ICCPlus/src/lib/store/types.ts`

These files show why the extraction exists. They mix many concerns: Svelte reactivity, selected choices, point mutation, requirements, styling, save/load behavior, and viewer side effects.

## Original Viewer Coupling

The old viewer choice rendering lives here:

- `../ICCPlus/src/lib/viewer/AppObject.svelte`
- `../ICCPlus/src/lib/viewer/Object/ObjectScore.svelte`
- `../ICCPlus/src/lib/viewer/Object/ObjectRequired.svelte`
- `../ICCPlus/src/lib/viewer/AppPointBar.svelte`

These files mix layout, availability, score display, requirement display, inline styles, and Svelte behavior. The new core should not reproduce that shape.

## First In-Repo Prototype

Before this folder existed, the first pure-core seed was placed in:

- `../ICCPlus/src/lib/core/`

The first adapter seed was placed in:

- `../ICCPlus/tools/core/source-package-adapter.ts`

Those files were useful stepping stones. This `pcyoa-core` directory is the cleaner extraction target because it no longer imports the legacy Svelte app's store types.

## Source Package Prior Art

The larger repo already has Source Project Package work here:

- `../ICCPlus/tools/source-package/schema.ts`
- `../ICCPlus/tools/source-package/loader.ts`
- `../ICCPlus/tools/source-package/decompose.ts`
- `../ICCPlus/tools/source-package/compiler.ts`

That work is still valuable. The caution is that its schema currently imports legacy app types. The standalone core therefore defines its own source package types in:

- `src/source-package/types.ts`

Future work can reconnect the two worlds through explicit adapters instead of shared legacy types.

## Project File Compatibility

Legacy Project File compatibility remains outside this package.

This package should not compile to or from the legacy Project File directly until a clean source-native interface is designed. Compatibility should remain an adapter concern, not part of the core rules.

