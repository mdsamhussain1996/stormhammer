import { audio } from '../systems/Audio.js';

/**
 * HUDScene — High Polish Gothic / Norse HUD
 * Displays Hearts, Coins, Score, Pulsing Key Slot, Power-up countdown bars,
 * Realm progress bar, Toasts, and interactive Pause/Sound buttons.
 */
export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    const W = this.scale.width;

    // --- Top-Left Container (Hearts, Coins, Score, Key Slot) ---
    this.panelBg = this.add.graphics();
    this.panelBg.fillStyle(0x0e131b, 0.75);
    this.panelBg.fillRoundedRect(16, 14, 270, 76, 10);
    this.panelBg.lineStyle(1.5, 0x2a3342, 0.8);
    this.panelBg.strokeRoundedRect(16, 14, 270, 76, 10);

    // Hearts (5)
    this.heartSprites = [];
    for (let i = 0; i < 5; i++) {
      const h = this.add.image(38 + i * 26, 34, 'pickup_heart').setScale(1.1);
      this.heartSprites.push(h);
    }

    // Coins & Score
    this.coinIcon = this.add.image(36, 68, 'pickup_coin').setScale(0.9);
    this.coinsText = this.add.text(52, 68, '00', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '20px',
      color: '#f2c14e',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.scoreLabel = this.add.text(100, 68, 'SCORE', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '13px',
      color: '#98a0ae',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(146, 68, '0', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '20px',
      color: '#ece6d6',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Key Slot (pulses when near key crate)
    this.keySlotBg = this.add.rectangle(254, 52, 38, 52, 0x141a24, 0.6)
      .setStrokeStyle(1.5, 0x4a5568, 0.8);

    this.keyIcon = this.add.image(254, 52, 'pickup_key')
      .setScale(1.1)
      .setAlpha(0.25);

    // --- Active Power-Up Badges ---
    this.powerContainer = this.add.container(300, 14);

    // Storm Badge
    this.stormBadge = this.createPowerBadge(0, 'pickup_storm', 0x7fd4ff);
    // Aegis Badge
    this.aegisBadge = this.createPowerBadge(54, 'pickup_shield', 0x9ef0e0);
    // Wings Badge
    this.wingsBadge = this.createPowerBadge(108, 'pickup_wings', 0xffffff, false);

    this.powerContainer.add([this.stormBadge.container, this.aegisBadge.container, this.wingsBadge.container]);

    // --- Top-Right Panel (Realm Name & Progress) ---
    this.realmText = this.add.text(W - 140, 24, '', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '28px',
      color: '#ece6d6'
    }).setOrigin(1, 0.5);

    this.realmSub = this.add.text(W - 140, 48, '', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '13px',
      color: '#98a0ae',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    // Gate Progress Bar
    this.progressBg = this.add.rectangle(W - 250, 68, 110, 4, 0x2a3342).setOrigin(0, 0.5);
    this.progressBar = this.add.rectangle(W - 250, 68, 0, 4, 0x7fd4ff).setOrigin(0, 0.5);
    this.gateMarker = this.add.rectangle(W - 140, 68, 4, 12, 0xf2c14e).setOrigin(0.5, 0.5);

    // --- Top-Right Action Buttons (Sound & Pause) ---
    this.soundBtn = this.createButton(W - 110, 36, audio.isMuted() ? '🔇' : '🔊', () => {
      const isMuted = audio.toggleMute();
      this.soundBtnText.setText(isMuted ? '🔇' : '🔊');
    });

    this.pauseBtn = this.createButton(W - 50, 36, '⏸', () => {
      this.scene.launch('PauseScene');
      this.scene.pause('GameScene');
      this.scene.pause();
    });

    // --- Center Toast Banner ---
    this.toastContainer = this.add.container(W / 2, 100).setAlpha(0);
    this.toastBg = this.add.graphics();
    this.toastText = this.add.text(0, 0, '', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '18px',
      color: '#ece6d6',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.toastContainer.add([this.toastBg, this.toastText]);
  }

  createPowerBadge(x, iconKey, barColor, hasBar = true) {
    const container = this.add.container(x, 0).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e131b, 0.75);
    bg.fillRoundedRect(0, 0, 46, 76, 10);
    bg.lineStyle(1.5, 0x2a3342, 0.8);
    bg.strokeRoundedRect(0, 0, 46, 76, 10);

    const icon = this.add.image(23, 34, iconKey).setScale(1.1);

    let barBg = null;
    let bar = null;
    if (hasBar) {
      barBg = this.add.rectangle(8, 64, 30, 4, 0x2a3342).setOrigin(0, 0.5);
      bar = this.add.rectangle(8, 64, 30, 4, barColor).setOrigin(0, 0.5);
      container.add([bg, icon, barBg, bar]);
    } else {
      container.add([bg, icon]);
    }

    return { container, icon, bar, hasBar };
  }

  createButton(x, y, label, onClick) {
    const bg = this.add.circle(x, y, 20, 0x141a24, 0.75)
      .setStrokeStyle(1.5, 0x2a3342, 0.8)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: '18px'
    }).setOrigin(0.5);

    if (label.includes('🔊') || label.includes('🔇')) {
      this.soundBtnText = txt;
    }

    bg.on('pointerover', () => bg.setStrokeStyle(1.5, 0x7fd4ff, 1.0));
    bg.on('pointerout', () => bg.setStrokeStyle(1.5, 0x2a3342, 0.8));
    bg.on('pointerdown', onClick);

    return bg;
  }

  pulseKeySlot() {
    if (this.keySlotPulseTween && this.keySlotPulseTween.isPlaying()) return;

    this.keySlotPulseTween = this.tweens.add({
      targets: this.keySlotBg,
      scale: 1.15,
      yoyo: true,
      duration: 300,
      ease: 'Sine.easeInOut'
    });
  }

  showToast(msg, duration = 2400) {
    if (this.toastHideTimer) this.toastHideTimer.remove();

    this.toastText.setText(msg);
    const textW = this.toastText.width + 44;

    this.toastBg.clear();
    this.toastBg.fillStyle(0x0e131b, 0.88);
    this.toastBg.fillRoundedRect(-textW / 2, -18, textW, 36, 18);
    this.toastBg.lineStyle(1.5, 0x7fd4ff, 0.7);
    this.toastBg.strokeRoundedRect(-textW / 2, -18, textW, 36, 18);

    this.tweens.add({
      targets: this.toastContainer,
      alpha: 1,
      y: 110,
      duration: 250,
      ease: 'Power2'
    });

    this.toastHideTimer = this.time.delayedCall(duration, () => {
      this.tweens.add({
        targets: this.toastContainer,
        alpha: 0,
        y: 100,
        duration: 350,
        ease: 'Power2'
      });
    });
  }

  update(time, delta) {
    const game = this.gameScene;
    if (!game || !game.hero) return;
    const hero = game.hero;

    // Hearts
    for (let i = 0; i < 5; i++) {
      this.heartSprites[i].setAlpha(i < hero.hp ? 1.0 : 0.2);
    }

    // Coins & Score
    this.coinsText.setText(String(hero.coins).padStart(2, '0'));
    this.scoreText.setText(String(hero.score));

    // Key Slot
    if (hero.hasKey) {
      this.keyIcon.setAlpha(1.0);
      this.keySlotBg.setStrokeStyle(2, 0xf2c14e, 1.0);
    } else {
      this.keyIcon.setAlpha(0.25);
    }

    // Power Badges
    if (hero.stormTimer > 0) {
      this.stormBadge.container.setVisible(true);
      const frac = Phaser.Math.Clamp(hero.stormTimer / 15.0, 0, 1);
      this.stormBadge.bar.setSize(30 * frac, 4);
    } else {
      this.stormBadge.container.setVisible(false);
    }

    if (hero.shieldTimer > 0) {
      this.aegisBadge.container.setVisible(true);
      const frac = Phaser.Math.Clamp(hero.shieldTimer / 8.0, 0, 1);
      this.aegisBadge.bar.setSize(30 * frac, 4);
    } else {
      this.aegisBadge.container.setVisible(false);
    }

    this.wingsBadge.container.setVisible(hero.hasWingBoots);

    // Realm info & Gate progress
    if (game.levelData) {
      this.realmText.setText(game.levelData.name);
      this.realmSub.setText(`REALM ${game.levelData.realm} OF 3`);

      const gateX = game.levelData.gate.x * 40;
      const progress = Phaser.Math.Clamp(hero.x / gateX, 0, 1);
      this.progressBar.setSize(110 * progress, 4);
    }
  }
}
