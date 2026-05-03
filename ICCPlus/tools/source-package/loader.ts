import { LegacyIdMapSchema, SourceIndexSchema, type InfrastructureRuleModule, type LoadedSourceProjectPackage, type RuleModule, type SourcePackageFiles } from './schema';
import { createHealthReport, type SourceDiagnostic, type SourceHealthReport } from './diagnostics';

export type SourcePackageLoadResult = {
    package?: LoadedSourceProjectPackage;
    health: SourceHealthReport;
};

const EMPTY_LEGACY_ID_MAP = { schemaVersion: 1 as const, ids: {} };

export function loadSourceProjectPackage(files: SourcePackageFiles): SourcePackageLoadResult {
    const diagnostics: SourceDiagnostic[] = [];
    const sourceIndexInput = parseJsonFile(files, 'source-index.json', diagnostics);
    const sourceIndexParsed = SourceIndexSchema.safeParse(sourceIndexInput);

    if (!sourceIndexParsed.success) {
        const health = createEmptyHealth(diagnostics.concat(sourceIndexParsed.error.issues.map((issue) => ({
            level: 'error',
            code: 'invalid-source-index',
            message: issue.message,
            path: issue.path.join('.')
        }))));
        return { health };
    }

    const legacyMapInput = files['legacy/id-map.json']
        ? parseJsonFile(files, 'legacy/id-map.json', diagnostics)
        : EMPTY_LEGACY_ID_MAP;
    const legacyMapParsed = LegacyIdMapSchema.safeParse(legacyMapInput);
    const legacyIdMap = legacyMapParsed.success ? legacyMapParsed.data : EMPTY_LEGACY_ID_MAP;

    if (!legacyMapParsed.success) {
        diagnostics.push(...legacyMapParsed.error.issues.map((issue) => ({
            level: 'error' as const,
            code: 'invalid-legacy-id-map',
            message: issue.message,
            path: issue.path.join('.')
        })));
    }

    const sourceIndex = sourceIndexParsed.data;
    const objects = sourceIndex.objects.map((entry) => {
        const loreMarkdown = entry.lore ? files[entry.lore] : undefined;
        const ruleModule = entry.rules ? parseRuleModule(files, entry.rules, diagnostics) : undefined;

        return {
            ...entry,
            loreMarkdown,
            ruleModule
        };
    });

    const infrastructure = sourceIndex.infrastructureRules.reduce<InfrastructureRuleModule>((acc, path) => {
        const module = parseInfrastructureModule(files, path, diagnostics);
        acc.points = [...(acc.points ?? []), ...(module.points ?? [])];
        acc.variables = [...(acc.variables ?? []), ...(module.variables ?? [])];
        acc.groups = [...(acc.groups ?? []), ...(module.groups ?? [])];
        acc.globalRequirements = [...(acc.globalRequirements ?? []), ...(module.globalRequirements ?? [])];
        return acc;
    }, {});

    const legacyQuarantine = files['legacy/quarantine.json']
        ? parseJsonFile(files, 'legacy/quarantine.json', diagnostics) ?? []
        : [];
    const legacyBaseProjectFile = files['legacy/base-project.json']
        ? parseJsonFile(files, 'legacy/base-project.json', diagnostics)
        : undefined;

    const pkg = {
        sourceIndex,
        legacyIdMap,
        objects,
        infrastructure,
        legacyQuarantine: Array.isArray(legacyQuarantine) ? legacyQuarantine : [],
        legacyBaseProjectFile: isRecord(legacyBaseProjectFile) ? legacyBaseProjectFile : undefined
    };

    return {
        package: pkg,
        health: createHealthReport(pkg, diagnostics)
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJsonFile(files: SourcePackageFiles, path: string, diagnostics: SourceDiagnostic[]): unknown {
    const text = files[path];
    if (typeof text !== 'string') {
        diagnostics.push({
            level: 'error',
            code: 'missing-file',
            message: `Missing source package file: ${path}.`,
            path
        });
        return undefined;
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        diagnostics.push({
            level: 'error',
            code: 'invalid-json',
            message: `Could not parse ${path}: ${error instanceof Error ? error.message : 'unknown parse error'}.`,
            path
        });
        return undefined;
    }
}

function parseRuleModule(files: SourcePackageFiles, path: string, diagnostics: SourceDiagnostic[]): RuleModule | undefined {
    const parsed = parseJsonFile(files, path, diagnostics);
    if (!parsed || typeof parsed !== 'object' || !('sourceId' in parsed) || !('type' in parsed)) {
        diagnostics.push({
            level: 'warning',
            code: 'unsupported-rule-module',
            message: `Rule Module ${path} must export declarative JSON-compatible rule data for this workflow.`,
            path
        });
        return undefined;
    }
    return parsed as RuleModule;
}

function parseInfrastructureModule(files: SourcePackageFiles, path: string, diagnostics: SourceDiagnostic[]): InfrastructureRuleModule {
    const parsed = parseJsonFile(files, path, diagnostics);
    if (!parsed || typeof parsed !== 'object') {
        diagnostics.push({
            level: 'warning',
            code: 'unsupported-infrastructure-rule-module',
            message: `Infrastructure Rule Module ${path} must export declarative JSON-compatible rule data for this workflow.`,
            path
        });
        return {};
    }
    return parsed as InfrastructureRuleModule;
}

function createEmptyHealth(diagnostics: SourceDiagnostic[]): SourceHealthReport {
    return {
        diagnostics,
        promotedLoreCount: 0,
        quarantinedCount: 0,
        legacyMaterialCount: 0,
        legacyIdMapCount: 0,
        legacyQuarantineCount: 0,
        unresolvedIds: [],
        missingExpectedFiles: [],
        loreOnlyCount: 0,
        rulesOnlyCount: 0,
        lossyConversionCount: 0
    };
}
