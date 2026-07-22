// Copyright © 2026 Gateway Information Group LLC. All rights reserved.
// Public storefront entry: player-facing runtime only.
import { GameEngine } from './core/GameEngine.js';
import { SaveManager } from './core/SaveManager.js';
import { UIController } from './ui/UIController.js';

const root = document.querySelector('#app');
const saveManager = new SaveManager();
const engine = new GameEngine();
const saved = saveManager.load();

if (saved) engine.hydrate(saved);

const ui = new UIController({
  root,
  engine,
  saveManager,
  showWelcome: !saved
});
ui.start();

window.InboxFromHell = {
  engine,
  saveManager,
  version: engine.getSnapshot().appVersion,
  exportSave: () => saveManager.export(engine.state),
  reset: () => {
    saveManager.clear();
    engine.reset();
  }
};
