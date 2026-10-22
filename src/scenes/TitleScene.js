import { audio } from '../systems/Audio.js';
import { SaveSystem } from '../systems/Save.js';

/**
 * TitleScene
 * Atmospheric main menu with animated realm preview, controls legend, power-up chips,
 * and Begin / Continue options.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background preview (Forest)
    this.add.image(0, 0, 'bg_sky_forest').setOrigin(0, 0).setDisplaySize(W, H);
    this.bgL1 = this.add.tileSprite(0, 0, W * 2, H, 'bg_l1_forest').setOrigin(0, 0);
    this.bgL2 = this.add.tileSprite(0, 0, W * 2, H, 'bg_l2_forest').setOrigin(0, 0);

    // Dark vignette overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x090c10, 0.72);
    overlay.fillRect(0, 0, W, H);

    // Title Card
    this.add.text(W / 2, 60, 'THREE REALMS · THREE HIDDEN KEYS', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '14px',
      color: '#7fd4ff',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5);

    const title = this.add.text(W / 2, 108, 'STORMHAMMER', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '68px',
      color: '#ece6d6',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: 1.03,
      yoyo: true,
      repeat: -1,
      duration: 1800,
      ease: 'Sine.easeInOut'
    });

    this.add.text(W / 2, 150, 'Each realm hides its key inside one crate. Smash crates for power, defeat foes, and breach the gate.', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '15px',
      color: '#cfd5de',
      align: 'center'
    }).setOrigin(0.5);

    // --- Controls Box ---
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const boxH = isTouchDevice ? 136 : 110;

    const ctrlBg = this.add.graphics();
    ctrlBg.fillStyle(0x141a24, 0.8);
    ctrlBg.fillRoundedRect(W / 2 - 270, 178, 540, boxH, 8);
    ctrlBg.lineStyle(1.5, 0x2a3342, 0.8);
    ctrlBg.strokeRoundedRect(W / 2 - 270, 178, 540, boxH, 8);

    const controls = [
      ['Move', '← → / A D'],
      ['Jump', '↑ / W / Space'],
      ['Swing Hammer', 'J / Z'],
      ['Throw Hammer', 'K / X'],
      ['Drop through planks', '↓ + Jump'],
      ['Pause', 'P / Esc']
    ];

    controls.forEach(([action, key], idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = W / 2 - 250 + col * 260;
      const y = 196 + row * 28;

      this.add.text(x, y, action, {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '14px',
        color: '#98a0ae'
      });

      this.add.text(x + 230, y, key, {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '14px',
        color: '#ece6d6',
        fontStyle: 'bold'
      }).setOrigin(1, 0);
    });

    if (isTouchDevice) {
      this.add.text(W / 2, 297, 'Touch: ◀ ▶ move · ▼ slam · ▲ jump · ⚔ swing · 🔨 throw · ⚡ thunder · ‖ pause', {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '13px',
        color: '#7fd4ff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    // --- Power-ups Legend Chips ---
    const chipsY = isTouchDevice ? 332 : 308;
    const chips = [
      { color: 0xff5a6a, label: 'Heart' },
      { color: 0x7fd4ff, label: 'Storm · chain lightning' },
      { color: 0xffffff, label: 'Wing Boots · double jump' },
      { color: 0x9ef0e0, label: 'Aegis · 8s shield' }
    ];

    let chipX = W / 2 - 240;
    chips.forEach(chip => {
      const dot = this.add.circle(chipX, chipsY, 4, chip.color);
      const txt = this.add.text(chipX + 10, chipsY, chip.label, {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '13px',
        color: '#cfd5de'
      }).setOrigin(0, 0.5);
      chipX += txt.width + 28;
    });

    // --- Action Buttons ---
    const highestRealm = SaveSystem.getHighestRealm();
    const btnY = isTouchDevice ? 384 : 370;

    if (highestRealm > 1) {
      // Continue Button
      this.createMenuButton(W / 2 - 110, btnY, `Continue (Realm ${highestRealm})`, () => {
        audio.playSfx('catch');
        this.scene.start('GameScene', { realm: highestRealm });
      });

      // New Game Button
      this.createMenuButton(W / 2 + 110, btnY, 'New Game', () => {
        audio.playSfx('catch');
        this.scene.start('GameScene', { realm: 1 });
      });
    } else {
      // Begin Button
      this.createMenuButton(W / 2, btnY, 'Begin Journey', () => {
        audio.playSfx('catch');
        this.scene.start('GameScene', { realm: 1 });
      });
    }

    // Portfolio Link Button
    const portBtn = this.add.text(W / 2, isTouchDevice ? 434 : 420, '🌐 Creator Portfolio: mdsamhussain1996.github.io', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '15px',
      color: '#7fd4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    portBtn.on('pointerover', () => portBtn.setColor('#ffffff'));
    portBtn.on('pointerout', () => portBtn.setColor('#7fd4ff'));
    portBtn.on('pointerdown', () => {
      window.open('https://mdsamhussain1996.github.io/', '_blank');
    });

    // Play subtle forest BGM
    audio.playThemeBgm('forest');

    // Enter key shortcut
    this.input.keyboard.on('keydown-ENTER', () => {
      audio.playSfx('catch');
      this.scene.start('GameScene', { realm: 1 });
    });
  }

  createMenuButton(x, y, text, onClick) {
    const btnW = 200;
    const btnH = 46;

    const bg = this.add.graphics();
    bg.fillStyle(0x7fd4ff, 1.0);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);

    const txt = this.add.text(x, y, text, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '20px',
      color: '#08131b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xacf0ff, 1.0);
      bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x7fd4ff, 1.0);
      bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
    });

    hitArea.on('pointerdown', onClick);
  }

  update(time, delta) {
    if (this.bgL1) this.bgL1.tilePositionX += 0.2;
    if (this.bgL2) this.bgL2.tilePositionX += 0.5;
  }
}
