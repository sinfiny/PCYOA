import { describe, expect, it } from 'vitest';
import {
    createInMemoryLoadedCyoaRuntime,
    makeActivation,
    makeChoice,
    makeGlobalRequirement,
    makeGroup,
    makePointType,
    makeRequired,
    makeRow,
    makeRuntimeChoice,
    makeVariable
} from './loaded-cyoa-runtime-fixtures';

describe('Loaded CYOA runtime state', () => {
    it('reads activation-facing CYOA data through a narrow seam', () => {
        const row = makeRow('row-a');
        const choice = makeChoice('choice-a');
        const choiceEntry = { choice, row };
        const group = makeGroup('group-a', { name: 'Group A', elements: [choice.id], rowElements: [row.id] });
        const pointType = makePointType('points-a');
        const variable = makeVariable('variable-a');
        const globalRequirement = makeGlobalRequirement('global-req-a', {
            name: 'Global Requirement A',
            requireds: [makeRequired({ reqId: choice.id })]
        });
        const activation = makeActivation({ multiple: 2 });

        const { runtime } = createInMemoryLoadedCyoaRuntime({
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
        const { runtime, state } = createInMemoryLoadedCyoaRuntime();

        runtime.setActivation('choice-a', makeActivation());

        expect(runtime.isActivated('choice-a')).toBe(true);
        expect(state.activations.get('choice-a')).toEqual({ multiple: 1 });

        runtime.deleteActivation('choice-a');

        expect(runtime.isActivated('choice-a')).toBe(false);
        expect(state.activations.has('choice-a')).toBe(false);
    });

    it('provides a pure fixture harness for activation behavior tests', () => {
        const { runtime, state } = makeRuntimeChoice({
            row: makeRow('row-a', { allowedChoices: 1 }),
            choice: makeChoice('choice-a', {
                groups: ['group-a'],
                requireds: [makeRequired({ reqId: 'choice-b' })]
            })
        });

        runtime.setActivation('choice-a', makeActivation({ multiple: 3 }));

        expect(runtime.getChoice('choice-a')?.choice.requireds[0].reqId).toBe('choice-b');
        expect(runtime.getChoice('choice-a')?.row.allowedChoices).toBe(1);
        expect(runtime.getActivation('choice-a')).toEqual({ multiple: 3 });
        expect(state.activations.size).toBe(1);
    });
});
