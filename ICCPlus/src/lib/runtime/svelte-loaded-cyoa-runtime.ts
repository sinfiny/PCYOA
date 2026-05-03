import {
    activatedMap,
    choiceMap,
    globalReqMap,
    groupMap,
    pointTypeMap,
    rowMap,
    variableMap
} from '$lib/store/store.svelte';
import { createLoadedCyoaRuntime } from './loaded-cyoa-runtime';

export const loadedCyoaRuntime = createLoadedCyoaRuntime({
    rows: rowMap,
    choices: choiceMap,
    groups: groupMap,
    pointTypes: pointTypeMap,
    variables: variableMap,
    globalRequirements: globalReqMap,
    activations: activatedMap
});
