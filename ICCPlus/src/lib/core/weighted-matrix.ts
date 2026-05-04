import { getChoiceSelectionCount } from './requirements';
import type {
    ChoiceBias,
    ChoiceSignalMap,
    GameModeInterpretation,
    LoadedChoice,
    LoadedCyoa,
    PlayState,
    ResultPressure,
    SourceId
} from './types';

export type WeightedResult = {
    id: SourceId;
    label?: string;
    weights: ChoiceSignalMap;
};

export type WeightedMatrix = {
    id?: string;
    results: WeightedResult[];
};

export type WeightedMatrixSnapshot = {
    selectedSignals: ChoiceSignalMap;
    resultPressures: ResultPressure[];
    choiceBiases: ChoiceBias[];
};

export function createWeightedMatrixGameMode(matrix: WeightedMatrix): GameModeInterpretation {
    return {
        id: matrix.id ?? 'weighted-matrix',
        interpret({ cyoa, state, snapshot }) {
            const matrixSnapshot = evaluateWeightedMatrix(cyoa, state, matrix);
            const availableChoiceIds = new Set(Object.values(snapshot.choiceStates)
                .filter((choiceState) => choiceState.availability === 'available')
                .map((choiceState) => choiceState.id));

            return {
                resultPressures: matrixSnapshot.resultPressures,
                choiceBiases: matrixSnapshot.choiceBiases.filter((bias) => availableChoiceIds.has(bias.choiceId))
            };
        }
    };
}

export function evaluateWeightedMatrix(
    cyoa: LoadedCyoa,
    state: PlayState,
    matrix: WeightedMatrix
): WeightedMatrixSnapshot {
    const selectedSignals = collectSelectedSignals(cyoa, state);
    const resultPressures = matrix.results
        .map((result) => scoreResult(result, selectedSignals))
        .sort((left, right) => right.score - left.score)
        .map((pressure, index) => ({
            ...pressure,
            rank: index + 1
        }));

    const leadingResult = resultPressures[0];
    const choiceBiases = leadingResult
        ? cyoa.choices
            .filter((choice) => getChoiceSelectionCount(state, choice.id) === 0)
            .map((choice) => ({
                choiceId: choice.id,
                resultId: leadingResult.resultId,
                contribution: dotProduct(choice.signals ?? {}, matrix.results.find((result) => result.id === leadingResult.resultId)?.weights ?? {})
            }))
            .filter((bias) => bias.contribution !== 0)
            .sort((left, right) => right.contribution - left.contribution)
        : [];

    return {
        selectedSignals,
        resultPressures,
        choiceBiases
    };
}

export function collectSelectedSignals(cyoa: LoadedCyoa, state: PlayState): ChoiceSignalMap {
    return cyoa.choices.reduce<ChoiceSignalMap>((signals, choice) => {
        const selectedCount = getChoiceSelectionCount(state, choice.id);
        if (selectedCount === 0) {
            return signals;
        }

        for (const [signal, value] of Object.entries(choice.signals ?? {})) {
            signals[signal] = (signals[signal] ?? 0) + value * selectedCount;
        }

        return signals;
    }, {});
}

function scoreResult(result: WeightedResult, selectedSignals: ChoiceSignalMap): ResultPressure {
    const score = dotProduct(selectedSignals, result.weights);
    const weightMagnitude = Object.values(result.weights).reduce((sum, weight) => sum + Math.abs(weight), 0);

    return {
        resultId: result.id,
        score,
        rank: 0,
        normalizedScore: weightMagnitude === 0 ? 0 : score / weightMagnitude
    };
}

function dotProduct(left: ChoiceSignalMap, right: ChoiceSignalMap): number {
    return Object.entries(left).reduce((sum, [signal, value]) => sum + value * (right[signal] ?? 0), 0);
}

