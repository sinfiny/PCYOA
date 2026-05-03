import type { SourceHealthReport } from './diagnostics';

export function hasHealthErrors(report: SourceHealthReport): boolean {
    return report.diagnostics.some((diagnostic) => diagnostic.level === 'error');
}

export function formatHealthReport(report: SourceHealthReport): string {
    const lines = [
        'Source health:',
        `  promoted lore: ${report.promotedLoreCount}`,
        `  quarantined material: ${report.quarantinedCount}`,
        `  legacy ID mappings: ${report.legacyIdMapCount}`,
        `  legacy quarantine entries: ${report.legacyQuarantineCount}`,
        `  lore-only objects: ${report.loreOnlyCount}`,
        `  rules-only objects: ${report.rulesOnlyCount}`,
        `  unresolved IDs: ${report.unresolvedIds.length}`,
        `  missing expected files: ${report.missingExpectedFiles.length}`,
        `  lossy conversions: ${report.lossyConversionCount}`
    ];

    if (report.diagnostics.length > 0) {
        lines.push('Diagnostics:');
        for (const diagnostic of report.diagnostics) {
            const location = diagnostic.sourceId ?? diagnostic.path;
            lines.push(`  [${diagnostic.level}] ${diagnostic.code}${location ? ` (${location})` : ''}: ${diagnostic.message}`);
        }
    }

    return lines.join('\n');
}

