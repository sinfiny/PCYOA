import type {
    ActivatedMap,
    Choice,
    ChoiceMap,
    GlobalRequirement,
    Group,
    PointType,
    Requireds,
    Row,
    Variable,
    Word
} from '$lib/store/types';
import { createLoadedCyoaRuntime, type LoadedCyoaRuntime, type LoadedCyoaRuntimeState } from './loaded-cyoa-runtime';

export type InMemoryLoadedCyoaRuntimeState = LoadedCyoaRuntimeState & {
    rows: Map<string, Row>;
    choices: Map<string, ChoiceMap>;
    groups: Map<string, Group>;
    pointTypes: Map<string, PointType>;
    variables: Map<string, Variable>;
    words: Map<string, Word>;
    globalRequirements: Map<string, GlobalRequirement>;
    activations: Map<string, ActivatedMap>;
};

export type InMemoryLoadedCyoaRuntime = {
    runtime: LoadedCyoaRuntime;
    state: InMemoryLoadedCyoaRuntimeState;
};

export function createInMemoryLoadedCyoaRuntime(
    initialState: Partial<InMemoryLoadedCyoaRuntimeState> = {}
): InMemoryLoadedCyoaRuntime {
    const state: InMemoryLoadedCyoaRuntimeState = {
        rows: initialState.rows ?? new Map(),
        choices: initialState.choices ?? new Map(),
        groups: initialState.groups ?? new Map(),
        pointTypes: initialState.pointTypes ?? new Map(),
        variables: initialState.variables ?? new Map(),
        words: initialState.words ?? new Map(),
        globalRequirements: initialState.globalRequirements ?? new Map(),
        activations: initialState.activations ?? new Map()
    };

    return {
        runtime: createLoadedCyoaRuntime(state),
        state
    };
}

export function makeRuntimeChoice(options: {
    row?: Row;
    choice?: Choice;
    activation?: ActivatedMap;
} = {}): InMemoryLoadedCyoaRuntime {
    const row = options.row ?? makeRow('row-a');
    const choice = options.choice ?? makeChoice('choice-a');
    const choiceEntry: ChoiceMap = { choice, row };
    const activation = options.activation;

    return createInMemoryLoadedCyoaRuntime({
        rows: new Map([[row.id, row]]),
        choices: new Map([[choice.id, choiceEntry]]),
        activations: activation ? new Map([[choice.id, activation]]) : new Map()
    });
}

export function makeRow(id: string, overrides: Partial<Row> = {}): Row {
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
        objects: [],
        ...overrides
    };
}

export function makeChoice(id: string, overrides: Partial<Choice> = {}): Choice {
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
        groups: [],
        ...overrides
    };
}

export function makePointType(id: string, overrides: Partial<PointType> = {}): PointType {
    return {
        id,
        name: 'Points',
        startingSum: 0,
        initValue: 0,
        activatedId: '',
        beforeText: '',
        afterText: '',
        ...overrides
    };
}

export function makeVariable(id: string, overrides: Partial<Variable> = {}): Variable {
    return {
        id,
        isTrue: false,
        ...overrides
    };
}

export function makeWord(id: string, overrides: Partial<Word> = {}): Word {
    return {
        id,
        replaceText: '',
        ...overrides
    };
}

export function makeGroup(id: string, overrides: Partial<Group> = {}): Group {
    return {
        id,
        name: 'Group',
        elements: [],
        rowElements: [],
        ...overrides
    };
}

export function makeGlobalRequirement(
    id: string,
    overrides: Partial<GlobalRequirement> = {}
): GlobalRequirement {
    return {
        id,
        name: 'Global Requirement',
        requireds: [],
        ...overrides
    };
}

export function makeRequired(overrides: Partial<Requireds> = {}): Requireds {
    return {
        required: true,
        requireds: [],
        orRequired: [],
        id: '',
        type: '',
        reqId: '',
        reqId1: '',
        reqId2: '',
        reqId3: '',
        reqPoints: 0,
        showRequired: true,
        afterText: '',
        beforeText: '',
        ...overrides
    };
}

export function makeActivation(overrides: Partial<ActivatedMap> = {}): ActivatedMap {
    return {
        multiple: 1,
        ...overrides
    };
}
