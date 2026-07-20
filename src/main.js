// Copyright © 2026 Gateway Information Group LLC. All rights reserved.
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
