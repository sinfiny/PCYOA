# PRD: Source Project Package for IDE-authored CYOAs

_Triage label intended: `needs-triage`_

## Problem Statement

PCYOA creators who already have many CYOAs exported from the current application can only maintain them comfortably inside the Creator UI. The current **Project File** format mixes rules, requirements, presentation, images, game lore, descriptions, and legacy viewer compatibility into one JSON-oriented artifact. That makes the data unfriendly to humans, hard to edit in an IDE, hard for coding agents to reason about safely, and difficult to evolve toward new **Viewer Implementations** with different presentation philosophies.

The user wants a human-editable **Source Project Package** that can be created from existing **Project Files**, edited programmatically or manually outside the Creator, and compiled back into a legacy-compatible **Project File** so the existing Viewer behavior remains usable while the new source schema evolves.

## Solution

Introduce a **Source Project Package** as a future-facing, human-editable ZIP/source structure for CYOA authoring. The package separates lore, declarative mechanics, content media, source-native structure, and legacy compatibility concerns.

A **Project File** can be decomposed into a **Source Project Package**. The package can then be edited in an IDE by humans or coding agents. **Source Project Compilation** turns the package back into a legacy-compatible **Project File** for the existing Viewer. New **Viewer Implementations** should be free to read the source-native material directly and apply their own **Game Mode Interpretation**, without depending on legacy compatibility files.

The source model uses human-authored **Source IDs** as canonical identifiers. Legacy **Project File** IDs are preserved separately in a **Legacy ID Map**. **Source Status** and **Source Object Kind** live in the **Source Index** so agents can decide what to load before reading lore or rule files. **Legacy Quarantine** preserves old **Project File** material that should remain playable in legacy output but should not influence authoring agents unless explicitly requested.

## User Stories

1. As a CYOA author, I want to decompose an existing **Project File** into a **Source Project Package**, so that I can start editing old CYOAs outside the Creator.
2. As a CYOA author, I want the **Source Project Package** to use human-readable **Source IDs**, so that future work is not trapped inside legacy naming.
3. As a CYOA author, I want old PCYOA IDs preserved separately, so that legacy compatibility does not clutter lore files.
4. As a CYOA author, I want one **Lore File** per meaningful CYOA object, so that prose edits are targeted and easy to review.
5. As a CYOA author, I want **Lore Files** to be Markdown, so that descriptions and lore are comfortable to edit in normal writing tools.
6. As a CYOA author, I want **Rule Modules** to be TypeScript files exporting typed declarative data, so that mechanics can be edited with IDE support without becoming arbitrary scripts.
7. As a CYOA author, I want source mechanics to stay declarative, so that different **Viewer Implementations** can interpret the same rules in different game modes.
8. As a CYOA author, I want lore and rules separated, so that lore-focused agents do not need to load mechanics and mechanics-focused agents do not need to load prose.
9. As a CYOA author, I want lore and rules to use mirrored **Source IDs** when both exist, so that humans and agents can connect them without guessing.
10. As a CYOA author, I want lore-only objects to be explicit, so that agents do not assume a missing **Rule Module** is a bug.
11. As a CYOA author, I want rules-only objects to be explicit, so that agents do not assume a missing **Lore File** is a bug.
12. As a CYOA author, I want the **Source Index** to declare **Source Object Type**, so that objects have clear domain roles such as choice, row, point, variable, group, ending, or world note.
13. As a CYOA author, I want the **Source Index** to declare **Source Object Kind**, so that file expectations are explicit.
14. As a CYOA author, I want the **Source Index** to declare **Source Status**, so that canonical, draft, quarantined, and retired material can be handled consistently.
15. As a CYOA author, I want **Source Status** outside **Lore Files**, so that agents can filter context before opening prose.
16. As a CYOA author, I want undesirable legacy lore to remain playable while excluded from authoring context, so that I can replace it gradually.
17. As a CYOA author, I want to draft **Authored Replacements** for quarantined material, so that old cards can remain in the legacy Viewer until the replacement is ready.
18. As a CYOA author, I want legacy styling and low-value decomposed text quarantined, so that source truth stays clean.
19. As a CYOA author, I want **Content Media** to live separately from styling, so that meaningful images, maps, portraits, icons, or audio remain part of the CYOA.
20. As a CYOA author, I want concrete styling excluded from source truth, so that future **Viewer Implementations** can choose their own presentation philosophy.
21. As a CYOA author, I want semantic **Presentation Hints** to be allowed, so that Viewers can make better choices without inheriting old styling debt.
22. As a player, I want to choose between different **Viewer Implementations**, so that the same CYOA can be experienced through different presentation philosophies.
23. As a player, I want **Viewer Implementations** to preserve CYOA meaning and mechanics, so that presentation choice does not change legality or authored intent.
24. As a future Viewer developer, I want to read source-native structure without legacy compatibility details, so that new Viewers are not coupled to the old **Project File** shape.
25. As a future Viewer developer, I want declarative rule data, so that I can build an opinionated **Game Mode Interpretation** without reverse-engineering legacy JSON.
26. As a compiler implementer, I want **Source Project Compilation** to emit a legacy-compatible **Project File**, so that the existing Viewer remains usable while the source schema evolves.
27. As a compiler implementer, I want a **Legacy Compilation Manifest**, so that legacy ordering, placement, and compatibility policy are isolated from source-native concerns.
28. As a compiler implementer, I want a **Legacy ID Map**, so that **Source IDs** can compile to the legacy IDs expected by existing **Project Files**.
29. As a compiler implementer, I want **Legacy Quarantine** to be included or excluded by policy, so that different compilation targets can preserve or omit old material.
30. As a compiler implementer, I want grouped **Infrastructure Rule Modules** for points, variables, groups, and global requirements, so that rules-only infrastructure does not produce excessive tiny files.
31. As a compiler implementer, I want global mechanics defined outside the **Source Index**, so that the **Source Index** stays structural.
32. As a compiler implementer, I want source health diagnostics, so that decomposition and compilation can report quarantined material, unresolved IDs, and lossy conversions.
33. As an agent authoring lore, I want default context to exclude **Legacy Quarantine**, so that bad or unwanted legacy descriptions do not influence new writing.
34. As an agent authoring mechanics, I want typed declarative rule data, so that I can make safe changes without executing arbitrary gameplay scripts.
35. As an agent reviewing a package, I want object status, type, and kind in the **Source Index**, so that I can identify intended structure before reading content files.
36. As a maintainer, I want **Project File Decomposition** to preserve enough compatibility data, so that old CYOAs can round-trip into the legacy Viewer.
37. As a maintainer, I want source-native concepts documented in the domain glossary, so that future work does not reuse overloaded terms like project, import, export, styling, or manifest ambiguously.
38. As a maintainer, I want the Creator UI to become less central over time, so that CYOA creation can move toward skills, coding harnesses, and source-package workflows.
39. As a maintainer, I want the initial implementation to avoid a full styling editor, so that scope stays focused on source decomposition and compilation.
40. As a maintainer, I want the existing **Project File** import/export behavior to remain stable initially, so that source package work does not disrupt current users.

## Implementation Decisions

- Build the **Source Project Package** as a separate human-editable source format, not a direct replacement for the current **Project File**.
- Keep the existing Viewer behavior as the first runtime target by compiling **Source Project Packages** into legacy-compatible **Project Files**.
- Use **Project File Decomposition** for **Project File** to **Source Project Package** conversion.
- Use **Source Project Compilation** for **Source Project Package** to **Project File** conversion.
- Use **Source IDs** as canonical future-facing identifiers.
- Preserve legacy **Project File** IDs in a **Legacy ID Map**, not in **Lore File** metadata.
- Use a **Source Index** for source-native package metadata, authored order, grouping, **Source Status**, **Source Object Type**, and **Source Object Kind**.
- Keep legacy compatibility details out of the **Source Index**.
- Use a **Legacy Compilation Manifest** only for compiling into the legacy **Project File** shape.
- Keep new **Viewer Implementations** independent from the **Legacy Compilation Manifest**.
- Store **Lore Files** as Markdown, one file per meaningful CYOA object when prose exists.
- Store **Rule Modules** as TypeScript files that export typed declarative data, not arbitrary executable gameplay scripts and not a custom world DSL.
- Allow **Infrastructure Rule Modules** to group rules-only source objects such as points, variables, groups, and global requirements.
- Keep global mechanic definitions in **Infrastructure Rule Modules**; the **Source Index** may reference or order them but should not define them.
- Allow lore-only, rules-only, and lore-and-rules objects, with intent declared through **Source Object Kind**.
- Use **Source Object Type** for domain role and **Source Object Kind** for expected source files.
- Store **Content Media** separately from lore and rules, referenced semantically from **Lore Files** or the **Source Index**.
- Permit semantic **Presentation Hints** but exclude concrete styling choices such as fonts, colors, margins, and layout measurements from source truth.
- Preserve legacy styling, styling images, low-value lore, and unwanted decomposed material in **Legacy Quarantine**.
- Allow **Legacy Quarantine** to remain playable in legacy-compatible output while excluded from authoring-agent context by default.
- Support **Authored Replacements** for quarantined material without forcing immediate deletion of legacy material.
- Provide source health diagnostics after decomposition and compilation, including quarantined material, unresolved IDs, and lossy conversions.
- Major implementation modules expected: source package schema and validation, source index loader, lore loader, rule module loader, legacy ID mapping, **Project File Decomposition**, **Source Project Compilation**, legacy quarantine policy, content media handling, and source health reporting.
- Prefer deep modules with simple interfaces for decomposition, compilation, and validation so they can be tested without Svelte UI involvement.
- UI integration should come after core package modules are stable.

## Testing Decisions

- Tests should cover externally visible behavior: accepted source shapes, emitted package artifacts, emitted **Project Files**, diagnostics, and filtering decisions. They should not lock onto internal helper names or implementation order.
- Source package schema tests should verify valid **Source Index** entries, **Source Status**, **Source Object Type**, **Source Object Kind**, **Source IDs**, and invalid ambiguity cases.
- **Legacy ID Map** tests should verify that legacy IDs are preserved separately and applied during **Source Project Compilation**.
- **Project File Decomposition** tests should use representative **Project File** fixtures and assert that lore, rules, content media, legacy quarantine, source status, and ID maps are produced correctly.
- **Source Project Compilation** tests should assert that a **Source Project Package** compiles into a **Project File** accepted by the existing app schema.
- **Legacy Quarantine** tests should verify that quarantined material can be included in legacy-compatible output while excluded from authoring context by default.
- **Rule Module** tests should verify that modules export typed declarative data and that unsupported arbitrary runtime-script patterns are rejected or ignored according to policy.
- **Infrastructure Rule Module** tests should verify grouped points, variables, groups, and global requirements compile correctly.
- **Content Media** tests should verify that meaningful media is copied and referenced semantically, while legacy styling media remains quarantined unless promoted.
- Source health tests should verify diagnostics for unresolved IDs, missing expected files, intentionally lore-only or rules-only objects, quarantined counts, and lossy conversions.
- Current repo prior art appears to center on TypeScript, Zod schema validation, and Svelte type checking rather than an established test suite. The first implementation should add focused tests around pure TypeScript modules before UI integration.

## Out of Scope

- Replacing the current **Project File** format as the only supported import/export format.
- Making the existing Viewer read **Source Project Packages** directly in the first iteration.
- Building new **Viewer Implementations**.
- Building a full styling editor or player-controlled per-element styling controls.
- Preserving concrete legacy styling as future-facing source truth.
- Turning **Rule Modules** into arbitrary executable gameplay scripts.
- Introducing Lua or a custom world DSL for the initial rules format.
- Removing the Creator UI immediately.
- Automatically rewriting all legacy lore into canonical replacements.
- Designing every future **Game Mode Interpretation**.

## Further Notes

The domain glossary now distinguishes **Project File**, **Loaded CYOA**, **Source Project Package**, **Project File Decomposition**, **Source Project Compilation**, **Source Index**, **Legacy ID Map**, **Legacy Compilation Manifest**, **Legacy Quarantine**, **Source Status**, **Source Object Type**, **Source Object Kind**, **Lore File**, **Rule Module**, **Infrastructure Rule Module**, **Content Media**, **Presentation Hint**, **Viewer Implementation**, **Player Presentation Choice**, **Game Mode Interpretation**, and **Authored Replacement**.

This PRD intentionally treats legacy compatibility as a fenced concern. The **Source Project Package** should become the authoring surface for humans, IDEs, coding agents, and future **Viewer Implementations**, while the legacy compiler preserves the ability to play existing CYOAs through the current Viewer.
