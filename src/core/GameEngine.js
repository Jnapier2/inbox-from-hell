import { ACTION_CATALOG } from '../content/actionCatalog.js';
import {
  ARTIFACTS,
  ARTIFACT_BY_ID,
  CLEARANCE_RANKS,
  OFFICE_PATHS,
  OFFICE_ROOMS,
  OFFICE_ROOM_BY_ID,
  REPLY_TECHNIQUES,
  REPLY_TECHNIQUE_BY_ID,
  SHIFT_CONDITIONS
} from '../content/artifacts.js';
import { CASE_FILES } from '../content/caseFiles.js';
import { SHIFTS, DEPARTMENT_DESCRIPTIONS, TIMED_EVENTS } from '../content/shifts.js';
import { TICKETS } from '../content/tickets.js';
import { clamp, deepClone, uid } from './utils.js';

const APP_VERSION = '0.7.0';
const CONTENT_VERSION = 'demo-five-shifts.13';
const SAVE_SCHEMA = 3;
const MAX_LOG = 80;
const ALLOWED_PHASES = new Set(['ticketing', 'shiftSummary', 'gameOver', 'demoComplete']);
const FAILURE_REASONS = new Set(['burnout', 'terminated', 'claimed', 'breach', 'probation']);
const CASE_GRADES = new Set(['strong', 'defensible', 'missed']);
const CASE_INSIGHT = Object.freeze({ strong: 2, defensible: 1, missed: 0 });
const CASE_POINTS = Object.freeze({ strong: 100, defensible: 70, missed: 0 });
const INCIDENT_WARNINGS = Object.freeze([30, 10]);
const TIMED_EVENT_WARNINGS = Object.freeze([10]);
const CUSTOMER_THREADS = Object.freeze([
  {
    id: 'evelyn-thread',
    name: 'Evelyn Marsh: password afterlife',
    ids: ['s1-t02-ghost-password', 's2-f02-evelyn-thanks', 's2-f03-evelyn-haunt'],
    required: 2,
    hint: 'Your first reply decides which Evelyn returns.'
  },
  {
    id: 'malphas-thread',
    name: 'Malphas: cancellation portal',
    ids: ['s1-t01-malphas-portal', 's2-f01-malphas-review'],
    required: 2,
    hint: 'A satisfied demon may be more dangerous than an angry one.'
  },
  {
    id: 'greg-thread',
    name: 'Greg H.: suspiciously human',
    ids: ['s1-t05-greg-normal', 's3-f01-greg-referral'],
    required: 2,
    hint: 'One escalation can turn an ordinary customer into a department mystery.'
  },
  {
    id: 'lucien-thread',
    name: 'Lucien Voss: elegant liability',
    ids: ['s1-t04-vampire-mug', 's3-t03-vampire-class-action'],
    required: 2,
    hint: 'The mug was never the whole complaint.'
  },
  {
    id: 'miriam-thread',
    name: 'Miriam: familiar consequences',
    ids: ['s1-t03-witch-familiar', 's3-t05-coupon-mice'],
    required: 2,
    hint: 'A witch remembers whether support treated her familiar like property.'
  }
]);

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
      const resumedAt = this.now();
      if (restored.clockMode === 'incident' && restored.activeIncident?.status === 'active') {
        restored.activeIncident.startedAt = resumedAt;
      } else if (restored.clockMode === 'event' && restored.activeTimedEvent?.status === 'active') {
        restored.activeTimedEvent.startedAt = resumedAt;
      } else {
        restored.shiftStartedAt = resumedAt;
      }
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
    const state = {
      appVersion: APP_VERSION,
      contentVersion: CONTENT_VERSION,
      saveSchema: SAVE_SCHEMA,
      runId: uid('run'),
      createdAt: timestamp,
      updatedAt: timestamp,
      activeShiftId: 1,
      phase: 'ticketing',
      shiftStartedAt: this.now(),
      shiftElapsedMs: 0,
      shiftEndedAt: null,
      paused: false,
      clockMode: 'shift',
      activeIncident: null,
      activeTimedEvent: null,
      timedEventHistory: [],
      selectedTicketId: queue[0] ?? null,
      queue,
      pendingFollowups: [],
      handled: {},
      shiftHistory: [],
      lastSummary: null,
      flags: {},
      metrics: deepClone(INITIAL_METRICS),
      progression: {
        insight: 0,
        artifacts: [],
        pendingArtifactChoices: [],
        officeRooms: [],
        pendingRoomChoices: []
      },
      log: [{
        id: uid('log'),
        at: timestamp,
        type: 'system',
        title: 'Shift opened',
        message: 'Orientation queue loaded. The training console is sealed; the inbox is watching whether you read before answering.'
      }],
      unlockedDepartments: deepClone(SHIFTS[0]?.unlocks ?? ['General']),
      settings: {
        showDeltaPreview: true,
        compactTickets: false,
        reducedMotion: false,
        textScale: 1,
        qaSpeed: false
      },
      failureReason: null
    };
    this.activateNextIncident({ state, now: this.now(), emit: false });
    return state;
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
    const progression = sanitizeProgression(rawState.progression);
    const merged = {
      ...base,
      appVersion: APP_VERSION,
      contentVersion: CONTENT_VERSION,
      saveSchema: SAVE_SCHEMA,
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
      progression,
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
      clockMode: 'shift',
      activeIncident: null,
      activeTimedEvent: null,
      timedEventHistory: sanitizeTimedEventHistory(rawState.timedEventHistory),
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
    const selectionIsValid = merged.queue.includes(merged.selectedTicketId);
    if (!selectionIsValid) merged.selectedTicketId = openTicketIds[0] ?? merged.queue[0] ?? null;
    merged.metrics = this.clampMetrics(merged.metrics);
    if (merged.phase === 'ticketing') {
      merged.activeTimedEvent = this.normalizeActiveTimedEvent(rawState.activeTimedEvent, merged);
      merged.activeIncident = merged.activeTimedEvent
        ? null
        : this.normalizeActiveIncident(rawState.activeIncident, merged);
      if (merged.activeTimedEvent?.status === 'active') {
        merged.clockMode = 'event';
      } else if (merged.activeIncident?.status === 'active') {
        merged.clockMode = 'incident';
        merged.selectedTicketId = merged.activeIncident.ticketId;
      } else {
        merged.clockMode = 'shift';
      }
      if (!merged.activeIncident && !merged.activeTimedEvent) {
        this.activateNextIncident({ state: merged, now: this.now(), emit: false });
      }
      if (!merged.activeIncident && !merged.activeTimedEvent) {
        this.activateTimedEventIfReady({ state: merged, now: this.now(), emit: false });
      }
    }
    this.restoreArtifactDraft(merged);
    this.restoreOfficeDraft(merged);
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
    const incidentSnapshot = this.getIncidentSnapshot(now);
    const timedEventSnapshot = this.getTimedEventSnapshot(now);
    const clearance = this.getClearanceProgress();
    const information = this.getInformationClearance(clearance);
    const casework = this.getCaseworkStatus(this.state.activeShiftId);
    const careerCasework = this.getCareerCaseworkStatus();
    const shiftCondition = this.getShiftCondition(this.state.activeShiftId);
    const artifactIds = this.state.progression.artifacts;
    const offerIds = this.state.progression.pendingArtifactChoices;
    const officeRoomIds = this.state.progression.officeRooms;
    const roomOfferIds = this.state.progression.pendingRoomChoices;
    const selectedCaseFile = selectedTicket ? this.getCaseFile(selectedTicket.id) : null;
    const rank = clearance.rank
      ? { ...clearance.rank, title: clearance.rank.title ?? clearance.rank.name }
      : null;
    const nextRank = clearance.nextRank
      ? { ...clearance.nextRank, title: clearance.nextRank.title ?? clearance.nextRank.name }
      : null;
    const precedentEchoes = Object.fromEntries(this.state.queue
      .map(ticketId => [ticketId, this.getPrecedentEcho(ticketId)])
      .filter(([, echo]) => Boolean(echo)));

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
      selectedCaseFile,
      selectedPrecedentEcho: selectedTicket ? precedentEchoes[selectedTicket.id] ?? null : null,
      precedentEchoes,
      caseFile: selectedCaseFile,
      actionList,
      activeIncident: incidentSnapshot,
      activeTimedEvent: timedEventSnapshot,
      resolvedThisShift,
      totalHandled,
      metrics: this.state.metrics,
      information,
      casework,
      careerCasework,
      shiftCondition,
      office: this.getOfficeSnapshot(clearance),
      departments: this.state.unlockedDepartments.map(name => ({
        name,
        description: DEPARTMENT_DESCRIPTIONS[name] ?? 'A department that prefers not to be documented.'
      })),
      progression: {
        insight: this.state.progression.insight,
        artifactIds,
        artifacts: artifactIds.map(id => this.getArtifact(id)).filter(Boolean),
        artifactDefinitions: artifactIds.map(id => this.getArtifact(id)).filter(Boolean),
        pendingArtifactChoices: offerIds,
        artifactOffers: offerIds.map(id => this.getArtifact(id)).filter(Boolean),
        offers: offerIds.map(id => this.getArtifact(id)).filter(Boolean),
        officeRoomIds,
        officeRooms: officeRoomIds.map(id => this.getOfficeRoom(id)).filter(Boolean),
        pendingRoomChoices: roomOfferIds,
        roomOffers: roomOfferIds.map(id => this.getOfficeRoom(id)).filter(Boolean),
        rank,
        nextRank,
        replyTechniques: this.getReplyTechniqueViews(),
        nextReplyTechnique: this.getNextReplyTechnique(),
        progress: clearance.progress,
        progressCurrent: clearance.progress.earned,
        progressNeeded: clearance.progress.required,
        progressPercent: clearance.progress.percent,
        information
      },
      maxShiftId: Math.max(...SHIFTS.map(item => item.id)),
      ending: this.getEndingLabel()
    };
  }

  getCurrentShift() {
    return this.content.shiftById.get(this.state.activeShiftId) ?? SHIFTS[0];
  }

  getShiftCondition(shiftId = this.state.activeShiftId) {
    if (Number(shiftId) <= 1 || !Array.isArray(SHIFT_CONDITIONS) || SHIFT_CONDITIONS.length === 0) return null;
    const seed = hashString(`${this.state.runId}:${shiftId}:supervisor-memo`);
    return SHIFT_CONDITIONS[seed % SHIFT_CONDITIONS.length] ?? null;
  }

  getInformationClearance(clearance = this.getClearanceProgress()) {
    const current = normalizeInstrumentAccess(clearance?.rank?.instruments);
    const roomBonus = this.getOfficeEffectRecords()
      .reduce((total, effects) => total + finiteNumber(effects.forecastSlotsBonus, 0), 0);
    current.forecastSlots = clamp(current.forecastSlots + roomBonus, 0, 6);
    const next = clearance?.nextRank
      ? {
          rankName: clearance.nextRank.name,
          minInsight: clearance.nextRank.minInsight,
          ...normalizeInstrumentAccess(clearance.nextRank.instruments)
        }
      : null;
    return { ...current, next, officeForecastBonus: roomBonus };
  }

  getCaseworkStatus(shiftId = this.state.activeShiftId) {
    const shift = this.content.shiftById.get(Number(shiftId)) ?? this.getCurrentShift();
    const judgments = this.getShiftJudgmentStats(Number(shiftId));
    const score = caseworkScore(judgments.counts);
    const roomTargetDelta = this.getOfficeEffectRecords()
      .reduce((total, effects) => total + finiteNumber(effects.caseworkTargetDelta, 0), 0);
    const target = Math.max(0, Math.round(
      finiteNumber(shift?.caseworkTarget, shift?.quota ?? 0) + roomTargetDelta
    ));
    const resolved = Object.values(judgments.counts).reduce((total, count) => total + count, 0);
    const points = judgments.points;
    const targetPoints = caseworkPointsTarget(target, shift?.quota ?? resolved);
    const average = resolved > 0 ? Math.round(points / resolved) : null;
    return {
      score,
      target,
      points,
      targetPoints,
      resolved,
      average,
      grade: shiftLetterGrade(average),
      remaining: Math.max(0, target - score),
      met: score >= target,
      counts: judgments.counts,
      auditMarks: Math.max(0, Number(this.state.flags.auditMark ?? 0))
    };
  }

  getCareerCaseworkStatus() {
    const counts = { strong: 0, defensible: 0, missed: 0 };
    let points = 0;
    for (const decision of Object.values(this.state.handled)) {
      if (!decision?.caseJudgment) continue;
      const grade = normalizeCaseGrade(decision.caseJudgment.grade ?? decision.caseJudgment.rating);
      counts[grade] += 1;
      points += finiteNonNegative(decision.caseJudgment.points, CASE_POINTS[grade]);
    }
    const resolved = Object.values(counts).reduce((total, count) => total + count, 0);
    const average = resolved > 0 ? Math.round(points / resolved) : null;
    return {
      resolved,
      points,
      maxPoints: resolved * CASE_POINTS.strong,
      average,
      grade: shiftLetterGrade(average),
      counts
    };
  }

  getTicket(ticketId) {
    return this.content.ticketById.get(ticketId) ?? null;
  }

  getCaseFile(ticketId) {
    const caseFile = CASE_FILES?.[ticketId];
    return isRecord(caseFile) ? caseFile : null;
  }

  getPrecedentEcho(ticketId, state = this.state) {
    const target = this.getTicket(ticketId);
    if (!target || target.defaultAvailable !== false) return null;
    const handledEntries = Object.entries(state.handled ?? {})
      .sort(([, left], [, right]) => safeText(left?.at, '').localeCompare(safeText(right?.at, '')));

    for (const [sourceTicketId, decision] of handledEntries) {
      const sourceTicket = this.getTicket(sourceTicketId);
      if (!sourceTicket || !isRecord(decision)) continue;
      const sourceActionId = decision.sourceActionId || decision.actionId;
      const sourceAction = sourceTicket.actions?.[sourceActionId];
      const scheduledFollowups = Array.isArray(decision.scheduledFollowups)
        ? decision.scheduledFollowups
        : Array.isArray(sourceAction?.schedule) ? sourceAction.schedule : [];
      if (!scheduledFollowups.includes(ticketId)) continue;

      return {
        sourceTicketId,
        sourceShiftId: sourceTicket.shiftId,
        sourceSubject: sourceTicket.subject,
        sourceFrom: sourceTicket.from,
        actionLabel: safeText(decision.actionLabel, sourceAction?.label ?? sourceActionId),
        outcomeTitle: safeText(decision.outcomeTitle, 'Earlier resolution'),
        techniqueName: safeText(decision.technique?.name, ''),
        message: `This follow-up exists because of your Shift ${sourceTicket.shiftId} reply to ${sourceTicket.from}.`
      };
    }
    return null;
  }

  getArtifact(artifactId) {
    if (!artifactId) return null;
    if (ARTIFACT_BY_ID instanceof Map) return ARTIFACT_BY_ID.get(artifactId) ?? null;
    if (isRecord(ARTIFACT_BY_ID)) return ARTIFACT_BY_ID[artifactId] ?? null;
    return (Array.isArray(ARTIFACTS) ? ARTIFACTS : []).find(item => item?.id === artifactId) ?? null;
  }

  getOfficeRoom(roomId) {
    if (!roomId) return null;
    if (OFFICE_ROOM_BY_ID instanceof Map) return OFFICE_ROOM_BY_ID.get(roomId) ?? null;
    return (Array.isArray(OFFICE_ROOMS) ? OFFICE_ROOMS : [])
      .find(room => room?.id === roomId) ?? null;
  }

  getBuiltOfficeRooms(progression = this.state.progression) {
    const ids = Array.isArray(progression?.officeRooms) ? progression.officeRooms : [];
    return ids.map(id => this.getOfficeRoom(id)).filter(Boolean);
  }

  getOfficeEffectRecords(progression = this.state.progression) {
    return [
      ...this.getBuiltOfficeRooms(progression).flatMap(room => officeEffectRecords(room)),
      ...this.getActiveOfficePaths(progression).flatMap(path => officeEffectRecords(path))
    ];
  }

  getActiveOfficePaths(progression = this.state.progression) {
    const built = new Set(Array.isArray(progression?.officeRooms) ? progression.officeRooms : []);
    return (Array.isArray(OFFICE_PATHS) ? OFFICE_PATHS : [])
      .filter(path => Array.isArray(path?.requires) && path.requires.every(roomId => built.has(roomId)));
  }

  getCustomerThreadViews(handled = this.state.handled) {
    const handledIds = new Set(Object.keys(isRecord(handled) ? handled : {}));
    return CUSTOMER_THREADS.map(thread => {
      const current = thread.ids.filter(id => handledIds.has(id)).length;
      const discovered = handledIds.has(thread.ids[0]);
      return {
        ...thread,
        current: Math.min(current, thread.required),
        complete: current >= thread.required,
        title: discovered ? thread.name : 'Unknown customer thread',
        hint: discovered ? thread.hint : 'Resolve more emails to put a name on this string.',
        reward: 'Close the thread with a Strong read for +1 Insight.'
      };
    });
  }

  getCustomerThreadCompletion(ticketId) {
    if (this.state.handled[ticketId]) return null;
    const thread = CUSTOMER_THREADS.find(item => item.ids.includes(ticketId));
    if (!thread) return null;
    const handledIds = new Set(Object.keys(this.state.handled));
    const before = thread.ids.filter(id => handledIds.has(id)).length;
    if (before >= thread.required || before + 1 < thread.required) return null;
    return { id: thread.id, title: thread.name };
  }

  getOfficeSnapshot(clearance = this.getClearanceProgress()) {
    const roomIds = [...this.state.progression.officeRooms];
    const rooms = roomIds.map(id => this.getOfficeRoom(id)).filter(Boolean);
    const offerIds = [...this.state.progression.pendingRoomChoices];
    const philosophyCounts = rooms.reduce((counts, room) => {
      counts[room.philosophy] = Number(counts[room.philosophy] ?? 0) + 1;
      return counts;
    }, {});
    const orderedPhilosophies = Object.entries(philosophyCounts)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
    const leadingCount = orderedPhilosophies[0]?.[1] ?? 0;
    const philosophy = orderedPhilosophies.length === 0
      ? 'Unbuilt office'
      : orderedPhilosophies.filter(([, count]) => count === leadingCount).length > 1
        ? 'Hybrid office'
        : orderedPhilosophies[0][0];
    const elevatorUnlocked = rooms.length >= 3;
    const activePaths = this.getActiveOfficePaths();
    const nextRank = clearance.nextRank;
    const ranks = normalizeClearanceRanks(CLEARANCE_RANKS);
    const nextRankIndex = nextRank ? ranks.findIndex(rank => rank.name === nextRank.name) : -1;
    const afterNextRank = nextRankIndex >= 0 ? ranks[nextRankIndex + 1] ?? null : null;
    const resolvedIncidents = Object.values(this.state.handled)
      .filter(decision => decision?.caseJudgment?.incidentResult === 'contained').length;
    const caseThreads = this.getCustomerThreadViews();

    return {
      capacity: OFFICE_ROOMS.length,
      roomsBuilt: rooms.length,
      roomIds,
      rooms,
      offers: offerIds.map(id => this.getOfficeRoom(id)).filter(Boolean),
      slots: OFFICE_ROOMS.map(room => ({ ...room, built: roomIds.includes(room.id) })),
      philosophy,
      philosophyCounts,
      activePaths,
      elevator: {
        unlocked: elevatorUnlocked,
        current: Math.min(rooms.length, 3),
        required: 3,
        label: elevatorUnlocked ? 'Executive elevator answering calls' : `${Math.min(rooms.length, 3)}/3 rooms restored`
      },
      careerChain: [nextRank, afterNextRank].filter(Boolean).map(rank => ({
        name: rank.name,
        minInsight: rank.minInsight,
        reward: rank.techniqueId
          ? this.getReplyTechnique(rank.techniqueId)?.name ?? rank.instruments?.name
          : rank.instruments?.name
      })),
      corkboard: [
        {
          id: 'elevator',
          title: elevatorUnlocked ? 'The elevator answered' : 'The sealed elevator',
          current: Math.min(rooms.length, 3),
          required: 3,
          complete: elevatorUnlocked,
          hint: elevatorUnlocked
            ? 'A button marked EXECUTIVE FLOOR now watches the queue.'
            : 'Three restored rooms should make the building admit you work here.'
        },
        {
          id: 'incident-record',
          title: 'Critical incident record',
          current: resolvedIncidents,
          required: 3,
          complete: resolvedIncidents >= 3,
          hint: 'Contain severe cases before their private clocks expire.'
        }
      ],
      caseThreads
    };
  }

  getActionsForTicket(ticketId) {
    const ticket = this.getTicket(ticketId);
    if (!ticket?.actions) return [];
    const orderedActions = Object.entries(ticket.actions).sort(([leftId], [rightId]) => {
      const leftOrder = hashString(`${this.state.runId}:${ticketId}:${leftId}:response-order`);
      const rightOrder = hashString(`${this.state.runId}:${ticketId}:${rightId}:response-order`);
      return leftOrder - rightOrder || leftId.localeCompare(rightId);
    });
    const baseActions = orderedActions.map(([actionId, action]) => {
      const base = ACTION_CATALOG[actionId] ?? { label: actionId, icon: '✉️', description: 'Custom action.', defaultDelta: {} };
      const authoredDelta = { ...(base.defaultDelta ?? {}), ...(action.delta ?? {}) };
      const delta = this.getEffectiveActionDelta(ticket, actionId, authoredDelta);
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
        schedule: action.schedule ?? [],
        forecast: buildQualitativeForecast(delta),
        conditionAffected: conditionAffectsAction(this.getShiftCondition(ticket.shiftId), actionId)
      };
    });
    const masteryAction = this.buildMasteryAction(ticket, baseActions);
    return masteryAction ? [...baseActions, masteryAction] : baseActions;
  }

  getReplyTechnique(techniqueId) {
    if (!techniqueId) return null;
    if (REPLY_TECHNIQUE_BY_ID instanceof Map) return REPLY_TECHNIQUE_BY_ID.get(techniqueId) ?? null;
    return (Array.isArray(REPLY_TECHNIQUES) ? REPLY_TECHNIQUES : [])
      .find(technique => technique?.id === techniqueId) ?? null;
  }

  getUnlockedReplyTechniques(insight = this.state.progression.insight) {
    return (Array.isArray(REPLY_TECHNIQUES) ? REPLY_TECHNIQUES : [])
      .filter(technique => technique?.id && finiteNonNegative(technique.minInsight, Infinity) <= insight)
      .sort((left, right) => left.minInsight - right.minInsight);
  }

  getUsedReplyTechniqueIds(shiftId = this.state.activeShiftId, state = this.state) {
    return new Set(Object.entries(state.handled ?? {})
      .filter(([ticketId, decision]) => (
        this.getTicket(ticketId)?.shiftId === shiftId
        && decision?.technique?.id
      ))
      .map(([, decision]) => decision.technique.id));
  }

  getReplyTechniqueViews(insight = this.state.progression.insight) {
    const used = this.getUsedReplyTechniqueIds();
    return this.getUnlockedReplyTechniques(insight).map(technique => ({
      ...technique,
      ready: !used.has(technique.id),
      usedThisShift: used.has(technique.id),
      usageRule: 'Once per shift'
    }));
  }

  getNextReplyTechnique(insight = this.state.progression.insight) {
    return (Array.isArray(REPLY_TECHNIQUES) ? REPLY_TECHNIQUES : [])
      .filter(technique => technique?.id && finiteNonNegative(technique.minInsight, Infinity) > insight)
      .sort((left, right) => left.minInsight - right.minInsight)[0] ?? null;
  }

  getTechniqueUnlocksBetween(beforeInsight, afterInsight) {
    return (Array.isArray(REPLY_TECHNIQUES) ? REPLY_TECHNIQUES : [])
      .filter(technique => (
        technique?.id
        && finiteNonNegative(technique.minInsight, Infinity) > beforeInsight
        && finiteNonNegative(technique.minInsight, Infinity) <= afterInsight
      ))
      .sort((left, right) => left.minInsight - right.minInsight);
  }

  announceTechniqueUnlocks(techniques = []) {
    for (const technique of techniques) {
      this.addLog({
        type: 'progression',
        title: 'Reply added to playbook',
        message: `${technique.name} is now available when it fits the case.`
      });
    }
  }

  buildMasteryAction(ticket, baseActions) {
    const caseFile = this.getCaseFile(ticket?.id);
    if (!caseFile || !Array.isArray(baseActions) || baseActions.length === 0) return null;
    const unlocked = [...this.getUnlockedReplyTechniques()]
      .sort((left, right) => right.minInsight - left.minInsight);
    const usedThisShift = this.getUsedReplyTechniqueIds();

    for (const technique of unlocked) {
      if (usedThisShift.has(technique.id)) continue;
      if (technique.incidentOnly && !isRecord(caseFile.incident)) continue;
      const sourceIds = Array.isArray(technique.sourceActionIds) ? technique.sourceActionIds : [];
      const candidates = sourceIds
        .map(sourceId => baseActions.find(action => action.id === sourceId))
        .filter(Boolean)
        .map(action => ({ action, grade: normalizeCaseGrade(caseFile.grades?.[action.id]) }))
        .filter(candidate => candidate.grade !== 'missed');
      const source = candidates.find(candidate => candidate.grade === 'strong') ?? candidates[0];
      if (!source) continue;

      const delta = { ...source.action.delta };
      addDelta(delta, metricDeltaRecord(technique.delta));
      const techniqueView = {
        id: technique.id,
        name: technique.name,
        glyph: technique.glyph,
        description: technique.description,
        minInsight: technique.minInsight,
        usageRule: 'Once per shift'
      };
      return {
        ...source.action,
        id: `mastery:${technique.id}`,
        label: safeText(technique.label, technique.name),
        icon: safeText(technique.glyph, '✦'),
        tone: safeText(technique.tone, 'Supervisor-approved'),
        description: safeText(technique.description, source.action.description),
        preview: safeText(technique.preview, source.action.preview),
        delta: sanitizeDelta(delta),
        outcomeTitle: `Special reply: ${source.action.outcomeTitle}`,
        outcome: `${source.action.outcome} ${safeText(technique.outcomeSuffix, '')}`.trim(),
        flags: { ...source.action.flags, replyMastery: 1 },
        schedule: [...source.action.schedule],
        forecast: buildQualitativeForecast(delta),
        isMastery: true,
        technique: techniqueView,
        sourceActionId: source.action.id,
        caseGrade: 'strong',
        caseReason: safeText(technique.reason, '')
      };
    }
    return null;
  }

  selectTicket(ticketId) {
    if (!this.content.ticketById.has(ticketId) || !this.state.queue.includes(ticketId)) return false;
    if (this.state.activeTimedEvent?.status === 'active') return false;
    if (this.state.activeIncident?.status === 'active' && ticketId !== this.state.activeIncident.ticketId) return false;
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
    if (this.state.activeTimedEvent?.status === 'active') {
      return { ok: false, error: 'Resolve the timed office interruption before returning to the queue.' };
    }
    if (this.state.activeIncident?.status === 'active' && ticketId !== this.state.activeIncident.ticketId) {
      return { ok: false, error: 'Resolve the critical incident before returning to the queue.' };
    }

    const resolvedAt = this.now();
    if (this.state.clockMode === 'shift' && this.getShiftElapsed(resolvedAt) >= this.getShiftDurationMs()) {
      this.endShift('timeout');
      return { ok: false, error: 'Shift time expired before the response was sent.' };
    }

    const action = this.getActionsForTicket(ticketId).find(item => item.id === actionId);
    if (!action) return { ok: false, error: 'Action not available for this ticket.' };

    if (
      this.state.activeIncident?.status === 'active'
      && this.state.activeIncident.ticketId === ticketId
      && this.getIncidentElapsed(resolvedAt) >= this.state.activeIncident.durationMs
    ) {
      this.expireActiveIncident(resolvedAt);
      if (this.state.failureReason) return { ok: false, error: 'The incident deadline ended your assignment.' };
    }
    const incidentResult = this.getIncidentResultForResolution(ticketId, resolvedAt);
    this.commitElapsed(resolvedAt);
    const insightBefore = this.state.progression.insight;
    const customerThreadCompletion = this.getCustomerThreadCompletion(ticketId);
    const caseJudgment = this.buildCaseJudgment(ticketId, actionId, incidentResult, action);
    if (caseJudgment && customerThreadCompletion) {
      const bonusInsight = caseJudgment.grade === 'strong' ? 1 : 0;
      caseJudgment.customerThread = { ...customerThreadCompletion, bonusInsight };
      caseJudgment.insightAwarded += bonusInsight;
      caseJudgment.insight = caseJudgment.insightAwarded;
    }
    const judgmentPressure = this.getJudgmentPressureDelta(caseJudgment?.grade, ticket.shiftId);
    const resolvedDelta = { ...action.delta };
    addDelta(resolvedDelta, judgmentPressure);
    if (caseJudgment) caseJudgment.pressureDelta = sanitizeDelta(judgmentPressure);

    this.applyDelta(resolvedDelta);
    this.incrementFlags(action.flags);
    if (caseJudgment?.grade === 'missed') this.incrementFlags({ missedBrief: 1 });
    this.scheduleFollowups(action.schedule);
    if (caseJudgment) {
      this.state.progression.insight += caseJudgment.insightAwarded;
    }
    const replyUnlocks = this.getTechniqueUnlocksBetween(insightBefore, this.state.progression.insight);

    const timestamp = new Date(resolvedAt).toISOString();
    this.state.handled[ticketId] = {
      actionId,
      actionLabel: action.label,
      at: timestamp,
      delta: sanitizeDelta(resolvedDelta),
      outcomeTitle: action.outcomeTitle,
      outcome: action.outcome,
      caseJudgment,
      technique: action.technique ?? null,
      sourceActionId: action.sourceActionId ?? null,
      scheduledFollowups: [...action.schedule]
    };

    this.releaseIncidentAfterResolution(ticketId, resolvedAt);

    this.addLog({
      type: 'ticket',
      title: action.outcomeTitle,
      message: `${ticket.from}: ${action.outcome}`,
      ticketId,
      actionId
    });
    if (caseJudgment?.customerThread) {
      this.addLog({
        type: 'progression',
        title: 'Customer case file closed',
        message: caseJudgment.customerThread.bonusInsight > 0
          ? `${caseJudgment.customerThread.title} is complete. The Strong final read adds +1 Insight.`
          : `${caseJudgment.customerThread.title} is complete, but its final read did not earn the +1 Insight bonus.`,
        ticketId,
        actionId
      });
    }
    if (action.schedule.length > 0) {
      this.addLog({
        type: 'story',
        title: 'Precedent created',
        message: `${ticket.from} may return in a later shift because of this reply.`,
        ticketId,
        actionId
      });
    }

    this.processThresholdEvents();
    this.checkFailure();

    if (!this.state.failureReason) {
      this.announceTechniqueUnlocks(replyUnlocks);
      this.activateNextIncident({ now: resolvedAt, emit: true });
      if (!this.state.activeIncident) this.activateTimedEventIfReady({ now: resolvedAt, emit: true });
    }

    this.emitChange(replyUnlocks.length > 0 ? 'reply-technique-unlocked' : 'resolve-ticket');
    return { ok: true, ticket, action, caseJudgment, replyUnlocks, scheduledFollowups: [...action.schedule] };
  }

  endShift(reason = 'cleared') {
    if (!['ticketing', 'shiftSummary'].includes(this.state.phase)) return false;
    if (this.state.phase === 'shiftSummary') return true;

    this.commitElapsed();
    const openIds = this.getOpenTicketIds();
    const shift = this.getCurrentShift();
    const unresolvedPenalty = this.calculateUnresolvedPenalty(openIds.length, reason);
    if (openIds.length > 0) this.applyDelta(unresolvedPenalty);
    const judgments = this.getShiftJudgmentStats(this.state.activeShiftId);
    const casework = this.getCaseworkStatus(this.state.activeShiftId);
    const auditMarkDelta = !casework.met
      ? (casework.remaining >= 4 ? 2 : 1)
      : casework.score >= casework.target + 2 && Number(this.state.flags.auditMark ?? 0) > 0 ? -1 : 0;
    if (auditMarkDelta !== 0) this.incrementFlags({ auditMark: auditMarkDelta });
    this.state.flags.auditMark = Math.max(0, Number(this.state.flags.auditMark ?? 0));
    const auditDelta = this.calculateCaseworkAuditDelta(casework);
    this.applyDelta(auditDelta);
    const timedEvents = this.getShiftTimedEventStats(this.state.activeShiftId);
    const insightEarned = judgments.insight + timedEvents.insight;
    const insightAtShiftStart = Math.max(0, this.state.progression.insight - insightEarned);
    const replyUnlocks = this.getTechniqueUnlocksBetween(insightAtShiftStart, this.state.progression.insight)
      .map(technique => technique.id);
    const artifactOffers = this.state.activeShiftId < Math.max(...SHIFTS.map(item => item.id))
      ? this.buildArtifactOffer(this.state.activeShiftId, casework)
      : [];
    const roomOffers = this.state.activeShiftId < Math.max(...SHIFTS.map(item => item.id))
      ? this.buildOfficeRoomOffer(this.state.activeShiftId)
      : [];
    this.state.progression.pendingArtifactChoices = artifactOffers;
    this.state.progression.pendingRoomChoices = roomOffers;

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
      judgments: judgments.counts,
      casework: {
        ...casework,
        auditDelta: sanitizeDelta(auditDelta),
        result: casework.met ? 'passed' : 'below-target',
        artifactOfferCount: artifactOffers.length,
        auditMarks: this.state.flags.auditMark,
        auditMarkDelta
      },
      insightEarned,
      insightTotal: this.state.progression.insight,
      timedEvents: timedEvents.results,
      replyUnlocks,
      artifactOffers,
      artifactChoice: artifactOffers.length > 0 ? null : 'none',
      artifactChosen: artifactOffers.length > 0 ? null : 'none',
      roomOffers,
      roomChoice: roomOffers.length > 0 ? null : 'none',
      roomChosen: roomOffers.length > 0 ? null : 'none',
      endedAt: new Date(this.now()).toISOString(),
      endingHint: this.getEndingLabel()
    };

    this.state.lastSummary = summary;
    this.state.shiftHistory.push(summary);
    this.state.phase = 'shiftSummary';
    this.state.shiftEndedAt = this.now();
    this.state.clockMode = 'shift';
    this.state.activeIncident = null;
    this.state.activeTimedEvent = null;

    this.addLog({
      type: reason === 'timeout' ? 'warning' : 'system',
      title: reason === 'timeout' ? 'Shift timed out' : 'Shift closed',
      message: openIds.length > 0
        ? `${openIds.length} unresolved ticket(s) generated penalties. The inbox will remember.`
        : `All available tickets closed. ${shift.title} is ready for audit.`
    });
    if (Object.keys(auditDelta).length > 0) {
      this.addLog({
        type: casework.met ? 'progression' : 'warning',
        title: casework.met ? 'Casework target exceeded' : 'Casework target missed',
        message: casework.met
          ? 'Careful reads steadied the desk before the next shift.'
          : 'Missed details created additional audit pressure.'
      });
    }

    this.checkFailure();
    this.emitChange('end-shift');
    return true;
  }

  advanceShift() {
    if (this.state.phase !== 'shiftSummary') return false;
    if (this.state.failureReason) return false;

    const nextShiftId = this.state.activeShiftId + 1;
    if (this.content.shiftById.has(nextShiftId) && this.state.lastSummary?.artifactChoice == null) return false;
    if (this.content.shiftById.has(nextShiftId) && this.state.lastSummary?.roomChoice == null) return false;
    if (!this.content.shiftById.has(nextShiftId)) {
      this.state.phase = 'demoComplete';
      this.addLog({
        type: 'system',
        title: 'Probation complete',
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
    this.state.clockMode = 'shift';
    this.state.activeIncident = null;
    this.state.activeTimedEvent = null;
    this.state.progression.pendingArtifactChoices = [];
    this.state.progression.pendingRoomChoices = [];
    this.state.unlockedDepartments = unique([
      ...this.state.unlockedDepartments,
      ...(nextShift.unlocks ?? [])
    ]);
    this.applyShiftStartPressure();
    this.applyArtifactShiftStartEffects();
    this.applyOfficeShiftStartEffects();
    this.activateNextIncident({ now: this.now(), emit: true });
    if (!this.state.activeIncident) this.activateTimedEventIfReady({ now: this.now(), emit: true });

    this.addLog({
      type: 'system',
      title: `Shift ${nextShiftId} opened`,
      message: `${nextShift.title}: ${nextShift.objective}`
    });
    this.checkFailure();
    this.emitChange('advance-shift');
    return true;
  }

  chooseArtifact(artifactId) {
    if (this.state.phase !== 'shiftSummary' || !this.state.lastSummary) return false;
    if (this.state.lastSummary.artifactChoice != null) return false;

    const choices = this.state.progression.pendingArtifactChoices;
    const choice = artifactId === 'none' ? 'none' : safeText(artifactId, '');
    if (choice !== 'none' && !choices.includes(choice)) return false;
    if (choice !== 'none' && !this.getArtifact(choice)) return false;

    if (choice !== 'none') {
      this.state.progression.artifacts = unique([...this.state.progression.artifacts, choice]);
    }
    this.state.progression.pendingArtifactChoices = [];
    this.state.lastSummary.artifactChoice = choice;
    this.state.lastSummary.artifactChosen = choice;
    const historySummary = [...this.state.shiftHistory]
      .reverse()
      .find(item => item.shiftId === this.state.lastSummary.shiftId);
    if (historySummary) {
      historySummary.artifactChoice = choice;
      historySummary.artifactChosen = choice;
    }

    this.addLog({
      type: 'progression',
      title: choice === 'none' ? 'Artifact declined' : 'Desk artifact acquired',
      message: choice === 'none'
        ? 'You leave the requisition tray untouched.'
        : `${this.getArtifact(choice)?.name ?? choice} has been added to your desk.`
    });
    this.emitChange('choose-artifact');
    return true;
  }

  chooseOfficeRoom(roomId) {
    if (this.state.phase !== 'shiftSummary' || !this.state.lastSummary) return false;
    if (this.state.lastSummary.roomChoice != null) return false;

    const choice = safeText(roomId, '');
    const choices = this.state.progression.pendingRoomChoices;
    if (!choices.includes(choice) || !this.getOfficeRoom(choice)) return false;
    if (this.state.progression.officeRooms.includes(choice)) return false;

    const roomsBefore = this.state.progression.officeRooms.length;
    this.state.progression.officeRooms = unique([...this.state.progression.officeRooms, choice]);
    this.state.progression.pendingRoomChoices = [];
    this.state.lastSummary.roomChoice = choice;
    this.state.lastSummary.roomChosen = choice;
    const historySummary = [...this.state.shiftHistory]
      .reverse()
      .find(item => item.shiftId === this.state.lastSummary.shiftId);
    if (historySummary) {
      historySummary.roomChoice = choice;
      historySummary.roomChosen = choice;
    }

    const room = this.getOfficeRoom(choice);
    this.addLog({
      type: 'progression',
      title: `${room?.name ?? choice} restored`,
      message: `${room?.boon ?? 'The office expands.'} Complication: ${room?.complication ?? 'The building notices.'}`
    });
    if (roomsBefore < 3 && this.state.progression.officeRooms.length >= 3) {
      this.state.unlockedDepartments = unique([...this.state.unlockedDepartments, 'Executive Floor']);
      this.addLog({
        type: 'story',
        title: 'The elevator answered',
        message: 'Three restored rooms make the sealed elevator light up. Its only button reads EXECUTIVE FLOOR.'
      });
    }
    this.emitChange('choose-office-room');
    return true;
  }

  togglePause() {
    if (this.state.phase !== 'ticketing') return false;
    if (this.state.paused) {
      this.state.paused = false;
      const resumedAt = this.now();
      if (this.state.clockMode === 'incident' && this.state.activeIncident?.status === 'active') {
        this.state.activeIncident.startedAt = resumedAt;
      } else if (this.state.clockMode === 'event' && this.state.activeTimedEvent?.status === 'active') {
        this.state.activeTimedEvent.startedAt = resumedAt;
      } else {
        this.state.shiftStartedAt = resumedAt;
      }
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
    this.addLog({ type: 'system', title: 'Assignment restored', message: 'The imported personnel record is back on your desk.' });
    this.emitChange('import');
  }

  getShiftElapsed(now = this.now()) {
    if (this.state.phase !== 'ticketing') return this.state.shiftElapsedMs;
    if (this.state.paused || this.state.clockMode !== 'shift') return this.state.shiftElapsedMs;
    return this.state.shiftElapsedMs + Math.max(0, now - Number(this.state.shiftStartedAt ?? now));
  }

  getShiftDurationMs(shift = this.getCurrentShift()) {
    let duration = shift?.durationMs ?? 5 * 60 * 1000;
    let multiplier = 1;
    for (const artifact of this.getEquippedArtifacts()) {
      for (const effects of artifactEffectRecords(artifact)) {
        duration += finiteNumber(effects.shiftDurationMs ?? effects.shiftDurationDeltaMs, 0);
        multiplier *= positiveNumber(effects.shiftDurationMultiplier, 1);
      }
    }
    const adjusted = Math.max(30 * 1000, Math.round(duration * multiplier));
    return this.state.settings.qaSpeed ? Math.max(45 * 1000, Math.floor(adjusted / 6)) : adjusted;
  }

  getIncidentElapsed(now = this.now(), incident = this.state.activeIncident) {
    if (!incident) return 0;
    if (incident.status !== 'active' || this.state.phase !== 'ticketing' || this.state.paused || this.state.clockMode !== 'incident') {
      return finiteNonNegative(incident.elapsedMs, 0);
    }
    return finiteNonNegative(incident.elapsedMs, 0)
      + Math.max(0, now - Number(incident.startedAt ?? now));
  }

  getIncidentSnapshot(now = this.now()) {
    const incident = this.state.activeIncident;
    if (!incident) return null;
    const elapsedMs = this.getIncidentElapsed(now, incident);
    const durationMs = positiveNumber(incident.durationMs, 1);
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    const ticket = this.getTicket(incident.ticketId);
    const caseFile = this.getCaseFile(incident.ticketId);
    return {
      ...incident,
      ticket,
      caseFile,
      label: safeText(caseFile?.incident?.label, ticket?.subject ?? 'Critical incident'),
      expired: incident.status === 'expired',
      elapsedMs,
      remainingMs,
      durationMs,
      timerPercent: clamp((remainingMs / durationMs) * 100, 0, 100)
    };
  }

  processDeadlines(now = this.now()) {
    const result = {
      incidentWarnings: [],
      incidentExpired: false,
      timedEventWarnings: [],
      timedEventExpired: false,
      shiftEnded: false
    };
    if (this.state.phase !== 'ticketing' || this.state.paused) return result;

    const timedEvent = this.state.activeTimedEvent;
    if (timedEvent?.status === 'active') {
      const remainingMs = Math.max(0, timedEvent.durationMs - this.getTimedEventElapsed(now, timedEvent));
      if (remainingMs <= 0 && this.expireActiveTimedEvent(now)) {
        result.timedEventExpired = true;
        return result;
      }
      const dueWarnings = TIMED_EVENT_WARNINGS.filter(seconds => (
        remainingMs <= seconds * 1000
        && !timedEvent.announcedThresholds.includes(seconds)
      ));
      if (dueWarnings.length > 0) {
        this.commitElapsed(now);
        for (const seconds of dueWarnings) {
          timedEvent.announcedThresholds.push(seconds);
          result.timedEventWarnings.push(seconds);
          this.emitChange(`timed-event-warning-${seconds}`);
        }
      }
      return result;
    }

    const incident = this.state.activeIncident;
    if (incident?.status === 'active') {
      const remainingMs = Math.max(0, incident.durationMs - this.getIncidentElapsed(now, incident));
      if (remainingMs <= 0 && this.expireActiveIncident(now)) {
        result.incidentExpired = true;
        return result;
      }
      const dueWarnings = INCIDENT_WARNINGS.filter(seconds => (
        remainingMs <= seconds * 1000
        && !incident.announcedThresholds.includes(seconds)
      ));
      if (dueWarnings.length > 0) {
        this.commitElapsed(now);
        for (const seconds of dueWarnings) {
          incident.announcedThresholds.push(seconds);
          result.incidentWarnings.push(seconds);
          this.emitChange(`incident-warning-${seconds}`);
        }
      }

      return result;
    }

    if (this.getShiftElapsed(now) >= this.getShiftDurationMs()) {
      result.shiftEnded = this.endShift('timeout');
    }
    return result;
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

  getEffectiveActionDelta(ticket, actionId, authoredDelta = {}) {
    const delta = { ...sanitizeDelta(authoredDelta) };
    for (const artifact of this.getEquippedArtifacts()) {
      for (const effects of artifactEffectRecords(artifact)) {
        addDelta(delta, metricDeltaRecord(effects.actionDelta));
        addDelta(delta, metricDeltaRecord(effects.actionDeltas?.[actionId]));
        addDelta(delta, metricDeltaRecord(effects.actionDeltaById?.[actionId]));
        addDelta(delta, metricDeltaRecord(effects.actionTypeDeltas?.[actionId]));
        addDelta(delta, metricDeltaRecord(effects.actions?.[actionId]?.delta));
        if (effects.actionId === actionId) addDelta(delta, metricDeltaRecord(effects.delta));
        if (effects.ticketId === ticket.id) addDelta(delta, metricDeltaRecord(effects.ticketDelta ?? effects.delta));
      }
    }
    const condition = this.getShiftCondition(ticket.shiftId);
    for (const effects of conditionEffectRecords(condition)) {
      addDelta(delta, metricDeltaRecord(effects.actionDelta));
      addDelta(delta, metricDeltaRecord(effects.actionDeltas?.[actionId]));
      addDelta(delta, metricDeltaRecord(effects.actionDeltaById?.[actionId]));
      addDelta(delta, metricDeltaRecord(effects.actionTypeDeltas?.[actionId]));
      addDelta(delta, metricDeltaRecord(effects.actions?.[actionId]?.delta));
      if (effects.actionId === actionId) addDelta(delta, metricDeltaRecord(effects.delta));
      if (effects.ticketId === ticket.id) addDelta(delta, metricDeltaRecord(effects.ticketDelta ?? effects.delta));
    }
    return sanitizeDelta(delta);
  }

  getEquippedArtifacts(progression = this.state.progression) {
    const ids = Array.isArray(progression?.artifacts) ? progression.artifacts : [];
    return ids.map(id => this.getArtifact(id)).filter(Boolean);
  }

  buildCaseJudgment(ticketId, actionId, incidentResult = null, action = null) {
    const caseFile = this.getCaseFile(ticketId);
    if (!caseFile) return null;
    const gradeRecord = caseFile.grades?.[actionId];
    const authoredGrade = isRecord(gradeRecord) ? gradeRecord.grade : gradeRecord;
    const grade = normalizeCaseGrade(action?.caseGrade ?? authoredGrade);
    const reason = safeText(
      action?.caseReason
        ?? caseFile.reasons?.[actionId]
        ?? (isRecord(gradeRecord) ? gradeRecord.reason : ''),
      ''
    );
    let insightAwarded = CASE_INSIGHT[grade];
    for (const artifact of this.getEquippedArtifacts()) {
      for (const effects of artifactEffectRecords(artifact)) {
        insightAwarded += finiteNumber(effects.insightBonus, 0);
        insightAwarded += finiteNumber(effects.gradeInsightBonus?.[grade], 0);
        insightAwarded += finiteNumber(effects.insightByGrade?.[grade], 0);
      }
    }
    for (const effects of this.getOfficeEffectRecords()) {
      insightAwarded += finiteNumber(effects.insightBonus, 0);
      insightAwarded += finiteNumber(effects.gradeInsightBonus?.[grade], 0);
      insightAwarded += finiteNumber(effects.insightByGrade?.[grade], 0);
    }
    if (incidentResult === 'contained' && grade !== 'missed') {
      insightAwarded += finiteNumber(caseFile.incident?.bonusInsight, 0);
    }
    insightAwarded = Math.max(0, Math.round(insightAwarded));

    return {
      focus: caseFocusText(caseFile.focus),
      grade,
      rating: grade,
      label: caseGradeLabel(grade),
      points: CASE_POINTS[grade],
      letter: caseLetterGrade(grade),
      reason,
      insightAwarded,
      insight: insightAwarded,
      incidentResult
    };
  }

  getJudgmentPressureDelta(grade, shiftId = this.state.activeShiftId) {
    if (normalizeCaseGrade(grade) !== 'missed') return {};
    const level = clamp(Math.round(finiteNumber(shiftId, 1)), 1, 5);
    const pressure = { inboxHeat: level + 1 };
    if (level >= 2) pressure.reputation = -1;
    if (level >= 3) pressure.sanity = -1;
    if (level >= 4) pressure.containment = -2;
    if (level >= 5) pressure.soulRisk = 2;
    return pressure;
  }

  getIncidentResultForResolution(ticketId, now = this.now()) {
    const incident = this.state.activeIncident;
    if (!incident || incident.ticketId !== ticketId) return null;
    if (incident.status === 'expired') return 'expired';
    if (incident.status !== 'active') return null;
    return this.getIncidentElapsed(now, incident) < incident.durationMs ? 'contained' : 'expired';
  }

  getIncidentDurationMs(caseFile, progression = this.state.progression, settings = this.state.settings) {
    const incident = caseFile?.incident;
    if (!isRecord(incident)) return 0;
    let duration = positiveNumber(incident.durationMs ?? incident.timeLimitMs, 60 * 1000);
    let multiplier = 1;
    for (const artifact of this.getEquippedArtifacts(progression)) {
      for (const effects of artifactEffectRecords(artifact)) {
        duration += finiteNumber(effects.incidentDurationMs ?? effects.incidentDurationDeltaMs, 0);
        multiplier *= positiveNumber(effects.incidentDurationMultiplier, 1);
      }
    }
    for (const effects of this.getOfficeEffectRecords(progression)) {
      duration += finiteNumber(effects.incidentDurationMs ?? effects.incidentDurationDeltaMs, 0);
      multiplier *= positiveNumber(effects.incidentDurationMultiplier, 1);
    }
    const adjusted = Math.max(10 * 1000, Math.round(duration * multiplier));
    return settings?.qaSpeed ? Math.max(15 * 1000, Math.floor(adjusted / 6)) : adjusted;
  }

  activateNextIncident({ state = this.state, now = this.now(), emit = false } = {}) {
    if (state.phase !== 'ticketing' || state.activeIncident || state.activeTimedEvent) return false;
    const ticketId = state.queue.find(id => !state.handled[id] && isRecord(this.getCaseFile(id)?.incident));
    if (!ticketId) return false;

    if (state === this.state && !state.paused && state.clockMode === 'shift') this.commitElapsed(now);
    const caseFile = this.getCaseFile(ticketId);
    state.activeIncident = {
      ticketId,
      status: 'active',
      durationMs: this.getIncidentDurationMs(caseFile, state.progression, state.settings),
      elapsedMs: 0,
      startedAt: now,
      announcedThresholds: [],
      expiredAt: null
    };
    state.clockMode = 'incident';
    state.selectedTicketId = ticketId;
    if (state === this.state) {
      this.addLog({
        type: 'incident',
        title: 'Critical incident opened',
        message: `${this.getTicket(ticketId)?.subject ?? 'A severe case'} has stopped the shift clock.` ,
        ticketId
      });
      if (emit) this.emitChange('incident-start');
    }
    return true;
  }

  normalizeActiveIncident(value, state) {
    if (!isRecord(value)) return null;
    const ticketId = typeof value.ticketId === 'string' ? value.ticketId : '';
    const caseFile = this.getCaseFile(ticketId);
    if (!state.queue.includes(ticketId) || state.handled[ticketId] || !isRecord(caseFile?.incident)) return null;
    const status = value.status === 'expired' ? 'expired' : 'active';
    const durationMs = positiveNumber(
      value.durationMs,
      this.getIncidentDurationMs(caseFile, state.progression, state.settings)
    );
    return {
      ticketId,
      status,
      durationMs,
      elapsedMs: clamp(finiteNonNegative(value.elapsedMs, 0), 0, durationMs),
      startedAt: finiteNonNegative(value.startedAt, this.now()),
      announcedThresholds: unique((Array.isArray(value.announcedThresholds) ? value.announcedThresholds : [])
        .map(Number)
        .filter(seconds => INCIDENT_WARNINGS.includes(seconds))),
      expiredAt: value.expiredAt == null ? null : finiteNonNegative(value.expiredAt, null)
    };
  }

  releaseIncidentAfterResolution(ticketId, now = this.now()) {
    const incident = this.state.activeIncident;
    if (!incident || incident.ticketId !== ticketId) return false;
    this.state.activeIncident = null;
    this.state.clockMode = 'shift';
    this.state.shiftStartedAt = now;
    return true;
  }

  expireActiveIncident(now = this.now()) {
    const incident = this.state.activeIncident;
    if (!incident || incident.status !== 'active') return false;
    this.commitElapsed(now);
    incident.elapsedMs = incident.durationMs;
    incident.startedAt = now;
    incident.status = 'expired';
    incident.expiredAt = now;
    this.state.clockMode = 'shift';
    this.state.shiftStartedAt = now;

    const caseFile = this.getCaseFile(incident.ticketId);
    const expiryDelta = sanitizeDelta(caseFile?.incident?.expiryDelta ?? caseFile?.incident?.timeoutDelta);
    this.applyDelta(expiryDelta);
    this.addLog({
      type: 'warning',
      title: 'Critical incident deadline missed',
      message: safeText(
        caseFile?.incident?.expiryText ?? caseFile?.incident?.timeoutText,
        'The incident escalates, applies its penalty, and releases the shift clock.'
      ),
      ticketId: incident.ticketId
    });
    this.processThresholdEvents();
    this.checkFailure();
    this.emitChange('incident-timeout');
    return true;
  }

  getTimedEvent(eventId) {
    if (!eventId) return null;
    return (Array.isArray(TIMED_EVENTS) ? TIMED_EVENTS : [])
      .find(event => event?.id === eventId) ?? null;
  }

  getTimedEventElapsed(now = this.now(), activeEvent = this.state.activeTimedEvent) {
    if (!activeEvent) return 0;
    if (
      activeEvent.status !== 'active'
      || this.state.phase !== 'ticketing'
      || this.state.paused
      || this.state.clockMode !== 'event'
    ) {
      return finiteNonNegative(activeEvent.elapsedMs, 0);
    }
    return finiteNonNegative(activeEvent.elapsedMs, 0)
      + Math.max(0, now - Number(activeEvent.startedAt ?? now));
  }

  getTimedEventSnapshot(now = this.now()) {
    const activeEvent = this.state.activeTimedEvent;
    if (!activeEvent) return null;
    const event = this.getTimedEvent(activeEvent.eventId);
    if (!event) return null;
    const elapsedMs = this.getTimedEventElapsed(now, activeEvent);
    const durationMs = positiveNumber(activeEvent.durationMs, 1);
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    return {
      ...activeEvent,
      ...event,
      elapsedMs,
      remainingMs,
      durationMs,
      timerPercent: clamp((remainingMs / durationMs) * 100, 0, 100)
    };
  }

  activateTimedEventIfReady({ state = this.state, now = this.now(), emit = false } = {}) {
    if (state.phase !== 'ticketing' || state.activeIncident || state.activeTimedEvent) return false;
    const completed = new Set((Array.isArray(state.timedEventHistory) ? state.timedEventHistory : [])
      .map(result => result?.eventId));
    const roomEventOccurredThisShift = (Array.isArray(state.timedEventHistory) ? state.timedEventHistory : [])
      .some(result => result?.shiftId === state.activeShiftId && this.getTimedEvent(result?.eventId)?.roomEvent);
    const resolvedThisShift = state.queue.filter(ticketId => Boolean(state.handled[ticketId])).length;
    const event = (Array.isArray(TIMED_EVENTS) ? TIMED_EVENTS : []).find(candidate => (
      eventMatchesState(candidate, state)
      && !completed.has(candidate.id)
      && (!candidate.roomEvent || !roomEventOccurredThisShift)
      && resolvedThisShift >= finiteNonNegative(candidate.triggerResolved, Infinity)
    ));
    if (!event) return false;

    if (state === this.state && !state.paused && state.clockMode === 'shift') this.commitElapsed(now);
    state.activeTimedEvent = {
      eventId: event.id,
      status: 'active',
      durationMs: positiveNumber(event.durationMs, 25 * 1000),
      elapsedMs: 0,
      startedAt: now,
      announcedThresholds: []
    };
    state.clockMode = 'event';
    if (state === this.state) {
      this.addLog({
        type: 'event',
        title: 'Timed office interruption',
        message: `${event.title} The normal shift clock has stopped.`
      });
      if (emit) this.emitChange('timed-event-start');
    }
    return true;
  }

  normalizeActiveTimedEvent(value, state) {
    if (!isRecord(value)) return null;
    const eventId = safeText(value.eventId, '');
    const event = this.getTimedEvent(eventId);
    if (!event || !eventMatchesState(event, state)) return null;
    if (state.timedEventHistory.some(result => result.eventId === eventId)) return null;
    const durationMs = positiveNumber(value.durationMs, event.durationMs);
    return {
      eventId,
      status: 'active',
      durationMs,
      elapsedMs: clamp(finiteNonNegative(value.elapsedMs, 0), 0, durationMs),
      startedAt: finiteNonNegative(value.startedAt, this.now()),
      announcedThresholds: unique((Array.isArray(value.announcedThresholds) ? value.announcedThresholds : [])
        .map(Number)
        .filter(seconds => TIMED_EVENT_WARNINGS.includes(seconds)))
    };
  }

  resolveTimedEvent(choiceId) {
    const activeEvent = this.state.activeTimedEvent;
    if (!activeEvent || activeEvent.status !== 'active') return { ok: false, error: 'No timed event is active.' };
    if (this.state.phase !== 'ticketing' || this.state.paused) return { ok: false, error: 'Resume before choosing.' };
    const event = this.getTimedEvent(activeEvent.eventId);
    const choice = event?.choices?.find(option => option.id === choiceId);
    if (!event || !choice) return { ok: false, error: 'That event choice is not available.' };

    const resolvedAt = this.now();
    if (this.getTimedEventElapsed(resolvedAt, activeEvent) >= activeEvent.durationMs) {
      this.expireActiveTimedEvent(resolvedAt);
      return { ok: false, error: 'The office interruption expired before the choice was made.' };
    }

    this.commitElapsed(resolvedAt);
    const insightBefore = this.state.progression.insight;
    const insightAwarded = 1;
    this.applyDelta(choice.delta);
    this.state.progression.insight += insightAwarded;
    const replyUnlocks = this.getTechniqueUnlocksBetween(insightBefore, this.state.progression.insight);
    this.state.timedEventHistory.push({
      eventId: event.id,
      shiftId: this.state.activeShiftId,
      result: 'resolved',
      choiceId: choice.id,
      choiceLabel: choice.label,
      outcome: choice.outcome,
      delta: sanitizeDelta(choice.delta),
      insightAwarded,
      at: new Date(resolvedAt).toISOString()
    });
    this.state.activeTimedEvent = null;
    this.state.clockMode = 'shift';
    this.state.shiftStartedAt = resolvedAt;
    this.addLog({
      type: 'event',
      title: choice.label,
      message: `${choice.outcome} +${insightAwarded} Insight.`
    });
    this.processThresholdEvents();
    this.checkFailure();
    if (!this.state.failureReason) this.announceTechniqueUnlocks(replyUnlocks);
    this.emitChange('timed-event-resolved');
    return { ok: true, event, choice, insightAwarded, replyUnlocks };
  }

  expireActiveTimedEvent(now = this.now()) {
    const activeEvent = this.state.activeTimedEvent;
    if (!activeEvent || activeEvent.status !== 'active') return false;
    this.commitElapsed(now);
    const event = this.getTimedEvent(activeEvent.eventId);
    const delta = sanitizeDelta(event?.timeoutDelta);
    this.applyDelta(delta);
    this.state.timedEventHistory.push({
      eventId: activeEvent.eventId,
      shiftId: this.state.activeShiftId,
      result: 'expired',
      choiceId: null,
      choiceLabel: 'No response',
      outcome: safeText(event?.timeoutText, 'The interruption resolves itself badly.'),
      delta,
      insightAwarded: 0,
      at: new Date(now).toISOString()
    });
    this.state.activeTimedEvent = null;
    this.state.clockMode = 'shift';
    this.state.shiftStartedAt = now;
    this.addLog({
      type: 'warning',
      title: 'Office interruption expired',
      message: safeText(event?.timeoutText, 'The interruption resolves itself badly.')
    });
    this.processThresholdEvents();
    this.checkFailure();
    this.emitChange('timed-event-timeout');
    return true;
  }

  buildArtifactOffer(shiftId, casework = this.getCaseworkStatus(shiftId)) {
    const chosen = new Set(this.state.progression.artifacts);
    const candidates = (Array.isArray(ARTIFACTS) ? ARTIFACTS : [])
      .filter(item => item?.id && !chosen.has(item.id));
    const seed = hashString(`${this.state.runId}:${shiftId}:artifact-draft`);
    const score = finiteNonNegative(casework?.score, 0);
    const target = finiteNonNegative(casework?.target, 0);
    const roomBonus = this.getOfficeEffectRecords()
      .reduce((total, effects) => total + finiteNumber(effects.artifactOfferBonus, 0), 0);
    const offerCount = clamp((score >= target + 2 ? 4 : score >= target ? 3 : 2) + roomBonus, 2, 5);
    return deterministicShuffle(candidates, seed).slice(0, offerCount).map(item => item.id);
  }

  buildOfficeRoomOffer(shiftId) {
    const built = new Set(this.state.progression.officeRooms);
    const candidates = (Array.isArray(OFFICE_ROOMS) ? OFFICE_ROOMS : [])
      .filter(room => room?.id && !built.has(room.id));
    const seed = hashString(`${this.state.runId}:${shiftId}:office-draft`);
    return deterministicShuffle(candidates, seed).slice(0, Math.min(3, candidates.length)).map(room => room.id);
  }

  restoreArtifactDraft(state) {
    if (state.phase !== 'shiftSummary' || !state.lastSummary) return;
    const maxShiftId = Math.max(...SHIFTS.map(item => item.id));
    if (state.activeShiftId >= maxShiftId || state.lastSummary.artifactChoice != null) {
      state.progression.pendingArtifactChoices = [];
      return;
    }
    let choices = unique(state.progression.pendingArtifactChoices)
      .filter(id => this.getArtifact(id) && !state.progression.artifacts.includes(id));
    if (choices.length === 0) {
      const priorState = this.state;
      this.state = state;
      choices = this.buildArtifactOffer(state.activeShiftId);
      this.state = priorState;
    }
    state.progression.pendingArtifactChoices = choices.slice(0, 5);
    state.lastSummary.artifactOffers = state.progression.pendingArtifactChoices;
    if (choices.length === 0) {
      state.lastSummary.artifactChoice = 'none';
      state.lastSummary.artifactChosen = 'none';
    }
  }

  restoreOfficeDraft(state) {
    if (state.phase !== 'shiftSummary' || !state.lastSummary) return;
    const maxShiftId = Math.max(...SHIFTS.map(item => item.id));
    if (state.activeShiftId >= maxShiftId || state.lastSummary.roomChoice != null) {
      state.progression.pendingRoomChoices = [];
      return;
    }
    let choices = unique(state.progression.pendingRoomChoices)
      .filter(id => this.getOfficeRoom(id) && !state.progression.officeRooms.includes(id));
    if (choices.length === 0) {
      const priorState = this.state;
      this.state = state;
      choices = this.buildOfficeRoomOffer(state.activeShiftId);
      this.state = priorState;
    }
    state.progression.pendingRoomChoices = choices.slice(0, 3);
    state.lastSummary.roomOffers = state.progression.pendingRoomChoices;
    if (choices.length === 0) {
      state.lastSummary.roomChoice = 'none';
      state.lastSummary.roomChosen = 'none';
    }
  }

  getShiftJudgmentStats(shiftId) {
    const counts = { strong: 0, defensible: 0, missed: 0 };
    let insight = 0;
    let points = 0;
    for (const [ticketId, decision] of Object.entries(this.state.handled)) {
      if (this.getTicket(ticketId)?.shiftId !== shiftId || !decision.caseJudgment) continue;
      const grade = normalizeCaseGrade(decision.caseJudgment.grade);
      counts[grade] += 1;
      insight += finiteNonNegative(decision.caseJudgment.insightAwarded, 0);
      points += finiteNonNegative(decision.caseJudgment.points, CASE_POINTS[grade]);
    }
    return { counts, insight, points };
  }

  getShiftTimedEventStats(shiftId) {
    const results = (Array.isArray(this.state.timedEventHistory) ? this.state.timedEventHistory : [])
      .filter(result => result.shiftId === shiftId)
      .map(result => deepClone(result));
    const insight = results.reduce((total, result) => (
      total + finiteNonNegative(result.insightAwarded, 0)
    ), 0);
    return { results, insight };
  }

  calculateCaseworkAuditDelta(casework = this.getCaseworkStatus()) {
    const score = finiteNonNegative(casework?.score, 0);
    const target = finiteNonNegative(casework?.target, 0);
    const deficit = Math.max(0, target - score);
    const surplus = Math.max(0, score - target);
    if (deficit > 0) {
      return sanitizeDelta({
        reputation: -2 * deficit,
        sanity: -Math.ceil(deficit / 2),
        inboxHeat: 2 * deficit
      });
    }
    if (surplus >= 2) {
      return sanitizeDelta({ sanity: 2, containment: 2, inboxHeat: -1 });
    }
    return {};
  }

  getClearanceProgress() {
    const ranks = normalizeClearanceRanks(CLEARANCE_RANKS);
    const insight = this.state.progression.insight;
    let rank = ranks[0];
    for (const candidate of ranks) {
      if (candidate.minInsight <= insight) rank = candidate;
    }
    const rankIndex = ranks.indexOf(rank);
    const nextRank = ranks[rankIndex + 1] ?? null;
    const span = nextRank ? Math.max(1, nextRank.minInsight - rank.minInsight) : 0;
    const earned = nextRank ? clamp(insight - rank.minInsight, 0, span) : 0;
    return {
      rank,
      nextRank,
      progress: {
        earned,
        required: span,
        percent: nextRank ? clamp((earned / span) * 100, 0, 100) : 100,
        totalInsight: insight
      }
    };
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
    if (Number(this.state.flags.auditMark ?? 0) >= 3) failure = 'probation';

    if (failure && !this.state.failureReason) {
      this.state.failureReason = failure;
      this.state.phase = 'gameOver';
      this.addLog({
        type: 'failure',
        title: 'Employment ended',
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

  applyArtifactShiftStartEffects() {
    const delta = {};
    for (const artifact of this.getEquippedArtifacts()) {
      for (const effects of artifactEffectRecords(artifact)) {
        addDelta(delta, metricDeltaRecord(effects.shiftStartDelta));
      }
    }
    this.applyDelta(delta);
  }

  applyOfficeShiftStartEffects() {
    const delta = {};
    for (const effects of this.getOfficeEffectRecords()) {
      addDelta(delta, metricDeltaRecord(effects.shiftStartDelta));
    }
    this.applyDelta(delta);
    if (Object.keys(delta).length > 0) {
      this.addLog({
        type: 'progression',
        title: 'The office opens with you',
        message: 'Your restored rooms apply their ongoing benefits and operating costs.'
      });
    }
  }

  commitElapsed(now = this.now()) {
    if (!this.state.paused && this.state.phase === 'ticketing') {
      if (this.state.clockMode === 'incident' && this.state.activeIncident?.status === 'active') {
        this.state.activeIncident.elapsedMs = this.getIncidentElapsed(now);
        this.state.activeIncident.startedAt = now;
      } else if (this.state.clockMode === 'event' && this.state.activeTimedEvent?.status === 'active') {
        this.state.activeTimedEvent.elapsedMs = this.getTimedEventElapsed(now);
        this.state.activeTimedEvent.startedAt = now;
      } else {
        this.state.shiftElapsedMs = this.getShiftElapsed(now);
        this.state.shiftStartedAt = now;
      }
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
    const careerCasework = this.getCareerCaseworkStatus();
    const techniques = this.getUnlockedReplyTechniques().length;
    const timedEvents = this.state.timedEventHistory.filter(result => result.result === 'resolved').length;
    return `Probation complete: ${ending}. You resolved ${handled} ticket(s) with a ${careerCasework.grade} probation case grade, earned ${this.state.progression.insight} Insight, restored ${this.state.progression.officeRooms.length} room(s), added ${techniques} special reply technique(s) to your playbook, handled ${timedEvents} office interruption(s), kept ${this.state.progression.artifacts.length} desk artifact(s), and left ${this.state.metrics.soulRisk}% soul risk on the table.`;
  }

  failureTitle(reason) {
    return ({
      burnout: 'Burnout: The Cursor Keeps Moving',
      terminated: 'Terminated: Reputation Collapse',
      claimed: 'Claimed by Infernal Accounts',
      breach: 'Containment Breach',
      probation: 'Probation Failed: Read the Email'
    })[reason] ?? 'Assignment Failed';
  }

  failureText(reason) {
    return ({
      burnout: 'Your sanity bottoms out. The inbox continues typing polite replies with your hands.',
      terminated: 'Reputation reaches zero. A normal-looking HR email arrives, which is how you know it is over.',
      claimed: 'Soul Risk reaches 100. Infernal Accounts stamps PAID IN FULL on your reflection.',
      breach: 'Containment collapses. The inbox is no longer on the screen; it is the room.',
      probation: 'Three audit marks confirm that fast replies kept missing the actual cases. Your badge quietly unprints your name.'
    })[reason] ?? 'Your assignment has ended.';
  }

  emitChange(reason) {
    this.commitElapsed();
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
    textScale: clamp(Number.isFinite(textScale) ? textScale : defaults.textScale, 0.9, 1.18),
    qaSpeed: raw.qaSpeed === undefined ? defaults.qaSpeed : Boolean(raw.qaSpeed)
  };
}

function sanitizeFlags(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, count]) => typeof key === 'string' && key.length <= 80 && Number.isFinite(Number(count)))
    .map(([key, count]) => [key, Number(count)]));
}

function sanitizeProgression(value) {
  const raw = isRecord(value) ? value : {};
  const validArtifactIds = new Set((Array.isArray(ARTIFACTS) ? ARTIFACTS : [])
    .map(item => item?.id)
    .filter(Boolean));
  const artifacts = unique((Array.isArray(raw.artifacts) ? raw.artifacts : [])
    .filter(id => typeof id === 'string' && validArtifactIds.has(id)));
  const pendingArtifactChoices = unique((Array.isArray(raw.pendingArtifactChoices) ? raw.pendingArtifactChoices : [])
    .filter(id => typeof id === 'string' && validArtifactIds.has(id) && !artifacts.includes(id)))
    .slice(0, 5);
  const validRoomIds = new Set((Array.isArray(OFFICE_ROOMS) ? OFFICE_ROOMS : [])
    .map(item => item?.id)
    .filter(Boolean));
  const officeRooms = unique((Array.isArray(raw.officeRooms) ? raw.officeRooms : [])
    .filter(id => typeof id === 'string' && validRoomIds.has(id)))
    .slice(0, validRoomIds.size);
  const pendingRoomChoices = unique((Array.isArray(raw.pendingRoomChoices) ? raw.pendingRoomChoices : [])
    .filter(id => typeof id === 'string' && validRoomIds.has(id) && !officeRooms.includes(id)))
    .slice(0, 3);
  return {
    insight: finiteNonNegative(raw.insight, 0),
    artifacts,
    pendingArtifactChoices,
    officeRooms,
    pendingRoomChoices
  };
}

function sanitizeHandled(value, ticketById) {
  if (!isRecord(value)) return {};
  const handled = {};
  for (const [ticketId, decision] of Object.entries(value)) {
    if (!ticketById.has(ticketId) || !isRecord(decision)) continue;
    const sourceActionId = typeof decision.sourceActionId === 'string'
      ? decision.sourceActionId
      : safeText(decision.actionId, 'unknown');
    const authoredSchedule = ticketById.get(ticketId)?.actions?.[sourceActionId]?.schedule;
    const scheduledFollowups = Array.isArray(decision.scheduledFollowups)
      ? decision.scheduledFollowups
      : Array.isArray(authoredSchedule) ? authoredSchedule : [];
    handled[ticketId] = {
      actionId: safeText(decision.actionId, 'unknown'),
      actionLabel: safeText(decision.actionLabel, 'Imported decision'),
      at: safeText(decision.at, new Date(0).toISOString()),
      delta: sanitizeDelta(decision.delta),
      outcomeTitle: safeText(decision.outcomeTitle, 'Resolved'),
      outcome: safeText(decision.outcome, 'This ticket was resolved in an imported save.'),
      caseJudgment: sanitizeCaseJudgment(decision.caseJudgment),
      technique: sanitizeTechniqueView(decision.technique),
      sourceActionId: typeof decision.sourceActionId === 'string' ? decision.sourceActionId : null,
      scheduledFollowups: unique(scheduledFollowups
        .filter(id => typeof id === 'string' && ticketById.has(id)))
    };
  }
  return handled;
}

function sanitizeCaseJudgment(value) {
  if (!isRecord(value)) return null;
  const incidentResult = ['contained', 'expired'].includes(value.incidentResult)
    ? value.incidentResult
    : null;
  const grade = normalizeCaseGrade(value.grade ?? value.rating);
  const insightAwarded = finiteNonNegative(value.insightAwarded ?? value.insight, 0);
  const customerThreadSource = isRecord(value.customerThread)
    ? CUSTOMER_THREADS.find(thread => thread.id === value.customerThread.id)
    : null;
  const customerThread = customerThreadSource
    ? {
        id: customerThreadSource.id,
        title: customerThreadSource.name,
        bonusInsight: finiteNonNegative(value.customerThread.bonusInsight, 0) > 0 ? 1 : 0
      }
    : null;
  return {
    focus: safeText(value.focus, ''),
    grade,
    rating: grade,
    label: safeText(value.label, caseGradeLabel(grade)),
    points: finiteNonNegative(value.points, CASE_POINTS[grade]),
    letter: safeText(value.letter, caseLetterGrade(grade)),
    reason: safeText(value.reason, ''),
    insightAwarded,
    insight: insightAwarded,
    incidentResult,
    customerThread,
    pressureDelta: sanitizeDelta(value.pressureDelta)
  };
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

function sanitizeTechniqueView(value) {
  if (!isRecord(value)) return null;
  const techniqueId = safeText(value.id, '');
  const technique = (Array.isArray(REPLY_TECHNIQUES) ? REPLY_TECHNIQUES : [])
    .find(candidate => candidate?.id === techniqueId);
  if (!technique) return null;
  return {
    id: technique.id,
    name: safeText(value.name, technique.name),
    glyph: safeText(value.glyph, technique.glyph),
    description: safeText(value.description, technique.description),
    minInsight: finiteNonNegative(value.minInsight, technique.minInsight)
  };
}

function sanitizeTimedEventHistory(value) {
  if (!Array.isArray(value)) return [];
  const validEvents = new Map((Array.isArray(TIMED_EVENTS) ? TIMED_EVENTS : [])
    .filter(event => event?.id)
    .map(event => [event.id, event]));
  const seen = new Set();
  const results = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const eventId = safeText(raw.eventId, '');
    const event = validEvents.get(eventId);
    if (!event || seen.has(eventId)) continue;
    seen.add(eventId);
    const choice = event.choices?.find(option => option.id === raw.choiceId);
    const result = raw.result === 'resolved' && choice ? 'resolved' : 'expired';
    results.push({
      eventId,
      shiftId: eventSupportsShift(event, Number(raw.shiftId))
        ? Number(raw.shiftId)
        : Number(event.shiftId ?? event.shiftIds?.[0] ?? 1),
      result,
      choiceId: result === 'resolved' ? choice.id : null,
      choiceLabel: result === 'resolved' ? choice.label : 'No response',
      outcome: safeText(raw.outcome, result === 'resolved' ? choice.outcome : event.timeoutText),
      delta: sanitizeDelta(raw.delta),
      insightAwarded: result === 'resolved' ? finiteNonNegative(raw.insightAwarded, 1) : 0,
      at: safeText(raw.at, new Date(0).toISOString())
    });
  }
  return results;
}

function sanitizeSummary(value, expectedShiftId = null) {
  if (!isRecord(value)) return null;
  const shiftId = Number(value.shiftId);
  if (!Number.isInteger(shiftId) || !SHIFTS.some(shift => shift.id === shiftId)) return null;
  if (expectedShiftId !== null && shiftId !== expectedShiftId) return null;
  const shift = SHIFTS.find(item => item.id === shiftId);
  const artifactOffers = unique((Array.isArray(value.artifactOffers) ? value.artifactOffers : [])
    .filter(id => typeof id === 'string' && artifactExists(id)))
    .slice(0, 5);
  const rawArtifactChoice = value.artifactChoice ?? value.artifactChosen;
  const artifactChoice = rawArtifactChoice == null
    ? null
    : rawArtifactChoice === 'none' || artifactExists(rawArtifactChoice)
      ? rawArtifactChoice
      : artifactOffers.length > 0 ? null : 'none';
  const roomOffers = unique((Array.isArray(value.roomOffers) ? value.roomOffers : [])
    .filter(id => typeof id === 'string' && officeRoomExists(id)))
    .slice(0, 3);
  const rawRoomChoice = value.roomChoice ?? value.roomChosen;
  const roomChoice = rawRoomChoice == null
    ? null
    : rawRoomChoice === 'none' || officeRoomExists(rawRoomChoice)
      ? rawRoomChoice
      : roomOffers.length > 0 ? null : 'none';
  const timedEvents = sanitizeTimedEventHistory(value.timedEvents)
    .filter(result => result.shiftId === shiftId);
  const replyUnlocks = unique((Array.isArray(value.replyUnlocks) ? value.replyUnlocks : [])
    .filter(id => typeof id === 'string' && REPLY_TECHNIQUE_BY_ID.has(id)));
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
    judgments: sanitizeJudgmentCounts(value.judgments),
    casework: sanitizeCaseworkSummary(value.casework, shift),
    insightEarned: finiteNonNegative(value.insightEarned, 0),
    insightTotal: finiteNonNegative(value.insightTotal, 0),
    timedEvents,
    replyUnlocks,
    artifactOffers,
    artifactChoice,
    artifactChosen: artifactChoice,
    roomOffers,
    roomChoice,
    roomChosen: roomChoice,
    endedAt: safeText(value.endedAt, new Date(0).toISOString()),
    endingHint: safeText(value.endingHint, 'Unclassified Agent')
  };
}

function sanitizeJudgmentCounts(value) {
  const raw = isRecord(value) ? value : {};
  return {
    strong: finiteNonNegative(raw.strong, 0),
    defensible: finiteNonNegative(raw.defensible, 0),
    missed: finiteNonNegative(raw.missed, 0)
  };
}

function sanitizeCaseworkSummary(value, shift) {
  const raw = isRecord(value) ? value : {};
  const score = finiteNonNegative(raw.score, 0);
  const target = finiteNonNegative(raw.target, shift?.caseworkTarget ?? shift?.quota ?? 0);
  const counts = sanitizeJudgmentCounts(raw.counts);
  const resolved = finiteNonNegative(raw.resolved, Object.values(counts).reduce((total, count) => total + count, 0));
  const derivedPoints = counts.strong * CASE_POINTS.strong + counts.defensible * CASE_POINTS.defensible;
  const points = finiteNonNegative(raw.points, derivedPoints);
  const targetPoints = finiteNonNegative(raw.targetPoints, caseworkPointsTarget(target, shift?.quota ?? resolved));
  const average = resolved > 0 ? finiteNonNegative(raw.average, Math.round(points / resolved)) : null;
  return {
    score,
    target,
    points,
    targetPoints,
    resolved,
    average,
    grade: safeText(raw.grade, shiftLetterGrade(average)),
    remaining: Math.max(0, target - score),
    met: raw.met === undefined ? score >= target : Boolean(raw.met),
    counts,
    auditDelta: sanitizeDelta(raw.auditDelta),
    result: raw.result === 'passed' || score >= target ? 'passed' : 'below-target',
    artifactOfferCount: finiteNonNegative(raw.artifactOfferCount, 0),
    auditMarks: finiteNonNegative(raw.auditMarks, 0),
    auditMarkDelta: finiteNumber(raw.auditMarkDelta, 0)
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

function normalizeCaseGrade(value) {
  return CASE_GRADES.has(value) ? value : 'defensible';
}

function caseGradeLabel(grade) {
  return ({
    strong: 'Strong read',
    defensible: 'Defensible',
    missed: 'Missed the brief'
  })[normalizeCaseGrade(grade)];
}

function caseLetterGrade(grade) {
  return ({ strong: 'A', defensible: 'C', missed: 'F' })[normalizeCaseGrade(grade)];
}

function shiftLetterGrade(average) {
  if (average === null || average === undefined || average === '' || !Number.isFinite(Number(average))) return '—';
  const score = Number(average);
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function caseworkPointsTarget(target, quota) {
  const cases = Math.max(0, Math.round(finiteNumber(quota, 0)));
  const credit = Math.max(0, Math.round(finiteNumber(target, 0)));
  const defensibleCases = Math.min(cases, credit);
  const strongUpgrades = Math.min(cases, Math.max(0, credit - cases));
  return defensibleCases * CASE_POINTS.defensible + strongUpgrades * (CASE_POINTS.strong - CASE_POINTS.defensible);
}

function caseFocusText(value) {
  if (typeof value === 'string') return safeText(value, '');
  if (!isRecord(value)) return '';
  return safeText(value.text ?? value.prompt ?? value.label, '');
}

function buildQualitativeForecast(delta) {
  return Object.entries(sanitizeDelta(delta)).map(([metric, amount]) => ({
    metric,
    direction: amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat'
  }));
}

function artifactEffectRecords(artifact) {
  if (!artifact) return [];
  const value = artifact.effects ?? artifact.effect;
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
}

function officeEffectRecords(room) {
  if (!room) return [];
  const value = room.effects ?? room.effect;
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
}

function conditionEffectRecords(condition) {
  if (!condition) return [];
  const value = condition.effects ?? condition.effect;
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
}

function conditionAffectsAction(condition, actionId) {
  return conditionEffectRecords(condition).some(effects => (
    Boolean(effects.actionDelta)
    || Boolean(effects.actionDeltas?.[actionId])
    || Boolean(effects.actionDeltaById?.[actionId])
    || Boolean(effects.actionTypeDeltas?.[actionId])
    || Boolean(effects.actions?.[actionId]?.delta)
    || effects.actionId === actionId
  ));
}

function eventSupportsShift(event, shiftId) {
  if (!event || !Number.isInteger(Number(shiftId))) return false;
  if (Number(event.shiftId) === Number(shiftId)) return true;
  return Array.isArray(event.shiftIds) && event.shiftIds.map(Number).includes(Number(shiftId));
}

function eventMatchesState(event, state) {
  if (!eventSupportsShift(event, Number(state?.activeShiftId))) return false;
  if (finiteNonNegative(event.requiresMinRooms, 0) > finiteNonNegative(state?.progression?.officeRooms?.length, 0)) return false;
  if (!event.requiresRoom) return true;
  return Array.isArray(state?.progression?.officeRooms)
    && state.progression.officeRooms.includes(event.requiresRoom);
}

function caseworkScore(counts = {}) {
  return (2 * finiteNonNegative(counts.strong, 0))
    + finiteNonNegative(counts.defensible, 0);
}

function normalizeInstrumentAccess(value) {
  const raw = isRecord(value) ? value : {};
  const metricKeys = unique((Array.isArray(raw.metricKeys) ? raw.metricKeys : [])
    .filter(key => typeof key === 'string' && key in METRIC_BOUNDS));
  return {
    name: safeText(raw.name, 'Sealed console'),
    metricKeys,
    forecastSlots: clamp(Math.round(finiteNonNegative(raw.forecastSlots, 0)), 0, 6),
    description: safeText(raw.description, 'The email is your evidence.')
  };
}

function artifactExists(artifactId) {
  if (typeof artifactId !== 'string' || !artifactId) return false;
  if (ARTIFACT_BY_ID instanceof Map) return ARTIFACT_BY_ID.has(artifactId);
  if (isRecord(ARTIFACT_BY_ID)) return Boolean(ARTIFACT_BY_ID[artifactId]);
  return (Array.isArray(ARTIFACTS) ? ARTIFACTS : []).some(item => item?.id === artifactId);
}

function officeRoomExists(roomId) {
  if (typeof roomId !== 'string' || !roomId) return false;
  if (OFFICE_ROOM_BY_ID instanceof Map) return OFFICE_ROOM_BY_ID.has(roomId);
  return (Array.isArray(OFFICE_ROOMS) ? OFFICE_ROOMS : []).some(room => room?.id === roomId);
}

function metricDeltaRecord(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, amount]) => key in METRIC_BOUNDS && Number.isFinite(Number(amount)))
    .map(([key, amount]) => [key, Number(amount)]));
}

function addDelta(target, source) {
  for (const [key, amount] of Object.entries(metricDeltaRecord(source))) {
    target[key] = Number(target[key] ?? 0) + amount;
  }
  return target;
}

function finiteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function positiveNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicShuffle(values, initialSeed) {
  const items = [...values];
  let seed = initialSeed || 0x9e3779b9;
  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function normalizeClearanceRanks(value) {
  const source = Array.isArray(value) ? value : [];
  const ranks = source.map((rank, index) => {
    const raw = isRecord(rank) ? rank : {};
    return {
      ...raw,
      id: safeText(raw.id, `rank-${index + 1}`),
      name: safeText(raw.name ?? raw.label, `Clearance ${index + 1}`),
      minInsight: finiteNonNegative(raw.minInsight ?? raw.threshold, index === 0 ? 0 : index * 10)
    };
  }).sort((a, b) => a.minInsight - b.minInsight);
  return ranks.length > 0
    ? ranks
    : [{ id: 'probationary', name: 'Probationary', minInsight: 0 }];
}

function safeText(value, fallback = '') {
  return typeof value === 'string' ? value.slice(0, 20000) : fallback;
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
