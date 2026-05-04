export type SourceId = string;

export type CountOperator = '>' | '>=' | '=' | '<=' | '<';

export type Requirement =
    | {
        kind: 'choice-selected';
        choiceId: SourceId;
        minSelections?: number;
        invert?: boolean;
    }
    | {
        kind: 'point-threshold';
        pointId: SourceId;
        operator: CountOperator;
        value: number;
    }
    | {
        kind: 'variable';
        variableId: SourceId;
        value?: boolean;
    }
    | {
        kind: 'row-selected';
        rowId: SourceId;
        operator: CountOperator;
        count: number;
    }
    | {
        kind: 'group-selected';
        groupId: SourceId;
        operator: CountOperator;
        count: number;
    }
    | {
        kind: 'selection-count';
        choiceIds?: SourceId[];
        rowIds?: SourceId[];
        groupIds?: SourceId[];
        operator: CountOperator;
        count: number;
    }
    | {
        kind: 'global';
        requirementId: SourceId;
        invert?: boolean;
    }
    | {
        kind: 'when';
        when: Requirement[];
        then: Requirement;
    }
    | {
        kind: 'all';
        requirements: Requirement[];
    }
    | {
        kind: 'any';
        requirements: Requirement[];
        min?: number;
    }
    | {
        kind: 'unsupported';
        message: string;
        sourceId?: SourceId;
    };

export type PointDefinition = {
    id: SourceId;
    label?: string;
    initial?: number;
    floor?: number;
    precision?: number;
};

export type VariableDefinition = {
    id: SourceId;
    initial?: boolean;
};

export type GroupDefinition = {
    id: SourceId;
    choiceIds?: SourceId[];
    rowIds?: SourceId[];
};

export type GlobalRequirementDefinition = {
    id: SourceId;
    requirements: Requirement[];
};

export type PointEffect = {
    pointId: SourceId;
    value: number;
    operation?: 'add' | 'set';
    perSelection?: boolean;
    requireds?: Requirement[];
};

export type ChoiceSignalMap = Record<string, number>;

export type LoadedChoice = {
    id: SourceId;
    rowId: SourceId;
    title?: string;
    requireds?: Requirement[];
    pointEffects?: PointEffect[];
    groups?: SourceId[];
    signals?: ChoiceSignalMap;
    selectable?: boolean;
    maxSelections?: number;
    countsTowardRow?: boolean;
};

export type LoadedRow = {
    id: SourceId;
    title?: string;
    choiceIds?: SourceId[];
    allowedChoices?: number;
    requireds?: Requirement[];
};

export type LoadedCyoa = {
    id?: SourceId;
    title?: string;
    rows: LoadedRow[];
    choices: LoadedChoice[];
    points?: PointDefinition[];
    variables?: VariableDefinition[];
    groups?: GroupDefinition[];
    globalRequirements?: GlobalRequirementDefinition[];
};

export type PlayState = {
    selectedChoices: Record<SourceId, number>;
    variables: Record<SourceId, boolean>;
    history: PlayerAction[];
};

export type PlayerAction =
    | {
        type: 'select-choice';
        choiceId: SourceId;
        count?: number;
    }
    | {
        type: 'deselect-choice';
        choiceId: SourceId;
        count?: number;
    }
    | {
        type: 'set-choice-count';
        choiceId: SourceId;
        count: number;
    }
    | {
        type: 'set-variable';
        variableId: SourceId;
        value: boolean;
    }
    | {
        type: 'reset';
    };

export type Availability = 'available' | 'selected' | 'unavailable';

export type UnavailableReasonCode =
    | 'missing-row'
    | 'not-selectable'
    | 'row-unavailable'
    | 'requirements-unmet'
    | 'row-capacity'
    | 'max-selections'
    | 'floor-violation';

export type UnavailableReason = {
    code: UnavailableReasonCode;
    message: string;
    sourceId?: SourceId;
};

export type ChoiceState = {
    id: SourceId;
    rowId: SourceId;
    selectedCount: number;
    availability: Availability;
    reasons: UnavailableReason[];
    maxSelections: number;
};

export type RowState = {
    id: SourceId;
    selectedCount: number;
    allowedChoices: number;
    isAvailable: boolean;
    reasons: UnavailableReason[];
};

export type ResultPressure = {
    resultId: SourceId;
    score: number;
    rank: number;
    normalizedScore: number;
};

export type ChoiceBias = {
    choiceId: SourceId;
    resultId: SourceId;
    contribution: number;
};

export type GameModeOutput = {
    resultPressures?: ResultPressure[];
    choiceBiases?: ChoiceBias[];
};

export type BasePlaySnapshot = {
    pointTotals: Record<SourceId, number>;
    rowStates: Record<SourceId, RowState>;
    choiceStates: Record<SourceId, ChoiceState>;
};

export type PlaySnapshot = BasePlaySnapshot & {
    gameMode: Record<string, GameModeOutput>;
};

export type GameModeInput = {
    cyoa: LoadedCyoa;
    state: PlayState;
    snapshot: BasePlaySnapshot;
};

export type GameModeInterpretation = {
    id: string;
    interpret(input: GameModeInput): GameModeOutput;
};

export type AvailabilityOptions = {
    gameModes?: GameModeInterpretation[];
};

export type Rejection = {
    code: UnavailableReasonCode | 'missing-choice' | 'not-selected' | 'invalid-count';
    message: string;
    sourceId?: SourceId;
};

export type AvailabilityTransition = {
    accepted: boolean;
    state: PlayState;
    snapshot: PlaySnapshot;
    rejection?: Rejection;
};
