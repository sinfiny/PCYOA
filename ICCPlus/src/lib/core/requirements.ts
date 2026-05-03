import type {
    CountOperator,
    LoadedChoice,
    LoadedCyoa,
    LoadedRow,
    PlayState,
    Requirement,
    SourceId,
    UnavailableReason
} from './types';

export type LoadedCyoaIndex = {
    rows: Map<SourceId, LoadedRow>;
    choices: Map<SourceId, LoadedChoice>;
    choiceIdsByRow: Map<SourceId, SourceId[]>;
};

export type RequirementContext = {
    cyoa: LoadedCyoa;
    index: LoadedCyoaIndex;
    state: PlayState;
    pointTotals: Record<SourceId, number>;
};

export type RequirementResult = {
    satisfied: boolean;
    reasons: UnavailableReason[];
};

export function indexLoadedCyoa(cyoa: LoadedCyoa): LoadedCyoaIndex {
    const rows = new Map(cyoa.rows.map((row) => [row.id, row]));
    const choices = new Map(cyoa.choices.map((choice) => [choice.id, choice]));
    const choiceIdsByRow = new Map<SourceId, SourceId[]>();

    for (const row of cyoa.rows) {
        choiceIdsByRow.set(row.id, row.choiceIds ?? []);
    }

    for (const choice of cyoa.choices) {
        const existing = choiceIdsByRow.get(choice.rowId) ?? [];
        if (!existing.includes(choice.id)) {
            choiceIdsByRow.set(choice.rowId, [...existing, choice.id]);
        }
    }

    return { rows, choices, choiceIdsByRow };
}

export function createRequirementContext(
    cyoa: LoadedCyoa,
    state: PlayState,
    pointTotals: Record<SourceId, number>
): RequirementContext {
    return {
        cyoa,
        index: indexLoadedCyoa(cyoa),
        state,
        pointTotals
    };
}

export function evaluateRequirements(
    requirements: Requirement[] | undefined,
    context: RequirementContext
): RequirementResult {
    const reasons: UnavailableReason[] = [];

    for (const requirement of requirements ?? []) {
        const result = evaluateRequirement(requirement, context);
        if (!result.satisfied) {
            reasons.push(...result.reasons);
        }
    }

    return {
        satisfied: reasons.length === 0,
        reasons
    };
}

export function evaluateRequirement(requirement: Requirement, context: RequirementContext): RequirementResult {
    switch (requirement.kind) {
        case 'choice-selected': {
            const count = getChoiceSelectionCount(context.state, requirement.choiceId);
            const expected = requirement.minSelections ?? 1;
            const satisfied = requirement.invert ? count < expected : count >= expected;
            return toRequirementResult(
                satisfied,
                `Choice '${requirement.choiceId}' must ${requirement.invert ? 'not ' : ''}be selected.`,
                requirement.choiceId
            );
        }
        case 'point-threshold': {
            const value = context.pointTotals[requirement.pointId] ?? 0;
            return toRequirementResult(
                compareCount(value, requirement.operator, requirement.value),
                `Point '${requirement.pointId}' must be ${requirement.operator} ${requirement.value}.`,
                requirement.pointId
            );
        }
        case 'variable': {
            const expected = requirement.value ?? true;
            const actual = context.state.variables[requirement.variableId]
                ?? context.cyoa.variables?.find((variable) => variable.id === requirement.variableId)?.initial
                ?? false;
            return toRequirementResult(
                actual === expected,
                `Variable '${requirement.variableId}' must be ${String(expected)}.`,
                requirement.variableId
            );
        }
        case 'row-selected': {
            const selectedCount = getRowSelectionCount(context.state, context.index, requirement.rowId);
            return toRequirementResult(
                compareCount(selectedCount, requirement.operator, requirement.count),
                `Row '${requirement.rowId}' must have ${requirement.operator} ${requirement.count} selections.`,
                requirement.rowId
            );
        }
        case 'group-selected': {
            const selectedCount = getGroupSelectionCount(context.state, context.cyoa, requirement.groupId);
            return toRequirementResult(
                compareCount(selectedCount, requirement.operator, requirement.count),
                `Group '${requirement.groupId}' must have ${requirement.operator} ${requirement.count} selections.`,
                requirement.groupId
            );
        }
        case 'global': {
            const globalRequirement = context.cyoa.globalRequirements?.find((candidate) => candidate.id === requirement.requirementId);
            if (!globalRequirement) {
                return toRequirementResult(false, `Global requirement '${requirement.requirementId}' does not exist.`, requirement.requirementId);
            }

            const result = evaluateRequirements(globalRequirement.requirements, context);
            return requirement.invert
                ? toRequirementResult(!result.satisfied, `Global requirement '${requirement.requirementId}' must not be satisfied.`, requirement.requirementId)
                : result;
        }
        case 'all':
            return evaluateRequirements(requirement.requirements, context);
        case 'any': {
            const results = requirement.requirements.map((item) => evaluateRequirement(item, context));
            const requiredCount = requirement.min ?? 1;
            const satisfiedCount = results.filter((result) => result.satisfied).length;
            return toRequirementResult(
                satisfiedCount >= requiredCount,
                `At least ${requiredCount} nested requirements must be satisfied.`
            );
        }
    }
}

export function compareCount(left: number, operator: CountOperator, right: number): boolean {
    switch (operator) {
        case '>':
            return left > right;
        case '>=':
            return left >= right;
        case '=':
            return left === right;
        case '<=':
            return left <= right;
        case '<':
            return left < right;
    }
}

export function getChoiceSelectionCount(state: PlayState, choiceId: SourceId): number {
    return Math.max(0, state.selectedChoices[choiceId] ?? 0);
}

export function getRowSelectionCount(state: PlayState, index: LoadedCyoaIndex, rowId: SourceId): number {
    const choiceIds = index.choiceIdsByRow.get(rowId) ?? [];
    return choiceIds.reduce((count, choiceId) => {
        const choice = index.choices.get(choiceId);
        if (choice?.countsTowardRow === false) {
            return count;
        }
        return count + getChoiceSelectionCount(state, choiceId);
    }, 0);
}

export function getGroupSelectionCount(state: PlayState, cyoa: LoadedCyoa, groupId: SourceId): number {
    const group = cyoa.groups?.find((candidate) => candidate.id === groupId);
    if (!group) {
        return 0;
    }

    const index = indexLoadedCyoa(cyoa);
    const choiceIds = new Set(group.choiceIds ?? []);
    for (const choice of cyoa.choices) {
        if (choice.groups?.includes(groupId)) {
            choiceIds.add(choice.id);
        }
    }

    const choiceSelections = [...choiceIds].reduce((count, choiceId) => count + getChoiceSelectionCount(state, choiceId), 0);
    const rowSelections = (group.rowIds ?? []).reduce((count, rowId) => count + getRowSelectionCount(state, index, rowId), 0);

    return choiceSelections + rowSelections;
}

function toRequirementResult(satisfied: boolean, message: string, sourceId?: SourceId): RequirementResult {
    return {
        satisfied,
        reasons: satisfied ? [] : [{
            code: 'requirements-unmet',
            message,
            sourceId
        }]
    };
}
