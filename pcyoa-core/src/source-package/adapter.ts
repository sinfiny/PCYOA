import type {
    ChoiceSignalMap,
    CountOperator,
    LoadedChoice,
    LoadedCyoa,
    LoadedRow,
    PointDefinition,
    PointEffect,
    Requirement,
    SourceId
} from '../core';
import type {
    DeclarativeRequirement,
    DeclarativeScore,
    LoadedSourceObject,
    LoadedSourceProjectPackage
} from './types';

export type SourcePackageCoreWarning = {
    code: 'unsupported-requirement' | 'missing-parent-row';
    message: string;
    sourceId?: SourceId;
};

export type SourcePackageToLoadedCyoaResult = {
    cyoa: LoadedCyoa;
    warnings: SourcePackageCoreWarning[];
};

type AdapterContext = {
    choiceIds: Set<SourceId>;
    rowIds: Set<SourceId>;
    variableIds: Set<SourceId>;
    warnings: SourcePackageCoreWarning[];
};

export function sourcePackageToLoadedCyoa(pkg: LoadedSourceProjectPackage): SourcePackageToLoadedCyoaResult {
    const authoringObjects = pkg.objects.filter((object) => object.status === 'canonical' || object.status === 'draft');
    const rowObjects = sortObjects(authoringObjects.filter((object) => object.type === 'row'));
    const choiceObjects = sortObjects(authoringObjects.filter((object) => object.type === 'choice'));
    const warnings: SourcePackageCoreWarning[] = [];
    const context: AdapterContext = {
        choiceIds: new Set(choiceObjects.map((object) => object.id)),
        rowIds: new Set(rowObjects.map((object) => object.id)),
        variableIds: new Set((pkg.infrastructure.variables ?? []).map((variable) => variable.id)),
        warnings
    };

    const choicesByParent = choiceObjects.reduce<Map<SourceId, LoadedSourceObject[]>>((parents, object) => {
        const parent = object.parent;
        if (!parent || !context.rowIds.has(parent)) {
            warnings.push({
                code: 'missing-parent-row',
                message: `Choice '${object.id}' does not have a valid parent row.`,
                sourceId: object.id
            });
            return parents;
        }

        parents.set(parent, [...(parents.get(parent) ?? []), object]);
        return parents;
    }, new Map());

    const rows: LoadedRow[] = rowObjects.map((object) => {
        const rule = object.ruleModule?.type === 'row' ? object.ruleModule : undefined;

        return {
            id: object.id,
            title: object.title,
            choiceIds: (choicesByParent.get(object.id) ?? []).map((choice) => choice.id),
            allowedChoices: rule?.allowedChoices ?? 0,
            requireds: convertRequirements(rule?.requireds, context, object.id)
        };
    });

    const choices: LoadedChoice[] = choiceObjects
        .filter((object) => object.parent && context.rowIds.has(object.parent))
        .map((object) => {
            const rule = object.ruleModule?.type === 'choice' ? object.ruleModule : undefined;
            const signals = extractSignals(object.presentationHints);

            return {
                id: object.id,
                rowId: object.parent!,
                title: object.title,
                requireds: convertRequirements(rule?.requireds, context, object.id),
                pointEffects: convertScores(rule?.scores, context, object.id),
                groups: rule?.groups ?? [],
                signals,
                selectable: rule?.isNotSelectable ? false : true
            };
        });

    return {
        cyoa: {
            id: pkg.sourceIndex.packageId,
            title: pkg.sourceIndex.title,
            rows,
            choices,
            points: (pkg.infrastructure.points ?? []).map((point): PointDefinition => ({
                id: point.id,
                label: point.name,
                initial: point.initValue ?? point.startingSum ?? 0,
                floor: point.belowZeroNotAllowed ? 0 : undefined,
                precision: point.allowFloat ? point.decimalPlaces : 0
            })),
            variables: (pkg.infrastructure.variables ?? []).map((variable) => ({
                id: variable.id,
                initial: variable.isTrue
            })),
            groups: (pkg.infrastructure.groups ?? []).map((group) => ({
                id: group.id,
                choiceIds: group.elements,
                rowIds: group.rowElements
            })),
            globalRequirements: (pkg.infrastructure.globalRequirements ?? []).map((globalRequirement) => ({
                id: globalRequirement.id,
                requirements: convertRequirements(globalRequirement.requireds, context, globalRequirement.id)
            }))
        },
        warnings
    };
}

function convertScores(
    scores: DeclarativeScore[] | undefined,
    context: AdapterContext,
    sourceId: SourceId
): PointEffect[] {
    return (scores ?? []).map((score) => ({
        pointId: score.id,
        value: score.value,
        requireds: convertRequirements(score.requireds, context, sourceId)
    }));
}

function convertRequirements(
    requirements: DeclarativeRequirement[] | undefined,
    context: AdapterContext,
    sourceId: SourceId
): Requirement[] {
    return (requirements ?? []).map((requirement) => convertRequirement(requirement, context, sourceId));
}

function convertRequirement(
    requirement: DeclarativeRequirement,
    context: AdapterContext,
    sourceId: SourceId
): Requirement {
    const base = convertRequirementBase(requirement, context, sourceId);
    const when = convertRequirements(requirement.requireds, context, sourceId);

    return when.length > 0 ? {
        kind: 'when',
        when,
        then: base
    } : base;
}

function convertRequirementBase(
    requirement: DeclarativeRequirement,
    context: AdapterContext,
    sourceId: SourceId
): Requirement {
    if (requirement.required === false && requirement.type !== 'id' && requirement.type !== 'gid') {
        return unsupportedRequirement(requirement, context, sourceId);
    }

    switch (requirement.type) {
        case 'id':
            return convertIdRequirement(requirement, context);
        case 'points':
            return {
                kind: 'point-threshold',
                pointId: requirement.reqId,
                operator: convertPointOperator(requirement.operator),
                value: requirement.reqPoints
            };
        case 'gid':
            return {
                kind: 'global',
                requirementId: requirement.reqId,
                invert: requirement.required === false || undefined
            };
        case 'or':
            return {
                kind: 'any',
                requirements: convertRequirements(requirement.orRequireds, context, sourceId),
                min: requirement.orNum ?? 1
            };
        case 'selFromGroups':
            return convertSelectionRequirement(
                [],
                [],
                requirement.selGroups ?? [],
                requirement.selFromOperators,
                requirement.selNum
            );
        case 'selFromRows':
            return convertSelectionRequirement(
                [],
                requirement.selRows ?? [],
                [],
                requirement.selFromOperators,
                requirement.selNum
            );
        case 'selFromWhole':
            return convertSelectionRequirement(
                [],
                [...context.rowIds],
                [],
                requirement.selFromOperators,
                requirement.selNum
            );
        default:
            return unsupportedRequirement(requirement, context, sourceId);
    }
}

function convertIdRequirement(requirement: DeclarativeRequirement, context: AdapterContext): Requirement {
    const parsed = parseActivatedId(requirement.reqId);

    if (context.variableIds.has(parsed.id)) {
        return {
            kind: 'variable',
            variableId: parsed.id,
            value: requirement.required !== false
        };
    }

    return {
        kind: 'choice-selected',
        choiceId: parsed.id,
        minSelections: parsed.count,
        invert: requirement.required === false || undefined
    };
}

function convertSelectionRequirement(
    choiceIds: SourceId[],
    rowIds: SourceId[],
    groupIds: SourceId[],
    legacyOperator = '1',
    legacyCount = 1
): Requirement {
    const operator = convertSelectionOperator(legacyOperator, legacyCount);

    return {
        kind: 'selection-count',
        choiceIds,
        rowIds,
        groupIds,
        operator,
        count: legacyCount
    };
}

function unsupportedRequirement(
    requirement: DeclarativeRequirement,
    context: AdapterContext,
    sourceId: SourceId
): Requirement {
    const message = `Requirement type '${requirement.type}' is not supported by the core adapter yet.`;
    context.warnings.push({
        code: 'unsupported-requirement',
        message,
        sourceId
    });

    return {
        kind: 'unsupported',
        message,
        sourceId
    };
}

function convertPointOperator(operator = '1'): CountOperator {
    switch (operator) {
        case '2':
            return '>=';
        case '3':
            return '=';
        case '4':
            return '<=';
        case '5':
            return '<';
        case '1':
        default:
            return '>';
    }
}

function convertSelectionOperator(operator = '1', count = 1): CountOperator {
    switch (operator) {
        case '2':
            return '=';
        case '3':
            return count === 0 ? '=' : '<=';
        case '1':
        default:
            return count === 0 ? '=' : '>=';
    }
}

function parseActivatedId(value: string): { id: SourceId; count: number } {
    const [id, count] = value.split('/ON#');
    const parsedCount = count ? Number(count) : 1;

    return {
        id,
        count: Number.isFinite(parsedCount) ? parsedCount : 1
    };
}

function extractSignals(presentationHints: Record<string, unknown> | undefined): ChoiceSignalMap | undefined {
    const signals = presentationHints?.signals;
    if (!isRecord(signals)) {
        return undefined;
    }

    const entries = Object.entries(signals).filter((entry): entry is [string, number] => typeof entry[1] === 'number');
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function sortObjects(objects: LoadedSourceObject[]): LoadedSourceObject[] {
    return [...objects].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
