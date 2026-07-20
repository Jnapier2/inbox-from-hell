import { renderApp } from './templates.js';
import { formatDuration } from '../core/utils.js';

export class UIController {
  constructor({
    root,
    engine,
    saveManager,
    showWelcome = true
  }) {
    this.root = root;
    this.engine = engine;
    this.saveManager = saveManager;
    this.showWelcome = Boolean(showWelcome);
    this.ui = {
      query: '',
      filter: 'open',
      rightTab: 'ops',
      modal: this.showWelcome && engine.state.phase === 'ticketing' ? 'welcome' : null,
      importText: '',
      exportText: ''
    };
    this.timerHandle = null;
    this.pendingFocus = null;
    this.pendingScrollToReader = false;
    this.modalRestoreFocus = null;
    this.autoPausedForModal = false;
    this.suppressNextPauseToast = false;
  }

  start() {
    if (this.ui.modal && this.engine.state.phase === 'ticketing' && !this.engine.state.paused) {
      this.autoPausedForModal = true;
      this.engine.togglePause();
    }

    this.engine.on('stateChanged', ({ reason }) => {
      this.saveManager.save(this.engine.state);
      this.syncModalToPhase();
      this.render();
      this.toastForReason(reason);
    });

    this.root.addEventListener('click', event => this.handleClick(event));
    this.root.addEventListener('input', event => this.handleInput(event));
    this.root.addEventListener('change', event => this.handleChange(event));
    document.addEventListener('keydown', event => this.handleKeyboard(event));

    this.syncModalToPhase();
    this.render();
    this.saveManager.save(this.engine.state);
    this.timerHandle = window.setInterval(() => this.refreshClock(), 500);
  }

  render() {
    const snapshot = this.engine.getSnapshot();
    const focusSelector = this.pendingFocus ?? (this.ui.modal ? this.captureFocusSelector() : null);
    this.pendingFocus = null;
    document.documentElement.style.setProperty('--font-scale', String(snapshot.state.settings.textScale ?? 1));
    document.documentElement.classList.toggle('reduced-motion', Boolean(snapshot.state.settings.reducedMotion));
    this.root.innerHTML = renderApp(snapshot, this.ui, {
      lastSavedAt: this.saveManager.lastSavedAt,
      loadError: this.saveManager.loadError,
      saveBlocked: this.saveManager.saveBlocked,
      blockReason: this.saveManager.blockReason,
      saveError: this.saveManager.saveError,
      noSaveMode: this.saveManager.noSaveMode
    });

    const element = focusSelector
      ? this.root.querySelector(focusSelector)
      : this.ui.modal
        ? this.root.querySelector('[data-modal-initial-focus]') ?? this.root.querySelector('[data-modal-root]')
        : null;
    if (element) {
      try {
        element.focus({ preventScroll: true });
      } catch {
        element.focus();
      }
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        const length = element.value.length;
        element.setSelectionRange(length, length);
      }
    }

    if (this.pendingScrollToReader) {
      this.pendingScrollToReader = false;
      const responsive = window.matchMedia?.('(max-width: 1180px)').matches;
      if (responsive && !this.ui.modal) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            const reader = this.root.querySelector('.mail-reader');
            if (!reader) return;
            const reduceMotion = Boolean(snapshot.state.settings.reducedMotion)
              || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            const top = Math.max(0, reader.getBoundingClientRect().top + window.scrollY - 8);
            window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
          });
        });
      }
    }
  }

  refreshClock() {
    const snapshot = this.engine.getSnapshot();
    if (snapshot.state.phase === 'ticketing' && !snapshot.state.paused && snapshot.remainingMs <= 0) {
      this.engine.endShift('timeout');
      return;
    }
    const timerText = this.root.querySelector('#timerText');
    const timerBar = this.root.querySelector('#timerBar');
    if (timerText) timerText.textContent = formatDuration(snapshot.remainingMs);
    if (timerBar) {
      timerBar.style.setProperty('--pct', `${snapshot.timerPercent}%`);
      timerBar.classList.toggle('bad', snapshot.timerPercent < 22);
      timerBar.classList.toggle('info', snapshot.timerPercent >= 22);
    }
  }

  handleClick(event) {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;
    const action = trigger.dataset.action;

    switch (action) {
      case 'select-ticket':
        this.pendingFocus = '#mailSubject';
        this.pendingScrollToReader = true;
        this.engine.selectTicket(trigger.dataset.ticketId);
        break;
      case 'resolve-ticket':
        if (this.ui.modal || this.engine.state.paused) return;
        this.pendingFocus = '#mailSubject';
        this.pendingScrollToReader = true;
        this.engine.resolveSelectedTicket(trigger.dataset.actionId);
        break;
      case 'set-filter':
        this.ui.filter = trigger.dataset.filter ?? 'open';
        this.pendingFocus = `[data-action="set-filter"][data-filter="${escapeSelectorValue(this.ui.filter)}"]`;
        this.render();
        break;
      case 'clear-search':
        this.ui.query = '';
        this.pendingFocus = '#searchBox';
        this.render();
        break;
      case 'set-right-tab':
        this.ui.rightTab = trigger.dataset.tab ?? 'ops';
        this.pendingFocus = `[data-action="set-right-tab"][data-tab="${escapeSelectorValue(this.ui.rightTab)}"]`;
        this.render();
        break;
      case 'open-modal':
        this.openModal(trigger.dataset.modal ?? null);
        break;
      case 'close-modal':
        this.closeModal();
        break;
      case 'start-game':
        this.closeModal({ force: true });
        break;
      case 'toggle-pause':
        if (this.ui.modal) return;
        this.engine.togglePause();
        break;
      case 'end-shift':
        if (this.ui.modal || this.engine.state.paused) return;
        this.engine.endShift('cleared');
        break;
      case 'advance-shift':
        this.ui.modal = null;
        this.autoPausedForModal = false;
        this.modalRestoreFocus = null;
        this.pendingFocus = '.ticket-button';
        this.engine.advanceShift();
        break;
      case 'export-save':
        this.exportSave();
        break;
      case 'import-save':
        this.ui.importText = '';
        this.openModal('import');
        break;
      case 'confirm-import':
        this.importSave();
        break;
      case 'reset-run':
        this.resetRun();
        break;
      default:
        break;
    }
  }

  handleInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    const action = target.dataset.action;
    if (action === 'search') {
      this.ui.query = target.value;
      this.pendingFocus = '#searchBox';
      this.render();
    }
    if (action === 'import-text') {
      this.ui.importText = target.value;
    }
  }

  handleChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    const action = target.dataset.action;
    if (action === 'toggle-setting') {
      this.engine.updateSetting(target.dataset.setting, target.checked);
    }
    if (action === 'set-text-scale') {
      this.engine.updateSetting('textScale', Number(target.value));
    }
  }

  handleKeyboard(event) {
    if (event.defaultPrevented) return;

    if (this.ui.modal) {
      if (event.key === 'Tab') {
        this.trapModalFocus(event);
      } else if (event.key === 'Escape' && ['settings', 'import', 'export'].includes(this.ui.modal)) {
        event.preventDefault();
        this.closeModal();
      }
      return;
    }

    const active = document.activeElement;
    const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
    if (typing) return;

    if (active?.matches?.('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      this.moveTabFocus(active, event.key);
      return;
    }

    if (event.key >= '1' && event.key <= '8') {
      if (this.engine.state.paused) return;
      const index = Number(event.key) - 1;
      const action = this.engine.getSnapshot().actionList[index];
      if (action) {
        event.preventDefault();
        this.engine.resolveSelectedTicket(action.id);
      }
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'j') {
      event.preventDefault();
      this.pendingFocus = '#mailSubject';
      this.pendingScrollToReader = true;
      this.engine.selectRelativeTicket(1);
    } else if (key === 'k') {
      event.preventDefault();
      this.pendingFocus = '#mailSubject';
      this.pendingScrollToReader = true;
      this.engine.selectRelativeTicket(-1);
    } else if (key === 'f') {
      event.preventDefault();
      this.pendingFocus = '#searchBox';
      this.render();
    } else if (key === 'e') {
      event.preventDefault();
      this.exportSave();
    } else if (key === 's') {
      event.preventDefault();
      this.openModal('settings');
    }
  }

  openModal(modal) {
    if (!modal) return;
    this.modalRestoreFocus = this.captureFocusSelector();
    this.ui.modal = modal;
    this.pendingFocus = '[data-modal-initial-focus]';

    if (this.engine.state.phase === 'ticketing' && !this.engine.state.paused) {
      this.autoPausedForModal = true;
      this.suppressNextPauseToast = true;
      this.engine.togglePause();
      return;
    }

    this.autoPausedForModal = false;
    this.render();
  }

  closeModal({ force = false } = {}) {
    if (!this.ui.modal) return;
    if (!force && !['settings', 'import', 'export'].includes(this.ui.modal)) return;

    const restoreSelector = this.modalRestoreFocus;
    const shouldResume = this.autoPausedForModal
      && this.engine.state.phase === 'ticketing'
      && this.engine.state.paused;

    this.ui.modal = null;
    this.autoPausedForModal = false;
    this.modalRestoreFocus = null;
    this.syncModalToPhase();
    this.pendingFocus = restoreSelector ?? (this.ui.modal ? '[data-modal-initial-focus]' : null);

    if (shouldResume && !this.ui.modal) {
      this.suppressNextPauseToast = true;
      this.engine.togglePause();
      return;
    }

    this.render();
  }

  captureFocusSelector() {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !this.root.contains(active)) return null;
    if (active.dataset.focusKey) {
      return `[data-focus-key="${escapeSelectorValue(active.dataset.focusKey)}"]`;
    }
    if (active.id) return `#${escapeSelectorValue(active.id)}`;
    if (!active.dataset.action) return null;

    const attributes = ['action', 'modal', 'ticketId', 'actionId', 'filter', 'tab', 'setting'];
    return attributes
      .filter(key => active.dataset[key])
      .map(key => `[data-${camelToKebab(key)}="${escapeSelectorValue(active.dataset[key])}"]`)
      .join('');
  }

  trapModalFocus(event) {
    const modal = this.root.querySelector('[data-modal-root]');
    if (!modal) return;
    const focusable = [...modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter(element => element.getClientRects().length > 0);

    event.preventDefault();
    if (focusable.length === 0) {
      modal.focus();
      return;
    }

    const currentIndex = focusable.indexOf(document.activeElement);
    let nextIndex;
    if (event.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex < 0 || currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
    }
    focusable[nextIndex].focus();
  }

  moveTabFocus(activeTab, key) {
    const tablist = activeTab.closest('[role="tablist"]');
    const tabs = [...(tablist?.querySelectorAll('[role="tab"]') ?? [])];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < 0 || tabs.length === 0) return;
    const nextIndex = key === 'Home'
      ? 0
      : key === 'End'
        ? tabs.length - 1
        : (currentIndex + (key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex].click();
  }

  exportSave() {
    const text = this.saveManager.export(this.engine.state);
    this.ui.exportText = text;
    this.openModal('export');

    downloadTextFile({
      text,
      filename: `inbox-from-hell-save-${this.engine.state.runId}.json`,
      type: 'application/json'
    });

    this.showToast('Save exported', 'The JSON save is ready for upgrade testing or bug reports.');
  }

  importSave() {
    try {
      const replaceBlocked = this.saveManager.saveBlocked;
      if (replaceBlocked) {
        const confirmed = window.confirm('A stored save is being protected because it is newer, corrupt, or changed in another tab. Replace that preserved save with this import?');
        if (!confirmed) return;
      }
      const imported = this.saveManager.import(this.ui.importText, { replaceBlocked });
      this.ui.modal = null;
      this.autoPausedForModal = false;
      this.modalRestoreFocus = null;
      this.engine.importState(imported);
      this.ui.importText = '';
      this.syncModalToPhase();
      this.render();
      const persisted = !this.saveManager.saveBlocked && !this.saveManager.saveError && !this.saveManager.noSaveMode;
      this.showToast(
        persisted ? 'Save imported' : 'Save loaded for this tab',
        persisted ? 'Imported state loaded and saved successfully.' : 'The imported state is playable, but browser storage is unavailable. Export it before closing.'
      );
    } catch (error) {
      this.showToast('Import failed', error.message || 'Invalid save JSON.');
    }
  }

  resetRun() {
    const confirmed = window.confirm('Reset this run and clear local progress?');
    if (!confirmed) return;
    const cleared = this.saveManager.clear();
    this.ui.modal = null;
    this.ui.query = '';
    this.ui.filter = 'open';
    this.ui.rightTab = 'ops';
    this.autoPausedForModal = false;
    this.modalRestoreFocus = null;
    if (this.showWelcome) {
      this.ui.modal = 'welcome';
      this.autoPausedForModal = true;
      this.pendingFocus = '[data-modal-initial-focus]';
    }
    this.engine.reset();
    if (this.showWelcome && !this.engine.state.paused) {
      this.suppressNextPauseToast = true;
      this.engine.togglePause();
    }
    this.showToast(
      'Run reset',
      cleared ? 'A fresh shift has been loaded.' : 'A fresh shift is loaded for this tab, but stored progress could not be cleared.'
    );
  }

  syncModalToPhase() {
    const phase = this.engine.state.phase;
    if (phase === 'shiftSummary') this.ui.modal = 'summary';
    if (phase === 'gameOver') this.ui.modal = 'gameOver';
    if (phase === 'demoComplete') this.ui.modal = 'demoComplete';
  }

  toastForReason(reason) {
    if (reason === 'pause' && this.suppressNextPauseToast) {
      this.suppressNextPauseToast = false;
      return;
    }
    const messages = {
      'resolve-ticket': ['Ticket resolved', 'Consequences have been added to the audit log.'],
      'advance-shift': ['New shift', 'Fresh tickets loaded. Previous choices may follow.'],
      'end-shift': ['Shift audit ready', 'Review outcomes before advancing.'],
      pause: [this.engine.state.paused ? 'Paused' : 'Resumed', this.engine.state.paused ? 'The timer is stopped.' : 'The timer is moving again.']
    };
    if (!messages[reason]) return;
    this.showToast(messages[reason][0], messages[reason][1]);
  }

  showToast(title, message) {
    const stack = this.root.querySelector('#toastStack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<strong>${escapeForToast(title)}</strong><p>${escapeForToast(message)}</p>`;
    stack.append(toast);
    window.setTimeout(() => toast.remove(), 3800);
  }
}

function escapeForToast(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeSelectorValue(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"');
}

function camelToKebab(value) {
  return String(value).replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function downloadTextFile({ text, filename, type = 'text/plain' }) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
