import type { App, Choice, Row } from '$lib/store/types';
import type { LegacyQuarantineEntry, SourceIndex, SourceIndexEntry, SourcePackageFiles } from './schema';
import { loadSourceProjectPackage } from './loader';

export type DecomposeProjectFileOptions = {
    packageId?: string;
    title?: string;
    quarantineStyling?: boolean;
    quarantineDefaultText?: boolean;
};

const DEFAULT_ROW_TEXT_START = 'This is a row, and inside of it';
const DEFAULT_CHOICE_TEXT_START = 'This is a Choice, and inside of it';

export function decomposeProjectFile(projectFile: App, options: DecomposeProjectFileOptions = {}) {
    const files = createSourcePackageFiles(projectFile, options);
    return {
        files,
        ...loadSourceProjectPackage(files)
    };
}

export function createSourcePackageFiles(projectFile: App, options: DecomposeProjectFileOptions = {}): SourcePackageFiles {
    const packageId = slugify(options.packageId ?? options.title ?? projectFile.viewerConfig?.title ?? 'source-project');
    const sourceIndex: SourceIndex = {
        schemaVersion: 1,
        packageId,
        title: options.title ?? projectFile.viewerConfig?.title ?? 'Source Project Package',
        objects: [],
        infrastructureRules: ['rules/infrastructure.json'],
        contentMedia: []
    };
    const files: SourcePackageFiles = {};
    const legacyIds: Record<string, string> = {};
    const quarantine: LegacyQuarantineEntry[] = [];

    for (const [rowIndex, row] of (projectFile.rows ?? []).entries()) {
        const rowSourceId = uniqueSourceId(sourceIndex.objects, slugify(row.debugTitle || row.title || row.id || `row-${rowIndex + 1}`));
        const rowLorePath = `lore/rows/${rowSourceId}.md`;
        const rowRulesPath = `rules/rows/${rowSourceId}.json`;
        const rowLore = shouldPromoteLore(row.titleText, options.quarantineDefaultText, DEFAULT_ROW_TEXT_START);

        sourceIndex.objects.push({
            id: rowSourceId,
            type: 'row',
            kind: rowLore ? 'lore-and-rules' : 'rules-only',
            status: 'canonical',
            title: plainText(row.title) || row.id,
            order: rowIndex,
            lore: rowLore ? rowLorePath : undefined,
            rules: rowRulesPath,
            media: collectMedia(row.image),
            presentationHints: {}
        });
        legacyIds[rowSourceId] = row.id;

        if (rowLore) {
            files[rowLorePath] = row.titleText;
        } else if (row.titleText) {
            quarantine.push(toQuarantine(rowSourceId, row.id, 'row', 'default-or-low-value-lore', row));
        }

        files[rowRulesPath] = JSON.stringify({
            sourceId: rowSourceId,
            type: 'row',
            allowedChoices: row.allowedChoices,
            requireds: row.requireds,
            objectWidth: row.objectWidth
        }, null, 2);

        if (options.quarantineStyling !== false && hasLegacyStyling(row)) {
            quarantine.push(toQuarantine(rowSourceId, row.id, 'row', 'legacy-styling', pickStylingData(row)));
        }

        for (const [choiceIndex, choice] of (row.objects ?? []).entries()) {
            addChoice(files, sourceIndex, legacyIds, quarantine, choice, rowSourceId, choiceIndex, options);
        }
    }

    files['source-index.json'] = JSON.stringify(sourceIndex, null, 2);
    files['legacy/base-project.json'] = JSON.stringify(projectFile, null, 2);
    files['legacy/id-map.json'] = JSON.stringify({ schemaVersion: 1, ids: legacyIds }, null, 2);
    files['legacy/quarantine.json'] = JSON.stringify(quarantine, null, 2);
    files['rules/infrastructure.json'] = JSON.stringify({
        points: projectFile.pointTypes ?? [],
        variables: projectFile.variables ?? [],
        groups: projectFile.groups ?? [],
        globalRequirements: projectFile.globalRequirements ?? []
    }, null, 2);

    return files;
}

function addChoice(
    files: SourcePackageFiles,
    sourceIndex: SourceIndex,
    legacyIds: Record<string, string>,
    quarantine: LegacyQuarantineEntry[],
    choice: Choice,
    parent: string,
    order: number,
    options: DecomposeProjectFileOptions
) {
    const choiceSourceId = uniqueSourceId(sourceIndex.objects, slugify(choice.debugTitle || choice.title || choice.id || `choice-${order + 1}`));
    const choiceLorePath = `lore/choices/${choiceSourceId}.md`;
    const choiceRulesPath = `rules/choices/${choiceSourceId}.json`;
    const choiceLore = shouldPromoteLore(choice.text, options.quarantineDefaultText, DEFAULT_CHOICE_TEXT_START);

    sourceIndex.objects.push({
        id: choiceSourceId,
        type: 'choice',
        kind: choiceLore ? 'lore-and-rules' : 'rules-only',
        status: 'canonical',
        title: plainText(choice.title) || choice.id,
        parent,
        order,
        lore: choiceLore ? choiceLorePath : undefined,
        rules: choiceRulesPath,
        media: collectMedia(choice.image),
        presentationHints: {}
    });
    legacyIds[choiceSourceId] = choice.id;

    if (choiceLore) {
        files[choiceLorePath] = choice.text;
    } else if (choice.text) {
        quarantine.push(toQuarantine(choiceSourceId, choice.id, 'choice', 'default-or-low-value-lore', choice));
    }

    files[choiceRulesPath] = JSON.stringify({
        sourceId: choiceSourceId,
        type: 'choice',
        scores: choice.scores,
        requireds: choice.requireds,
        groups: choice.groups,
        isNotSelectable: choice.isNotSelectable
    }, null, 2);

    if (options.quarantineStyling !== false && hasLegacyStyling(choice)) {
        quarantine.push(toQuarantine(choiceSourceId, choice.id, 'choice', 'legacy-styling', pickStylingData(choice)));
    }
}

function shouldPromoteLore(text: string | undefined, quarantineDefaultText = true, defaultStart: string): boolean {
    if (!text?.trim()) {
        return false;
    }
    if (quarantineDefaultText && plainText(text).startsWith(defaultStart)) {
        return false;
    }
    return true;
}

function uniqueSourceId(entries: SourceIndexEntry[], preferred: string): string {
    let id = preferred || 'source-object';
    let suffix = 2;
    while (entries.some((entry) => entry.id === id)) {
        id = `${preferred}-${suffix}`;
        suffix += 1;
    }
    return id;
}

function slugify(value: string): string {
    const slug = plainText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return /^[a-z]/.test(slug) ? slug : `source-${slug || 'object'}`;
}

function plainText(value: string): string {
    return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function collectMedia(image?: string): string[] {
    return image ? [image] : [];
}

function hasLegacyStyling(value: Row | Choice): boolean {
    return Boolean(value.isPrivateStyling || value.styling);
}

function pickStylingData(value: Row | Choice): unknown {
    return {
        isPrivateStyling: value.isPrivateStyling,
        styling: value.styling
    };
}

function toQuarantine(sourceId: string, legacyId: string, type: 'row' | 'choice', reason: string, legacyData: unknown): LegacyQuarantineEntry {
    return {
        sourceId,
        legacyId,
        type,
        reason,
        legacyData
    };
}
