import type { LoadedCyoa, WeightedMatrix } from '../src';

export type ChoiceCopy = {
  tag: string;
  body: string;
};

export type RowCopy = {
  note: string;
};

export const demoCyoa: LoadedCyoa = {
  id: 'atlas-first-wedge',
  title: 'Atlas First Wedge',
  rows: [
    {
      id: 'opening-wedge',
      title: 'Opening Wedge',
      allowedChoices: 1,
      choiceIds: ['creator-mvp', 'archive-rescue', 'roleplay-bridge']
    },
    {
      id: 'tooling-instinct',
      title: 'Tooling Instinct',
      allowedChoices: 2,
      choiceIds: ['balance-assistant', 'comments-to-cards', 'mobile-first', 'fork-remix']
    },
    {
      id: 'first-release',
      title: 'First Release Texture',
      allowedChoices: 1,
      choiceIds: ['original-title', 'living-archive', 'continuation-mode']
    }
  ],
  choices: [
    {
      id: 'creator-mvp',
      rowId: 'opening-wedge',
      title: 'Creator MVP',
      pointEffects: [
        { pointId: 'creator', value: 2 },
        { pointId: 'roleplay', value: 1 }
      ],
      signals: {
        creation: 3,
        systems: 2,
        continuity: 1
      }
    },
    {
      id: 'archive-rescue',
      rowId: 'opening-wedge',
      title: 'Archive Rescue',
      pointEffects: [
        { pointId: 'preservation', value: 2 },
        { pointId: 'community', value: 1 }
      ],
      signals: {
        preservation: 3,
        care: 2,
        community: 1
      }
    },
    {
      id: 'roleplay-bridge',
      rowId: 'opening-wedge',
      title: 'Roleplay Bridge',
      pointEffects: [
        { pointId: 'roleplay', value: 2 },
        { pointId: 'creator', value: 1 }
      ],
      signals: {
        simulation: 3,
        continuity: 2,
        character: 2
      }
    },
    {
      id: 'balance-assistant',
      rowId: 'tooling-instinct',
      title: 'Balance Assistant',
      pointEffects: [
        { pointId: 'gamefeel', value: 2 },
        { pointId: 'creator', value: 1 }
      ],
      signals: {
        balance: 3,
        systems: 2,
        creation: 1
      }
    },
    {
      id: 'comments-to-cards',
      rowId: 'tooling-instinct',
      title: 'Comments Become Cards',
      pointEffects: [
        { pointId: 'community', value: 2 },
        { pointId: 'creator', value: 1 }
      ],
      signals: {
        community: 3,
        loop: 2,
        remix: 1
      }
    },
    {
      id: 'mobile-first',
      rowId: 'tooling-instinct',
      title: 'Mobile First',
      pointEffects: [
        { pointId: 'reach', value: 2 },
        { pointId: 'gamefeel', value: 1 }
      ],
      signals: {
        accessibility: 3,
        retention: 2
      }
    },
    {
      id: 'fork-remix',
      rowId: 'tooling-instinct',
      title: 'Fork And Remix',
      pointEffects: [
        { pointId: 'preservation', value: 1 },
        { pointId: 'community', value: 1 }
      ],
      signals: {
        remix: 3,
        preservation: 1,
        community: 1
      }
    },
    {
      id: 'original-title',
      rowId: 'first-release',
      title: 'Ship One Original CYOA',
      requireds: [
        {
          kind: 'point-threshold',
          pointId: 'creator',
          operator: '>=',
          value: 2
        }
      ],
      pointEffects: [
        { pointId: 'creator', value: 2 },
        { pointId: 'gamefeel', value: 1 }
      ],
      signals: {
        creation: 3,
        balance: 1,
        retention: 1
      }
    },
    {
      id: 'living-archive',
      rowId: 'first-release',
      title: 'Publish A Living Archive Cut',
      requireds: [
        {
          kind: 'point-threshold',
          pointId: 'preservation',
          operator: '>=',
          value: 2
        }
      ],
      pointEffects: [
        { pointId: 'preservation', value: 2 },
        { pointId: 'community', value: 1 }
      ],
      signals: {
        preservation: 3,
        care: 2,
        remix: 1
      }
    },
    {
      id: 'continuation-mode',
      rowId: 'first-release',
      title: 'Continue A Build Into Play',
      requireds: [
        {
          kind: 'point-threshold',
          pointId: 'roleplay',
          operator: '>=',
          value: 2
        }
      ],
      pointEffects: [
        { pointId: 'roleplay', value: 2 },
        { pointId: 'gamefeel', value: 1 }
      ],
      signals: {
        simulation: 3,
        continuity: 2,
        character: 2
      }
    }
  ],
  points: [
    { id: 'creator', label: 'Creator', initial: 0, floor: 0 },
    { id: 'preservation', label: 'Preservation', initial: 0, floor: 0 },
    { id: 'roleplay', label: 'Roleplay', initial: 0, floor: 0 },
    { id: 'gamefeel', label: 'Game Feel', initial: 0, floor: 0 },
    { id: 'community', label: 'Community', initial: 0, floor: 0 },
    { id: 'reach', label: 'Reach', initial: 0, floor: 0 }
  ]
};

export const rowCopy: Record<string, RowCopy> = {
  'opening-wedge': {
    note: 'Choose the first strategic spell the platform casts.'
  },
  'tooling-instinct': {
    note: 'Pick the systems that make creation feel alive instead of heavy.'
  },
  'first-release': {
    note: 'Locked cards open when your earlier choices create enough gravity.'
  }
};

export const choiceCopy: Record<string, ChoiceCopy> = {
  'creator-mvp': {
    tag: 'authoring',
    body: 'Start by proving the creator pipeline with one playable original title.'
  },
  'archive-rescue': {
    tag: 'preservation',
    body: 'Treat old works as a living corpus: preserved, improved, cited, and replayed.'
  },
  'roleplay-bridge': {
    tag: 'continuation',
    body: 'Let a completed build become the opening state for longer character play.'
  },
  'balance-assistant': {
    tag: 'game feel',
    body: 'Use visible tuning support so choices feel like a game, not only a gallery.'
  },
  'comments-to-cards': {
    tag: 'community loop',
    body: 'Turn discussion into suggested cards, sections, variants, and forks.'
  },
  'mobile-first': {
    tag: 'access',
    body: 'Keep the experience fast enough for the way people actually browse and replay.'
  },
  'fork-remix': {
    tag: 'remix',
    body: 'Make inspiration traceable and forks normal, so the corpus can keep evolving.'
  },
  'original-title': {
    tag: 'release',
    body: 'Ship one strong original CYOA to validate the schema under real creative pressure.'
  },
  'living-archive': {
    tag: 'archive cut',
    body: 'Publish an improved variant beside the preserved original, without losing provenance.'
  },
  'continuation-mode': {
    tag: 'roleplay',
    body: 'Carry selected choices forward as memory, context, and character configuration.'
  }
};

export const weightedMatrix: WeightedMatrix = {
  id: 'atlas-pressure',
  results: [
    {
      id: 'creator-first-platform',
      label: 'Creator-First Platform',
      weights: {
        creation: 3,
        systems: 2,
        balance: 2,
        retention: 1
      }
    },
    {
      id: 'living-archive-engine',
      label: 'Living Archive Engine',
      weights: {
        preservation: 3,
        care: 2,
        remix: 2,
        community: 1
      }
    },
    {
      id: 'roleplay-continuation',
      label: 'Roleplay Continuation',
      weights: {
        simulation: 3,
        continuity: 3,
        character: 2,
        retention: 1
      }
    },
    {
      id: 'community-creation-loop',
      label: 'Community Creation Loop',
      weights: {
        community: 3,
        loop: 3,
        remix: 2,
        accessibility: 1
      }
    }
  ]
};
