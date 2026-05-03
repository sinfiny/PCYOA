import { SourceIndexSchema, type LoadedSourceProjectPackage, type SourceIndex } from './schema';

export type SourceDiagnosticLevel = 'error' | 'warning' | 'info';

export type SourceDiagnostic = {
    level: SourceDiagnosticLevel;
    code: string;
    message: string;
    sourceId?: string;
    path?: string;
};

export type SourceHealthReport = {
    diagnostics: SourceDiagnostic[];
    promotedLoreCount: number;
    quarantinedCount: number;
    legacyMaterialCount: number;
    legacyIdMapCount: number;
    legacyQuarantineCount: number;
    unresolvedIds: string[];
    missingExpectedFiles: string[];
    loreOnlyCount: number;
    rulesOnlyCount: number;
    lossyConversionCount: number;
};

export function validateSourceIndex(input: unknown): { index?: SourceIndex; diagnostics: SourceDiagnostic[] } {
    const parsed = SourceIndexSchema.safeParse(input);
    if (parsed.success) {
        return { index: parsed.data, diagnostics: [] };
    }

    return {
        diagnostics: parsed.error.issues.map((issue) => ({
            level: 'error',
            code: 'invalid-source-index',
            message: issue.message,
            path: issue.path.join('.')
        }))
    };
}

export function createHealthReport(pkg: LoadedSourceProjectPackage, extraDiagnostics: SourceDiagnostic[] = []): SourceHealthReport {
    const diagnostics = [...extraDiagnostics];
    const unresolvedIds = new Set<string>();
    const missingExpectedFiles = new Set<string>();
    let promotedLoreCount = 0;
    let loreOnlyCount = 0;
    let rulesOnlyCount = 0;
    const declaredIds = new Set(pkg.sourceIndex.objects.map((entry) => entry.id));

    for (const object of pkg.objects) {
        if (object.status !== 'quarantined' && object.loreMarkdown) {
            promotedLoreCount += 1;
        }
        if (object.kind === 'lore-only') {
            loreOnlyCount += 1;
        }
        if (object.kind === 'rules-only') {
            rulesOnlyCount += 1;
        }
        if ((object.kind === 'lore-only' || object.kind === 'lore-and-rules') && !object.loreMarkdown) {
            missingExpectedFiles.add(object.lore ?? `lore for ${object.id}`);
        }
        if ((object.kind === 'rules-only' || object.kind === 'lore-and-rules') && !object.ruleModule) {
            missingExpectedFiles.add(object.rules ?? `rules for ${object.id}`);
        }
        if (object.parent && !declaredIds.has(object.parent)) {
            unresolvedIds.add(object.parent);
        }
    }

    for (const path of missingExpectedFiles) {
        diagnostics.push({
            level: 'warning',
            code: 'missing-expected-file',
            message: `Expected source file is missing: ${path}.`,
            path
        });
    }

    for (const id of unresolvedIds) {
        diagnostics.push({
            level: 'error',
            code: 'unresolved-source-id',
            message: `Source ID '${id}' is referenced but not declared.`,
            sourceId: id
        });
    }

    const lossyConversionCount = diagnostics.filter((diagnostic) => diagnostic.code === 'lossy-conversion').length;
    const legacyIdMapCount = Object.keys(pkg.legacyIdMap.ids).length;
    const legacyQuarantineCount = pkg.legacyQuarantine.length;

    return {
        diagnostics,
        promotedLoreCount,
        quarantinedCount: legacyQuarantineCount + pkg.objects.filter((object) => object.status === 'quarantined').length,
        legacyMaterialCount: legacyIdMapCount + legacyQuarantineCount,
        legacyIdMapCount,
        legacyQuarantineCount,
        unresolvedIds: [...unresolvedIds],
        missingExpectedFiles: [...missingExpectedFiles],
        loreOnlyCount,
        rulesOnlyCount,
        lossyConversionCount
    };
}
