# Semantic Translation Layer

This document exists because the formal architecture vocabulary can create unnecessary cognitive load.

The user is fluent in several rich domains: creative literature, systems design, philosophical math, algorithmic thinking, UX design, microbiology, music theory, human behavior sciences, AI and ML engineering, game design, game development, plot narrative, science, magic systems, world building, and soft RPGs.

Future explanations should use those domains as the first layer of meaning. The formal architecture term can come after the intuitive meaning.

The goal is semantic density with instinctive simplicity.

## How To Explain Things

Use this pattern:

```text
Intuitive concept first. Formal project term second.
```

Example:

```text
This is the rulebook the game can perform from. In the code, that is the Loaded CYOA.
```

Avoid starting with a stack of formal names:

```text
The Loaded CYOA Module normalizes Source Project Package input into runtime interfaces.
```

That sentence may be technically accurate, but it asks the listener to hold too many unfamiliar labels at once.

## Preferred Metaphor Families

These domains are especially useful for this project.

### Creative Literature And World Building

Use this domain when explaining authoring, lore, endings, presentation hints, and source material.

- Source Project Package: the world bible plus manuscript folder.
- Lore File: one page of authored canon.
- Rule Module: the hidden rule attached to that canon.
- Source Index: the table of contents and continuity map.
- Presentation Hint: a stage direction, not the costume itself.
- Legacy Quarantine: old draft material kept in the archive until it is rewritten or retired.

Useful phrasing:

```text
The Source Project Package is the world bible. It keeps lore, rules, media, and old archived material in separate shelves.
```

### Soft RPGs And Game Design

Use this domain when explaining play, legality, choice selection, and game modes.

- Loaded CYOA: the playable rulebook.
- Play State: the character sheet plus campaign log.
- Player Action: a declared move.
- Availability State Machine: the table referee that checks whether the move is legal.
- Play Snapshot: the current board state after the rules are checked.
- Choice Availability: whether a move is open, already taken, or blocked.
- Requirement Explanation: the reason the move is blocked.
- Game Mode Interpretation: the campaign style.
- Balancing Algorithm: the balancing logic behind the campaign style.
- Weighted Matrix: the pressure system that notices what kind of path the player is drifting toward.

Useful phrasing:

```text
The player declares a move. The referee checks the rulebook and the character sheet. The result is a new board state.
```

### Music Theory

Use this domain when explaining derived state, weighting, pressure, and interpretation.

- Loaded CYOA: the score.
- Play State: the notes already played.
- Play Snapshot: the current harmony.
- Game Mode Interpretation: an interpretation of the score.
- Weighted Matrix: harmonic gravity toward possible resolutions.
- Result Pressure: tonal pull toward an ending.
- Choice Bias: how much one available note strengthens a resolution.

Useful phrasing:

```text
The weighted matrix is not the melody itself. It is harmonic analysis. It hears the notes the player has chosen and says which resolution they are leaning toward.
```

### Philosophical Math And Algorithmic Thinking

Use this domain when explaining purity, derivation, interfaces, and invariants.

- Loaded CYOA: the fixed structure.
- Play State: the variable assignment.
- Player Action: the next transformation request.
- Availability Transition: the result of applying the transition function.
- Play Snapshot: derived values.
- Requirement: a predicate.
- Point total: a derived value, not stored truth.
- Interface: a typed handoff between conceptual spaces.

Useful phrasing:

```text
The point total is a theorem of the current selections, not a mutable note scribbled into the rulebook.
```

### Human Behavior Sciences

Use this domain when explaining choice patterns, recommendations, pressure, and game modes.

- Play State: behavior history.
- Game Mode Interpretation: behavioral reading frame.
- Weighted Matrix: pattern inference.
- Result Pressure: the model's estimate of where behavior is trending.
- Choice Bias: the likely behavioral effect of a currently available choice.

Useful phrasing:

```text
The game mode reads patterns. It should not rewrite the player's history or the source rules.
```

### AI And ML Engineering

Use this domain when explaining matrix scoring, adapters, and interpretation.

- Source Project Package: raw structured dataset.
- Loaded CYOA: cleaned feature table plus rule graph.
- Play State: observed session state.
- Play Snapshot: derived features.
- Weighted Matrix: simple interpretable model.
- Balancing Algorithm: model behind the interpretation layer.
- Adapter: feature transformation from one representation to another.

Useful phrasing:

```text
The weighted matrix is the first simple model. It takes selected-choice signals and produces interpretable pressure toward possible results.
```

### Microbiology And Science

Use this domain carefully. It is useful for separation, quarantine, expression, and observable state.

- Source rules: genotype-like instructions.
- Play Snapshot: phenotype-like observable state.
- Legacy Quarantine: material preserved without letting it contaminate canonical source.
- Requirement: condition for expression.
- Point effects: expression products derived from selected conditions.

Useful phrasing:

```text
Legacy material can stay preserved in quarantine, but it should not become canonical source until intentionally promoted.
```

### Magic Systems

Use this domain when explaining rule consistency and authored mechanics.

- Rule Module: spell law.
- Requirement: casting condition.
- Point effect: magical consequence.
- Availability State Machine: the laws of magic checking whether a spell can fire.
- Game Mode Interpretation: a school or tradition interpreting the same laws differently.

Useful phrasing:

```text
The rule can be mystical in fiction, but the engine needs the casting condition and consequence to be explicit.
```

## Translation Table

| Formal term | Intuitive first explanation |
| --- | --- |
| Source Project Package | The world bible and manuscript bundle. |
| Source Index | The table of contents and continuity map. |
| Lore File | A page of canon. |
| Rule Module | The hidden rules attached to a piece of canon. |
| Infrastructure Rule Module | Shared laws, currencies, variables, and groups. |
| Content Media | Meaning-bearing art, audio, maps, icons, or portraits. |
| Presentation Hint | A stage direction, not styling. |
| Legacy Quarantine | The archive for old material that should not define the new system. |
| Loaded CYOA | The playable rulebook. |
| Play State | The character sheet plus campaign log. |
| Player Action | A declared move. |
| Availability State Machine | The referee and physics engine for legal moves. |
| Availability Transition | The ruling after a declared move. |
| Play Snapshot | The current board state, harmony, or observable phenotype. |
| Choice Availability | Whether a move is open, taken, or blocked. |
| Requirement Explanation | Why a move is blocked. |
| Point Totals | Derived consequences of selected choices. |
| Game Mode Interpretation | The campaign style or interpretive lens. |
| Balancing Algorithm | The deeper scoring or tuning logic behind the lens. |
| Weighted Matrix | A pressure system that tracks the path the player is drifting toward. |
| Presentation Template | Stage blocking for semantic shapes. |
| Viewer Implementation | The actual stage, instrument, or screen. |
| Legacy Compatibility | Translation to and from the old archive format. |

## A Lower-Cognitive-Load Version Of The Whole Architecture

The author writes a world bible.

The system translates that world bible into a playable rulebook.

The player has a character sheet and declares a move.

The referee checks the move against the rulebook.

The result is a new board state.

An interpretation layer can read the board state and say what kind of story, ending, pressure, or balance pattern is emerging.

A presentation layer can show that board state through templates.

The old project format stays in the archive as something we can translate to and from, not as the center of the new design.

## Agent Communication Rule

When explaining this project to the user, do not begin with dense architecture labels.

Begin with one intuitive domain. Then add the formal term in parentheses.

Good:

```text
This is the referee checking a declared move. In code, that is `advanceAvailability`.
```

Good:

```text
This is the current harmony after the player has chosen some notes. In code, that is the Play Snapshot.
```

Avoid:

```text
The Availability State Machine consumes Loaded CYOA and Play State and returns an Availability Transition.
```

That sentence is allowed in reference docs, but it should not be the first explanation.
