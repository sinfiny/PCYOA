import {
    createRequirementContext,
    evaluateRequirements,
    getChoiceSelectionCount,
    getRowSelectionCount,
    indexLoadedCyoa
} from './requirements';
import type {
    AvailabilityOptions,
    AvailabilityTransition,
    BasePlaySnapshot,
    ChoiceState,
    LoadedChoice,
    LoadedCyoa,
    PlaySnapshot,
    PlayState,
    PlayerAction,
    PointDefinition,
    PointEffect,
    Rejection,
    RowState,
    SourceId,
    UnavailableReason
} from './types';

export function createInitialPlayState(cyoa: LoadedCyoa): PlayState {
    return {
        selectedChoices: {},
        variables: Object.fromEntries((cyoa.variables ?? []).map((variable) => [variable.id, variable.initial ?? false])),
        history: []
    };
}

export function advanceAvailability(
    cyoa: LoadedCyoa,
    state: PlayState,
    action: PlayerAction,
    options: AvailabilityOptions = {}
): AvailabilityTransition {
    const normalizedState = normalizePlayState(state);

    if (action.type === 'reset') {
        const nextState = createInitialPlayState(cyoa);
        return acceptedTransition(cyoa, nextState, options);
    }

    if (action.type === 'set-variable') {
        const nextState = appendHistory({
            ...normalizedState,
            variables: {
                ...normalizedState.variables,
                [action.variableId]: action.value
            }
        }, action);
        return acceptedTransition(cyoa, nextState, options);
    }

    const index = indexLoadedCyoa(cyoa);
    const choice = index.choices.get(action.choiceId);
    if (!choice) {
        return rejectedTransition(cyoa, normalizedState, options, {
            code: 'missing-choice',
            message: `Choice '${action.choiceId}' does not exist.`,
            sourceId: action.choiceId
        });
    }

    if (action.type === 'deselect-choice') {
        return deselectChoice(cyoa, normalizedState, choice, action, options);
    }

    const requestedCount = action.type === 'set-choice-count'
        ? action.count
        : getChoiceSelectionCount(normalizedState, action.choiceId) + (action.count ?? 1);

    return setChoiceCount(cyoa, normalizedState, choice, requestedCount, action, options);
}

export function derivePlaySnapshot(
    cyoa: LoadedCyoa,
    state: PlayState,
    options: AvailabilityOptions = {}
): PlaySnapshot {
    const normalizedState = normalizePlayState(state);
    const baseSnapshot = deriveBasePlaySnapshot(cyoa, normalizedState);

    return {
        ...baseSnapshot,
        gameMode: Object.fromEntries((options.gameModes ?? []).map((gameMode) => [
            gameMode.id,
            gameMode.interpret({
                cyoa,
                state: normalizedState,
                snapshot: baseSnapshot
            })
        ]))
    };
}

export function derivePointTotals(cyoa: LoadedCyoa, state: PlayState): Record<SourceId, number> {
    const normalizedState = normalizePlayState(state);
    const totals = Object.fromEntries((cyoa.points ?? []).map((point) => [point.id, point.initial ?? 0]));
    const context = createRequirementContext(cyoa, normalizedState, totals);

    for (const choice of cyoa.choices) {
        const selectedCount = getChoiceSelectionCount(normalizedState, choice.id);
        if (selectedCount === 0) {
            continue;
        }

        for (const pointEffect of choice.pointEffects ?? []) {
            if (evaluateRequirements(pointEffect.requireds, context).satisfied) {
                applyPointEffect(totals, cyoa.points ?? [], pointEffect, selectedCount);
            }
        }
    }

    return totals;
}

export function normalizePlayState(state: PlayState): PlayState {
    const selectedChoices = Object.entries(state.selectedChoices).reduce<Record<SourceId, number>>((selected, [choiceId, count]) => {
        const normalizedCount = Math.max(0, Math.trunc(count));
        if (normalizedCount > 0) {
            selected[choiceId] = normalizedCount;
        }
        return selected;
    }, {});

    return {
        selectedChoices,
        variables: { ...state.variables },
        history: [...state.history]
    };
}

function deriveBasePlaySnapshot(cyoa: LoadedCyoa, state: PlayState): BasePlaySnapshot {
    const index = indexLoadedCyoa(cyoa);
    const pointTotals = derivePointTotals(cyoa, state);
    const context = createRequirementContext(cyoa, state, pointTotals);
    const rowStates: Record<SourceId, RowState> = {};

    for (const row of cyoa.rows) {
        const requirementResult = evaluateRequirements(row.requireds, context);
        rowStates[row.id] = {
            id: row.id,
            selectedCount: getRowSelectionCount(state, index, row.id),
            allowedChoices: row.allowedChoices ?? 0,
            isAvailable: requirementResult.satisfied,
            reasons: requirementResult.reasons
        };
    }

    const choiceStates: Record<SourceId, ChoiceState> = {};
    for (const choice of cyoa.choices) {
        choiceStates[choice.id] = deriveChoiceState(choice, state, rowStates, context);
    }

    return {
        pointTotals,
        rowStates,
        choiceStates
    };
}

function deriveChoiceState(
    choice: LoadedChoice,
    state: PlayState,
    rowStates: Record<SourceId, RowState>,
    context: ReturnType<typeof createRequirementContext>
): ChoiceState {
    const selectedCount = getChoiceSelectionCount(state, choice.id);
    const maxSelections = choice.maxSelections ?? 1;
    const reasons: UnavailableReason[] = [];
    const rowState = rowStates[choice.rowId];

    if (!rowState) {
        reasons.push({
            code: 'missing-row',
            message: `Choice '${choice.id}' refers to missing row '${choice.rowId}'.`,
            sourceId: choice.rowId
        });
    } else {
        if (!rowState.isAvailable) {
            reasons.push({
                code: 'row-unavailable',
                message: `Row '${choice.rowId}' is unavailable.`,
                sourceId: choice.rowId
            });
        }
        if (selectedCount === 0 && rowState.allowedChoices > 0 && rowState.selectedCount >= rowState.allowedChoices) {
            reasons.push({
                code: 'row-capacity',
                message: `Row '${choice.rowId}' has no remaining choice capacity.`,
                sourceId: choice.rowId
            });
        }
    }

    if (choice.selectable === false) {
        reasons.push({
            code: 'not-selectable',
            message: `Choice '${choice.id}' is not selectable.`,
            sourceId: choice.id
        });
    }

    const requirementResult = evaluateRequirements(choice.requireds, context);
    reasons.push(...requirementResult.reasons);

    return {
        id: choice.id,
        rowId: choice.rowId,
        selectedCount,
        availability: selectedCount > 0 ? 'selected' : reasons.length > 0 ? 'unavailable' : 'available',
        reasons,
        maxSelections
    };
}

function deselectChoice(
    cyoa: LoadedCyoa,
    state: PlayState,
    choice: LoadedChoice,
    action: Extract<PlayerAction, { type: 'deselect-choice' }>,
    options: AvailabilityOptions
): AvailabilityTransition {
    const selectedCount = getChoiceSelectionCount(state, choice.id);
    if (selectedCount === 0) {
        return rejectedTransition(cyoa, state, options, {
            code: 'not-selected',
            message: `Choice '${choice.id}' is not selected.`,
            sourceId: choice.id
        });
    }

    return setChoiceCount(cyoa, state, choice, selectedCount - (action.count ?? 1), action, options);
}

function setChoiceCount(
    cyoa: LoadedCyoa,
    state: PlayState,
    choice: LoadedChoice,
    requestedCount: number,
    action: PlayerAction,
    options: AvailabilityOptions
): AvailabilityTransition {
    if (!Number.isFinite(requestedCount) || requestedCount < 0) {
        return rejectedTransition(cyoa, state, options, {
            code: 'invalid-count',
            message: `Choice '${choice.id}' count must be zero or greater.`,
            sourceId: choice.id
        });
    }

    const nextCount = Math.trunc(requestedCount);
    const maxSelections = choice.maxSelections ?? 1;
    if (nextCount > maxSelections) {
        return rejectedTransition(cyoa, state, options, {
            code: 'max-selections',
            message: `Choice '${choice.id}' allows at most ${maxSelections} selections.`,
            sourceId: choice.id
        });
    }

    const currentSnapshot = derivePlaySnapshot(cyoa, state, options);
    const choiceState = currentSnapshot.choiceStates[choice.id];
    const currentCount = getChoiceSelectionCount(state, choice.id);
    const countDelta = nextCount - currentCount;

    if (countDelta > 0 && choiceState.availability === 'unavailable') {
        return rejectedTransition(cyoa, state, options, {
            code: choiceState.reasons[0]?.code ?? 'requirements-unmet',
            message: choiceState.reasons[0]?.message ?? `Choice '${choice.id}' is unavailable.`,
            sourceId: choice.id
        });
    }

    if (countDelta > 0 && choice.countsTowardRow !== false) {
        const rowState = currentSnapshot.rowStates[choice.rowId];
        if (rowState && rowState.allowedChoices > 0 && rowState.selectedCount + countDelta > rowState.allowedChoices) {
            return rejectedTransition(cyoa, state, options, {
                code: 'row-capacity',
                message: `Row '${choice.rowId}' has no remaining choice capacity.`,
                sourceId: choice.rowId
            });
        }
    }

    const selectedChoices = { ...state.selectedChoices };
    if (nextCount === 0) {
        delete selectedChoices[choice.id];
    } else {
        selectedChoices[choice.id] = nextCount;
    }

    const nextState = appendHistory({
        ...state,
        selectedChoices
    }, action);

    const nextSnapshot = derivePlaySnapshot(cyoa, nextState, options);
    const floorViolation = findFloorViolation(cyoa.points ?? [], nextSnapshot.pointTotals);
    if (floorViolation) {
        return rejectedTransition(cyoa, state, options, floorViolation);
    }

    return {
        accepted: true,
        state: nextState,
        snapshot: nextSnapshot
    };
}

function findFloorViolation(points: PointDefinition[], pointTotals: Record<SourceId, number>): Rejection | undefined {
    for (const point of points) {
        if (typeof point.floor === 'number' && (pointTotals[point.id] ?? 0) < point.floor) {
            return {
                code: 'floor-violation',
                message: `Point '${point.id}' cannot fall below ${point.floor}.`,
                sourceId: point.id
            };
        }
    }

    return undefined;
}

function applyPointEffect(
    totals: Record<SourceId, number>,
    points: PointDefinition[],
    pointEffect: PointEffect,
    selectedCount: number
) {
    const current = totals[pointEffect.pointId] ?? 0;
    const point = points.find((candidate) => candidate.id === pointEffect.pointId);
    const multiplier = pointEffect.perSelection === false ? 1 : selectedCount;
    const rawValue = pointEffect.value * multiplier;
    const nextValue = pointEffect.operation === 'set' ? rawValue : current + rawValue;

    totals[pointEffect.pointId] = roundPointValue(nextValue, point);
}

function roundPointValue(value: number, point?: PointDefinition): number {
    if (typeof point?.precision !== 'number') {
        return value;
    }

    return Number(value.toFixed(point.precision));
}

function appendHistory(state: PlayState, action: PlayerAction): PlayState {
    return {
        ...state,
        history: [...state.history, action]
    };
}

function acceptedTransition(
    cyoa: LoadedCyoa,
    state: PlayState,
    options: AvailabilityOptions
): AvailabilityTransition {
    return {
        accepted: true,
        state,
        snapshot: derivePlaySnapshot(cyoa, state, options)
    };
}

function rejectedTransition(
    cyoa: LoadedCyoa,
    state: PlayState,
    options: AvailabilityOptions,
    rejection: Rejection
): AvailabilityTransition {
    return {
        accepted: false,
        state,
        snapshot: derivePlaySnapshot(cyoa, state, options),
        rejection
    };
}
