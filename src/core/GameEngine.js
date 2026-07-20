import { ACTION_CATALOG } from '../content/actionCatalog.js';
import { SHIFTS, DEPARTMENT_DESCRIPTIONS } from '../content/shifts.js';
import { TICKETS } from '../content/tickets.js';
import { clamp, deepClone, uid } from './utils.js';

const APP_VERSION = '0.2.8';
const CONTENT_VERSION = 'demo-five-shifts.1';
const MAX_LOG = 80;
const ALLOWED_PHASES = new Set(['ticketing', 'shiftSummary', 'gameOver', 'demoComplete']);
const FAILURE_REASONS = new Set(['burnout', 'terminated', 'claimed', 'breach']);

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName).add(callback);
    return () => this.off(eventName, callback);
  }

  off(eventName, callback) {
    this.listeners.get(eventName)?.delete(callback);
  }

  emit(eventName, payload) {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks) return;
    for (const callback of callbacks) callback(payload);
  }
}

const INITIAL_METRICS = Object.freeze({
  reputation: 64,
  sanity: 72,
  cash: 120,
  soulRisk: 14,
  containment: 62,
  inboxHeat: 0
});

const METRIC_BOUNDS = Object.freeze({
  reputation: [0, 100],
  sanity: [0, 100],
  cash: [-120, 260],
  soulRisk: [0, 100],
  containment: [0, 100],
  inboxHeat: [0, 100]
});

export class GameEngine {
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.events = new EventBus();
    this.content = buildContentIndex();
    this.state = this.createNewState();
  }

  hydrate(saveState) {
    if (!saveState || typeof saveState !== 'object') {
      this.state = this.createNewState();
      this.emitChange('new-game');
      return this.state;
    }

    const restored = this.normalizeState(saveState);
    // Persist elapsed play time, not wall-clock time between sessions. A player
    // reopening an active save should not instantly time out because the tab was
    // closed overnight.
    if (restored.phase === 'ticketing' && !restored.paused) {
      restored.shiftStartedAt = this.now();
    }
    this.state = restored;
    this.emitChange('hydrate');
    return this.state;
  }

  reset() {
    this.state = this.createNewState();
    this.emitChange('reset');
    return this.state;
  }

  createNewState() {
    const timestamp = new Date(this.now()).toISOString();
    const queue = this.buildQueueForShift(1, []);
    return {
      appVersion: APP_VERSION,
      contentVersion: CONTENT_VERSION,
      saveSchema: 1,
      runId: uid('run'),
      createdAt: timestamp,
      updatedAt: timestamp,
      activeShiftId: 1,
      phase: 'ticketing',
      shiftStartedAt: this.now(),
      shiftElapsedMs: 0,
      shiftEndedAt: null,
      paused: false,
      selectedTicketId: queue[0] ?? null,
      queue,
      pendingFollowups: [],
      handled: {},
      shiftHistory: [],
      lastSummary: null,
      flags: {},
      metrics: deepClone(INITIAL_METRICS),
      log: [{
        id: uid('log'),
        at: timestamp,
        type: 'system',
        title: 'Shift opened',
        message: 'Orientation queue loaded. The inbox is watching how you answer.'
      }],
      unlockedDepartments: deepClone(SHIFTS[0]?.unlocks ?? ['General']),
      settings: {
        showDeltaPreview: true,
        compactTickets: false,
        reducedMotion: false,
        textScale: 1
      },
      failureReason: null
    };
  }

  normalizeState(rawState) {
    const base = this.createNewState();
    const activeShiftId = this.content.shiftById.has(Number(rawState.activeShiftId))
      ? Number(rawState.activeShiftId)
      : 1;
    const pendingFollowups = unique((Array.isArray(rawState.pendingFollowups) ? rawState.pendingFollowups : [])
      .filter(id => this.content.ticketById.has(id)));
    const handled = sanitizeHandled(rawState.handled, this.content.ticketById);
    const queueFromSave = unique((Array.isArray(rawState.queue) ? rawState.queue : [])
      .filter(id => this.content.ticketById.get(id)?.shiftId === activeShiftId));
    const phaseFromSave = ALLOWED_PHASES.has(rawState.phase) ? rawState.phase : 'ticketing';
    const failureReason = FAILURE_REASONS.has(rawState.failureReason) ? rawState.failureReason : null;
    const lastSummary = sanitizeSummary(rawState.lastSummary, activeShiftId);
    const shiftHistory = (Array.isArray(rawState.shiftHistory) ? rawState.shiftHistory : [])
      .map(item => sanitizeSummary(item))
      .filter(Boolean)
      .slice(-SHIFTS.length);
    const log = sanitizeLog(rawState.log).slice(0, MAX_LOG);
    const merged = {
      ...base,
      appVersion: APP_VERSION,
      contentVersion: CONTENT_VERSION,
      saveSchema: 1,
      saveRevision: finiteNonNegative(rawState.saveRevision, 0),
      runId: typeof rawState.runId === 'string' && rawState.runId.trim()
        ? rawState.runId.slice(0, 160)
        : base.runId,
      createdAt: safeText(rawState.createdAt, base.createdAt),
      updatedAt: safeText(rawState.updatedAt, base.updatedAt),
      activeShiftId,
      phase: phaseFromSave,
      settings: sanitizeSettings(rawState.settings, base.settings),
      metrics: { ...base.metrics, ...(rawState.metrics ?? {}) },
      flags: sanitizeFlags(rawState.flags),
      handled,
      pendingFollowups,
      shiftHistory,
      lastSummary,
      log: log.length ? log : base.log,
      unlockedDepartments: unique((Array.isArray(rawState.unlockedDepartments) ? rawState.unlockedDepartments : base.unlockedDepartments)
        .filter(item => typeof item === 'string')),
      queue: queueFromSave,
      selectedTicketId: typeof rawState.selectedTicketId === 'string' ? rawState.selectedTicketId : null,
      shiftElapsedMs: finiteNonNegative(rawState.shiftElapsedMs, 0),
      shiftStartedAt: finiteNonNegative(rawState.shiftStartedAt, this.now()),
      shiftEndedAt: rawState.shiftEndedAt == null ? null : finiteNonNegative(rawState.shiftEndedAt, null),
      paused: Boolean(rawState.paused),
      failureReason
    };

    if (merged.phase === 'shiftSummary' && !merged.lastSummary) merged.phase = 'ticketing';
    if (merged.phase === 'gameOver' && !merged.failureReason) merged.phase = 'ticketing';
    if (merged.failureReason) merged.phase = 'gameOver';
    if (merged.phase === 'demoComplete' && merged.activeShiftId !== Math.max(...SHIFTS.map(item => item.id))) {
      merged.phase = 'ticketing';
    }
    if (merged.phase !== 'ticketing') merged.paused = false;
    if (merged.queue.length === 0 && merged.phase === 'ticketing') {
      merged.queue = this.buildQueueForShift(merged.activeShiftId, merged.pendingFollowups);
    }
    const openTicketIds = this.getOpenTicketIds(merged);
    const selectionIsValid = merged.queue.includes(merged.selectedTicketId)
      && (!merged.handled[merged.selectedTicketId] || openTicketIds.length === 0);
    if (!selectionIsValid) merged.selectedTicketId = openTicketIds[0] ?? merged.queue[0] ?? null;
    merged.metrics = this.clampMetrics(merged.metrics);
    return merged;
  }

  on(eventName, callback) {
    return this.events.on(eventName, callback);
  }

  getSnapshot(now = this.now()) {
    const shift = this.getCurrentShift();
    const elapsedMs = this.getShiftElapsed(now);
    const durationMs = this.getShiftDurationMs(shift);
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    const openTicketIds = this.getOpenTicketIds();
    const resolvedThisShift = this.state.queue.length - openTicketIds.length;
    const totalHandled = Object.keys(this.state.handled).length;
    const selectedTicket = this.getTicket(this.state.selectedTicketId) ?? this.getTicket(openTicketIds[0]) ?? null;
    const actionList = selectedTicket ? this.getActionsForTicket(selectedTicket.id) : [];

    return {
      appVersion: APP_VERSION,
      contentVersion: CONTENT_VERSION,
      state: this.state,
      shift,
      elapsedMs,
      remainingMs,
      durationMs,
      timerPercent: durationMs > 0 ? clamp((remainingMs / durationMs) * 100, 0, 100) : 0,
      openTicketIds,
      visibleTickets: this.state.queue.map(id => this.getTicket(id)).filter(Boolean),
      selectedTicket,
      actionList,
      resolvedThisShift,
      totalHandled,
      metrics: this.state.metrics,
      departments: this.state.unlockedDepartments.map(name => ({
        name,
        description: DEPARTMENT_DESCRIPTIONS[name] ?? 'A department that prefers not to be documented.'
      })),
      maxShiftId: Math.max(...SHIFTS.map(item => item.id)),
      ending: this.getEndingLabel()
    };
  }

  getCurrentShift() {
    return this.content.shiftById.get(this.state.activeShiftId) ?? SHIFTS[0];
  }

  getTicket(ticketId) {
    return this.content.ticketById.get(ticketId) ?? null;
  }

  getActionsForTicket(ticketId) {
    const ticket = this.getTicket(ticketId);
    if (!ticket?.actions) return [];
    return Object.entries(ticket.actions).map(([actionId, action]) => {
      const base = ACTION_CATALOG[actionId] ?? { label: actionId, icon: '✉️', description: 'Custom action.', defaultDelta: {} };
      const delta = { ...(base.defaultDelta ?? {}), ...(action.delta ?? {}) };
      return {
        id: actionId,
        label: action.label ?? base.label,
        icon: action.icon ?? base.icon,
        tone: action.tone ?? base.tone ?? 'Custom',
        description: action.description ?? base.description,
        preview: action.preview ?? base.description,
        delta,
        outcomeTitle: action.outcomeTitle ?? 'Resolved',
        outcome: action.outcome ?? 'The inbox accepts the answer.',
        flags: action.flags ?? {},
        schedule: action.schedule ?? []
      };
    });
  }

  selectTicket(ticketId) {
    if (!this.content.ticketById.has(ticketId) || !this.state.queue.includes(ticketId)) return false;
    this.state.selectedTicketId = ticketId;
    this.emitChange('select-ticket');
    return true;
  }

  selectRelativeTicket(direction) {
    const ids = this.state.queue;
    if (ids.length === 0) return false;
    const currentIndex = Math.max(0, ids.indexOf(this.state.selectedTicketId));
    const nextIndex = clamp(currentIndex + direction, 0, ids.length - 1);
    return this.selectTicket(ids[nextIndex]);
  }

  resolveSelectedTicket(actionId) {
    if (!this.state.selectedTicketId) return { ok: false, error: 'No ticket selected.' };
    return this.resolveTicket(this.state.selectedTicketId, actionId);
  }

  resolveTicket(ticketId, actionId) {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return { ok: false, error: 'Ticket not found.' };
    if (this.state.phase !== 'ticketing') return { ok: false, error: 'Shift is not accepting tickets.' };
    if (this.state.paused) return { ok: false, error: 'Resume the shift before answering tickets.' };
    if (!this.state.queue.includes(ticketId)) return { ok: false, error: 'Ticket is not in the active queue.' };
    if (this.state.handled[ticketId]) return { ok: false, error: 'Ticket already resolved.' };

    const action = this.getActionsForTicket(ticketId).find(item => item.id === actionId);
    if (!action) return { ok: false, error: 'Action not available for this ticket.' };

    this.applyDelta(action.delta);
    this.incrementFlags(action.flags);
    this.scheduleFollowups(action.schedule);

    const timestamp = new Date(this.now()).toISOString();
    this.state.handled[ticketId] = {
      actionId,
      actionLabel: action.label,
      at: timestamp,
      delta: action.delta,
      outcomeTitle: action.outcomeTitle,
      outcome: action.outcome
    };

    this.addLog({
      type: 'ticket',
      title: action.outcomeTitle,
      message: `${ticket.from}: ${action.outcome}`,
      ticketId,
      actionId
    });

    this.processThresholdEvents();
    this.checkFailure();

    const openIds = this.getOpenTicketIds();
    if (!openIds.includes(this.state.selectedTicketId)) {
      this.state.selectedTicketId = openIds[0] ?? this.state.queue.find(id => !this.state.handled[id]) ?? this.state.queue[0] ?? null;
    }

    this.emitChange('resolve-ticket');
    return { ok: true, ticket, action };
  }

  endShift(reason = 'cleared') {
    if (!['ticketing', 'shiftSummary'].includes(this.state.phase)) return false;
    if (this.state.phase === 'shiftSummary') return true;

    this.commitElapsed();
    const openIds = this.getOpenTicketIds();
    const shift = this.getCurrentShift();
    const unresolvedPenalty = this.calculateUnresolvedPenalty(openIds.length, reason);
    if (openIds.length > 0) this.applyDelta(unresolvedPenalty);

    const summary = {
      shiftId: this.state.activeShiftId,
      title: shift.title,
      reason,
      resolved: this.state.queue.length - openIds.length,
      unresolved: openIds.length,
      quota: shift.quota,
      penalty: unresolvedPenalty,
      metricsAfter: deepClone(this.state.metrics),
      flags: deepClone(this.state.flags),
      endedAt: new Date(this.now()).toISOString(),
      endingHint: this.getEndingLabel()
    };

    this.state.lastSummary = summary;
    this.state.shiftHistory.push(summary);
    this.state.phase = 'shiftSummary';
    this.state.shiftEndedAt = this.now();

    this.addLog({
      type: reason === 'timeout' ? 'warning' : 'system',
      title: reason === 'timeout' ? 'Shift timed out' : 'Shift closed',
      message: openIds.length > 0
        ? `${openIds.length} unresolved ticket(s) generated penalties. The inbox will remember.`
        : `All available tickets closed. ${shift.title} is ready for audit.`
    });

    this.checkFailure();
    this.emitChange('end-shift');
    return true;
  }

  advanceShift() {
    if (this.state.phase !== 'shiftSummary') return false;
    if (this.state.failureReason) return false;

    const nextShiftId = this.state.activeShiftId + 1;
    if (!this.content.shiftById.has(nextShiftId)) {
      this.state.phase = 'demoComplete';
      this.addLog({
        type: 'system',
        title: 'Demo complete',
        message: this.buildFinalSummaryText()
      });
      this.emitChange('demo-complete');
      return true;
    }

    const nextShift = this.content.shiftById.get(nextShiftId);
    const queue = this.buildQueueForShift(nextShiftId, this.state.pendingFollowups);
    this.state.activeShiftId = nextShiftId;
    this.state.phase = 'ticketing';
    this.state.queue = queue;
    this.state.selectedTicketId = queue[0] ?? null;
    this.state.shiftStartedAt = this.now();
    this.state.shiftElapsedMs = 0;
    this.state.shiftEndedAt = null;
    this.state.paused = false;
    this.state.unlockedDepartments = unique([
      ...this.state.unlockedDepartments,
      ...(nextShift.unlocks ?? [])
    ]);
    this.applyShiftStartPressure();

    this.addLog({
      type: 'system',
      title: `Shift ${nextShiftId} opened`,
      message: `${nextShift.title}: ${nextShift.objective}`
    });
    this.checkFailure();
    this.emitChange('advance-shift');
    return true;
  }

  togglePause() {
    if (this.state.phase !== 'ticketing') return false;
    if (this.state.paused) {
      this.state.paused = false;
      this.state.shiftStartedAt = this.now();
      this.addLog({ type: 'system', title: 'Shift resumed', message: 'The inbox pretends it was not listening.' });
    } else {
      this.commitElapsed();
      this.state.paused = true;
      this.addLog({ type: 'system', title: 'Shift paused', message: 'The timer stops. The unread count does not blink.' });
    }
    this.emitChange('pause');
    return true;
  }

  updateSetting(key, value) {
    this.state.settings = { ...this.state.settings, [key]: value };
    if (key === 'textScale') {
      this.state.settings.textScale = clamp(Number(value), 0.9, 1.18);
    }
    this.emitChange('settings');
  }

  importState(saveState) {
    this.hydrate(saveState);
    this.addLog({ type: 'system', title: 'Save imported', message: 'The imported run has been loaded and normalized.' });
    this.emitChange('import');
  }

  getShiftElapsed(now = this.now()) {
    if (this.state.phase !== 'ticketing') return this.state.shiftElapsedMs;
    if (this.state.paused) return this.state.shiftElapsedMs;
    return this.state.shiftElapsedMs + Math.max(0, now - Number(this.state.shiftStartedAt ?? now));
  }

  getShiftDurationMs(shift = this.getCurrentShift()) {
    return shift?.durationMs ?? 5 * 60 * 1000;
  }

  getOpenTicketIds(state = this.state) {
    return state.queue.filter(id => !state.handled[id]);
  }

  buildQueueForShift(shiftId, pendingFollowups = []) {
    const baseIds = TICKETS
      .filter(ticket => ticket.shiftId === shiftId && ticket.defaultAvailable !== false)
      .map(ticket => ticket.id);
    const followupIds = pendingFollowups
      .filter(id => this.content.ticketById.get(id)?.shiftId === shiftId);
    return unique([...followupIds, ...baseIds]);
  }

  scheduleFollowups(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const validIds = ids.filter(id => this.content.ticketById.has(id));
    this.state.pendingFollowups = unique([...this.state.pendingFollowups, ...validIds]);

    const currentShiftFollowups = validIds.filter(id => this.getTicket(id)?.shiftId === this.state.activeShiftId);
    if (currentShiftFollowups.length > 0) {
      this.state.queue = unique([...this.state.queue, ...currentShiftFollowups]);
    }
  }

  applyDelta(delta = {}) {
    const metrics = { ...this.state.metrics };
    for (const [key, value] of Object.entries(delta)) {
      if (!(key in metrics)) continue;
      metrics[key] = Number(metrics[key] ?? 0) + Number(value ?? 0);
    }
    this.state.metrics = this.clampMetrics(metrics);
  }

  clampMetrics(metrics) {
    return sanitizeMetrics(metrics);
  }

  incrementFlags(flags = {}) {
    for (const [key, value] of Object.entries(flags)) {
      this.state.flags[key] = Number(this.state.flags[key] ?? 0) + Number(value ?? 1);
    }
  }

  addLog({ type = 'system', title, message, ticketId = null, actionId = null }) {
    this.state.log = [{
      id: uid('log'),
      at: new Date(this.now()).toISOString(),
      type,
      title,
      message,
      ticketId,
      actionId
    }, ...this.state.log].slice(0, MAX_LOG);
  }

  processThresholdEvents() {
    const m = this.state.metrics;
    if (m.cash < 0 && !this.state.flags.cashWarning) {
      this.state.flags.cashWarning = 1;
      this.addLog({
        type: 'warning',
        title: 'Budget below zero',
        message: 'Finance places a tiny guillotine on your desk. It is decorative for now.'
      });
    }
    if (m.containment <= 25 && !this.state.flags.containmentWarning) {
      this.state.flags.containmentWarning = 1;
      this.addLog({
        type: 'warning',
        title: 'Containment unstable',
        message: 'The inbox gutters like a candle. Future tickets may take advantage of the draft.'
      });
    }
    if (m.inboxHeat >= 40 && !this.state.flags.heatWarning) {
      this.state.flags.heatWarning = 1;
      this.addLog({
        type: 'warning',
        title: 'Inbox Heat high',
        message: 'Escalation chains are attracting attention from departments with no org chart.'
      });
    }
  }

  checkFailure() {
    const m = this.state.metrics;
    let failure = null;
    if (m.sanity <= 0) failure = 'burnout';
    if (m.reputation <= 0) failure = 'terminated';
    if (m.soulRisk >= 100) failure = 'claimed';
    if (m.containment <= 0) failure = 'breach';

    if (failure && !this.state.failureReason) {
      this.state.failureReason = failure;
      this.state.phase = 'gameOver';
      this.addLog({
        type: 'failure',
        title: 'Run ended',
        message: this.failureText(failure)
      });
    }
    return failure;
  }

  calculateUnresolvedPenalty(unresolvedCount, reason) {
    if (unresolvedCount <= 0) return {};
    const pressure = reason === 'timeout' ? 1.4 : 1;
    return {
      reputation: Math.round(-3 * unresolvedCount * pressure),
      sanity: Math.round(-2 * unresolvedCount * pressure),
      soulRisk: Math.round(3 * unresolvedCount * pressure),
      inboxHeat: Math.round(4 * unresolvedCount * pressure),
      containment: Math.round(-2 * unresolvedCount * pressure)
    };
  }

  applyShiftStartPressure() {
    const heat = this.state.metrics.inboxHeat;
    if (heat >= 30) {
      this.applyDelta({ sanity: -2, soulRisk: 2, containment: -1 });
      this.addLog({
        type: 'warning',
        title: 'Escalation residue',
        message: 'High Inbox Heat follows you into the next shift.'
      });
    }
    if (this.state.metrics.cash < 0) {
      this.applyDelta({ sanity: -3, reputation: -2 });
      this.addLog({
        type: 'warning',
        title: 'Finance penalty',
        message: 'Negative budget triggers a stern memo and a psychic paper cut.'
      });
    }
  }

  commitElapsed() {
    if (!this.state.paused && this.state.phase === 'ticketing') {
      this.state.shiftElapsedMs = this.getShiftElapsed();
      this.state.shiftStartedAt = this.now();
    }
  }

  getEndingLabel() {
    const flags = this.state.flags;
    const empathy = Number(flags.empathy ?? 0);
    const legalist = Number(flags.legalist ?? 0);
    const exorcist = Number(flags.exorcist ?? 0);
    const escalator = Number(flags.escalator ?? 0);

    if (this.state.failureReason) return this.failureTitle(this.state.failureReason);
    if (empathy >= 8) return 'The Candle in the Queue';
    if (legalist >= 8) return 'The Perfectly Defensible Monster';
    if (exorcist >= 7) return 'The Bell-Ringer';
    if (escalator >= 7) return 'Middle Management Portal';
    if (Number(flags.joinedBelow ?? 0) > 0) return 'Career Growth Below';
    if (Number(flags.declinedBelow ?? 0) > 0) return 'Offer Declined, Door Ajar';
    return 'Unclassified Agent';
  }

  buildFinalSummaryText() {
    const ending = this.getEndingLabel();
    const handled = Object.keys(this.state.handled).length;
    return `Demo complete: ${ending}. You resolved ${handled} ticket(s), unlocked ${this.state.unlockedDepartments.length} department(s), and left ${this.state.metrics.soulRisk}% soul risk on the table.`;
  }

  failureTitle(reason) {
    return ({
      burnout: 'Burnout: The Cursor Keeps Moving',
      terminated: 'Terminated: Reputation Collapse',
      claimed: 'Claimed by Infernal Accounts',
      breach: 'Containment Breach'
    })[reason] ?? 'Run Failed';
  }

  failureText(reason) {
    return ({
      burnout: 'Your sanity bottoms out. The inbox continues typing polite replies with your hands.',
      terminated: 'Reputation reaches zero. A normal-looking HR email arrives, which is how you know it is over.',
      claimed: 'Soul Risk reaches 100. Infernal Accounts stamps PAID IN FULL on your reflection.',
      breach: 'Containment collapses. The inbox is no longer on the screen; it is the room.'
    })[reason] ?? 'The run has ended.';
  }

  emitChange(reason) {
    this.state.updatedAt = new Date(this.now()).toISOString();
    this.events.emit('stateChanged', { reason, state: this.state });
  }
}

function buildContentIndex() {
  return {
    ticketById: new Map(TICKETS.map(ticket => [ticket.id, ticket])),
    shiftById: new Map(SHIFTS.map(shift => [shift.id, shift]))
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sanitizeSettings(value, defaults) {
  const raw = isRecord(value) ? value : {};
  const textScale = Number(raw.textScale);
  return {
    showDeltaPreview: raw.showDeltaPreview === undefined ? defaults.showDeltaPreview : Boolean(raw.showDeltaPreview),
    compactTickets: raw.compactTickets === undefined ? defaults.compactTickets : Boolean(raw.compactTickets),
    reducedMotion: raw.reducedMotion === undefined ? defaults.reducedMotion : Boolean(raw.reducedMotion),
    textScale: clamp(Number.isFinite(textScale) ? textScale : defaults.textScale, 0.9, 1.18)
  };
}

function sanitizeFlags(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, count]) => typeof key === 'string' && key.length <= 80 && Number.isFinite(Number(count)))
    .map(([key, count]) => [key, Number(count)]));
}

function sanitizeHandled(value, ticketById) {
  if (!isRecord(value)) return {};
  const handled = {};
  for (const [ticketId, decision] of Object.entries(value)) {
    if (!ticketById.has(ticketId) || !isRecord(decision)) continue;
    handled[ticketId] = {
      actionId: safeText(decision.actionId, 'unknown'),
      actionLabel: safeText(decision.actionLabel, 'Imported decision'),
      at: safeText(decision.at, new Date(0).toISOString()),
      delta: sanitizeDelta(decision.delta),
      outcomeTitle: safeText(decision.outcomeTitle, 'Resolved'),
      outcome: safeText(decision.outcome, 'This ticket was resolved in an imported save.')
    };
  }
  return handled;
}

function sanitizeDelta(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, amount]) => key in METRIC_BOUNDS && Number.isFinite(Number(amount)))
    .map(([key, amount]) => [key, Number(amount)]));
}

function sanitizeLog(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map(entry => ({
    id: safeText(entry.id, uid('log')),
    at: safeText(entry.at, new Date(0).toISOString()),
    type: safeText(entry.type, 'system'),
    title: safeText(entry.title, 'Imported event'),
    message: safeText(entry.message, ''),
    ticketId: typeof entry.ticketId === 'string' ? entry.ticketId : null,
    actionId: typeof entry.actionId === 'string' ? entry.actionId : null
  }));
}

function sanitizeSummary(value, expectedShiftId = null) {
  if (!isRecord(value)) return null;
  const shiftId = Number(value.shiftId);
  if (!Number.isInteger(shiftId) || !SHIFTS.some(shift => shift.id === shiftId)) return null;
  if (expectedShiftId !== null && shiftId !== expectedShiftId) return null;
  const shift = SHIFTS.find(item => item.id === shiftId);
  return {
    shiftId,
    title: safeText(value.title, shift?.title ?? `Shift ${shiftId}`),
    reason: value.reason === 'timeout' ? 'timeout' : 'cleared',
    resolved: finiteNonNegative(value.resolved, 0),
    unresolved: finiteNonNegative(value.unresolved, 0),
    quota: finiteNonNegative(value.quota, shift?.quota ?? 0),
    penalty: sanitizeDelta(value.penalty),
    metricsAfter: sanitizeMetrics(value.metricsAfter),
    flags: sanitizeFlags(value.flags),
    endedAt: safeText(value.endedAt, new Date(0).toISOString()),
    endingHint: safeText(value.endingHint, 'Unclassified Agent')
  };
}

function finiteNonNegative(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function sanitizeMetrics(value) {
  const raw = isRecord(value) ? value : {};
  const next = {};
  for (const [key, [min, max]] of Object.entries(METRIC_BOUNDS)) {
    const numeric = Number(raw[key]);
    const fallback = Number(INITIAL_METRICS[key] ?? 0);
    next[key] = clamp(Number.isFinite(numeric) ? numeric : fallback, min, max);
  }
  return next;
}

function safeText(value, fallback = '') {
  return typeof value === 'string' ? value.slice(0, 20000) : fallback;
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
