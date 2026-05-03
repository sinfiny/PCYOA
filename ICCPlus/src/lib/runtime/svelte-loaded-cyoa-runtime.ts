import {
    activatedMap,
    choiceMap,
    globalReqMap,
    groupMap,
    pointTypeMap,
    rowMap,
    variableMap,
    wordMap
} from '$lib/store/store.svelte';
import { createLoadedCyoaRuntime } from './loaded-cyoa-runtime';

export const loadedCyoaRuntime = createLoadedCyoaRuntime({
    rows: rowMap,
    choices: choiceMap,
    groups: groupMap,
    pointTypes: pointTypeMap,
    variables: variableMap,
    words: wordMap,
    globalRequirements: globalReqMap,
    activations: activatedMap
});
