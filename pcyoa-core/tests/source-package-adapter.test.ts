import assert from 'node:assert/strict';
import { advanceAvailability, createInitialPlayState, derivePlaySnapshot, sourcePackageToLoadedCyoa } from '../src';
import type { LoadedSourceProjectPackage } from '../src';

const pkg: LoadedSourceProjectPackage = {
    sourceIndex: {
        schemaVersion: 1,
        packageId: 'adapter-test',
        title: 'Adapter Test',
        infrastructureRules: [],
        contentMedia: [],
        objects: [{
            id: 'origin',
            type: 'row',
            kind: 'rules-only',
            status: 'canonical',
            title: 'Origin',
            order: 0,
            rules: 'rules/rows/origin.json',
            media: [],
            presentationHints: {}
        }, {
            id: 'brave',
            type: 'choice',
            kind: 'rules-only',
            status: 'canonical',
            title: 'Brave',
            parent: 'origin',
            order: 0,
            rules: 'rules/choices/brave.json',
            media: [],
            presentationHints: {
                signals: {
                    bold: 2
                }
            }
        }, {
            id: 'quiet',
            type: 'choice',
            kind: 'rules-only',
            status: 'canonical',
            title: 'Quiet',
            parent: 'origin',
            order: 1,
            rules: 'rules/choices/quiet.json',
            media: [],
            presentationHints: {}
        }, {
            id: 'locked',
            type: 'choice',
            kind: 'rules-only',
            status: 'canonical',
            title: 'Locked',
            parent: 'origin',
            order: 2,
            rules: 'rules/choices/locked.json',
            media: [],
            presentationHints: {}
        }]
    },
    objects: [{
        id: 'origin',
        type: 'row',
        kind: 'rules-only',
        status: 'canonical',
        title: 'Origin',
        order: 0,
        rules: 'rules/rows/origin.json',
        media: [],
        presentationHints: {},
        ruleModule: {
            sourceId: 'origin',
            type: 'row',
            allowedChoices: 2
        }
    }, {
        id: 'brave',
        type: 'choice',
        kind: 'rules-only',
        status: 'canonical',
        title: 'Brave',
        parent: 'origin',
        order: 0,
        rules: 'rules/choices/brave.json',
        media: [],
        presentationHints: {
            signals: {
                bold: 2
            }
        },
        ruleModule: {
            sourceId: 'brave',
            type: 'choice',
            scores: [{
                id: 'courage',
                value: 2
            }]
        }
    }, {
        id: 'quiet',
        type: 'choice',
        kind: 'rules-only',
        status: 'canonical',
        title: 'Quiet',
        parent: 'origin',
        order: 1,
        rules: 'rules/choices/quiet.json',
        media: [],
        presentationHints: {},
        ruleModule: {
            sourceId: 'quiet',
            type: 'choice',
            requireds: [{
                required: true,
                requireds: [],
                orRequired: [],
                id: '',
                type: 'id',
                reqId: 'brave',
                reqId1: '',
                reqId2: '',
                reqId3: '',
                reqPoints: 0,
                showRequired: true,
                afterText: '',
                beforeText: ''
            }],
            scores: [{
                id: 'courage',
                value: 1
            }]
        }
    }, {
        id: 'locked',
        type: 'choice',
        kind: 'rules-only',
        status: 'canonical',
        title: 'Locked',
        parent: 'origin',
        order: 2,
        rules: 'rules/choices/locked.json',
        media: [],
        presentationHints: {},
        ruleModule: {
            sourceId: 'locked',
            type: 'choice',
            requireds: [{
                required: true,
                requireds: [],
                orRequired: [],
                id: '',
                type: 'points',
                reqId: 'courage',
                reqId1: '',
                reqId2: '',
                reqId3: '',
                reqPoints: 2,
                operator: '2',
                showRequired: true,
                afterText: '',
                beforeText: ''
            }]
        }
    }],
    infrastructure: {
        points: [{
            id: 'courage',
            name: 'Courage',
            startingSum: 0,
            initValue: 0,
            belowZeroNotAllowed: true
        }],
        variables: [],
        groups: [],
        globalRequirements: []
    },
    legacyQuarantine: []
};

const { cyoa, warnings } = sourcePackageToLoadedCyoa(pkg);

assert.deepEqual(warnings, []);
assert.equal(cyoa.id, 'adapter-test');
assert.equal(cyoa.rows[0]?.choiceIds?.join(','), 'brave,quiet,locked');
assert.equal(cyoa.points?.[0]?.floor, 0);
assert.equal(cyoa.choices[0]?.signals?.bold, 2);

const initialState = createInitialPlayState(cyoa);
const initialSnapshot = derivePlaySnapshot(cyoa, initialState);
assert.equal(initialSnapshot.choiceStates.brave.availability, 'available');
assert.equal(initialSnapshot.choiceStates.quiet.availability, 'unavailable');
assert.equal(initialSnapshot.choiceStates.locked.availability, 'unavailable');

const braveTransition = advanceAvailability(cyoa, initialState, {
    type: 'select-choice',
    choiceId: 'brave'
});

assert.equal(braveTransition.accepted, true);
assert.equal(braveTransition.snapshot.pointTotals.courage, 2);
assert.equal(braveTransition.snapshot.choiceStates.quiet.availability, 'available');
assert.equal(braveTransition.snapshot.choiceStates.locked.availability, 'available');

console.log('source package adapter tests passed');
