# PCYOA

PCYOA is an editor and viewer for interactive CYOA data.

## Language

**Project File**:
An external JSON or ZIP artifact that can be imported, exported, saved, or loaded.
_Avoid_: Project, save data

**Loaded CYOA**:
A normalized internal CYOA representation that is ready for Creator and Viewer behavior.
_Avoid_: Project, Runtime Project, Hydrated Project, CYOA State

**CYOA Outline**:
A clean, non-interactive page structure derived from a Loaded CYOA that describes sections, items, media, placement, and stable targets for Viewer behavior.
_Avoid_: Raw rows, template fields, layout state, view model

**CYOA Target**:
A stable address inside a CYOA Outline for a meaningful place that Viewer behavior may style, reveal, hide, scroll to, activate, replace, or otherwise affect.
_Avoid_: DOM selector, CSS class, element id, raw object id

**Presentation Style Map**:
A Viewer-owned mapping from CYOA Targets to concrete presentation decisions such as CSS classes, inline style strings, resolved colors, spacing, typography, filters, and media sizing.
_Avoid_: CYOA Outline styling, source styling, Presentation Hint

**Game Mode Effect**:
A target-keyed behavioral outcome produced by a Game Mode Interpretation, such as selected, disabled, hidden, score changed, scroll requested, media replaced, or dialog requested.
_Avoid_: Direct mutation, DOM event, store side effect

**Project File Hydration**:
The transformation from a parsed Project File into a Loaded CYOA.
_Avoid_: Import, load project, initialize app

**Source Project Package**:
A human-editable ZIP artifact that separates CYOA rules, presentation, and lore for IDE-based authoring.
_Avoid_: JSON extract, source format, editable project

**Project File Decomposition**:
The transformation from a Project File into a Source Project Package.
_Avoid_: Extract, convert, split project

**Source Project Compilation**:
The transformation from a Source Project Package into a legacy-compatible Project File.
_Avoid_: Export, build project, creator save

**Viewer Implementation**:
A runtime application that presents a Loaded CYOA according to its own technology stack and presentation philosophy.
_Avoid_: Theme, skin, player settings

**Player Presentation Choice**:
The player's selection of a Viewer Implementation for experiencing the same CYOA content and mechanics.
_Avoid_: Styling editor, design customization

**Presentation Hint**:
An author-provided semantic cue that helps Viewer Implementations present content without prescribing concrete styling.
_Avoid_: Style setting, layout option, theme value

**Lore File**:
A Markdown file in a Source Project Package that describes one meaningful CYOA object for human editing.
_Avoid_: Description file, markdown extract, content blob

**Source ID**:
A human-authored stable slug that identifies a CYOA object inside a Source Project Package.
_Avoid_: Legacy ID, generated id

**Legacy ID Map**:
A separate compiler-owned mapping between Source IDs and legacy Project File IDs.
_Avoid_: Per-file legacy metadata, inline migration metadata

**Rule Module**:
A TypeScript file in a Source Project Package that exports typed declarative rule data.
_Avoid_: Script, DSL, gameplay code

**Infrastructure Rule Module**:
A shared Rule Module for rules-only source objects such as points, variables, groups, or global requirements.
_Avoid_: Lore companion, one-file-per-point

**Game Mode Interpretation**:
A Viewer Implementation's opinionated handling of declarative rules to create a play experience.
_Avoid_: Rule source, source mechanics

**Legacy Compilation Manifest**:
A TypeScript file that guides Source Project Compilation into the legacy Project File shape.
_Avoid_: Source spine, viewer contract, project config

**Source Index**:
A small source-native TypeScript file that defines package metadata, authored order, grouping, and Source Status.
_Avoid_: Legacy manifest, legacy id map, Project File compatibility config

**Source Object Kind**:
An explicit classification in the Source Index that says whether a source object has lore, rules, or both.
_Avoid_: Missing companion file, inferred file pair

**Source Object Type**:
An explicit domain role in the Source Index, such as choice, row, point, variable, group, ending, or world note.
_Avoid_: File kind, storage shape

**Content Media**:
Canonical media that carries CYOA meaning, such as portraits, illustrations, maps, icons, or audio.
_Avoid_: Styling asset, decoration, viewer asset

**Legacy Quarantine**:
A compatibility area inside a Source Project Package for decomposed Project File material that has not been promoted into clean source concepts.
_Avoid_: Source truth, authored content, dumping ground

**Authored Replacement**:
New canonical source content that is drafted to replace material currently preserved in Legacy Quarantine.
_Avoid_: Cleaned legacy content, edited dump

**Source Status**:
An explicit lifecycle marker that controls whether source material is canonical, draft, quarantined, or retired.
_Avoid_: Folder magic, viewer flag, hidden state

## Relationships

- A **Project File** is transformed into an internal normalized runtime model before Creator or Viewer behavior uses it.
- A **Project File** is hydrated into exactly one **Loaded CYOA**.
- **Project File Hydration** transforms one **Project File** into one **Loaded CYOA**.
- A **Loaded CYOA** can provide a **CYOA Outline** so Viewer layout work does not depend directly on legacy row and template fields.
- A **CYOA Outline** contains **CYOA Targets** for rows, choices, addons, point bars, result rows, and media slots that Viewer behavior may affect.
- A **Presentation Style Map** is separate from the **CYOA Outline** and applies concrete styling by **CYOA Target**.
- A **Game Mode Interpretation** expresses behavior as **Game Mode Effects** keyed by **CYOA Target**; legacy mutation may remain behind the first Adapter.
- A **Project File** can be decomposed into one **Source Project Package** for human editing.
- A **Source Project Package** is compiled into a legacy-compatible **Project File** before existing Viewer behavior uses it.
- Multiple **Viewer Implementations** can present the same **Loaded CYOA**.
- A **Player Presentation Choice** selects a **Viewer Implementation**, not arbitrary per-element styling.
- A **Source Project Package** may include **Presentation Hints**, but not concrete styling choices like fonts, colors, margins, or layout measurements.
- A **Lore File** belongs to exactly one meaningful CYOA object such as a row or choice.
- A **Lore File** is identified by a **Source ID**, not by a legacy Project File ID.
- A **Legacy ID Map** preserves compatibility with legacy **Project File** IDs without adding migration metadata to **Lore Files**.
- **Rule Modules** define source mechanics as typed declarative data, not executable gameplay scripts.
- **Infrastructure Rule Modules** may group rules-only source objects when one file per object would add clutter.
- A **Viewer Implementation** may apply its own **Game Mode Interpretation** to the same declarative rules.
- **Rule Modules** and **Lore Files** use mirrored paths and matching **Source IDs** when they describe the same CYOA object.
- A **Source Index** defines the future-facing structure of a **Source Project Package**.
- A **Legacy Compilation Manifest** exists only for compatibility with the legacy **Project File** shape.
- **Content Media** lives in an `assets/` tree and is referenced semantically from **Lore Files** or the **Source Index**.
- **Legacy Quarantine** may preserve legacy styling, styling images, or low-value decomposed lore without making them canonical source.
- **Legacy Quarantine** material may remain visible in legacy-compatible Viewer output while being excluded from authoring-agent context.
- An **Authored Replacement** can replace quarantined material without requiring the old material to be deleted immediately.
- **Source Status** controls authoring-agent visibility and legacy compiler inclusion policy for **Source Project Package** material.
- **Source Status** is declared in the **Source Index**, not inside **Lore Files** or **Rule Modules**.
- **Source Object Kind** is declared in the **Source Index** so lore-only and rules-only objects are intentional.
- **Source Object Type** describes domain role, while **Source Object Kind** describes expected source files.
- The **Source Index** references global mechanics by Source ID; **Infrastructure Rule Modules** define those mechanics.

## Example dialogue

> **Dev:** "Can the Creator use a **Project File** directly after parsing?"
> **Domain expert:** "No — it first has to be normalized into the internal runtime model."

> **Dev:** "Should activation rules read from the **Project File**?"
> **Domain expert:** "No — activation rules run against the **Loaded CYOA**."

> **Dev:** "Does **Project File Hydration** start autosave and load audio?"
> **Domain expert:** "No — it only produces the **Loaded CYOA**; runtime setup happens after hydration."

> **Dev:** "Should a layout-focused Viewer module read raw row templates from the **Loaded CYOA**?"
> **Domain expert:** "No — it should receive a **CYOA Outline** with clean sections, items, media, placement, and stable targets."

> **Dev:** "Should the **Game Mode Interpretation** point directly at DOM elements?"
> **Domain expert:** "No — it should point at **CYOA Targets** in the **CYOA Outline**."

> **Dev:** "Should concrete styling live directly on **CYOA Outline** nodes?"
> **Domain expert:** "No — the **Presentation Style Map** applies styling by **CYOA Target** so structure and presentation can change independently."

> **Dev:** "Does the first **Game Mode Interpretation** have to stop mutating legacy state internally?"
> **Domain expert:** "No — it should expose **Game Mode Effects** at the seam, while the first Adapter may still delegate to legacy mutation inside."

> **Dev:** "Are we replacing **Project Files** with the new editable ZIP?"
> **Domain expert:** "No — the editable ZIP is a **Source Project Package** that can be created from a **Project File** and then worked on outside the Creator."

> **Dev:** "Should the Viewer read a **Source Project Package** directly?"
> **Domain expert:** "Not yet — first use **Source Project Compilation** to produce a legacy-compatible **Project File** so the Viewer can stay stable while the source schema evolves."

> **Dev:** "Does moving styling to the player mean building a full styling editor in the Viewer?"
> **Domain expert:** "No — it means the player can choose between **Viewer Implementations** with different presentation philosophies."

> **Dev:** "Can an author say an image is primary art?"
> **Domain expert:** "Yes — that is a **Presentation Hint**. The author should not prescribe the exact image width, border radius, or placement."

> **Dev:** "Should all choice descriptions live in one big Markdown document?"
> **Domain expert:** "No — each meaningful CYOA object gets its own **Lore File** so IDs, diffs, and agent edits stay targeted."

> **Dev:** "Where do old PCYOA IDs go after **Project File Decomposition**?"
> **Domain expert:** "In a separate **Legacy ID Map**. **Lore Files** should stay focused on human-authored content."

> **Dev:** "Are rules arbitrary TypeScript or Lua scripts?"
> **Domain expert:** "No — **Rule Modules** are TypeScript files that export typed declarative data. Different **Viewer Implementations** can interpret that data differently."

> **Dev:** "Does every point type need its own rule file?"
> **Domain expert:** "No — points, variables, groups, and global requirements can live in **Infrastructure Rule Modules**."

> **Dev:** "Should point definitions live in the **Source Index**?"
> **Domain expert:** "No — the **Source Index** can reference and order them, but **Infrastructure Rule Modules** define them."

> **Dev:** "Should lore and rules live in the same file?"
> **Domain expert:** "No — keep them separate but mirrored, such as `lore/choices/vampire-prince.md` and `rules/choices/vampire-prince.ts`."

> **Dev:** "Do new Viewer Implementations depend on the manifest?"
> **Domain expert:** "No — the **Legacy Compilation Manifest** only exists to compile source material into the legacy **Project File** shape."

> **Dev:** "Where does source-native order live?"
> **Domain expert:** "In the **Source Index**, which contains no legacy IDs or Project File compatibility details."

> **Dev:** "Is a choice portrait a Viewer styling concern?"
> **Domain expert:** "No — if the image carries CYOA meaning, it is **Content Media** and belongs in `assets/`."

> **Dev:** "What happens to legacy styling and low-value text during **Project File Decomposition**?"
> **Domain expert:** "Put it in **Legacy Quarantine** unless it is intentionally promoted into **Lore Files**, **Content Media**, **Rule Modules**, or the **Package Manifest**."

> **Dev:** "Can undesirable legacy card text stay playable while agents ignore it?"
> **Domain expert:** "Yes — keep it in **Legacy Quarantine** for legacy-compatible Viewer output, then draft an **Authored Replacement** in canonical source when ready."

> **Dev:** "How do agents know whether to read a decomposed choice?"
> **Domain expert:** "They follow **Source Status**, defaulting to canonical and draft material unless a task explicitly asks for quarantined legacy material."

> **Dev:** "Should each **Lore File** declare whether it is canonical or quarantined?"
> **Domain expert:** "No — **Source Status** lives in the **Source Index** so agents can filter context before opening authoring files."

> **Dev:** "If a choice has lore but no rules, is the rules file missing?"
> **Domain expert:** "Not if its **Source Object Kind** says it is lore-only."

> **Dev:** "Is `choice` the same thing as `lore-and-rules`?"
> **Domain expert:** "No — `choice` is a **Source Object Type**; `lore-and-rules` is a **Source Object Kind**."

## Flagged ambiguities

- "project" is too broad: it has been used for both the external **Project File** and the internal normalized runtime model.
- "project" used for the internal normalized runtime model is resolved as **Loaded CYOA**.
- "import", "load project", and "initialize app" are too broad for the pure transformation step; use **Project File Hydration** for that step.
- "layout" is too broad when discussing Viewer structure; use **CYOA Outline** for the non-interactive page structure derived from a **Loaded CYOA**.
- "target" is too broad when discussing Viewer behavior; use **CYOA Target** for stable addresses inside a **CYOA Outline**.
- "JSON extract" is resolved as **Project File** when discussing the current `.json` or `project.json` export, and **Source Project Package** when discussing the proposed human-editable ZIP.
- "export" is too broad for generating runtime-compatible data from the editable ZIP; use **Source Project Compilation** for that step.
- "player-controlled styling" does not mean arbitrary styling controls; it is resolved as **Player Presentation Choice** between **Viewer Implementations**.
- "styling" in the **Source Project Package** is resolved as semantic **Presentation Hints**, not concrete visual styling.
- "authorialship" is resolved as human authoring of **Lore Files** and source mechanics; legacy compatibility belongs to **Source Project Compilation**.
- "TypeScript rules" means typed declarative **Rule Modules**, not arbitrary executable scripts or a custom DSL.
