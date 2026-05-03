import type {
    ActivatedMap,
    ChoiceMap,
    GlobalRequirement,
    Group,
    PointType,
    Row,
    Variable
} from '$lib/store/types';

type RuntimeMap<T> = {
    get(id: string): T | undefined;
    has(id: string): boolean;
    set(id: string, value: T): unknown;
    delete(id: string): unknown;
};

type ReadonlyRuntimeMap<T> = Pick<RuntimeMap<T>, 'get' | 'has'>;

export type LoadedCyoaRuntimeState = {
    rows: ReadonlyRuntimeMap<Row>;
    choices: ReadonlyRuntimeMap<ChoiceMap>;
    groups: ReadonlyRuntimeMap<Group>;
    pointTypes: ReadonlyRuntimeMap<PointType>;
    variables: ReadonlyRuntimeMap<Variable>;
    globalRequirements: ReadonlyRuntimeMap<GlobalRequirement>;
    activations: RuntimeMap<ActivatedMap>;
};

export type LoadedCyoaRuntime = {
    getRow(id: string): Row | undefined;
    getChoice(id: string): ChoiceMap | undefined;
    getGroup(id: string): Group | undefined;
    getPointType(id: string): PointType | undefined;
    getVariable(id: string): Variable | undefined;
    getGlobalRequirement(id: string): GlobalRequirement | undefined;
    isActivated(id: string): boolean;
    getActivation(id: string): ActivatedMap | undefined;
    setActivation(id: string, value: ActivatedMap): void;
    deleteActivation(id: string): void;
};

export function createLoadedCyoaRuntime(state: LoadedCyoaRuntimeState): LoadedCyoaRuntime {
    return {
        getRow: (id) => state.rows.get(id),
        getChoice: (id) => state.choices.get(id),
        getGroup: (id) => state.groups.get(id),
        getPointType: (id) => state.pointTypes.get(id),
        getVariable: (id) => state.variables.get(id),
        getGlobalRequirement: (id) => state.globalRequirements.get(id),
        isActivated: (id) => state.activations.has(id),
        getActivation: (id) => state.activations.get(id),
        setActivation: (id, value) => {
            state.activations.set(id, value);
        },
        deleteActivation: (id) => {
            state.activations.delete(id);
        }
    };
}
