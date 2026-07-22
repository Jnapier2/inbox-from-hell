import { ACTION_CATALOG, METRIC_HELP, METRIC_LABELS } from '../content/actionCatalog.js';
import { formatClock, formatDuration, escapeHTML } from '../core/utils.js';

const metricOrder = ['reputation', 'sanity', 'cash', 'soulRisk', 'containment', 'inboxHeat'];

export function renderApp(snapshot, ui, saveInfo = {}) {
  const { state, shift } = snapshot;
  const shellClasses = [
    'app-shell',
    state.settings.compactTickets ? 'compact-tickets' : '',
    state.settings.reducedMotion ? 'reduced-motion' : '',
    'public-mode'
  ].filter(Boolean).join(' ');
  const backgroundState = ui.modal ? ' inert aria-hidden="true"' : '';
  return `
    <div class="${shellClasses}" style="--font-scale:${escapeHTML(state.settings.textScale)}">
      ${renderTopbar(snapshot, saveInfo, { backgroundState })}
      ${renderHud(snapshot, backgroundState)}
      <main class="workspace" aria-label="Support console"${backgroundState}>
        ${renderInboxPanel(snapshot, ui)}
        ${renderMailPanel(snapshot, ui)}
        ${renderOpsPanel(snapshot, ui)}
      </main>
      ${renderModal(snapshot, ui)}
      <div class="toast-stack" id="toastStack" role="status" aria-live="polite" aria-atomic="false"></div>
    </div>
  `;
}

function renderTopbar(snapshot, saveInfo, { backgroundState }) {
  const { state, appVersion, contentVersion } = snapshot;
  const saveText = saveInfo.saveBlocked
    ? 'Autosave paused—stored progress protected'
    : saveInfo.noSaveMode || saveInfo.saveError
      ? 'Autosave unavailable—export manually'
      : saveInfo.lastSavedAt ? `Autosaved ${formatClock(saveInfo.lastSavedAt)}` : 'Autosave ready';
  const pausedClass = state.paused || saveInfo.saveBlocked || saveInfo.noSaveMode || saveInfo.saveError ? 'warn' : '';
  const saveTitle = saveInfo.blockReason || saveInfo.saveError || saveText;
  return `
    <header class="topbar"${backgroundState}>
      <div class="brand">
        <div class="logo-mark" aria-hidden="true">✉️</div>
        <div>
          <h1>Inbox From Hell</h1>
          <p>Papers, Please meets cursed customer service.</p>
        </div>
      </div>
      <div class="status-cluster" aria-label="Assignment status">
        <span class="status-pill strong"><span class="status-dot ${pausedClass}"></span>${escapeHTML(phaseLabel(state.phase, state.paused))}</span>
        <span class="status-pill" title="${escapeHTML(saveTitle)}">${escapeHTML(saveText)}</span>
        <span class="version-pill">v${escapeHTML(appVersion)} / ${escapeHTML(contentVersion)}</span>
      </div>
      <div class="top-actions">
        <button class="btn ghost" data-action="toggle-pause" data-focus-key="top-pause" ${state.phase !== 'ticketing' ? 'disabled' : ''}>${state.paused ? '▶ Resume' : '⏸ Pause'}</button>
        <button class="btn ghost" data-action="open-modal" data-modal="settings" data-focus-key="top-settings" aria-haspopup="dialog">⚙ Settings</button>
        <button class="btn ghost" data-action="export-save" data-focus-key="top-save">⬇ Save</button>
        <button class="btn ghost" data-action="import-save" data-focus-key="top-import" aria-haspopup="dialog">⬆ Import</button>
        <button class="btn danger" data-action="reset-run" data-focus-key="top-reset">Reset</button>
      </div>
    </header>
  `;
}

function renderHud(snapshot, backgroundState = '') {
  const { state, shift, remainingMs, durationMs, timerPercent, openTicketIds, resolvedThisShift, information, casework, shiftCondition } = snapshot;
  const timerDanger = timerPercent < 22 ? 'bad' : 'info';
  const visibleMetrics = new Set(information?.metricKeys ?? []);
  const cards = metricOrder.filter(key => visibleMetrics.has(key)).map(key => renderMetricCard(key, state.metrics[key])).join('');
  const sealedKeys = metricOrder.filter(key => !visibleMetrics.has(key));
  return `
    <section class="hud" aria-label="Shift desk"${backgroundState}>
      <article class="hud-card timer-card">
        <h2>Shift ${escapeHTML(shift.id)} · ${escapeHTML(shift.title)}</h2>
        <div class="value"><span id="timerText">${formatDuration(remainingMs)}</span><small>${escapeHTML(resolvedThisShift)} closed / ${escapeHTML(openTicketIds.length)} open</small></div>
        <div class="progress-track" aria-hidden="true"><div id="timerBar" class="progress-fill ${timerDanger}" style="--pct:${timerPercent}%"></div></div>
        <div class="metric-caption">${escapeHTML(shift.objective)} · ${Math.round(durationMs / 60000)} min profile</div>
        <div class="casework-line">
          <span>Case score</span>
          <strong>${escapeHTML(casework?.points ?? 0)} / ${escapeHTML(casework?.targetPoints ?? 0)} pts</strong>
          <span class="shift-grade ${letterGradeClass(casework?.grade)}"><small>Shift grade</small><b>${escapeHTML(casework?.grade ?? '—')}</b></span>
          <span>${casework?.auditMarks ? `Audit marks ${escapeHTML(casework.auditMarks)}/3` : casework?.met ? 'Audit target met' : 'A strong read earns the most'}</span>
        </div>
        ${shiftCondition ? `<div class="condition-line"><span aria-hidden="true">${escapeHTML(shiftCondition.glyph ?? '◆')}</span><span>Today: <strong>${escapeHTML(shiftCondition.name)}</strong></span></div>` : ''}
        ${renderDossierProgress(snapshot.progression)}
        ${renderOfficeMomentum(snapshot.office)}
      </article>
      ${cards}
      ${renderSealedGauges(sealedKeys, state.metrics, information)}
    </section>
  `;
}

function renderOfficeMomentum(office) {
  if (!office) return '';
  const elevatorText = office.elevator?.unlocked
    ? 'Executive elevator unlocked'
    : `Elevator ${office.elevator?.current ?? 0}/${office.elevator?.required ?? 3}`;
  return `<div class="office-momentum"><span>Brimstone Support</span><strong>${escapeHTML(office.roomsBuilt)} / ${escapeHTML(office.capacity)} rooms</strong><span>${escapeHTML(elevatorText)}</span></div>`;
}

function renderDossierProgress(progression) {
  if (!progression) return '';
  const rankTitle = progression.rank?.title ?? 'Temporary Agent';
  const nextRankTitle = progression.nextRank?.title ?? progression.nextRank ?? '';
  const insight = finiteDisplayNumber(progression.insight);
  const current = Math.max(0, finiteDisplayNumber(progression.progressCurrent));
  const needed = Math.max(0, finiteDisplayNumber(progression.progressNeeded));
  const percent = clampPct(Number(progression.progressPercent ?? (needed > 0 ? (current / needed) * 100 : 100)));
  const nextTechnique = progression.nextReplyTechnique?.name ?? '';
  const nextInstrument = progression.information?.next?.name ?? '';
  const progressLabel = needed > 0
    ? `${current} of ${needed} Insight toward ${nextRankTitle || 'the next review rank'}`
    : `${insight} total Insight; highest review rank reached`;

  return `
    <div class="dossier-progress" aria-label="Personnel file progression">
      <div class="dossier-line"><span>Personnel file</span><strong>${escapeHTML(rankTitle)}</strong><span>${escapeHTML(insight)} Insight</span></div>
      <div class="dossier-track" role="progressbar" aria-label="${escapeHTML(progressLabel)}" aria-valuemin="0" aria-valuemax="${escapeHTML(needed || 100)}" aria-valuenow="${escapeHTML(needed > 0 ? Math.min(current, needed) : 100)}">
        <div class="dossier-fill" style="--pct:${percent}%"></div>
      </div>
      ${needed > 0 ? `<div class="dossier-next">Next: ${escapeHTML(nextRankTitle || 'review rank')} · ${escapeHTML(current)}/${escapeHTML(needed)}${nextTechnique ? ` · adds ${escapeHTML(nextTechnique)}` : ''}${nextInstrument ? ` · opens ${escapeHTML(nextInstrument)}` : ''}</div>` : '<div class="dossier-next">Personnel file fully annotated. Every reply and desk gauge is open.</div>'}
    </div>
  `;
}

function renderSealedGauges(keys, metrics, information) {
  if (!Array.isArray(keys) || keys.length === 0) return '';
  const warning = hiddenGaugeWarning(keys, metrics);
  const next = information?.next;
  return `
    <article class="hud-card sealed-gauges" title="Exact readings unlock through careful casework.">
      <h3>Sealed desk gauges</h3>
      <div class="value"><span>${escapeHTML(keys.length)} sealed</span><small>${escapeHTML(information?.name ?? 'Training access')}</small></div>
      <div class="sealed-warning ${warning.danger ? 'danger' : ''}"><span class="status-dot ${warning.danger ? 'warn' : ''}"></span>${escapeHTML(warning.text)}</div>
      <div class="metric-caption">${next ? `${next.name} opens at ${next.minInsight} Insight.` : 'All desk gauges are open.'}</div>
    </article>
  `;
}

function hiddenGaugeWarning(keys, metrics = {}) {
  const warnings = {
    reputation: [Number(metrics.reputation) <= 20 ? 3 : Number(metrics.reputation) <= 40 ? 2 : 0, 'Public complaints are reaching management.'],
    sanity: [Number(metrics.sanity) <= 20 ? 3 : Number(metrics.sanity) <= 40 ? 2 : 0, 'Your hands are shaking over the Send button.'],
    cash: [Number(metrics.cash) < 0 ? 3 : Number(metrics.cash) < 35 ? 2 : 0, 'Finance has started counting the office furniture.'],
    soulRisk: [Number(metrics.soulRisk) >= 85 ? 3 : Number(metrics.soulRisk) >= 60 ? 2 : 0, 'Infernal Accounts is using your full name.'],
    containment: [Number(metrics.containment) <= 15 ? 3 : Number(metrics.containment) <= 35 ? 2 : 0, 'The walls no longer meet at right angles.'],
    inboxHeat: [Number(metrics.inboxHeat) >= 75 ? 3 : Number(metrics.inboxHeat) >= 45 ? 2 : 0, 'Unknown departments are watching the queue.']
  };
  const worst = keys
    .map(key => ({ level: warnings[key]?.[0] ?? 0, text: warnings[key]?.[1] ?? '' }))
    .sort((left, right) => right.level - left.level)[0];
  if (!worst || worst.level === 0) return { danger: false, text: 'No sealed gauge is ringing.' };
  return { danger: worst.level >= 3, text: worst.text };
}

function renderMetricCard(key, value) {
  const label = METRIC_LABELS[key] ?? key;
  const help = METRIC_HELP[key] ?? '';
  const pct = key === 'cash' ? normalizeCash(value) : value;
  const highIsBad = key === 'soulRisk' || key === 'inboxHeat';
  const bad = highIsBad ? pct > 70 : pct < 25;
  const display = key === 'cash' ? `$${Math.round(value)}` : `${Math.round(value)}`;
  return `
    <article class="hud-card" title="${escapeHTML(help)}">
      <h3>${escapeHTML(label)}</h3>
      <div class="value"><span>${escapeHTML(display)}</span><small>${escapeHTML(metricMood(key, value))}</small></div>
      <div class="progress-track" aria-hidden="true"><div class="progress-fill ${bad ? 'bad' : ''}" style="--pct:${clampPct(pct)}%"></div></div>
      <div class="metric-caption">${escapeHTML(help)}</div>
    </article>
  `;
}

function renderInboxPanel(snapshot, ui) {
  const activeIncident = snapshot.activeIncident ?? null;
  const activeTimedEvent = snapshot.activeTimedEvent ?? null;
  const tickets = filterTickets(snapshot.visibleTickets, snapshot.state, ui, activeIncident);
  const filterButtons = ['all', 'open', 'closed', 'severe'].map(filter => `
    <button class="chip-btn ${ui.filter === filter ? 'active' : ''}" data-action="set-filter" data-filter="${filter}" aria-pressed="${ui.filter === filter}">${filterLabel(filter)}</button>
  `).join('');

  return `
    <aside class="panel inbox-panel" aria-label="Inbox">
      <div class="panel-header stack">
        <div>
          <h2>Queue</h2>
          <p>${snapshot.visibleTickets.length} loaded · ${snapshot.openTicketIds.length} awaiting response</p>
          ${activeIncident ? `<p class="queue-incident-status">${activeIncident.expired ? 'Incident fallout unresolved · the critical case stays pinned.' : 'Critical incident in focus · other messages are temporarily held.'}</p>` : ''}
          ${activeTimedEvent ? '<p class="queue-incident-status">Office interruption active · choose a response before returning to email.</p>' : ''}
        </div>
        <div>
          <div class="search-row">
            <label class="sr-only" for="searchBox">Search tickets</label>
            <input id="searchBox" class="input" data-action="search" value="${escapeHTML(ui.query)}" placeholder="Search sender, tag, subject..." autocomplete="off" />
            <button class="btn icon-only" data-action="clear-search" aria-label="Clear ticket search" title="Clear ticket search">×</button>
          </div>
          <div class="filter-row" role="group" aria-label="Ticket filters">${filterButtons}</div>
        </div>
      </div>
      <div class="panel-body flush">
        ${tickets.length === 0 ? `<div class="empty-state"><h2>No matching tickets</h2><p>The void is filtered out.</p></div>` : `<ul class="ticket-list">${tickets.map(ticket => renderTicketItem(ticket, snapshot)).join('')}</ul>`}
      </div>
    </aside>
  `;
}

function renderTicketItem(ticket, snapshot) {
  const resolved = Boolean(snapshot.state.handled[ticket.id]);
  const active = snapshot.state.selectedTicketId === ticket.id;
  const handled = snapshot.state.handled[ticket.id];
  const incident = snapshot.activeIncident;
  const incidentIsActive = Boolean(incident && !incident.expired);
  const isIncident = incident?.ticketId === ticket.id;
  const timedEventLocked = Boolean(snapshot.activeTimedEvent);
  const locked = timedEventLocked || (incidentIsActive && !isIncident);
  const incidentTime = isIncident && !incident.expired ? formatDuration(incident.remainingMs ?? 0) : '';
  const precedentEcho = snapshot.precedentEchoes?.[ticket.id] ?? null;
  const tags = ticket.tags.slice(0, 3).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('');
  return `
    <li class="ticket-item">
      <button class="ticket-button ${active ? 'active' : ''} ${resolved ? 'resolved' : ''} ${isIncident ? 'incident-active' : ''} ${locked ? 'incident-locked' : ''}" data-action="select-ticket" data-ticket-id="${escapeHTML(ticket.id)}" aria-pressed="${active}" ${locked ? 'disabled aria-disabled="true"' : ''}>
        <div class="ticket-meta">
          <span>${escapeHTML(ticket.received)}</span>
          <span>·</span>
          <span>${escapeHTML(ticket.mailbox)}</span>
          <span class="severity" aria-label="Severity ${ticket.severity}" title="Severity ${ticket.severity}">${'◆'.repeat(ticket.severity)}</span>
          ${isIncident ? `<span class="incident-badge">Critical${incident.expired ? ' · Fallout' : ` · ${escapeHTML(incidentTime)}`}</span>` : ''}
        </div>
        <div class="ticket-subject">${escapeHTML(ticket.subject)}</div>
        <div class="ticket-from">From: ${escapeHTML(ticket.from)}</div>
        <div class="small-row">${tags}</div>
        ${precedentEcho ? '<div class="precedent-queue-label">↩ Follow-up from your decision</div>' : ''}
        ${locked ? `<div class="incident-lock-label">${timedEventLocked ? 'Held during office interruption' : 'Held during critical incident'}</div>` : ''}
        ${resolved ? `<div class="small-row">Resolved via ${escapeHTML(handled.actionLabel)}</div>` : ''}
      </button>
    </li>
  `;
}

function renderMailPanel(snapshot, ui) {
  const { selectedTicket: ticket, state } = snapshot;
  if (!ticket) {
    return `
      <section class="panel mail-reader" aria-label="Email reader">
        <div class="empty-state">
          <h2>Queue clear</h2>
          <p>The inbox is quiet. That is suspicious.</p>
          ${state.phase === 'ticketing' ? `<button class="btn primary" data-action="end-shift">End shift audit</button>` : ''}
        </div>
      </section>
    `;
  }

  const resolved = state.handled[ticket.id];
  const tags = ticket.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('');
  const body = ticket.body.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('');
  return `
    <section class="panel mail-reader" aria-label="Email reader">
      <header class="mail-header">
        ${renderTimedEventBanner(snapshot)}
        ${renderIncidentBanner(snapshot, ticket)}
        <div class="mail-meta">
          <span>${escapeHTML(ticket.mailbox)}</span>
          <span>·</span>
          <span>${escapeHTML(ticket.archetype)}</span>
          <span>·</span>
          <span class="severity" aria-label="Severity ${ticket.severity}">${'◆'.repeat(ticket.severity)}</span>
        </div>
        <h2 id="mailSubject" tabindex="-1">${escapeHTML(ticket.subject)}</h2>
        <div class="mail-meta">
          <span>From: ${escapeHTML(ticket.from)}</span>
          <span>·</span>
          <span>${escapeHTML(ticket.received)}</span>
        </div>
        <div class="filter-row">${tags}</div>
        ${renderPrecedentEcho(snapshot.selectedPrecedentEcho)}
        ${renderFirstShiftCoach(snapshot, ui)}
      </header>
      <div class="mail-body">
        ${resolved ? renderResolutionBox(resolved) : ''}
        <article class="email-card">
          <div class="email-paper">
            ${body}
            <p class="signature">— Sent through NetherHelp Support Gateway</p>
          </div>
        </article>
      </div>
      ${snapshot.activeTimedEvent ? renderTimedEventDock(snapshot) : resolved ? renderResolvedDock(snapshot) : renderActionDock(snapshot)}
    </section>
  `;
}

function renderPrecedentEcho(echo) {
  if (!echo) return '';
  const technique = echo.techniqueName ? ` using ${echo.techniqueName}` : '';
  return `
    <aside class="precedent-echo" aria-label="Earlier decision remembered">
      <span class="precedent-kicker">↩ Precedent echo · Shift ${escapeHTML(echo.sourceShiftId)}</span>
      <strong>${escapeHTML(echo.message)}</strong>
      <p>You chose <b>${escapeHTML(echo.actionLabel)}</b>${escapeHTML(technique)}. The inbox remembered: ${escapeHTML(echo.outcomeTitle)}</p>
    </aside>
  `;
}

function renderFirstShiftCoach(snapshot, ui) {
  const { state, openTicketIds, resolvedThisShift } = snapshot;
  if (ui.guidanceHidden || state.phase !== 'ticketing' || state.activeShiftId !== 1 || state.paused || snapshot.activeTimedEvent || (snapshot.activeIncident && !snapshot.activeIncident.expired)) return '';

  let step = 1;
  let title = 'Read for the case focus.';
  let message = 'Read the email and its Case focus. Your training console cannot predict replies yet; the decisive detail is in the message. Strong and defensible reads earn Insight.';

  if (resolvedThisShift > 0 && openTicketIds.length > 0) {
    step = 2;
    title = 'Review, then move on.';
    message = `Read the case judgment and confirmed impact, then open the next email—${openTicketIds.length} ${openTicketIds.length === 1 ? 'ticket remains' : 'tickets remain'}. Promotions open desk gauges and reply forecasts; the email still tells you which response fits.`;
  } else if (openTicketIds.length === 0) {
    step = 3;
    title = 'Review your work.';
    message = 'All five tickets are closed. Choose End shift audit to review your Insight, restore part of the office, and choose a desk artifact.';
  }

  return `
    <aside class="coach-tip" aria-label="First shift guidance" aria-live="polite">
      <span class="coach-step">Next · ${step}/3</span>
      <div class="coach-copy"><strong>${escapeHTML(title)}</strong><p>${escapeHTML(message)}</p></div>
      <button class="btn ghost coach-dismiss" data-action="dismiss-guidance" data-focus-key="dismiss-guidance" aria-label="Hide first shift tips">Hide tips</button>
    </aside>
  `;
}

function renderTimedEventBanner(snapshot) {
  const event = snapshot.activeTimedEvent;
  if (!event) return '';
  const remaining = Math.max(0, Number(event.remainingMs ?? 0));
  const percent = clampPct(Number(event.timerPercent ?? 0));
  return `
    <aside class="timed-event-banner" aria-label="Timed office interruption">
      <div class="incident-copy">
        <span class="timed-event-kicker">${event.roomEvent ? `${escapeHTML(event.sourceRoom ?? 'Restored room')} emergency` : event.elevatorEvent ? 'Executive Floor emergency' : 'Office emergency'} · not a customer email · +1 Insight</span>
        <strong>${escapeHTML(event.title)}</strong>
        <span class="incident-note">${event.roomEvent ? 'This complication exists because you built the room. ' : ''}Choose how the office responds before this timer ends. Your normal shift clock is paused.</span>
      </div>
      <span id="timedEventTimer" class="incident-clock" role="timer" aria-live="off">${escapeHTML(formatDuration(remaining))}</span>
      <div class="incident-track" aria-hidden="true"><div id="timedEventBar" class="timed-event-fill" style="--pct:${percent}%"></div></div>
    </aside>
  `;
}

function renderTimedEventDock(snapshot) {
  const event = snapshot.activeTimedEvent;
  if (!event) return '';
  if (snapshot.state.paused) {
    return `<footer class="action-dock" aria-label="Timed event choices"><div class="warning-box pause-message"><strong>Interruption paused</strong><p>Resume when you are ready to choose.</p><button class="btn primary" data-action="toggle-pause">Resume</button></div></footer>`;
  }
  const choices = (Array.isArray(event.choices) ? event.choices : []).map((choice, index) => `
    <button class="btn action-card timed-event-choice" data-action="resolve-timed-event" data-event-choice-id="${escapeHTML(choice.id)}">
      <strong><span>${escapeHTML(choice.label)}</span><span class="hotkey">${index + 1}</span></strong>
      <span>${escapeHTML(choice.preview)}</span>
      <span class="metric-chip">Urgent choice</span>
      ${snapshot.state.settings.showDeltaPreview ? renderForecast(choice.delta, snapshot.information?.forecastSlots) : '<span class="forecast-note">Approved reply clues hidden in Settings.</span>'}
    </button>
  `).join('');
  return `
    <footer class="action-dock timed-event-dock" aria-label="Timed event choices">
      <div class="case-focus timed-event-prompt"><span class="case-focus-label">Office emergency</span><strong>${escapeHTML(event.prompt)}</strong></div>
      <div class="action-dock-intro"><span><strong>This is an office decision, not an email reply.</strong> Choose in time to earn +1 Insight.</span><span>The normal shift clock is stopped.</span></div>
      <div class="action-grid event-choice-grid">${choices}</div>
    </footer>
  `;
}

function renderIncidentBanner(snapshot, selectedTicket) {
  const incident = snapshot.activeIncident;
  if (!incident) return '';
  const isSelected = incident.ticketId === selectedTicket?.id;
  const incidentTicket = snapshot.visibleTickets?.find?.(ticket => ticket.id === incident.ticketId);
  const remaining = Math.max(0, Number(incident.remainingMs ?? 0));
  const percent = clampPct(Number(incident.timerPercent ?? 0));
  const label = incident.label ?? incidentTicket?.subject ?? 'Critical case';
  const timeText = incident.expired ? 'Fallout triggered' : formatDuration(remaining);
  const ariaTime = incident.expired
    ? 'Incident deadline expired; fallout triggered'
    : `${timeText} remaining on the critical incident clock`;

  return `
    <aside class="incident-banner ${incident.expired ? 'expired' : ''}" aria-label="Critical incident">
      <div class="incident-copy">
        <span class="incident-kicker">Critical incident</span>
        <strong>${escapeHTML(label)}</strong>
        <span class="incident-note">${incident.expired ? 'Its private deadline passed and fallout occurred. Resolve the email while the normal queue remains held.' : 'This email has its own deadline. Resolve it before zero or fallout occurs; your normal shift clock is paused.'}</span>
      </div>
      <div class="incident-time-block">
        <span id="incidentTimer" class="incident-clock" role="timer" aria-live="off" aria-label="${escapeHTML(ariaTime)}">${escapeHTML(timeText)}</span>
        ${!isSelected ? `<button class="btn warn incident-open" data-action="select-ticket" data-ticket-id="${escapeHTML(incident.ticketId)}">${incident.expired ? 'Open fallout case' : 'Open incident'}</button>` : ''}
      </div>
      <div class="incident-track" aria-hidden="true"><div id="incidentBar" class="incident-fill" style="--pct:${percent}%"></div></div>
    </aside>
  `;
}

function renderResolutionBox(resolved) {
  const judgment = resolved.caseJudgment;
  const judgmentClass = judgmentRatingClass(judgment?.rating);
  const insight = Number(judgment?.insight ?? 0);
  const insightLabel = insight > 0 ? `+${insight} Insight` : 'No Insight';
  return `
    <div class="resolution-box" style="margin: 0 auto 1rem; max-width: 61rem;">
      <strong>${escapeHTML(resolved.outcomeTitle)}</strong>
      <p>${escapeHTML(resolved.outcome)}</p>
      ${judgment ? `
        <section class="case-judgment ${judgmentClass}" aria-label="Case judgment">
          <div class="judgment-heading"><strong>${escapeHTML(judgment.letter ?? '—')} · ${escapeHTML(judgment.label ?? judgmentLabel(judgment.rating))} · +${escapeHTML(judgment.points ?? 0)} case points</strong><span class="insight-award">${escapeHTML(insightLabel)}</span></div>
          ${judgment.reason ? `<p>${escapeHTML(judgment.reason)}</p>` : ''}
        </section>
      ` : ''}
      ${judgment?.grade === 'missed' && Object.keys(judgment.pressureDelta ?? {}).length ? `
        <div class="judgment-pressure" role="status"><strong>Audit pressure increased.</strong><span>The reply may have looked efficient, but it missed a decisive detail in the email.</span></div>
      ` : ''}
      ${resolved.technique ? `
        <div class="mastery-resolution" role="status">
          <span aria-hidden="true">${escapeHTML(resolved.technique.glyph ?? '✦')}</span>
          <div><strong>Special reply · ${escapeHTML(resolved.technique.name)}</strong><p>Your supervisor-approved reply fit this case. It will be ready again after the next audit.</p></div>
        </div>
      ` : ''}
      ${resolved.scheduledFollowups?.length ? `
        <div class="precedent-created" role="status">
          <strong>↩ Precedent created</strong>
          <span>This reply may return as a future email. The later case will identify what caused it.</span>
        </div>
      ` : ''}
      ${judgment?.customerThread ? `
        <div class="case-file-completed" role="status">
          <strong>📌 Customer file closed · ${escapeHTML(judgment.customerThread.title)}</strong>
          <span>${judgment.customerThread.bonusInsight > 0 ? 'Strong final read · +1 bonus Insight.' : 'The thread is complete. A Strong final read would have earned +1 bonus Insight.'}</span>
        </div>
      ` : ''}
      ${judgment?.incidentResult ? `
        <div class="incident-resolution ${judgment.incidentResult}" role="status">
          <strong>${judgment.incidentResult === 'contained' ? 'Incident contained' : 'Fallout occurred'}</strong>
          <span>${judgment.incidentResult === 'contained' ? 'Resolved before the special deadline; the normal shift clock resumes.' : 'The special deadline expired before resolution; fallout was already applied.'}</span>
        </div>
      ` : ''}
      <div class="resolution-impact-label">Confirmed impact</div>
      <div class="delta-row">${renderDeltaChips(resolved.delta)}</div>
    </div>
  `;
}

function renderActionDock(snapshot) {
  if (snapshot.state.phase !== 'ticketing') {
    return `<div class="action-dock"><div class="warning-box">This shift is not currently accepting replies.</div></div>`;
  }
  if (snapshot.activeIncident && !snapshot.activeIncident.expired && snapshot.selectedTicket?.id !== snapshot.activeIncident.ticketId) {
    return `
      <footer class="action-dock" aria-label="Response actions">
        <div class="warning-box pause-message">
          <strong>Critical incident in progress</strong>
          <p>Normal replies are held while the incident clock is active.</p>
          <button class="btn warn" data-action="select-ticket" data-ticket-id="${escapeHTML(snapshot.activeIncident.ticketId)}">Open incident</button>
        </div>
      </footer>
    `;
  }
  if (snapshot.state.paused) {
    return `<footer class="action-dock" aria-label="Response actions"><div class="warning-box pause-message"><strong>Shift paused</strong><p>Resume the timer when you are ready to respond.</p><button class="btn primary" data-action="toggle-pause">Resume shift</button></div></footer>`;
  }
  const caseFocus = snapshot.caseFile?.focus;
  const shiftRule = snapshot.shiftCondition;
  const cards = snapshot.actionList.map((action, index) => `
    <button class="btn action-card ${action.isMastery ? 'mastery-action' : ''}" data-action="resolve-ticket" data-action-id="${escapeHTML(action.id)}" aria-keyshortcuts="${index + 1}">
      <strong><span>${escapeHTML(action.icon)} ${escapeHTML(action.label)}</span><span class="hotkey">${index + 1}</span></strong>
      ${action.isMastery ? `<span class="mastery-badge">Special reply · unlocked personnel move · ${escapeHTML(action.technique?.name ?? 'Personnel playbook')}</span>` : ''}
      <span>${escapeHTML(action.preview)}</span>
      <span class="metric-chip">${escapeHTML(action.tone)}</span>
      ${action.conditionAffected ? '<span class="condition-affects">Today\'s shift rule changes this reply.</span>' : ''}
      ${snapshot.state.settings.showDeltaPreview ? renderForecast(action.delta, snapshot.information?.forecastSlots) : '<span class="forecast-note">Approved reply clues hidden in Settings.</span>'}
    </button>
  `).join('');
  return `
    <footer class="action-dock" aria-label="Response actions">
      ${renderShiftRuleReminder(shiftRule)}
      ${caseFocus ? `<div class="case-focus"><span class="case-focus-label">Case focus</span><strong>${escapeHTML(caseFocus)}</strong></div>` : ''}
      <div class="action-dock-intro"><span><strong>Choose your reply below.</strong> Click a card or press its number.</span><span>Your reply is sent immediately.</span></div>
      <div class="action-grid">${cards}</div>
    </footer>
  `;
}

function renderForecast(delta = {}, unlockedSlots = 0) {
  const entries = Object.entries(delta)
    .filter(([, value]) => Number(value) !== 0)
    .sort((a, b) => Math.abs(Number(b[1])) - Math.abs(Number(a[1])));
  const slots = Math.max(0, Math.min(6, Math.round(Number(unlockedSlots) || 0)));
  if (slots === 0) {
    return '<div class="forecast forecast-locked"><span class="forecast-label">Reply forecast sealed</span><span class="forecast-note">The email is your evidence. Earn Insight to open this instrument.</span></div>';
  }
  if (entries.length === 0) {
    return '<div class="forecast"><span class="forecast-label">Approved forecast</span><span class="forecast-note">No clear movement in the gauges you can read.</span></div>';
  }

  const chips = entries.slice(0, slots).map(([key, value]) => {
    const numeric = Number(value);
    const label = METRIC_LABELS[key] ?? key;
    const rises = numeric > 0;
    const highIsBad = ['soulRisk', 'inboxHeat'].includes(key);
    const improves = rises !== highIsBad;
    const directionWord = rises ? 'rises' : 'falls';
    return `
      <span class="forecast-chip ${improves ? 'improves' : 'worsens'}">
        <span aria-hidden="true">${escapeHTML(label)} ${rises ? '↑' : '↓'}</span>
        <span class="sr-only">${escapeHTML(label)} likely ${directionWord}; this generally ${improves ? 'improves' : 'worsens'} your position.</span>
      </span>
    `;
  }).join('');
  const hidden = Math.max(0, entries.length - slots);
  const uncertainty = hidden > 0
    ? `${hidden} other ${hidden === 1 ? 'consequence is' : 'consequences are'} still sealed.`
    : 'Directions only. Exact impact appears after sending.';

  return `
    <div class="forecast">
      <span class="forecast-label">Approved forecast · ${escapeHTML(Math.min(slots, entries.length))} read</span>
      <div class="forecast-row">${chips}</div>
      <span class="forecast-note">${escapeHTML(uncertainty)}</span>
    </div>
  `;
}

function renderResolvedDock(snapshot) {
  const open = snapshot.openTicketIds.length;
  const resolved = snapshot.state.handled?.[snapshot.selectedTicket?.id];
  const judgment = resolved?.caseJudgment;
  const letter = judgment?.letter ?? '—';
  const insight = Number(judgment?.insight ?? judgment?.insightAwarded ?? 0);
  const nextAction = snapshot.state.phase === 'ticketing' && open === 0
    ? '<button class="btn primary case-report-continue" data-action="end-shift">End shift audit</button>'
    : '';
  const nextTicketId = snapshot.openTicketIds[0];
  const continueAction = nextAction || (nextTicketId
    ? `<button class="btn primary case-report-continue" data-action="select-ticket" data-ticket-id="${escapeHTML(nextTicketId)}">Open next email · ${open} left</button>`
    : '');
  return `
    <footer class="action-dock resolved-dock case-report-dock" aria-label="Case report" aria-live="polite">
      <section class="case-report ${letterGradeClass(letter)}">
        <div class="case-grade-badge"><span>Case grade</span><b>${escapeHTML(letter)}</b></div>
        <div class="case-report-copy">
          <div class="case-report-heading">
            <strong>${escapeHTML(judgment?.label ?? judgmentLabel(judgment?.rating))}</strong>
            <span>+${escapeHTML(judgment?.points ?? 0)} case points · ${insight > 0 ? `+${escapeHTML(insight)} Insight` : 'No Insight'}</span>
          </div>
          ${resolved?.outcomeTitle ? `<p><b>Result:</b> ${escapeHTML(resolved.outcomeTitle)}</p>` : ''}
          ${judgment?.reason ? `<p class="case-report-reason"><b>Why:</b> ${escapeHTML(judgment.reason)}</p>` : ''}
          ${judgment?.customerThread ? `<div class="case-file-completed compact" role="status"><strong>📌 Customer file closed · ${escapeHTML(judgment.customerThread.title)}</strong><span>${judgment.customerThread.bonusInsight > 0 ? '+1 bonus Insight for a Strong final read.' : 'Complete, but no Strong-read bonus.'}</span></div>` : ''}
          ${judgment?.grade === 'missed' ? '<div class="case-report-warning"><strong>Audit pressure increased.</strong> The reply missed a decisive clue in the email.</div>' : ''}
          <div class="case-report-impact"><span>Confirmed impact</span><div class="delta-row">${renderDeltaChips(resolved?.delta ?? {})}</div></div>
        </div>
        <div class="case-report-next">
          <span>Current shift grade <b>${escapeHTML(snapshot.casework?.grade ?? '—')}</b> · ${escapeHTML(snapshot.casework?.points ?? 0)} points</span>
          ${continueAction}
        </div>
      </section>
    </footer>
  `;
}

function renderShiftRuleReminder(condition) {
  if (!condition) return '';
  return `
    <aside class="shift-rule-reminder" aria-label="Today's shift rule">
      <span class="case-focus-label">Today's shift rule</span>
      <strong><span aria-hidden="true">${escapeHTML(condition.glyph ?? '◆')}</span> ${escapeHTML(condition.name)}</strong>
      <span><b>Opportunity:</b> ${escapeHTML(condition.opportunity)}</span>
      <span><b>Hazard:</b> ${escapeHTML(condition.hazard)}</span>
    </aside>
  `;
}

function renderOpsPanel(snapshot, ui) {
  const availableTabs = ['ops', 'log'];
  const activeTab = availableTabs.includes(ui.rightTab) ? ui.rightTab : 'ops';
  const tabs = availableTabs.map(tab => `
    <button id="opsTab-${tab}" class="tab-btn ${activeTab === tab ? 'active' : ''}" role="tab" aria-selected="${activeTab === tab}" aria-controls="opsPanel" tabindex="${activeTab === tab ? '0' : '-1'}" data-action="set-right-tab" data-tab="${tab}">${tabLabel(tab)}</button>
  `).join('');
  return `
    <aside class="panel ops-panel" aria-label="Operations panel">
      <div class="right-tabs" role="tablist" aria-label="Operations views">${tabs}</div>
      <div class="panel-body" id="opsPanel" role="tabpanel" aria-labelledby="opsTab-${activeTab}">
        ${activeTab === 'log' ? renderAuditLog(snapshot) : renderOps(snapshot)}
      </div>
    </aside>
  `;
}

function renderOps(snapshot) {
  const { state, shift, departments } = snapshot;
  const flags = Object.entries(state.flags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  return `
    <div class="stack-list">
      <section class="directive-box">
        <h3>Shift briefing</h3>
        <p>${escapeHTML(shift.subtitle)}</p>
        <ul>${shift.briefing.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
      </section>
      ${renderShiftCondition(snapshot.shiftCondition)}
      ${renderOfficeBlueprint(snapshot.office)}
      ${renderOfficeCorkboard(snapshot.office)}
      ${renderInstrumentAccess(snapshot.information)}
      <section>
        <h3>Your department access</h3>
        <div class="department-grid" style="margin-top: 0.55rem;">
          ${departments.map(dep => `<span class="tag" title="${escapeHTML(dep.description)}">${escapeHTML(dep.name)}</span>`).join('')}
        </div>
      </section>
      ${renderReplyPlaybook(snapshot.progression)}
      ${renderDeskLoadout(snapshot.progression?.artifacts)}
      <section>
        <h3>Personnel notes</h3>
        <div class="flag-grid" style="margin-top: 0.55rem;">
          ${flags.length ? flags.map(([key, count]) => `<span class="tag">${escapeHTML(flagLabel(key))} ×${escapeHTML(count)}</span>`).join('') : '<span class="tag">No notes yet</span>'}
        </div>
      </section>
      <section>
        <h3>Keyboard</h3>
        <div class="kbd-grid" style="margin-top: 0.55rem;">
          <div><span>Send a reply</span><span class="hotkey">1–8</span></div>
          <div><span>Next / previous ticket</span><span class="hotkey">J / K</span></div>
          <div><span>Search inbox</span><span class="hotkey">F</span></div>
          <div><span>Export save</span><span class="hotkey">E</span></div>
          <div><span>Settings</span><span class="hotkey">S</span></div>
        </div>
      </section>
    </div>
  `;
}

function renderOfficeBlueprint(office) {
  if (!office) return '';
  return `
    <section class="office-blueprint" aria-labelledby="officeBlueprintTitle">
      <div class="office-section-heading"><div><span class="eyebrow">Your workplace</span><h3 id="officeBlueprintTitle">Brimstone Support blueprint</h3></div><span class="office-philosophy">${escapeHTML(office.philosophy)}</span></div>
      <p>Every restored room changes how the assignment plays and invites a new kind of trouble.</p>
      <div class="office-slot-grid">
        ${office.slots.map(slot => `
          <article class="office-slot ${slot.built ? 'built' : 'sealed'}" title="${escapeHTML(slot.built ? `${slot.boon} ${slot.complication}` : 'Restore this room through a shift audit.')}" aria-label="${escapeHTML(slot.built ? `${slot.name}, restored` : 'Sealed room')}">
            <span aria-hidden="true">${slot.built ? escapeHTML(slot.glyph ?? '▣') : '?'}</span>
            <strong>${slot.built ? escapeHTML(slot.name) : 'Sealed room'}</strong>
          </article>
        `).join('')}
      </div>
      ${office.activePaths?.length ? `<div class="office-paths"><span>Office identity awakened</span>${office.activePaths.map(path => `<article><strong>${escapeHTML(path.name)}</strong><p>${escapeHTML(path.description)}</p><small><b>Benefit:</b> ${escapeHTML(path.boon)} <b>Cost:</b> ${escapeHTML(path.complication)}</small></article>`).join('')}</div>` : '<p class="office-path-hint">Certain pairs of rooms awaken a stronger office identity—with another cost attached.</p>'}
      <div class="elevator-card ${office.elevator?.unlocked ? 'unlocked' : ''}"><span aria-hidden="true">${office.elevator?.unlocked ? '⇧' : '◦'}</span><div><strong>${escapeHTML(office.elevator?.unlocked ? 'Executive elevator' : 'Sealed elevator')}</strong><p>${escapeHTML(office.elevator?.label ?? '')}</p></div></div>
    </section>
  `;
}

function renderOfficeCorkboard(office) {
  if (!office?.corkboard?.length) return '';
  return `
    <section class="office-corkboard" aria-labelledby="officeCorkboardTitle">
      <span class="eyebrow">Things the building remembers</span>
      <h3 id="officeCorkboardTitle">Corkboard</h3>
      <div class="corkboard-list">
        ${office.corkboard.map(item => `
          <article class="corkboard-card ${item.complete ? 'complete' : ''}">
            <div><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.current)} / ${escapeHTML(item.required)}</span></div>
            <div class="mini-track"><span style="--pct:${clampPct((Number(item.current) / Math.max(1, Number(item.required))) * 100)}%"></span></div>
            <p>${escapeHTML(item.hint)}</p>
          </article>
        `).join('')}
      </div>
      ${office.caseThreads?.length ? `<div class="case-thread-list"><span>Customer threads</span>${office.caseThreads.map(thread => `<article class="${thread.complete ? 'complete' : ''}"><div><strong>${escapeHTML(thread.title)}</strong><span>${escapeHTML(thread.current)} / ${escapeHTML(thread.required)}</span></div><p>${escapeHTML(thread.hint)}</p><small>${escapeHTML(thread.reward)}</small></article>`).join('')}</div>` : ''}
      ${office.careerChain?.length ? `<div class="career-chain"><span>Next personnel rewards</span>${office.careerChain.map((reward, index) => `<div><b>${index + 1}</b><span><strong>${escapeHTML(reward.name)}</strong><small>${escapeHTML(reward.reward ?? 'New clearance')} at ${escapeHTML(reward.minInsight)} Insight</small></span></div>`).join('')}</div>` : ''}
    </section>
  `;
}

function renderShiftCondition(condition) {
  if (!condition) {
    return `
      <section class="condition-memo training-memo">
        <span class="eyebrow">Training restriction</span>
        <h3>Read before replying</h3>
        <p>Exact gauges and reply forecasts are sealed. The case focus points toward the decisive detail in each email.</p>
      </section>
    `;
  }
  return `
    <section class="condition-memo" aria-labelledby="conditionMemoTitle">
      <span class="eyebrow">Today's shift rule</span>
      <h3 id="conditionMemoTitle"><span aria-hidden="true">${escapeHTML(condition.glyph ?? '◆')}</span> ${escapeHTML(condition.name)}</h3>
      <p>${escapeHTML(condition.memo)}</p>
      <div class="memo-effect boon"><strong>Opportunity</strong><span>${escapeHTML(condition.opportunity)}</span></div>
      <div class="memo-effect hazard"><strong>Hazard</strong><span>${escapeHTML(condition.hazard)}</span></div>
    </section>
  `;
}

function renderInstrumentAccess(information) {
  if (!information) return '';
  const openCount = information.metricKeys?.length ?? 0;
  return `
    <section class="instrument-access">
      <h3>Your desk instruments</h3>
      <p><strong>${escapeHTML(information.name)}</strong> · ${escapeHTML(openCount)} exact ${openCount === 1 ? 'gauge' : 'gauges'} · ${escapeHTML(information.forecastSlots)} ${information.forecastSlots === 1 ? 'consequence' : 'consequences'} per reply</p>
      <p>${escapeHTML(information.description)}</p>
      ${information.next ? `<p class="playbook-next">Next instrument: <strong>${escapeHTML(information.next.name)}</strong> at ${escapeHTML(information.next.minInsight)} Insight.</p>` : '<p class="playbook-next"><strong>Every desk instrument is open.</strong></p>'}
    </section>
  `;
}

function renderReplyPlaybook(progression) {
  if (!progression) return '';
  const techniques = Array.isArray(progression.replyTechniques) ? progression.replyTechniques : [];
  const next = progression.nextReplyTechnique;
  return `
    <section class="reply-playbook" aria-labelledby="replyPlaybookTitle">
      <h3 id="replyPlaybookTitle">Reply playbook</h3>
      ${techniques.length ? `
        <ul class="technique-list">
          ${techniques.map(technique => `
            <li class="${technique.usedThisShift ? 'used' : 'ready'}"><span class="technique-glyph" aria-hidden="true">${escapeHTML(technique.glyph ?? '✦')}</span><div><div class="technique-title"><strong>${escapeHTML(technique.name)}</strong><span class="technique-status">${technique.usedThisShift ? 'Used this shift' : 'Ready'}</span></div><p>${escapeHTML(technique.description)}</p></div></li>
          `).join('')}
        </ul>
      ` : '<p class="small-row artifact-empty">Earn 6 Insight and your supervisor will add a special reply to your playbook.</p>'}
      <p class="playbook-rule">Each special reply can be sent once per shift. It is ready again after the audit.</p>
      ${next ? `<p class="playbook-next">Next playbook addition: <strong>${escapeHTML(next.name)}</strong> at ${escapeHTML(next.minInsight)} Insight.</p>` : '<p class="playbook-next"><strong>Your reply playbook is complete.</strong></p>'}
    </section>
  `;
}

function renderDeskLoadout(artifacts = []) {
  if (!Array.isArray(artifacts)) return '';
  return `
    <section class="desk-loadout" aria-labelledby="deskLoadoutTitle">
      <h3 id="deskLoadoutTitle">Your desk</h3>
      ${artifacts.length ? `
        <ul class="artifact-list">
          ${artifacts.map(artifact => renderOwnedArtifact(artifact)).join('')}
        </ul>
      ` : '<p class="small-row artifact-empty">Your desk is empty. The shift audit may offer something useful—or cursed.</p>'}
    </section>
  `;
}

function renderOwnedArtifact(artifact) {
  const view = artifactView(artifact);
  return `
    <li class="owned-artifact">
      <div class="artifact-title"><span class="artifact-icon" aria-hidden="true">${escapeHTML(view.icon)}</span><strong>${escapeHTML(view.title)}</strong></div>
      ${view.boon ? `<p><span class="artifact-effect-label">Boon</span> ${escapeHTML(view.boon)}</p>` : ''}
      ${view.drawback ? `<p><span class="artifact-effect-label drawback">Drawback</span> ${escapeHTML(view.drawback)}</p>` : ''}
    </li>
  `;
}

function renderAuditLog(snapshot) {
  const entries = snapshot.state.log.slice(0, 24).map(entry => `
    <li>
      <time datetime="${escapeHTML(entry.at)}">${escapeHTML(formatClock(entry.at))} · ${escapeHTML(entry.type)}</time>
      <strong>${escapeHTML(entry.title)}</strong>
      <p>${escapeHTML(entry.message)}</p>
    </li>
  `).join('');
  return `<ol class="audit-log">${entries}</ol>`;
}

function renderModal(snapshot, ui) {
  if (!ui.modal) return '';
  if (ui.modal === 'welcome') return renderWelcomeModal(snapshot);
  if (ui.modal === 'settings') return renderSettingsModal(snapshot);
  if (ui.modal === 'summary') return renderSummaryModal(snapshot);
  if (ui.modal === 'gameOver') return renderGameOverModal(snapshot);
  if (ui.modal === 'demoComplete') return renderDemoCompleteModal(snapshot);
  if (ui.modal === 'import') return renderImportModal(ui);
  if (ui.modal === 'export') return renderExportModal(ui);
  return '';
}

function renderWelcomeModal(snapshot) {
  const { shift } = snapshot;
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcomeTitle" aria-describedby="welcomeDescription" data-modal-root tabindex="-1">
      <section class="modal-card welcome-card">
        <p class="eyebrow">Orientation packet · Shift ${escapeHTML(shift.id)}</p>
        <h2 id="welcomeTitle">Welcome to Brimstone Support</h2>
        <p id="welcomeDescription">Your job is to read each cursed request, identify what the customer actually needs, and send a defensible reply before the shift ends. Most exact gauges begin sealed; the email is your evidence.</p>
        <div class="welcome-grid">
          <section class="directive-box"><h3>Today’s assignment</h3><p>${escapeHTML(shift.objective)}</p></section>
          <section class="directive-box"><h3>What your supervisor expects</h3><ol class="welcome-steps"><li>Read the email and notice the detail that changes the case.</li><li>Choose the reply that answers the case, not the reply that merely looks profitable.</li><li>At audit, spend your progress twice: restore one office room and choose one desk artifact.</li></ol></section>
        </div>
        <p class="small-row">There is no perfect reply. Strong reads earn more Insight, promotions add better replies and instruments, and restored rooms reshape later shifts—with useful perks and new trouble. Earlier customers may also write back about what you chose. Your supervisor leaves quiet notes during the first shift; hide them anytime.</p>
        <footer class="inline-actions modal-actions"><button class="btn primary" data-action="start-game" data-modal-initial-focus data-focus-key="welcome-start">Start shift</button></footer>
      </section>
    </div>
  `;
}

function renderSettingsModal(snapshot) {
  const { settings } = snapshot.state;
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="settingsTitle" aria-describedby="settingsDescription" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="settingsTitle">Settings</h2><p id="settingsDescription">Changes autosave. The shift timer is paused while this dialog is open.</p></div><button class="btn icon-only" data-action="close-modal" data-modal-initial-focus data-focus-key="settings-close" aria-label="Close settings">×</button></header>
        ${settingSwitch('showDeltaPreview', 'Show unlocked reply clues', 'Shows only the directional consequences your personnel clearance has opened.', settings.showDeltaPreview)}
        ${settingSwitch('compactTickets', 'Compact ticket list', 'Tightens queue rows so more tickets fit on screen.', settings.compactTickets)}
        ${settingSwitch('reducedMotion', 'Reduce motion', 'Disables smooth scrolling and decorative transitions.', settings.reducedMotion)}
        <div class="setting-row"><div><label for="textScale"><strong>Text scale</strong></label><p id="textScaleDescription">Adjusts the size of interface text.</p></div><select id="textScale" class="select" data-action="set-text-scale" data-focus-key="setting-text-scale" aria-describedby="textScaleDescription"><option value="0.9" ${settings.textScale === 0.9 ? 'selected' : ''}>Small</option><option value="1" ${settings.textScale === 1 ? 'selected' : ''}>Default</option><option value="1.08" ${settings.textScale === 1.08 ? 'selected' : ''}>Large</option><option value="1.18" ${settings.textScale === 1.18 ? 'selected' : ''}>XL</option></select></div>
        <footer class="inline-actions modal-actions"><button class="btn primary" data-action="close-modal" data-focus-key="settings-done">Done</button></footer>
      </section>
    </div>
  `;
}

function settingSwitch(key, title, description, checked) {
  const inputId = `setting-${key}`;
  const descriptionId = `${inputId}-description`;
  return `
    <div class="setting-row">
      <div><label for="${escapeHTML(inputId)}"><strong>${escapeHTML(title)}</strong></label><p id="${escapeHTML(descriptionId)}">${escapeHTML(description)}</p></div>
      <label class="switch"><input id="${escapeHTML(inputId)}" type="checkbox" data-action="toggle-setting" data-setting="${escapeHTML(key)}" data-focus-key="${escapeHTML(inputId)}" aria-label="${escapeHTML(title)}" aria-describedby="${escapeHTML(descriptionId)}" ${checked ? 'checked' : ''}><span aria-hidden="true"></span></label>
    </div>
  `;
}

function renderSummaryModal(snapshot) {
  const summary = snapshot.state.lastSummary;
  if (!summary) return '';
  const artifactDraft = renderArtifactDraft(snapshot, summary);
  const roomDraft = renderOfficeRoomDraft(snapshot, summary);
  const mustChooseArtifact = artifactDraft.requiresChoice;
  const mustChooseRoom = roomDraft.requiresChoice;
  const judgments = summary.judgments ?? {};
  const casework = summary.casework ?? { score: 0, target: snapshot.shift?.caseworkTarget ?? 0, met: false, auditDelta: {} };
  const insightEarned = finiteDisplayNumber(summary.insightEarned);
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="summaryTitle" aria-describedby="summaryDescription" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="summaryTitle">Shift audit: ${escapeHTML(summary.title)}</h2><p id="summaryDescription">${summary.reason === 'timeout' ? 'Time expired.' : 'Queue closed.'} The inbox updates your personnel file.</p></div></header>
        <div class="summary-grid">
          <div class="summary-card"><span>Queue result</span><b>${escapeHTML(summary.resolved)} closed</b><small>${escapeHTML(summary.unresolved)} left unresolved</small></div>
          <div class="summary-card"><span>Ending vector</span><b>${escapeHTML(summary.endingHint)}</b></div>
          <div class="summary-card grade-summary ${letterGradeClass(casework.grade)}"><span>Final shift grade</span><b>${escapeHTML(casework.grade ?? '—')}</b><small>${escapeHTML(casework.points ?? 0)} / ${escapeHTML(casework.targetPoints ?? 0)} case points</small></div>
          ${snapshot.progression ? `<div class="summary-card"><span>Personnel file</span><b>${escapeHTML(snapshot.progression.rank?.title ?? 'Temporary Agent')}</b><small>+${escapeHTML(insightEarned)} this shift · ${escapeHTML(finiteDisplayNumber(snapshot.progression.insight))} Insight total</small></div>` : ''}
          <div class="summary-card"><span>Case reads</span><b>${escapeHTML(finiteDisplayNumber(judgments.strong))} strong</b><small>${escapeHTML(finiteDisplayNumber(judgments.defensible))} defensible · ${escapeHTML(finiteDisplayNumber(judgments.missed))} missed</small></div>
          <div class="summary-card"><span>Audit marks</span><b>${escapeHTML(casework.auditMarks ?? 0)} / 3</b><small>Three ends probation</small></div>
        </div>
        ${summary.unresolved ? `<div class="warning-box" style="margin-top: 1rem;"><strong>Penalty applied</strong><div class="delta-row" style="margin-top: .5rem;">${renderDeltaChips(summary.penalty)}</div></div>` : ''}
        ${roomDraft.html}
        ${artifactDraft.html}
        <footer class="inline-actions summary-actions" style="justify-content: flex-end; margin-top: 1rem;">
          ${mustChooseRoom || mustChooseArtifact
            ? `<span class="artifact-choice-prompt">${mustChooseRoom ? 'Restore one office room' : ''}${mustChooseRoom && mustChooseArtifact ? ', then ' : ''}${mustChooseArtifact ? 'choose a desk artifact or take nothing' : ''} to continue.</span>`
            : `<button class="btn primary" data-action="advance-shift" data-modal-initial-focus data-focus-key="summary-advance">${snapshot.state.activeShiftId >= snapshot.maxShiftId ? 'Finish probation' : 'Start next shift'}</button>`}
        </footer>
        <div class="audit-details-divider"><span>Detailed audit record</span></div>
        ${renderCaseworkAudit(casework)}
        ${renderReplyUnlockSummary(snapshot, summary)}
        ${renderTimedEventAudit(summary)}
      </section>
    </div>
  `;
}

function renderOfficeRoomDraft(snapshot, summary) {
  const offers = Array.isArray(snapshot.office?.offers) ? snapshot.office.offers : [];
  const finalShift = snapshot.state.activeShiftId >= snapshot.maxShiftId;
  const choiceMade = summary.roomChosen !== undefined && summary.roomChosen !== null;
  if (choiceMade) {
    const chosenId = typeof summary.roomChosen === 'object' ? summary.roomChosen.id : summary.roomChosen;
    const chosen = typeof summary.roomChosen === 'object'
      ? summary.roomChosen
      : snapshot.office?.rooms?.find?.(room => room.id === chosenId);
    if (chosenId === 'none') return { html: '', requiresChoice: false };
    return {
      html: `<section class="room-draft room-complete" aria-label="Restored office room"><span class="eyebrow">Office expanded</span>${renderChosenRoom(chosen)}</section>`,
      requiresChoice: false
    };
  }
  if (finalShift || offers.length === 0) return { html: '', requiresChoice: false };
  return {
    html: `
      <section class="room-draft" aria-labelledby="roomDraftTitle">
        <span class="eyebrow">Build Brimstone Support</span>
        <h3 id="roomDraftTitle">Restore one office room</h3>
        <p>The room stays for the rest of the assignment. Its advantage begins next shift; its complication may eventually send an emergency to your desk.</p>
        <div class="room-offer-grid" role="group" aria-label="Available office rooms">
          ${offers.map((room, index) => renderRoomOffer(room, index === 0)).join('')}
        </div>
      </section>
    `,
    requiresChoice: true
  };
}

function renderRoomOffer(room, initialFocus = false) {
  return `
    <button class="btn room-offer" data-action="choose-office-room" data-room-id="${escapeHTML(room.id)}" ${initialFocus ? 'data-modal-initial-focus' : ''}>
      <span class="room-title"><span class="room-icon" aria-hidden="true">${escapeHTML(room.glyph ?? '▣')}</span><span><strong>${escapeHTML(room.name)}</strong><small>${escapeHTML(room.philosophy)}</small></span></span>
      <span class="room-description">${escapeHTML(room.description)}</span>
      <span class="room-boon"><span class="artifact-effect-label">Opens</span> ${escapeHTML(room.boon)}</span>
      <span class="room-complication"><span class="artifact-effect-label drawback">Complication</span> ${escapeHTML(room.complication)}</span>
      <span class="room-unlock">May awaken: ${escapeHTML(room.unlock)}</span>
    </button>
  `;
}

function renderChosenRoom(room) {
  if (!room) return '<strong>Room restored.</strong><p>The blueprint records the choice.</p>';
  return `<div class="room-equipped"><div class="room-title"><span class="room-icon" aria-hidden="true">${escapeHTML(room.glyph ?? '▣')}</span><span><strong>${escapeHTML(room.name)}</strong><small>${escapeHTML(room.philosophy)}</small></span></div><p>${escapeHTML(room.boon)}</p><p class="room-complication"><span class="artifact-effect-label drawback">Complication</span> ${escapeHTML(room.complication)}</p></div>`;
}

function renderCaseworkAudit(casework) {
  const delta = casework?.auditDelta ?? {};
  if (casework?.met) {
    return `
      <section class="casework-audit passed">
        <span class="eyebrow">Casework target met</span>
        <h3>The supervisor found evidence that you read the emails.</h3>
        <p>${casework.auditMarkDelta < 0 ? 'Exceptional casework cleared one earlier audit mark and widened the artifact requisition tray.' : casework.score >= casework.target + 2 ? 'Exceptional casework steadied the desk and widened the artifact requisition tray.' : 'The audit passes. Your artifact requisition tray reflects the quality of the work.'}</p>
        ${Object.keys(delta).length ? `<div class="delta-row">${renderDeltaChips(delta)}</div>` : ''}
      </section>
    `;
  }
  return `
    <section class="casework-audit missed">
      <span class="eyebrow">Casework target missed</span>
      <h3>Efficient replies did not answer enough of the actual cases.</h3>
      <p>The deficit adds ${escapeHTML(casework.auditMarkDelta ?? 1)} audit ${Number(casework.auditMarkDelta) === 1 ? 'mark' : 'marks'}, applies pressure, and narrows the next artifact requisition tray. Three marks end probation.</p>
      ${Object.keys(delta).length ? `<div class="delta-row">${renderDeltaChips(delta)}</div>` : ''}
    </section>
  `;
}

function renderReplyUnlockSummary(snapshot, summary) {
  const ids = Array.isArray(summary.replyUnlocks) ? summary.replyUnlocks : [];
  if (ids.length === 0) return '';
  const techniques = ids
    .map(id => snapshot.progression?.replyTechniques?.find?.(technique => technique.id === id))
    .filter(Boolean);
  if (techniques.length === 0) return '';
  return `
    <section class="progression-reward" aria-label="New reply techniques">
      <span class="eyebrow">Promotion reward</span>
      <h3>${techniques.length === 1 ? 'New reply added to your playbook' : 'New replies added to your playbook'}</h3>
      ${techniques.map(technique => `
        <div class="unlocked-technique"><span class="technique-glyph" aria-hidden="true">${escapeHTML(technique.glyph ?? '✦')}</span><div><strong>${escapeHTML(technique.name)}</strong><p>${escapeHTML(technique.description)} It will appear only when it fits the active case.</p></div></div>
      `).join('')}
      ${snapshot.information ? `<div class="unlocked-technique instrument-unlock"><span class="technique-glyph" aria-hidden="true">⌁</span><div><strong>Desk upgrade: ${escapeHTML(snapshot.information.name)}</strong><p>${escapeHTML(snapshot.information.description)}</p></div></div>` : ''}
    </section>
  `;
}

function renderTimedEventAudit(summary) {
  const results = Array.isArray(summary.timedEvents) ? summary.timedEvents : [];
  if (results.length === 0) return '';
  return `
    <section class="timed-event-audit" aria-label="Office interruption result">
      <span class="eyebrow">Office interruption</span>
      ${results.map(result => `
        <div><strong>${escapeHTML(result.result === 'resolved' ? result.choiceLabel : 'Deadline missed')}</strong><p>${escapeHTML(result.outcome)}</p>${result.insightAwarded ? `<span class="insight-award">+${escapeHTML(result.insightAwarded)} Insight</span>` : '<span class="insight-award missed">No Insight</span>'}<div class="delta-row">${renderDeltaChips(result.delta)}</div></div>
      `).join('')}
    </section>
  `;
}

function renderArtifactDraft(snapshot, summary) {
  const offers = Array.isArray(snapshot.progression?.artifactOffers)
    ? snapshot.progression.artifactOffers
    : [];
  const finalShift = snapshot.state.activeShiftId >= snapshot.maxShiftId;
  const choiceMade = summary.artifactChosen !== undefined && summary.artifactChosen !== null;
  if (choiceMade) {
    const chosenId = typeof summary.artifactChosen === 'object'
      ? summary.artifactChosen.id
      : summary.artifactChosen;
    const chosen = typeof summary.artifactChosen === 'object'
      ? summary.artifactChosen
      : offers.find(artifact => artifact?.id === chosenId)
        ?? snapshot.progression?.artifacts?.find?.(artifact => artifact?.id === chosenId);
    const choiceText = chosenId === 'none'
      ? '<strong>Desk left unchanged.</strong><p>You decline the offer. The drawer closes by itself.</p>'
      : renderChosenArtifact(chosen);
    return {
      html: `<section class="artifact-draft artifact-complete" aria-label="Desk artifact choice"><span class="eyebrow">Desk artifact equipped</span>${choiceText}</section>`,
      requiresChoice: false
    };
  }
  if (finalShift || offers.length === 0) return { html: '', requiresChoice: false };

  return {
    html: `
      <section class="artifact-draft" aria-labelledby="artifactDraftTitle">
        <span class="eyebrow">Between-shift reward</span>
        <h3 id="artifactDraftTitle">Choose one desk artifact</h3>
        <p>Your casework earned ${escapeHTML(offers.length)} ${offers.length === 1 ? 'offer' : 'offers'}. The artifact stays for the rest of this assignment, so read both the boon and drawback.</p>
        <div class="artifact-offer-grid" role="group" aria-label="Available desk artifacts">
          ${offers.map((artifact, index) => renderArtifactOffer(artifact, index === 0)).join('')}
          <button class="btn artifact-offer artifact-none" data-action="choose-artifact" data-artifact-id="none">
            <span class="artifact-title"><span class="artifact-icon" aria-hidden="true">○</span><strong>Take nothing</strong></span>
            <span class="artifact-boon">Leave your desk exactly as it is and accept no new drawback.</span>
          </button>
        </div>
      </section>
    `,
    requiresChoice: true
  };
}

function renderArtifactOffer(artifact, initialFocus = false) {
  const view = artifactView(artifact);
  return `
    <button class="btn artifact-offer" data-action="choose-artifact" data-artifact-id="${escapeHTML(view.id)}" ${initialFocus ? 'data-modal-initial-focus' : ''}>
      <span class="artifact-title"><span class="artifact-icon" aria-hidden="true">${escapeHTML(view.icon)}</span><strong>${escapeHTML(view.title)}</strong></span>
      ${view.boon ? `<span class="artifact-boon"><span class="artifact-effect-label">Boon</span> ${escapeHTML(view.boon)}</span>` : ''}
      ${view.drawback ? `<span class="artifact-drawback"><span class="artifact-effect-label drawback">Drawback</span> ${escapeHTML(view.drawback)}</span>` : ''}
    </button>
  `;
}

function renderChosenArtifact(artifact) {
  if (!artifact) return '<strong>Artifact equipped.</strong><p>The personnel file records the choice.</p>';
  const view = artifactView(artifact);
  return `
    <div class="artifact-equipped">
      <div class="artifact-title"><span class="artifact-icon" aria-hidden="true">${escapeHTML(view.icon)}</span><strong>${escapeHTML(view.title)}</strong></div>
      ${view.boon ? `<p><span class="artifact-effect-label">Boon</span> ${escapeHTML(view.boon)}</p>` : ''}
      ${view.drawback ? `<p><span class="artifact-effect-label drawback">Drawback</span> ${escapeHTML(view.drawback)}</p>` : ''}
    </div>
  `;
}

function renderGameOverModal(snapshot) {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="gameOverTitle" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="gameOverTitle">${escapeHTML(snapshot.ending)}</h2><p>Your assignment ends, but the inbox archives everything.</p></div></header>
        <p>${escapeHTML(snapshot.state.log[0]?.message ?? 'Your shift cannot continue.')}</p>
        <div class="summary-grid">${Object.entries(snapshot.metrics).map(([key, value]) => `<div class="summary-card"><span>${escapeHTML(METRIC_LABELS[key] ?? key)}</span><b>${escapeHTML(value)}</b></div>`).join('')}</div>
        <footer class="inline-actions modal-actions"><button class="btn" data-action="export-save" data-focus-key="gameover-export-save">Export save</button><button class="btn primary" data-action="reset-run" data-modal-initial-focus data-focus-key="gameover-new-run">Start over</button></footer>
      </section>
    </div>
  `;
}

function renderDemoCompleteModal(snapshot) {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="demoTitle" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="demoTitle">Probation complete: ${escapeHTML(snapshot.ending)}</h2><p>You survived your first five shifts.</p></div></header>
        <p>${escapeHTML(snapshot.state.log[0]?.message ?? 'Your first week has ended.')}</p>
        <div class="summary-grid">
          <div class="summary-card"><span>Tickets resolved</span><b>${escapeHTML(Object.keys(snapshot.state.handled).length)}</b></div>
          <div class="summary-card"><span>Probation case grade</span><b>${escapeHTML(snapshot.careerCasework?.grade ?? '—')}</b><small>${escapeHTML(snapshot.careerCasework?.points ?? 0)} / ${escapeHTML(snapshot.careerCasework?.maxPoints ?? 0)} possible points</small></div>
          <div class="summary-card"><span>Departments unlocked</span><b>${escapeHTML(snapshot.state.unlockedDepartments.length)}</b></div>
          <div class="summary-card"><span>Special replies earned</span><b>${escapeHTML(snapshot.progression?.replyTechniques?.length ?? 0)}</b></div>
          <div class="summary-card"><span>Rooms restored</span><b>${escapeHTML(snapshot.office?.roomsBuilt ?? 0)} / ${escapeHTML(snapshot.office?.capacity ?? 0)}</b><small>${escapeHTML(snapshot.office?.philosophy ?? 'Unbuilt office')}</small></div>
          <div class="summary-card"><span>Executive elevator</span><b>${escapeHTML(snapshot.office?.elevator?.unlocked ? 'Open' : 'Sealed')}</b><small>${escapeHTML(snapshot.office?.elevator?.label ?? '')}</small></div>
          <div class="summary-card"><span>Office interruptions handled</span><b>${escapeHTML(snapshot.state.timedEventHistory?.filter?.(result => result.result === 'resolved').length ?? 0)}</b></div>
          <div class="summary-card"><span>Final sanity</span><b>${escapeHTML(snapshot.metrics.sanity)}</b></div>
          <div class="summary-card"><span>Final soul risk</span><b>${escapeHTML(snapshot.metrics.soulRisk)}</b></div>
        </div>
        <footer class="inline-actions modal-actions"><button class="btn" data-action="export-save" data-focus-key="demo-export-save">Export save</button><button class="btn primary" data-action="reset-run" data-modal-initial-focus data-focus-key="demo-play-again">Play again</button></footer>
      </section>
    </div>
  `;
}

function renderImportModal(ui) {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="importTitle" aria-describedby="importDescription" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="importTitle">Import save JSON</h2><p id="importDescription">Paste a previously exported save. Import normalizes older schemas. The timer is paused while this dialog is open.</p></div><button class="btn icon-only" data-action="close-modal" data-focus-key="import-close" aria-label="Close import dialog">×</button></header>
        <label class="sr-only" for="importSaveText">Save JSON</label><textarea id="importSaveText" class="textarea" data-action="import-text" data-modal-initial-focus data-focus-key="import-text" placeholder="Paste save JSON here">${escapeHTML(ui.importText ?? '')}</textarea>
        <footer class="inline-actions modal-actions"><button class="btn" data-action="close-modal" data-focus-key="import-cancel">Cancel</button><button class="btn primary" data-action="confirm-import" data-focus-key="import-confirm">Import</button></footer>
      </section>
    </div>
  `;
}

function renderExportModal(ui) {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="exportTitle" aria-describedby="exportDescription" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="exportTitle">Export save JSON</h2><p id="exportDescription">Copy this for backup or upgrade testing. A file download has also been triggered.</p></div><button class="btn icon-only" data-action="close-modal" data-focus-key="export-close" aria-label="Close export dialog">×</button></header>
        <label class="sr-only" for="exportSaveText">Exported save JSON</label><textarea id="exportSaveText" class="textarea" readonly data-modal-initial-focus data-focus-key="export-text">${escapeHTML(ui.exportText ?? '')}</textarea>
        <footer class="inline-actions modal-actions"><button class="btn primary" data-action="close-modal" data-focus-key="export-done">Done</button></footer>
      </section>
    </div>
  `;
}

export function renderDeltaChips(delta = {}) {
  const entries = Object.entries(delta).filter(([, value]) => Number(value) !== 0);
  if (entries.length === 0) return '<span class="delta-chip neutral">No visible metric change</span>';
  return entries.map(([key, value]) => {
    const numeric = Number(value);
    const positiveGood = !['soulRisk', 'inboxHeat'].includes(key);
    const directionClass = numeric === 0 ? 'neutral' : (numeric > 0 === positiveGood ? 'up' : 'down');
    const sign = numeric > 0 ? '+' : '';
    return `<span class="delta-chip ${directionClass}">${escapeHTML(METRIC_LABELS[key] ?? key)} ${escapeHTML(sign + numeric)}</span>`;
  }).join('');
}

function filterTickets(tickets, state, ui, activeIncident = null) {
  const query = String(ui.query ?? '').trim().toLowerCase();
  return tickets.filter(ticket => {
    if (activeIncident?.ticketId === ticket.id) return true;
    const resolved = Boolean(state.handled[ticket.id]);
    if (ui.filter === 'open' && resolved) return false;
    if (ui.filter === 'closed' && !resolved) return false;
    if (ui.filter === 'severe' && ticket.severity < 4) return false;
    if (!query) return true;
    const haystack = [ticket.subject, ticket.from, ticket.mailbox, ticket.archetype, ticket.preview, ...(ticket.tags ?? [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

function artifactView(artifact = {}) {
  const id = artifact.id ?? artifact.key ?? 'unknown-artifact';
  const title = artifact.title ?? artifact.name ?? artifact.label ?? 'Unnamed artifact';
  const icon = artifact.icon ?? artifact.glyph ?? '◆';
  const boon = artifact.boon ?? artifact.benefit ?? artifact.upside ?? artifact.effect ?? artifact.description ?? '';
  const drawback = artifact.drawback ?? artifact.cost ?? artifact.downside ?? artifact.curse ?? '';
  return { id, title, icon, boon, drawback };
}

function judgmentRatingClass(rating) {
  const normalized = String(rating ?? '').toLowerCase();
  return ['strong', 'defensible', 'missed'].includes(normalized) ? normalized : 'unrated';
}

function judgmentLabel(rating) {
  return ({
    strong: 'Strong read',
    defensible: 'Defensible read',
    missed: 'Missed the brief'
  })[String(rating ?? '').toLowerCase()] ?? 'Case reviewed';
}

function letterGradeClass(letter) {
  const normalized = String(letter ?? '').trim().toLowerCase();
  return ['a', 'b', 'c', 'd', 'f'].includes(normalized) ? `grade-${normalized}` : 'grade-pending';
}

function finiteDisplayNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

export function phaseLabel(phase, paused = false) {
  if (paused) return 'Paused';
  return ({
    ticketing: 'On shift',
    shiftSummary: 'Shift audit',
    gameOver: 'Employment ended',
    demoComplete: 'Probation complete'
  })[phase] ?? phase;
}

function filterLabel(filter) {
  return ({ all: 'All', open: 'Open', closed: 'Closed', severe: 'Severe' })[filter] ?? filter;
}

function tabLabel(tab) {
  return ({ ops: 'Ops', log: 'Audit', diagnostics: 'Diag' })[tab] ?? tab;
}

function flagLabel(key) {
  if (key === 'replyMastery') return 'Special Reply';
  if (key === 'missedBrief') return 'Missed Brief';
  if (key === 'auditMark') return 'Audit Mark';
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase());
}

function metricMood(key, value) {
  if (key === 'cash') return value < 0 ? 'debt' : 'budget';
  if (key === 'soulRisk' || key === 'inboxHeat') return value > 70 ? 'critical' : value > 40 ? 'rising' : 'stable';
  return value < 25 ? 'critical' : value < 45 ? 'strained' : 'stable';
}

function normalizeCash(value) {
  return ((value + 120) / 380) * 100;
}

function clampPct(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}
