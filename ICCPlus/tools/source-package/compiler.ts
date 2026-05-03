import type { Choice, Requireds, Row, Score } from '$lib/store/types';
import type { LoadedSourceObject, LoadedSourceProjectPackage, PartialProjectFile, ProjectFile } from './schema';
import { createHealthReport, type SourceDiagnostic, type SourceHealthReport } from './diagnostics';

export type QuarantineCompilationPolicy = 'include' | 'exclude';

export type CompileSourceProjectOptions = {
    baseProjectFile?: PartialProjectFile;
    quarantinePolicy?: QuarantineCompilationPolicy;
    requireLegacyIds?: boolean;
};

export type CompileSourceProjectResult = {
    projectFile: PartialProjectFile;
    health: SourceHealthReport;
};

export function compileSourceProjectPackage(
    pkg: LoadedSourceProjectPackage,
    options: CompileSourceProjectOptions = {}
): CompileSourceProjectResult {
    const diagnostics: SourceDiagnostic[] = [];
    const projectFile: PartialProjectFile = structuredClone(options.baseProjectFile ?? pkg.legacyBaseProjectFile ?? {});
    const rowsBySourceId = new Map<string, Row>();
    const choicesByParent = new Map<string, Choice[]>();
    const legacyIds = pkg.legacyIdMap.ids;

    for (const object of getAuthoringObjects(pkg.objects)) {
        if (options.requireLegacyIds && !legacyIds[object.id]) {
            diagnostics.push({
                level: 'error',
                code: 'missing-legacy-id',
                message: `No Legacy ID Map entry exists for Source ID '${object.id}'.`,
                sourceId: object.id
            });
        }

        if (object.type === 'row') {
            rowsBySourceId.set(object.id, buildRow(object, legacyIds[object.id] ?? object.id));
        }

        if (object.type === 'choice') {
            const choice = buildChoice(object, legacyIds[object.id] ?? object.id);
            const parent = object.parent ?? '';
            choicesByParent.set(parent, [...(choicesByParent.get(parent) ?? []), choice]);
        }
    }

    const rows = [...rowsBySourceId.entries()]
        .sort(([, a], [, b]) => a.index - b.index)
        .map(([sourceId, row]) => ({
            ...row,
            objects: (choicesByParent.get(sourceId) ?? []).sort((a, b) => a.index - b.index)
        }));

    projectFile.rows = rows;
    projectFile.pointTypes = pkg.infrastructure.points ?? projectFile.pointTypes ?? [];
    projectFile.variables = pkg.infrastructure.variables ?? projectFile.variables ?? [];
    projectFile.groups = pkg.infrastructure.groups ?? projectFile.groups ?? [];
    projectFile.globalRequirements = pkg.infrastructure.globalRequirements ?? projectFile.globalRequirements ?? [];

    if (options.quarantinePolicy === 'include') {
        includeQuarantinedLegacyRows(projectFile, pkg);
    }

    const health = createHealthReport(pkg, diagnostics);
    return { projectFile, health };
}

export function compileToLegacyProjectFile(
    pkg: LoadedSourceProjectPackage,
    baseProjectFile: ProjectFile,
    options: Omit<CompileSourceProjectOptions, 'baseProjectFile'> = {}
): { projectFile: ProjectFile; health: SourceHealthReport } {
    const result = compileSourceProjectPackage(pkg, { ...options, baseProjectFile });
    return {
        projectFile: result.projectFile as ProjectFile,
        health: result.health
    };
}

export function getAuthoringObjects(objects: LoadedSourceObject[]): LoadedSourceObject[] {
    return objects.filter((object) => object.status === 'canonical' || object.status === 'draft');
}

export function getQuarantinedObjects(objects: LoadedSourceObject[]): LoadedSourceObject[] {
    return objects.filter((object) => object.status === 'quarantined');
}

export function createAuthoringContext(pkg: LoadedSourceProjectPackage): LoadedSourceProjectPackage {
    return {
        ...pkg,
        objects: getAuthoringObjects(pkg.objects),
        legacyQuarantine: []
    };
}

function buildRow(object: LoadedSourceObject, legacyId: string): Row {
    const rule = object.ruleModule?.type === 'row' ? object.ruleModule : undefined;

    return {
        id: legacyId,
        index: object.order ?? 0,
        title: object.title ?? legacyId,
        titleText: object.loreMarkdown ?? '',
        debugTitle: object.id,
        objectWidth: rule?.objectWidth ?? 'col-12',
        image: object.media[0] ?? '',
        template: 1,
        defaultAspectWidth: 1,
        defaultAspectHeight: 1,
        allowedChoices: rule?.allowedChoices ?? 0,
        currentChoices: 0,
        requireds: (rule?.requireds ?? []) as Requireds[],
        objects: []
    };
}

function buildChoice(object: LoadedSourceObject, legacyId: string): Choice {
    const rule = object.ruleModule?.type === 'choice' ? object.ruleModule : undefined;

    return {
        id: legacyId,
        index: object.order ?? 0,
        title: object.title ?? legacyId,
        text: object.loreMarkdown ?? '',
        debugTitle: object.id,
        image: object.media[0] ?? '',
        template: 1,
        objectWidth: '',
        isActive: false,
        multipleUseVariable: 0,
        selectedThisManyTimesProp: 0,
        requireds: (rule?.requireds ?? []) as Requireds[],
        addons: [],
        scores: (rule?.scores ?? []).map((score, index) => ({
            idx: `${index}`,
            id: score.id,
            value: score.value,
            type: score.type ?? 'pluss',
            beforeText: score.beforeText ?? '',
            afterText: score.afterText ?? '',
            requireds: (score.requireds ?? []) as Requireds[],
            showScore: score.showScore ?? true
        } satisfies Score)),
        groups: rule?.groups ?? [],
        isNotSelectable: rule?.isNotSelectable
    };
}

function includeQuarantinedLegacyRows(projectFile: PartialProjectFile, pkg: LoadedSourceProjectPackage) {
    const rows = [...(projectFile.rows ?? [])];

    for (const entry of pkg.legacyQuarantine) {
        if (entry.type === 'row' && isLegacyRow(entry.legacyData)) {
            rows.push(entry.legacyData as Row);
        }
        if (entry.type === 'choice' && isLegacyChoice(entry.legacyData)) {
            const quarantineRow = rows.find((row) => row.id === 'legacy-quarantine') ?? createQuarantineRow(rows.length);
            if (!rows.includes(quarantineRow)) {
                rows.push(quarantineRow);
            }
            quarantineRow.objects.push(entry.legacyData as Choice);
        }
    }

    projectFile.rows = rows;
}

function createQuarantineRow(index: number): Row {
    return {
        id: 'legacy-quarantine',
        index,
        title: 'Legacy Quarantine',
        titleText: '',
        objectWidth: 'col-12',
        image: '',
        template: 1,
        defaultAspectWidth: 1,
        defaultAspectHeight: 1,
        allowedChoices: 0,
        currentChoices: 0,
        requireds: [],
        objects: []
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLegacyRow(value: unknown): value is Row {
    return isRecord(value)
        && typeof value.id === 'string'
        && typeof value.title === 'string'
        && Array.isArray(value.objects)
        && Array.isArray(value.requireds);
}

function isLegacyChoice(value: unknown): value is Choice {
    return isRecord(value)
        && typeof value.id === 'string'
        && typeof value.title === 'string'
        && Array.isArray(value.requireds)
        && Array.isArray(value.scores)
        && Array.isArray(value.addons);
}
