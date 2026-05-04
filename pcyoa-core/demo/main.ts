import {
  advanceAvailability,
  createInitialPlayState,
  createWeightedMatrixGameMode,
  derivePlaySnapshot
} from '../src';
import type { AvailabilityTransition, ChoiceState, PlaySnapshot, PlayState, ResultPressure } from '../src';
import { choiceCopy, demoCyoa, rowCopy, weightedMatrix } from './demo-cyoa';
import './styles.css';

const gameModes = [createWeightedMatrixGameMode(weightedMatrix)];
let state: PlayState = createInitialPlayState(demoCyoa);
let lastTransition: AvailabilityTransition | undefined;
let lastPulseId = '';

const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Demo root not found.');
}

const root = app;

function currentSnapshot(): PlaySnapshot {
  return derivePlaySnapshot(demoCyoa, state, {
    gameModes
  });
}

function act(choiceId: string) {
  const snapshot = currentSnapshot();
  const choiceState = snapshot.choiceStates[choiceId];
  const action = choiceState?.selectedCount
    ? {
        type: 'deselect-choice' as const,
        choiceId
      }
    : {
        type: 'select-choice' as const,
        choiceId
      };
  const transition = advanceAvailability(demoCyoa, state, action, {
    gameModes
  });

  lastTransition = transition;
  lastPulseId = choiceId;

  if (transition.accepted) {
    state = transition.state;
  }

  render();
}

function resetRun() {
  const transition = advanceAvailability(demoCyoa, state, {
    type: 'reset'
  }, {
    gameModes
  });
  state = transition.state;
  lastTransition = transition;
  lastPulseId = 'reset';
  render();
}

function render() {
  const snapshot = currentSnapshot();
  const selected = Object.values(snapshot.choiceStates).filter((choice) => choice.selectedCount > 0);
  const leading = getPressures(snapshot)[0];

  root.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">pcyoa-core demo</p>
          <h1>${demoCyoa.title}</h1>
        </div>
        <button class="reset-button" type="button" data-action="reset">Reset</button>
      </header>

      <section class="summary-grid" aria-label="Current play snapshot">
        <div class="status-panel">
          <p class="panel-label">Current pull</p>
          <h2>${formatResultId(leading?.resultId ?? 'uncommitted')}</h2>
          <p>${statusMessage(snapshot, selected)}</p>
        </div>
        <div class="points-panel">
          ${renderPoints(snapshot)}
        </div>
      </section>

      <section class="layout">
        <div class="rows">
          ${demoCyoa.rows.map((row) => renderRow(row.id, snapshot)).join('')}
        </div>
        <aside class="side-panel" aria-label="Weighted matrix output">
          ${renderMatrix(snapshot)}
          ${renderRecent(selected)}
        </aside>
      </section>
    </section>
  `;

  root.querySelector<HTMLButtonElement>('[data-action="reset"]')?.addEventListener('click', resetRun);
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-choice-id]')) {
    button.addEventListener('click', () => {
      const choiceId = button.dataset.choiceId;
      if (choiceId) {
        act(choiceId);
      }
    });
  }
}

function renderRow(rowId: string, snapshot: PlaySnapshot): string {
  const row = demoCyoa.rows.find((candidate) => candidate.id === rowId);
  if (!row) {
    return '';
  }

  const rowState = snapshot.rowStates[rowId];
  const countLabel = rowState.allowedChoices > 0
    ? `${rowState.selectedCount}/${rowState.allowedChoices}`
    : `${rowState.selectedCount}`;

  return `
    <section class="choice-row">
      <div class="row-heading">
        <div>
          <p class="eyebrow">${countLabel} chosen</p>
          <h2>${row.title ?? row.id}</h2>
        </div>
        <p>${rowCopy[rowId]?.note ?? ''}</p>
      </div>
      <div class="choice-grid">
        ${(row.choiceIds ?? [])
          .map((choiceId) => renderChoice(choiceId, snapshot.choiceStates[choiceId]))
          .join('')}
      </div>
    </section>
  `;
}

function renderChoice(choiceId: string, choiceState: ChoiceState | undefined): string {
  const choice = demoCyoa.choices.find((candidate) => candidate.id === choiceId);
  if (!choice || !choiceState) {
    return '';
  }

  const copy = choiceCopy[choiceId];
  const stateClass = choiceState.availability;
  const pulseClass = lastPulseId === choiceId ? 'pulse' : '';
  const reason = choiceState.reasons[0]?.message;
  const action = choiceState.selectedCount > 0 ? 'Selected' : choiceState.availability === 'available' ? 'Available' : 'Blocked';

  return `
    <button class="choice-card ${stateClass} ${pulseClass}" type="button" data-choice-id="${choice.id}" aria-pressed="${choiceState.selectedCount > 0}">
      <span class="choice-state">${action}</span>
      <span class="choice-tag">${copy?.tag ?? 'choice'}</span>
      <strong>${choice.title ?? choice.id}</strong>
      <span class="choice-body">${copy?.body ?? ''}</span>
      ${reason ? `<span class="choice-reason">${reason}</span>` : ''}
    </button>
  `;
}

function renderPoints(snapshot: PlaySnapshot): string {
  const max = Math.max(1, ...Object.values(snapshot.pointTotals));

  return (demoCyoa.points ?? []).map((point) => {
    const value = snapshot.pointTotals[point.id] ?? 0;
    const width = Math.max(2, Math.round((value / Math.max(max, 4)) * 100));

    return `
      <div class="point-line">
        <span>${point.label ?? point.id}</span>
        <div class="meter" aria-hidden="true">
          <span style="width: ${width}%"></span>
        </div>
        <strong>${value}</strong>
      </div>
    `;
  }).join('');
}

function renderMatrix(snapshot: PlaySnapshot): string {
  const pressures = getPressures(snapshot);
  const maxAbs = Math.max(1, ...pressures.map((pressure) => Math.abs(pressure.score)));
  const biases = snapshot.gameMode['atlas-pressure']?.choiceBiases ?? [];

  return `
    <section class="matrix-panel">
      <p class="panel-label">Weighted matrix</p>
      <h2>Story gravity</h2>
      <div class="pressure-list">
        ${pressures.map((pressure) => renderPressure(pressure, maxAbs)).join('')}
      </div>
      <div class="bias-list">
        <p class="panel-label">Strong next cards</p>
        ${biases.slice(0, 3).map((bias) => `
          <div class="bias-pill">
            <span>${demoCyoa.choices.find((choice) => choice.id === bias.choiceId)?.title ?? bias.choiceId}</span>
            <strong>${bias.contribution > 0 ? '+' : ''}${bias.contribution}</strong>
          </div>
        `).join('') || '<p class="quiet">Choose one card to wake the pressure system.</p>'}
      </div>
    </section>
  `;
}

function renderPressure(pressure: ResultPressure, maxAbs: number): string {
  const centerOffset = Math.round((pressure.score / maxAbs) * 50);
  const width = Math.abs(centerOffset);
  const start = pressure.score >= 0 ? 50 : 50 - width;

  return `
    <div class="pressure-row">
      <div class="pressure-title">
        <span>${formatResultId(pressure.resultId)}</span>
        <strong>${pressure.score}</strong>
      </div>
      <div class="pressure-meter" aria-hidden="true">
        <span style="left: ${start}%; width: ${Math.max(2, width)}%"></span>
      </div>
    </div>
  `;
}

function renderRecent(selected: ChoiceState[]): string {
  return `
    <section class="recent-panel">
      <p class="panel-label">Selected path</p>
      ${selected.length > 0
        ? `<ol>${selected.map((choice) => `<li>${demoCyoa.choices.find((candidate) => candidate.id === choice.id)?.title ?? choice.id}</li>`).join('')}</ol>`
        : '<p class="quiet">No cards selected yet.</p>'}
    </section>
  `;
}

function statusMessage(snapshot: PlaySnapshot, selected: ChoiceState[]): string {
  if (lastTransition?.rejection) {
    return lastTransition.rejection.message;
  }

  if (selected.length === 0) {
    return 'The board is waiting for its first declared move.';
  }

  const available = Object.values(snapshot.choiceStates).filter((choice) => choice.availability === 'available').length;
  return `${selected.length} selected. ${available} open cards remain.`;
}

function getPressures(snapshot: PlaySnapshot): ResultPressure[] {
  return snapshot.gameMode['atlas-pressure']?.resultPressures ?? [];
}

function formatResultId(resultId: string): string {
  return resultId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

render();
