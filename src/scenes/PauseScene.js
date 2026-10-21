import { audio } from '../systems/Audio.js';

/**
 * PauseScene
 * Gothic translucent modal pausing GameScene, providing Resume, Restart, and Mute options.
 */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Duck BGM during pause
    audio.duckBgm(true);

    // Dark backdrop overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x080a10, 0.82);
    overlay.fillRect(0, 0, W, H);

    // Modal Card
    const cardW = 380;
    const cardH = 340;
    const card = this.add.graphics();
    card.fillStyle(0x141a23, 0.95);
    card.fillRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 12);
    card.lineStyle(1.5, 0x2a3240, 1.0);
    card.strokeRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 12);

    this.add.text(W / 2, H / 2 - 120, 'PAUSED', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '14px',
      color: '#7fd4ff',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 80, 'Catch your breath', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '44px',
      color: '#ece6d6'
    }).setOrigin(0.5);

    // Buttons
    let btnY = H / 2 - 15;

    // 1. Resume Button
    this.createButton(W / 2, btnY, 'Resume', 0x7fd4ff, 0x08131b, () => {
      this.resumeGame();
    });

    // 2. Restart Level Button
    this.createButton(W / 2, btnY + 54, 'Restart Realm', 0x242c38, '#ece6d6', () => {
      const gameScene = this.scene.get('GameScene');
      const realm = gameScene ? gameScene.currentRealm : 1;
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene', { realm });
      this.scene.stop();
    });

    // 3. Main Menu Button
    this.createButton(W / 2, btnY + 108, 'Quit to Menu', 0x242c38, '#ece6d6', () => {
      audio.stopBgm();
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('TitleScene');
      this.scene.stop();
    });

    // Keyboard resume shortcuts
    this.input.keyboard.on('keydown-P', () => this.resumeGame());
    this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
  }

  resumeGame() {
    audio.duckBgm(false);
    this.scene.resume('GameScene');
    this.scene.resume('HUDScene');
    this.scene.stop();
  }

  createButton(x, y, text, bgColor, textColor, onClick) {
    const btnW = 240;
    const btnH = 42;

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1.0);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);

    const txt = this.add.text(x, y, text, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '18px',
      color: typeof textColor === 'number' ? `#${textColor.toString(16)}` : textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x, y, btnW, btnH).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
  }
}
