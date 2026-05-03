import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { compileSourceProjectPackage, createAuthoringContext, createSourcePackageFiles, getAuthoringObjects, loadSourceProjectPackage, readSourcePackageDirectory, runSourcePackageCli } from '../index';
import type { App } from '$lib/store/types';

const fixtureProject = {
    viewerConfig: {
        title: 'Tiny Test CYOA'
    },
    rows: [{
        id: 'row_legacy_1',
        index: 0,
        title: 'First Row',
        titleText: 'A real row introduction.',
        objectWidth: 'col-12',
        image: '',
        template: 1,
        defaultAspectWidth: 1,
        defaultAspectHeight: 1,
        allowedChoices: 0,
        currentChoices: 0,
        requireds: [],
        objects: [{
            id: 'choice_legacy_1',
            index: 0,
            title: 'Brave Choice',
            text: 'Choose the difficult road.',
            debugTitle: '',
            image: '',
            template: 1,
            objectWidth: '',
            isActive: false,
            multipleUseVariable: 0,
            selectedThisManyTimesProp: 0,
            requireds: [],
            addons: [],
            scores: [{
                idx: '0',
                id: 'courage',
                value: 1,
                type: 'pluss',
                beforeText: '',
                afterText: '',
                requireds: [],
                showScore: true
            }],
            groups: []
        }, {
            id: 'choice_default_text',
            index: 1,
            title: 'Default Choice',
            text: 'This is a Choice, and inside of it, you can place images and text.',
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
            isPrivateStyling: true,
            styling: { objectBgColor: '#fff' }
        }]
    }],
    pointTypes: [{
        id: 'courage',
        name: 'Courage',
        startingSum: 0,
        initValue: 0,
        activatedId: '',
        beforeText: '',
        afterText: ''
    }],
    variables: [],
    groups: [],
    globalRequirements: []
} as unknown as App;

const files = createSourcePackageFiles(fixtureProject);
assert.ok(files['source-index.json']);
assert.ok(files['legacy/id-map.json']);
assert.ok(files['legacy/quarantine.json']);
assert.ok(files['lore/rows/first-row.md']);
assert.ok(files['lore/choices/brave-choice.md']);

const loadResult = loadSourceProjectPackage(files);
assert.ok(loadResult.package);
assert.equal(loadResult.health.diagnostics.filter((diagnostic) => diagnostic.level === 'error').length, 0);
assert.equal(loadResult.health.promotedLoreCount, 2);
assert.equal(loadResult.health.quarantinedCount, 2);
assert.equal(loadResult.health.legacyIdMapCount, 3);
assert.equal(loadResult.health.legacyQuarantineCount, 2);

const pkg = loadResult.package;
assert.equal(getAuthoringObjects(pkg.objects).some((object) => object.status === 'quarantined'), false);
assert.equal(createAuthoringContext(pkg).legacyQuarantine.length, 0);

const compiled = compileSourceProjectPackage(pkg, { requireLegacyIds: true, quarantinePolicy: 'exclude' });
assert.equal(compiled.health.diagnostics.filter((diagnostic) => diagnostic.level === 'error').length, 0);
assert.equal(compiled.projectFile.rows?.[0]?.id, 'row_legacy_1');
assert.equal(compiled.projectFile.rows?.[0]?.objects[0]?.id, 'choice_legacy_1');
assert.equal(compiled.projectFile.rows?.[0]?.objects.length, 2);
assert.equal(compiled.projectFile.pointTypes?.[0]?.id, 'courage');

const compiledWithQuarantine = compileSourceProjectPackage(pkg, { quarantinePolicy: 'include' });
assert.ok((compiledWithQuarantine.projectFile.rows?.length ?? 0) >= 1);
assert.ok(compiledWithQuarantine.projectFile.rows?.some((row) => row.id === 'legacy-quarantine'));

const brokenFiles = { ...files };
delete brokenFiles['lore/choices/brave-choice.md'];
const brokenLoad = loadSourceProjectPackage(brokenFiles);
assert.ok(brokenLoad.health.missingExpectedFiles.includes('lore/choices/brave-choice.md'));

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'pcyoa-source-package-'));
try {
    const projectPath = path.join(tempRoot, 'project.json');
    const packageDir = path.join(tempRoot, 'source-package');
    const compiledPath = path.join(tempRoot, 'compiled.json');

    await writeFile(projectPath, JSON.stringify(fixtureProject), 'utf8');
    assert.equal(await runSourcePackageCli(['decompose', projectPath, packageDir]), 0);

    const directoryFiles = await readSourcePackageDirectory(packageDir);
    assert.ok(directoryFiles['source-index.json']);
    assert.equal(await runSourcePackageCli(['compile', packageDir, compiledPath, '--include-quarantine', '--require-legacy-ids']), 0);

    const compiledProject = JSON.parse(await readFile(compiledPath, 'utf8'));
    assert.equal(compiledProject.rows[0].id, 'row_legacy_1');
} finally {
    await rm(tempRoot, { recursive: true, force: true });
}

console.log('source-package tests passed');
