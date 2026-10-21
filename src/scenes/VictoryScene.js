import { audio } from '../systems/Audio.js';

/**
 * VictoryScene
 * Triumphant end game screen after beating all three realms.
 */
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  init(data) {
    this.coins = data.coins || 0;
    this.kills = data.kills || 0;
    this.score = data.score || 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    audio.playSfx('power');

    // Regal dark backdrop with warm sun glow
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0e14, 0.95);
    bg.fillRect(0, 0, W, H);

    // Glowing victory card
    const cardW = 520;
    const cardH = 380;
    const card = this.add.graphics();
    card.fillStyle(0x141b24, 0.95);
    card.fillRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 12);
    card.lineStyle(2, 0xf2c14e, 0.8);
    card.strokeRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 12);

    this.add.text(W / 2, H / 2 - 140, 'ALL THREE REALMS BREACHED', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '14px',
      color: '#f2c14e',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5);

    const title = this.add.text(W / 2, H / 2 - 96, 'STORMBRINGER', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '62px',
      color: '#ece6d6',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: 1.05,
      yoyo: true,
      repeat: -1,
      duration: 1500
    });

    this.add.text(W / 2, H / 2 - 38, 'Every gate is broken. The thunder hammer returns to your hand one last time.', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '16px',
      color: '#cfd5de',
      align: 'center'
    }).setOrigin(0.5);

    // Stats
    const statsY = H / 2 + 25;
    const stats = [
      { label: 'COINS', val: this.coins, color: '#f2c14e' },
      { label: 'FOES DEFEATED', val: this.kills, color: '#ff5a6a' },
      { label: 'FINAL SCORE', val: this.score, color: '#7fd4ff' }
    ];

    stats.forEach((s, idx) => {
      const x = W / 2 - 160 + idx * 160;

      this.add.text(x, statsY - 14, String(s.val), {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '38px',
        color: s.color,
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(x, statsY + 20, s.label, {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '12px',
        color: '#98a0ae',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    });

    // Play Again button
    const btnW = 220;
    const btnH = 46;
    const btnY = H / 2 + 115;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7fd4ff, 1.0);
    btnBg.fillRoundedRect(W / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    this.add.text(W / 2, btnY, 'Play Again', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '20px',
      color: '#08131b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const hit = this.add.rectangle(W / 2, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      audio.stopBgm();
      this.scene.start('TitleScene');
    });

    this.input.keyboard.on('keydown-ENTER', () => hit.emit('pointerdown'));
    this.input.keyboard.on('keydown-SPACE', () => hit.emit('pointerdown'));
  }
}
