import { z } from 'zod';
import type { App, Choice, GlobalRequirement, Group, PointType, Requireds, Row, Variable } from '$lib/store/types';

export const SourceIdSchema = z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case Source IDs.');

export const SourceStatusSchema = z.enum(['canonical', 'draft', 'quarantined', 'retired']);
export const SourceObjectTypeSchema = z.enum([
    'row',
    'choice',
    'point',
    'variable',
    'group',
    'global-requirement',
    'ending',
    'world-note'
]);
export const SourceObjectKindSchema = z.enum(['lore-only', 'rules-only', 'lore-and-rules']);

export type SourceId = z.infer<typeof SourceIdSchema>;
export type SourceStatus = z.infer<typeof SourceStatusSchema>;
export type SourceObjectType = z.infer<typeof SourceObjectTypeSchema>;
export type SourceObjectKind = z.infer<typeof SourceObjectKindSchema>;

export const SourceIndexEntrySchema = z.object({
    id: SourceIdSchema,
    type: SourceObjectTypeSchema,
    kind: SourceObjectKindSchema,
    status: SourceStatusSchema.default('canonical'),
    title: z.string().optional(),
    parent: SourceIdSchema.optional(),
    order: z.number().int().nonnegative().optional(),
    lore: z.string().optional(),
    rules: z.string().optional(),
    media: z.array(z.string()).default([]),
    presentationHints: z.record(z.string(), z.unknown()).default({})
}).superRefine((entry, ctx) => {
    if ((entry.kind === 'lore-only' || entry.kind === 'lore-and-rules') && !entry.lore) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['lore'],
            message: `${entry.kind} entries must declare a Lore File path.`
        });
    }

    if ((entry.kind === 'rules-only' || entry.kind === 'lore-and-rules') && !entry.rules) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['rules'],
            message: `${entry.kind} entries must declare a Rule Module path.`
        });
    }
});

export type SourceIndexEntry = z.infer<typeof SourceIndexEntrySchema>;

export const SourceIndexSchema = z.object({
    schemaVersion: z.literal(1),
    packageId: SourceIdSchema,
    title: z.string(),
    objects: z.array(SourceIndexEntrySchema),
    infrastructureRules: z.array(z.string()).default([]),
    contentMedia: z.array(z.object({
        id: SourceIdSchema,
        path: z.string(),
        role: z.enum(['portrait', 'illustration', 'map', 'icon', 'audio', 'other']).default('other'),
        sourceObject: SourceIdSchema.optional()
    })).default([])
}).superRefine((index, ctx) => {
    const seen = new Set<string>();

    for (let i = 0; i < index.objects.length; i++) {
        const entry = index.objects[i];
        if (seen.has(entry.id)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['objects', i, 'id'],
                message: `Duplicate Source ID '${entry.id}'.`
            });
        }
        seen.add(entry.id);

        if (entry.parent && !index.objects.some((candidate) => candidate.id === entry.parent)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['objects', i, 'parent'],
                message: `Parent Source ID '${entry.parent}' is not present in the Source Index.`
            });
        }
    }
});

export type SourceIndex = z.infer<typeof SourceIndexSchema>;

export const LegacyIdMapSchema = z.object({
    schemaVersion: z.literal(1),
    ids: z.record(SourceIdSchema, z.string().min(1))
});

export type LegacyIdMap = z.infer<typeof LegacyIdMapSchema>;

export type DeclarativeRequirement = Pick<
    Requireds,
    'type' | 'reqId' | 'reqPoints' | 'operator' | 'required' | 'showRequired' | 'afterText' | 'beforeText'
> & Partial<Requireds>;

export type DeclarativeScore = {
    id: string;
    value: number;
    type?: string;
    beforeText?: string;
    afterText?: string;
    requireds?: DeclarativeRequirement[];
    showScore?: boolean;
};

export type RowRuleModule = {
    sourceId: SourceId;
    type: 'row';
    allowedChoices?: number;
    requireds?: DeclarativeRequirement[];
    objectWidth?: string;
};

export type ChoiceRuleModule = {
    sourceId: SourceId;
    type: 'choice';
    scores?: DeclarativeScore[];
    requireds?: DeclarativeRequirement[];
    groups?: SourceId[];
    isNotSelectable?: boolean;
};

export type InfrastructureRuleModule = {
    points?: PointType[];
    variables?: Variable[];
    groups?: Group[];
    globalRequirements?: GlobalRequirement[];
};

export type RuleModule = RowRuleModule | ChoiceRuleModule;

export type LoadedSourceObject = SourceIndexEntry & {
    loreMarkdown?: string;
    ruleModule?: RuleModule;
};

export type LoadedSourceProjectPackage = {
    sourceIndex: SourceIndex;
    legacyIdMap: LegacyIdMap;
    objects: LoadedSourceObject[];
    infrastructure: InfrastructureRuleModule;
    legacyQuarantine: LegacyQuarantineEntry[];
    legacyBaseProjectFile?: PartialProjectFile;
};

export type LegacyQuarantineEntry = {
    sourceId: SourceId;
    legacyId: string;
    type: SourceObjectType;
    reason: string;
    legacyData: unknown;
};

export type SourcePackageFiles = Record<string, string>;

export type ProjectFile = App;
export type PartialProjectFile = Partial<App> & {
    rows?: Row[];
    pointTypes?: PointType[];
    variables?: Variable[];
    groups?: Group[];
    globalRequirements?: GlobalRequirement[];
};
