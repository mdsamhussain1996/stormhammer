import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { LevelClearScene } from './scenes/LevelClearScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';

/**
 * Stormhammer Main Phaser 3 Configuration
 */
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 540,
  pixelArt: false, // High quality painted aesthetic
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 2000 },
      debug: false
    }
  },
  input: {
    gamepad: true
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    GameScene,
    HUDScene,
    PauseScene,
    LevelClearScene,
    GameOverScene,
    VictoryScene
  ]
};

// Start the game instance
const game = new Phaser.Game(config);

export default game;
