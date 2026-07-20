import { ACTION_CATALOG, METRIC_HELP, METRIC_LABELS } from '../content/actionCatalog.js';
import { formatClock, formatDuration, escapeHTML } from '../core/utils.js';

const metricOrder = ['reputation', 'sanity', 'cash', 'soulRisk', 'containment', 'inboxHeat'];

export function renderApp(snapshot, ui, saveInfo = {}) {
  const { state, shift } = snapshot;
  const shellClasses = [
    'app-shell',
    state.settings.compactTickets ? 'compact-tickets' : '',
    state.settings.reducedMotion ? 'reduced-motion' : ''
  ].filter(Boolean).join(' ');
  const backgroundState = ui.modal ? ' inert aria-hidden="true"' : '';
  return `
    <div class="${shellClasses}" style="--font-scale:${escapeHTML(state.settings.textScale)}">
      ${renderTopbar(snapshot, saveInfo, { backgroundState })}
      ${renderHud(snapshot, backgroundState)}
      <main class="workspace" aria-label="Support console"${backgroundState}>
        ${renderInboxPanel(snapshot, ui)}
        ${renderMailPanel(snapshot)}
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
      <div class="status-cluster" aria-label="Run status">
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
  const { state, shift, remainingMs, durationMs, timerPercent, openTicketIds, resolvedThisShift } = snapshot;
  const timerDanger = timerPercent < 22 ? 'bad' : 'info';
  const cards = metricOrder.map(key => renderMetricCard(key, state.metrics[key])).join('');
  return `
    <section class="hud" aria-label="Shift metrics"${backgroundState}>
      <article class="hud-card timer-card">
        <h2>Shift ${escapeHTML(shift.id)} · ${escapeHTML(shift.title)}</h2>
        <div class="value"><span id="timerText">${formatDuration(remainingMs)}</span><small>${escapeHTML(resolvedThisShift)} closed / ${escapeHTML(openTicketIds.length)} open</small></div>
        <div class="progress-track" aria-hidden="true"><div id="timerBar" class="progress-fill ${timerDanger}" style="--pct:${timerPercent}%"></div></div>
        <div class="metric-caption">${escapeHTML(shift.objective)} · ${Math.round(durationMs / 60000)} min profile</div>
      </article>
      ${cards}
    </section>
  `;
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
  const tickets = filterTickets(snapshot.visibleTickets, snapshot.state, ui);
  const filterButtons = ['all', 'open', 'closed', 'severe'].map(filter => `
    <button class="chip-btn ${ui.filter === filter ? 'active' : ''}" data-action="set-filter" data-filter="${filter}" aria-pressed="${ui.filter === filter}">${filterLabel(filter)}</button>
  `).join('');

  return `
    <aside class="panel inbox-panel" aria-label="Inbox">
      <div class="panel-header stack">
        <div>
          <h2>Queue</h2>
          <p>${snapshot.visibleTickets.length} loaded · ${snapshot.openTicketIds.length} awaiting response</p>
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
  const tags = ticket.tags.slice(0, 3).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('');
  return `
    <li class="ticket-item">
      <button class="ticket-button ${active ? 'active' : ''} ${resolved ? 'resolved' : ''}" data-action="select-ticket" data-ticket-id="${escapeHTML(ticket.id)}" aria-pressed="${active}">
        <div class="ticket-meta">
          <span>${escapeHTML(ticket.received)}</span>
          <span>·</span>
          <span>${escapeHTML(ticket.mailbox)}</span>
          <span class="severity" aria-label="Severity ${ticket.severity}" title="Severity ${ticket.severity}">${'◆'.repeat(ticket.severity)}</span>
        </div>
        <div class="ticket-subject">${escapeHTML(ticket.subject)}</div>
        <div class="ticket-from">From: ${escapeHTML(ticket.from)}</div>
        <div class="small-row">${tags}</div>
        ${resolved ? `<div class="small-row">Resolved via ${escapeHTML(handled.actionLabel)}</div>` : ''}
      </button>
    </li>
  `;
}

function renderMailPanel(snapshot) {
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
      </header>
      <div class="mail-body">
        <article class="email-card">
          <div class="email-paper">
            ${body}
            <p class="signature">— Sent through NetherHelp Support Gateway</p>
          </div>
        </article>
        ${resolved ? renderResolutionBox(resolved) : ''}
      </div>
      ${resolved ? renderResolvedDock(snapshot) : renderActionDock(snapshot)}
    </section>
  `;
}

function renderResolutionBox(resolved) {
  return `
    <div class="resolution-box" style="margin: 1rem auto 0; max-width: 61rem;">
      <strong>${escapeHTML(resolved.outcomeTitle)}</strong>
      <p>${escapeHTML(resolved.outcome)}</p>
      <div class="delta-row">${renderDeltaChips(resolved.delta)}</div>
    </div>
  `;
}

function renderActionDock(snapshot) {
  if (snapshot.state.phase !== 'ticketing') {
    return `<div class="action-dock"><div class="warning-box">This shift is not currently accepting replies.</div></div>`;
  }
  if (snapshot.state.paused) {
    return `<footer class="action-dock" aria-label="Response actions"><div class="warning-box pause-message"><strong>Shift paused</strong><p>Resume the timer when you are ready to respond.</p><button class="btn primary" data-action="toggle-pause">Resume shift</button></div></footer>`;
  }
  const cards = snapshot.actionList.map((action, index) => `
    <button class="btn action-card" data-action="resolve-ticket" data-action-id="${escapeHTML(action.id)}" aria-keyshortcuts="${index + 1}">
      <strong><span>${escapeHTML(action.icon)} ${escapeHTML(action.label)}</span><span class="hotkey">${index + 1}</span></strong>
      <span>${escapeHTML(action.preview)}</span>
      <span class="metric-chip">${escapeHTML(action.tone)}</span>
      ${snapshot.state.settings.showDeltaPreview ? `<div class="delta-row">${renderDeltaChips(action.delta)}</div>` : ''}
    </button>
  `).join('');
  return `
    <footer class="action-dock" aria-label="Response actions">
      <div class="small-row" style="margin-bottom: 0.65rem;">Choose a response. All actions autosave.</div>
      <div class="action-grid">${cards}</div>
    </footer>
  `;
}

function renderResolvedDock(snapshot) {
  const open = snapshot.openTicketIds.length;
  if (snapshot.state.phase === 'ticketing' && open === 0) {
    return `
      <footer class="action-dock">
        <button class="btn primary" data-action="end-shift">End shift audit</button>
      </footer>
    `;
  }
  return `<footer class="action-dock"><div class="small-row">Ticket closed. Select another message from the queue.</div></footer>`;
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
      <section>
        <h3>Unlocked departments</h3>
        <div class="department-grid" style="margin-top: 0.55rem;">
          ${departments.map(dep => `<span class="tag" title="${escapeHTML(dep.description)}">${escapeHTML(dep.name)}</span>`).join('')}
        </div>
      </section>
      <section>
        <h3>Case flags</h3>
        <div class="flag-grid" style="margin-top: 0.55rem;">
          ${flags.length ? flags.map(([key, count]) => `<span class="tag">${escapeHTML(flagLabel(key))} ×${escapeHTML(count)}</span>`).join('') : '<span class="tag">No flags yet</span>'}
        </div>
      </section>
      <section>
        <h3>Keyboard</h3>
        <div class="kbd-grid" style="margin-top: 0.55rem;">
          <div><span>Resolve actions</span><span class="hotkey">1–8</span></div>
          <div><span>Next / previous ticket</span><span class="hotkey">J / K</span></div>
          <div><span>Search inbox</span><span class="hotkey">F</span></div>
          <div><span>Export save</span><span class="hotkey">E</span></div>
          <div><span>Settings</span><span class="hotkey">S</span></div>
        </div>
      </section>
    </div>
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
        <p id="welcomeDescription">Read each cursed request, choose a response, and keep Reputation, Sanity, and Containment above zero while Soul Risk stays below 100.</p>
        <div class="welcome-grid">
          <section class="directive-box"><h3>Your first shift</h3><p>${escapeHTML(shift.objective)}</p></section>
          <section class="directive-box"><h3>How to play</h3><p>Select a message from the queue, read it, then choose one response. Every choice changes the run and autosaves.</p></section>
        </div>
        <p class="small-row">The timer is paused while this orientation is open. Settings and save controls remain available during the run.</p>
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
        ${settingSwitch('showDeltaPreview', 'Show action impact preview', 'Shows the metric change attached to each response.', settings.showDeltaPreview)}
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
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="summaryTitle" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="summaryTitle">Shift audit: ${escapeHTML(summary.title)}</h2><p>${summary.reason === 'timeout' ? 'Time expired.' : 'Queue closed.'} The inbox updates your personnel file.</p></div></header>
        <div class="summary-grid">
          <div class="summary-card"><span>Resolved</span><b>${escapeHTML(summary.resolved)}</b></div>
          <div class="summary-card"><span>Unresolved</span><b>${escapeHTML(summary.unresolved)}</b></div>
          <div class="summary-card"><span>Ending vector</span><b>${escapeHTML(summary.endingHint)}</b></div>
          <div class="summary-card"><span>Soul risk</span><b>${escapeHTML(summary.metricsAfter.soulRisk)}</b></div>
        </div>
        ${summary.unresolved ? `<div class="warning-box" style="margin-top: 1rem;"><strong>Penalty applied</strong><div class="delta-row" style="margin-top: .5rem;">${renderDeltaChips(summary.penalty)}</div></div>` : ''}
        <footer class="inline-actions" style="justify-content: flex-end; margin-top: 1rem;">
          <button class="btn primary" data-action="advance-shift" data-modal-initial-focus data-focus-key="summary-advance">${snapshot.state.activeShiftId >= snapshot.maxShiftId ? 'Finish demo' : 'Start next shift'}</button>
        </footer>
      </section>
    </div>
  `;
}

function renderGameOverModal(snapshot) {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="gameOverTitle" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="gameOverTitle">${escapeHTML(snapshot.ending)}</h2><p>The run ends, but the inbox archives everything.</p></div></header>
        <p>${escapeHTML(snapshot.state.log[0]?.message ?? 'Your shift cannot continue.')}</p>
        <div class="summary-grid">${Object.entries(snapshot.metrics).map(([key, value]) => `<div class="summary-card"><span>${escapeHTML(METRIC_LABELS[key] ?? key)}</span><b>${escapeHTML(value)}</b></div>`).join('')}</div>
        <footer class="inline-actions modal-actions"><button class="btn" data-action="export-save" data-focus-key="gameover-export-save">Export save</button><button class="btn primary" data-action="reset-run" data-modal-initial-focus data-focus-key="gameover-new-run">New run</button></footer>
      </section>
    </div>
  `;
}

function renderDemoCompleteModal(snapshot) {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="demoTitle" data-modal-root tabindex="-1">
      <section class="modal-card">
        <header><div><h2 id="demoTitle">Demo complete: ${escapeHTML(snapshot.ending)}</h2><p>You survived the first five shifts.</p></div></header>
        <p>${escapeHTML(snapshot.state.log[0]?.message ?? 'The demo has ended.')}</p>
        <div class="summary-grid">
          <div class="summary-card"><span>Tickets resolved</span><b>${escapeHTML(Object.keys(snapshot.state.handled).length)}</b></div>
          <div class="summary-card"><span>Departments unlocked</span><b>${escapeHTML(snapshot.state.unlockedDepartments.length)}</b></div>
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

function filterTickets(tickets, state, ui) {
  const query = String(ui.query ?? '').trim().toLowerCase();
  return tickets.filter(ticket => {
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

export function phaseLabel(phase, paused = false) {
  if (paused) return 'Paused';
  return ({
    ticketing: 'On shift',
    shiftSummary: 'Shift audit',
    gameOver: 'Run ended',
    demoComplete: 'Demo complete'
  })[phase] ?? phase;
}

function filterLabel(filter) {
  return ({ all: 'All', open: 'Open', closed: 'Closed', severe: 'Severe' })[filter] ?? filter;
}

function tabLabel(tab) {
  return ({ ops: 'Ops', log: 'Audit' })[tab] ?? tab;
}

function flagLabel(key) {
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
