import { describe, expect, it } from 'vitest';
import type {
    ActivatedMap,
    Choice,
    ChoiceMap,
    GlobalRequirement,
    Group,
    PointType,
    Row,
    Variable
} from '$lib/store/types';
import { createLoadedCyoaRuntime } from './loaded-cyoa-runtime';

describe('Loaded CYOA runtime state', () => {
    it('reads activation-facing CYOA data through a narrow seam', () => {
        const row = makeRow('row-a');
        const choice = makeChoice('choice-a');
        const choiceEntry: ChoiceMap = { choice, row };
        const group: Group = { id: 'group-a', name: 'Group A', elements: [choice.id], rowElements: [row.id] };
        const pointType = makePointType('points-a');
        const variable: Variable = { id: 'variable-a', isTrue: false };
        const globalRequirement: GlobalRequirement = { id: 'global-req-a', name: 'Global Requirement A', requireds: [] };
        const activation: ActivatedMap = { multiple: 2 };

        const runtime = createLoadedCyoaRuntime({
            rows: new Map([[row.id, row]]),
            choices: new Map([[choice.id, choiceEntry]]),
            groups: new Map([[group.id, group]]),
            pointTypes: new Map([[pointType.id, pointType]]),
            variables: new Map([[variable.id, variable]]),
            globalRequirements: new Map([[globalRequirement.id, globalRequirement]]),
            activations: new Map([[choice.id, activation]])
        });

        expect(runtime.getRow(row.id)).toBe(row);
        expect(runtime.getChoice(choice.id)).toBe(choiceEntry);
        expect(runtime.getGroup(group.id)).toBe(group);
        expect(runtime.getPointType(pointType.id)).toBe(pointType);
        expect(runtime.getVariable(variable.id)).toBe(variable);
        expect(runtime.getGlobalRequirement(globalRequirement.id)).toBe(globalRequirement);
        expect(runtime.isActivated(choice.id)).toBe(true);
        expect(runtime.getActivation(choice.id)).toBe(activation);
        expect(runtime.getRow('missing-row')).toBeUndefined();
    });

    it('updates activation state through the seam', () => {
        const activations = new Map<string, ActivatedMap>();
        const runtime = createLoadedCyoaRuntime({
            rows: new Map(),
            choices: new Map(),
            groups: new Map(),
            pointTypes: new Map(),
            variables: new Map(),
            globalRequirements: new Map(),
            activations
        });

        runtime.setActivation('choice-a', { multiple: 1 });

        expect(runtime.isActivated('choice-a')).toBe(true);
        expect(activations.get('choice-a')).toEqual({ multiple: 1 });

        runtime.deleteActivation('choice-a');

        expect(runtime.isActivated('choice-a')).toBe(false);
        expect(activations.has('choice-a')).toBe(false);
    });
});

function makeRow(id: string): Row {
    return {
        id,
        index: 0,
        title: 'Row',
        titleText: '',
        objectWidth: '',
        image: '',
        template: 1,
        defaultAspectWidth: 1,
        defaultAspectHeight: 1,
        allowedChoices: 0,
        currentChoices: 0,
        requireds: [],
        objects: []
    };
}

function makeChoice(id: string): Choice {
    return {
        id,
        index: 0,
        title: 'Choice',
        text: '',
        debugTitle: '',
        image: '',
        template: 1,
        objectWidth: '',
        isActive: false,
        multipleUseVariable: 0,
        selectedThisManyTimesProp: 0,
        requireds: [],
        addons: [],
        scores: [],
        groups: []
    };
}

function makePointType(id: string): PointType {
    return {
        id,
        name: 'Points',
        startingSum: 0,
        initValue: 0,
        activatedId: '',
        beforeText: '',
        afterText: ''
    };
}
