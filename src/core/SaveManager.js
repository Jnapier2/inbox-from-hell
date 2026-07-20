export const CURRENT_SAVE_SCHEMA = 1;

const migrations = new Map([
  [1, save => save]
]);

export class UnsupportedSaveSchemaError extends Error {
  constructor(schema, currentSchema = CURRENT_SAVE_SCHEMA) {
    super(`Save schema ${schema} is newer than this build supports (${currentSchema}). Export or back up the save, then open it with a newer compatible build.`);
    this.name = 'UnsupportedSaveSchemaError';
    this.schema = schema;
    this.currentSchema = currentSchema;
  }
}

export function acquireLocalStorage() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return { storage: null, error: 'Local storage is unavailable in this browser context.' };
    return { storage, error: null };
  } catch (error) {
    return {
      storage: null,
      error: `Local storage is unavailable: ${error?.message || String(error)}`
    };
  }
}

export function migrateSave(rawSave) {
  if (!isRecord(rawSave)) return null;
  let save = structuredCloneSafe(rawSave);
  let schema = Number(save.saveSchema ?? 0);

  if (!Number.isInteger(schema) || schema < 0) {
    throw new Error(`Invalid save schema: ${save.saveSchema}`);
  }
  if (schema > CURRENT_SAVE_SCHEMA) {
    throw new UnsupportedSaveSchemaError(schema);
  }
  if (schema === CURRENT_SAVE_SCHEMA) {
    assertCompatibleSaveShape(save);
    return save;
  }
  while (schema < CURRENT_SAVE_SCHEMA) {
    const nextSchema = schema + 1;
    const migrate = migrations.get(nextSchema);
    if (!migrate) throw new Error(`No migration registered for save schema ${nextSchema}.`);
    save = migrate(save);
    save.saveSchema = nextSchema;
    schema = nextSchema;
  }
  assertCompatibleSaveShape(save);
  return save;
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export class SaveManager {
  constructor({ storageKey = 'inbox-from-hell.save.v1', storage } = {}) {
    const acquired = storage === undefined
      ? acquireLocalStorage()
      : { storage: storage ?? null, error: storage ? null : 'Local storage was not provided.' };

    this.storageKey = storageKey;
    this.storage = acquired.storage;
    this.storageAvailable = Boolean(this.storage);
    this.noSaveMode = !this.storage;
    this.lastSavedAt = null;
    this.loadError = null;
    this.saveError = acquired.error;
    this.saveBlocked = false;
    this.blockReason = null;
    this.recoveryRaw = null;
    this.expectedRevision = null;
    this.overwriteAuthorized = false;
  }

  load() {
    this.loadError = null;
    this.saveBlocked = false;
    this.blockReason = null;
    this.recoveryRaw = null;
    this.overwriteAuthorized = false;

    if (!this.storage) {
      this.noSaveMode = true;
      this.saveError ||= 'Autosave is unavailable because local storage could not be opened.';
      return null;
    }

    let raw = null;
    let readSucceeded = false;
    try {
      raw = this.storage.getItem(this.storageKey);
      readSucceeded = true;
      if (!raw) {
        this.expectedRevision = 0;
        this.lastSavedAt = null;
        this.saveError = null;
        this.noSaveMode = false;
        return null;
      }

      const parsed = JSON.parse(raw);
      const migrated = migrateSave(parsed);
      if (!migrated) throw new Error('Stored save did not contain a valid save object.');
      this.expectedRevision = readRevision(migrated);
      this.lastSavedAt = typeof migrated.updatedAt === 'string' ? migrated.updatedAt : null;
      this.saveError = null;
      this.noSaveMode = false;
      return migrated;
    } catch (error) {
      if (!readSucceeded) return this.enterNoSaveMode(error, { loading: true });
      return this.blockLoadedRaw(raw, error);
    }
  }

  save(state) {
    if (!this.storage) {
      this.noSaveMode = true;
      this.saveError ||= 'Autosave is unavailable because local storage could not be opened.';
      return false;
    }
    const overwriteAuthorized = this.overwriteAuthorized;
    // Replacement approval is single-use even if storage throws. Keeping this
    // flag alive after a failed write could allow a later stale tab overwrite.
    this.overwriteAuthorized = false;
    if (this.saveBlocked && !overwriteAuthorized) return false;

    let currentRaw = null;
    try {
      currentRaw = this.storage.getItem(this.storageKey);
      const currentRevision = overwriteAuthorized
        ? readRevisionBestEffort(currentRaw)
        : this.verifyCurrentRevision(currentRaw);
      const nextRevision = Math.max(currentRevision, this.expectedRevision ?? 0) + 1;
      const stampedState = {
        ...state,
        saveSchema: CURRENT_SAVE_SCHEMA,
        saveRevision: nextRevision,
        updatedAt: new Date().toISOString()
      };

      this.storage.setItem(this.storageKey, JSON.stringify(stampedState));
      this.expectedRevision = nextRevision;
      this.lastSavedAt = stampedState.updatedAt;
      this.loadError = null;
      this.saveError = null;
      this.saveBlocked = false;
      this.blockReason = null;
      this.recoveryRaw = null;
      this.storageAvailable = true;
      this.noSaveMode = false;
      return true;
    } catch (error) {
      if (overwriteAuthorized) {
        this.saveBlocked = true;
        this.recoveryRaw = currentRaw;
        this.blockReason = `Confirmed replacement failed and the stored save remains protected: ${error?.message || String(error)}`;
      }
      if (error instanceof SaveConflictError || error instanceof UnsupportedSaveSchemaError || error instanceof StoredSaveError) {
        this.saveBlocked = true;
        this.blockReason = error.message;
      }
      this.saveError = error?.message || String(error);
      this.noSaveMode = true;
      this.storageAvailable = false;
      console.warn('[SaveManager] Failed to save:', error);
      return false;
    }
  }

  clear() {
    if (!this.storage) {
      this.noSaveMode = true;
      this.saveError ||= 'Local progress could not be cleared because local storage is unavailable.';
      return false;
    }

    try {
      this.storage.removeItem(this.storageKey);
      this.lastSavedAt = null;
      this.loadError = null;
      this.saveError = null;
      this.saveBlocked = false;
      this.blockReason = null;
      this.recoveryRaw = null;
      this.expectedRevision = 0;
      this.overwriteAuthorized = false;
      this.storageAvailable = true;
      this.noSaveMode = false;
      return true;
    } catch (error) {
      this.saveError = error?.message || String(error);
      this.noSaveMode = true;
      console.warn('[SaveManager] Failed to clear save:', error);
      return false;
    }
  }

  export(state) {
    return JSON.stringify({
      ...state,
      saveSchema: CURRENT_SAVE_SCHEMA,
      saveRevision: Math.max(readRevision(state), this.expectedRevision ?? 0)
    }, null, 2);
  }

  import(jsonText, { replaceBlocked = false } = {}) {
    const parsed = JSON.parse(jsonText);
    const migrated = migrateSave(parsed);
    if (!migrated) throw new Error('Import did not contain a valid save object.');

    if (this.saveBlocked && !replaceBlocked) {
      throw new Error('A stored save is being protected. Confirm replacement before importing over it.');
    }

    // A confirmed replacement authorizes exactly one write so a compatible
    // import can replace a corrupt, stale, or newer preserved save.
    this.overwriteAuthorized = Boolean(replaceBlocked);
    this.saveBlocked = false;
    this.blockReason = null;
    this.loadError = null;
    this.saveError = null;
    return migrated;
  }

  getRecoveryRaw() {
    return this.recoveryRaw;
  }

  verifyCurrentRevision(raw) {
    if (!raw) {
      const expected = this.expectedRevision ?? 0;
      if (expected !== 0) {
        throw new SaveConflictError(expected, 0);
      }
      this.expectedRevision = 0;
      return 0;
    }

    let persisted;
    try {
      persisted = migrateSave(JSON.parse(raw));
      if (!persisted) throw new Error('Stored save did not contain a valid save object.');
    } catch (error) {
      this.recoveryRaw = raw;
      if (error instanceof UnsupportedSaveSchemaError) throw error;
      throw new StoredSaveError(error?.message || String(error));
    }

    const currentRevision = readRevision(persisted);
    if (this.expectedRevision === null) {
      this.recoveryRaw = raw;
      throw new SaveConflictError(null, currentRevision);
    }
    if (currentRevision !== this.expectedRevision) {
      this.recoveryRaw = raw;
      throw new SaveConflictError(this.expectedRevision, currentRevision);
    }
    return currentRevision;
  }

  blockLoadedRaw(raw, error) {
    const message = error?.message || String(error);
    this.loadError = message;
    this.saveError = message;
    this.saveBlocked = true;
    this.blockReason = message;
    this.recoveryRaw = raw;
    this.expectedRevision = readRevisionBestEffort(raw);

    if (error instanceof UnsupportedSaveSchemaError) {
      console.warn('[SaveManager] Refusing to overwrite newer save schema:', error);
    } else {
      console.warn('[SaveManager] Failed to load save; preserving raw data:', error);
    }
    return null;
  }

  enterNoSaveMode(error, { loading = false } = {}) {
    const message = error?.message || String(error);
    this.storageAvailable = false;
    this.noSaveMode = true;
    this.saveBlocked = false;
    this.blockReason = null;
    this.recoveryRaw = null;
    this.expectedRevision = null;
    this.saveError = message;
    if (loading) this.loadError = message;
    console.warn('[SaveManager] Local storage is unavailable:', error);
    return null;
  }
}

class SaveConflictError extends Error {
  constructor(expectedRevision, actualRevision) {
    const expected = expectedRevision === null ? 'not loaded' : expectedRevision;
    super(`Save conflict: expected revision ${expected}, but storage contains revision ${actualRevision}. Another tab or process may have newer progress.`);
    this.name = 'SaveConflictError';
    this.expectedRevision = expectedRevision;
    this.actualRevision = actualRevision;
  }
}

class StoredSaveError extends Error {
  constructor(message) {
    super(`Stored save cannot be safely overwritten: ${message}`);
    this.name = 'StoredSaveError';
  }
}

function readRevision(save) {
  const value = Number(save?.saveRevision ?? 0);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function readRevisionBestEffort(raw) {
  if (!raw) return 0;
  try {
    return readRevision(JSON.parse(raw));
  } catch {
    return 0;
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertCompatibleSaveShape(save) {
  const missing = [];
  if (typeof save.runId !== 'string' || !save.runId.trim()) missing.push('runId');
  if (!Number.isInteger(Number(save.activeShiftId))) missing.push('activeShiftId');
  if (typeof save.phase !== 'string' || !save.phase) missing.push('phase');
  if (!Array.isArray(save.queue)) missing.push('queue');
  if (!isRecord(save.handled)) missing.push('handled');
  if (!isRecord(save.metrics)) missing.push('metrics');
  if (missing.length > 0) {
    throw new Error(`Invalid save data: missing or malformed ${missing.join(', ')}.`);
  }
}
