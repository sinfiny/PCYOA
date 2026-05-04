import type { ChoiceSignalMap, SourceId } from '../core';

export type SourceStatus = 'canonical' | 'draft' | 'quarantined' | 'retired';
export type SourceObjectType = 'row' | 'choice' | 'point' | 'variable' | 'group' | 'global-requirement' | 'ending' | 'world-note';
export type SourceObjectKind = 'lore-only' | 'rules-only' | 'lore-and-rules';

export type SourceIndexEntry = {
    id: SourceId;
    type: SourceObjectType;
    kind: SourceObjectKind;
    status: SourceStatus;
    title?: string;
    parent?: SourceId;
    order?: number;
    lore?: string;
    rules?: string;
    media: string[];
    presentationHints: {
        signals?: ChoiceSignalMap;
        [key: string]: unknown;
    };
};

export type SourceIndex = {
    schemaVersion: 1;
    packageId: SourceId;
    title: string;
    objects: SourceIndexEntry[];
    infrastructureRules: string[];
    contentMedia: Array<{
        id: SourceId;
        path: string;
        role: 'portrait' | 'illustration' | 'map' | 'icon' | 'audio' | 'other';
        sourceObject?: SourceId;
    }>;
};

export type DeclarativeRequirement = {
    required: boolean;
    requireds?: DeclarativeRequirement[];
    orRequired?: Array<{ req?: string }>;
    orRequireds?: DeclarativeRequirement[];
    id?: string;
    type: string;
    reqId: SourceId;
    reqId1?: SourceId;
    reqId2?: SourceId;
    reqId3?: SourceId;
    reqPoints: number;
    showRequired?: boolean;
    hideRequired?: boolean;
    hideRequired2?: boolean;
    operator?: string;
    afterText?: string;
    beforeText?: string;
    orNum?: number;
    selNum?: number;
    selFromOperators?: string;
    selGroups?: SourceId[];
    selRows?: SourceId[];
    more?: Array<{
        operator?: string;
        type?: string;
        id?: SourceId;
        points?: number;
        priority?: number;
    }>;
    customTextIsOn?: boolean;
    customText?: string;
};

export type DeclarativeScore = {
    id: SourceId;
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

export type RuleModule = RowRuleModule | ChoiceRuleModule;

export type SourcePointDefinition = {
    id: SourceId;
    name?: string;
    startingSum?: number;
    initValue?: number;
    belowZeroNotAllowed?: boolean;
    allowFloat?: boolean;
    decimalPlaces?: number;
};

export type SourceVariableDefinition = {
    id: SourceId;
    isTrue: boolean;
};

export type SourceGroupDefinition = {
    id: SourceId;
    name?: string;
    elements: SourceId[];
    rowElements: SourceId[];
};

export type SourceGlobalRequirementDefinition = {
    id: SourceId;
    name?: string;
    requireds: DeclarativeRequirement[];
};

export type InfrastructureRuleModule = {
    points?: SourcePointDefinition[];
    variables?: SourceVariableDefinition[];
    groups?: SourceGroupDefinition[];
    globalRequirements?: SourceGlobalRequirementDefinition[];
};

export type LoadedSourceObject = SourceIndexEntry & {
    loreMarkdown?: string;
    ruleModule?: RuleModule;
};

export type LegacyQuarantineEntry = {
    sourceId: SourceId;
    legacyId: string;
    type: SourceObjectType;
    reason: string;
    legacyData: unknown;
};

export type LoadedSourceProjectPackage = {
    sourceIndex: SourceIndex;
    objects: LoadedSourceObject[];
    infrastructure: InfrastructureRuleModule;
    legacyQuarantine?: LegacyQuarantineEntry[];
};
