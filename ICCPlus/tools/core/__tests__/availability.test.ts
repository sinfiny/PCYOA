import assert from 'node:assert/strict';
import {
    advanceAvailability,
    createInitialPlayState,
    createWeightedMatrixGameMode,
    derivePlaySnapshot,
    evaluateWeightedMatrix
} from '../../../src/lib/core/index';
import type { LoadedCyoa } from '../../../src/lib/core/index';

const tinyCyoa: LoadedCyoa = {
    id: 'tiny',
    rows: [{
        id: 'origin',
        allowedChoices: 1
    }, {
        id: 'locked',
        requireds: [{
            kind: 'choice-selected',
            choiceId: 'brave'
        }]
    }],
    choices: [{
        id: 'brave',
        rowId: 'origin',
        title: 'Brave',
        pointEffects: [{
            pointId: 'courage',
            value: 2
        }],
        signals: {
            bold: 2,
            gentle: -1
        }
    }, {
        id: 'quiet',
        rowId: 'origin',
        title: 'Quiet',
        pointEffects: [{
            pointId: 'courage',
            value: -1
        }],
        signals: {
            gentle: 2
        }
    }, {
        id: 'follow-through',
        rowId: 'locked',
        title: 'Follow Through',
        requireds: [{
            kind: 'point-threshold',
            pointId: 'courage',
            operator: '>=',
            value: 2
        }],
        signals: {
            bold: 1
        }
    }],
    points: [{
        id: 'courage',
        initial: 0,
        floor: 0
    }]
};

const initialState = createInitialPlayState(tinyCyoa);
const initialSnapshot = derivePlaySnapshot(tinyCyoa, initialState);

assert.equal(initialSnapshot.choiceStates.brave.availability, 'available');
assert.equal(initialSnapshot.choiceStates['follow-through'].availability, 'unavailable');
assert.equal(initialSnapshot.pointTotals.courage, 0);

const quietTransition = advanceAvailability(tinyCyoa, initialState, {
    type: 'select-choice',
    choiceId: 'quiet'
});

assert.equal(quietTransition.accepted, false);
assert.equal(quietTransition.rejection?.code, 'floor-violation');
assert.equal(initialSnapshot.pointTotals.courage, 0);

const braveTransition = advanceAvailability(tinyCyoa, initialState, {
    type: 'select-choice',
    choiceId: 'brave'
});

assert.equal(braveTransition.accepted, true);
assert.equal(braveTransition.snapshot.pointTotals.courage, 2);
assert.equal(braveTransition.snapshot.choiceStates.brave.availability, 'selected');
assert.equal(braveTransition.snapshot.choiceStates.quiet.availability, 'unavailable');
assert.equal(braveTransition.snapshot.choiceStates['follow-through'].availability, 'available');

const capacityTransition = advanceAvailability(tinyCyoa, braveTransition.state, {
    type: 'select-choice',
    choiceId: 'quiet'
});

assert.equal(capacityTransition.accepted, false);
assert.equal(capacityTransition.rejection?.code, 'row-capacity');

const weightedMatrix = {
    results: [{
        id: 'hero-ending',
        weights: {
            bold: 2,
            gentle: -1
        }
    }, {
        id: 'healer-ending',
        weights: {
            gentle: 2
        }
    }]
};

const matrixSnapshot = evaluateWeightedMatrix(tinyCyoa, braveTransition.state, weightedMatrix);
assert.equal(matrixSnapshot.resultPressures[0]?.resultId, 'hero-ending');
assert.equal(matrixSnapshot.selectedSignals.bold, 2);

const weightedSnapshot = derivePlaySnapshot(tinyCyoa, braveTransition.state, {
    gameModes: [createWeightedMatrixGameMode(weightedMatrix)]
});

assert.equal(weightedSnapshot.gameMode['weighted-matrix'].resultPressures?.[0]?.resultId, 'hero-ending');
assert.equal(weightedSnapshot.gameMode['weighted-matrix'].choiceBiases?.[0]?.choiceId, 'follow-through');

console.log('availability core tests passed');

