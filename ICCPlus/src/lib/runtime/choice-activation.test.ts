import { describe, expect, it } from 'vitest';
import {
    changeMultipleChoiceSelection,
    checkActivated,
    checkRequirement,
    checkRequirements,
    collectActivationEffects,
    activateRowButton,
    activateVariable,
    deactivateVariable,
    deselectChoice,
    applyScoreDeselection,
    applyScoreSelection,
    selectChoice
} from './choice-activation';
import {
    createInMemoryLoadedCyoaRuntime,
    makeActivation,
    makeChoice,
    makeGlobalRequirement,
    makeGroup,
    makePointType,
    makeRequired,
    makeRow,
    makeVariable,
    makeWord
} from './loaded-cyoa-runtime-fixtures';

describe('Choice Activation requirement evaluation', () => {
    it('evaluates activated ids and activation counts through the runtime seam', () => {
        const { runtime } = createInMemoryLoadedCyoaRuntime({
            activations: new Map([['choice-a', makeActivation({ multiple: 2 })]])
        });

        expect(checkActivated(runtime, 'choice-a')).toBe(true);
        expect(checkActivated(runtime, 'choice-a/ON#2')).toBe(true);
        expect(checkActivated(runtime, 'choice-a/ON#3')).toBe(false);
        expect(checkRequirement(runtime, makeRequired({ type: 'id', reqId: 'choice-a' }))).toBe(true);
    });

    it('evaluates point, group, row, variable, word, and global requirements without Svelte', () => {
        const variable = makeVariable('variable-a');
        const globalRequirement = makeGlobalRequirement('global-a', {
            requireds: [makeRequired({ type: 'id', reqId: variable.id })]
        });
        const { runtime } = createInMemoryLoadedCyoaRuntime({
            rows: new Map([
                ['row-a', makeRow('row-a', { currentChoices: 2 })],
                ['row-b', makeRow('row-b', { currentChoices: 1 })]
            ]),
            groups: new Map([['group-a', makeGroup('group-a', { elements: ['choice-a', 'choice-b'] })]]),
            pointTypes: new Map([['points-a', makePointType('points-a', { startingSum: 5 })]]),
            variables: new Map([[variable.id, variable]]),
            words: new Map([['word-a', makeWord('word-a', { replaceText: 'open' })]]),
            globalRequirements: new Map([[globalRequirement.id, globalRequirement]]),
            activations: new Map([
                ['choice-a', makeActivation()],
                [variable.id, makeActivation({ isVariable: true })]
            ])
        });

        expect(checkRequirement(runtime, makeRequired({ type: 'points', reqId: 'points-a', reqPoints: 4 }))).toBe(true);
        expect(
            checkRequirement(
                runtime,
                makeRequired({ type: 'selFromGroups', selGroups: ['group-a'], selNum: 1, selFromOperators: '1' })
            )
        ).toBe(true);
        expect(
            checkRequirement(
                runtime,
                makeRequired({ type: 'selFromRows', selRows: ['row-a', 'row-b'], selNum: 3, selFromOperators: '2' })
            )
        ).toBe(true);
        expect(checkRequirement(runtime, makeRequired({ type: 'selFromWhole', selNum: 3, selFromOperators: '2' }))).toBe(true);
        expect(checkRequirement(runtime, makeRequired({ type: 'id', reqId: variable.id }))).toBe(true);
        expect(checkRequirement(runtime, makeRequired({ type: 'gid', reqId: globalRequirement.id }))).toBe(true);
        expect(
            checkRequirement(runtime, makeRequired({ type: 'word', reqId: 'word-a', orRequired: [{ req: 'open' }] }))
        ).toBe(true);
    });

    it('evaluates nested requirement lists', () => {
        const { runtime } = createInMemoryLoadedCyoaRuntime({
            activations: new Map([['choice-a', makeActivation()]])
        });

        const requireds = [
            makeRequired({
                type: 'id',
                reqId: 'choice-a',
                requireds: [makeRequired({ type: 'id', reqId: 'missing-choice', required: false })]
            })
        ];

        expect(checkRequirements(runtime, requireds)).toBe(true);
    });

    it('selects and deselects a choice through the runtime seam', () => {
        const row = makeRow('row-a');
        const choice = makeChoice('choice-a');
        const { runtime, state } = createInMemoryLoadedCyoaRuntime({
            rows: new Map([[row.id, row]]),
            choices: new Map([[choice.id, { choice, row }]])
        });

        selectChoice(runtime, choice, row);

        expect(choice.isActive).toBe(true);
        expect(row.currentChoices).toBe(1);
        expect(state.activations.get(choice.id)).toEqual({ multiple: 0 });

        deselectChoice(runtime, choice, row);

        expect(choice.isActive).toBe(false);
        expect(row.currentChoices).toBe(0);
        expect(state.activations.has(choice.id)).toBe(false);
    });

    it('updates multi-choice counters through the runtime seam', () => {
        const row = makeRow('row-a');
        const choice = makeChoice('choice-a', { isSelectableMultiple: true, isMultipleUseVariable: true });
        const { runtime, state } = createInMemoryLoadedCyoaRuntime();

        changeMultipleChoiceSelection(runtime, choice, row, 1);
        changeMultipleChoiceSelection(runtime, choice, row, 1);

        expect(choice.isActive).toBe(true);
        expect(choice.multipleUseVariable).toBe(2);
        expect(row.currentChoices).toBe(1);
        expect(state.activations.get(choice.id)).toEqual({ multiple: 2 });

        changeMultipleChoiceSelection(runtime, choice, row, -1);
        changeMultipleChoiceSelection(runtime, choice, row, -1);

        expect(choice.isActive).toBe(false);
        expect(choice.multipleUseVariable).toBe(0);
        expect(row.currentChoices).toBe(0);
        expect(state.activations.has(choice.id)).toBe(false);
    });

    it('applies score selection and deselection through the runtime seam', () => {
        const pointType = makePointType('points-a', { startingSum: 10 });
        const score = {
            idx: 'score-a',
            id: pointType.id,
            value: 3,
            type: '',
            beforeText: '',
            afterText: '',
            requireds: [],
            showScore: true
        };
        const { runtime } = createInMemoryLoadedCyoaRuntime({
            pointTypes: new Map([[pointType.id, pointType]])
        });

        expect(applyScoreSelection(runtime, score)).toBe(3);
        expect(pointType.startingSum).toBe(7);
        expect(score.isActive).toBe(true);

        expect(applyScoreDeselection(runtime, score)).toBe(3);
        expect(pointType.startingSum).toBe(10);
        expect(score.isActive).toBeUndefined();
    });

    it('applies active discount score values when scoring', () => {
        const pointType = makePointType('points-a', { startingSum: 10 });
        const score = {
            idx: 'score-a',
            id: pointType.id,
            value: 5,
            type: '',
            beforeText: '',
            afterText: '',
            requireds: [],
            showScore: true,
            discountIsOn: true,
            appliedDiscount: true,
            discountScore: 2
        };
        const { runtime } = createInMemoryLoadedCyoaRuntime({
            pointTypes: new Map([[pointType.id, pointType]])
        });

        expect(applyScoreSelection(runtime, score)).toBe(2);
        expect(pointType.startingSum).toBe(8);
    });

    it('activates and deactivates variables through the runtime seam', () => {
        const variable = makeVariable('variable-a');
        const { runtime, state } = createInMemoryLoadedCyoaRuntime({
            variables: new Map([[variable.id, variable]])
        });

        activateVariable(runtime, variable);

        expect(variable.isTrue).toBe(true);
        expect(state.activations.get(variable.id)).toEqual({ multiple: 0, isVariable: true });

        deactivateVariable(runtime, variable);

        expect(variable.isTrue).toBe(false);
        expect(state.activations.has(variable.id)).toBe(false);
    });

    it('activates row buttons through the runtime seam', () => {
        const row = makeRow('row-a');
        const { runtime, state } = createInMemoryLoadedCyoaRuntime({
            rows: new Map([[row.id, row]])
        });

        activateRowButton(runtime, row, { randomPointTypeId: 'points-a', pointNum: 4 });

        expect(state.activations.get(row.id)).toEqual({
            multiple: 0,
            isRowButton: true,
            rndPoint: 'points-a',
            pointNum: 4
        });
    });

    it('surfaces activation UI side effects explicitly', () => {
        const choice = makeChoice('choice-a', {
            textfieldIsOn: true,
            idOfTheTextfieldWord: 'word-a',
            wordPromptText: 'Name?',
            wordChangeSelect: 'Alice',
            isImageUpload: true,
            defaultImage: 'placeholder.png',
            scrollToRow: true,
            scrollRowId: 'row-b',
            isFadeTransition: true,
            fadeTransitionColor: '#000000',
            fadeTransitionTime: 1,
            setBgmIsOn: true,
            bgmId: 'bgm-a',
            bgmFadeIn: true,
            useSfx: true,
            sfxId: 'sfx-a',
            sfxOnSelect: true
        });

        expect(collectActivationEffects(choice, 'select')).toEqual([
            {
                type: 'text-entry-prompt',
                wordId: 'word-a',
                prompt: 'Name?',
                selectText: 'Alice',
                deselectText: undefined
            },
            { type: 'image-upload-prompt', choiceId: 'choice-a', defaultImage: 'placeholder.png' },
            { type: 'scroll', rowId: 'row-b', choiceId: undefined },
            {
                type: 'fade-transition',
                color: '#000000',
                time: 1,
                fadeInTime: undefined,
                fadeOutTime: undefined
            },
            {
                type: 'bgm',
                bgmId: 'bgm-a',
                fadeIn: true,
                fadeOut: undefined,
                fadeInSec: undefined,
                fadeOutSec: undefined,
                noLoop: undefined,
                mute: undefined,
                useAudioURL: undefined
            },
            { type: 'sound-effect', sfxId: 'sfx-a', event: 'select' }
        ]);
    });
});
