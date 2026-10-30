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
    // Flush any toast requested before this HUD finished creating
    this.events.once('create', () => {
      if (this.pendingToast) {
        const t = this.pendingToast;
        this.pendingToast = null;
        this.showToast(t.msg, t.duration);
      }
      if (this.pendingPulseKeySlot) {
        this.pendingPulseKeySlot = false;
        this.pulseKeySlot();
      }
    });
    const W = this.scale.width;

    // --- Slim Compact Top-Left HUD (Hearts, Coins, Score, Key Slot, Thunder Meter in one unified bar) ---
    this.panelBg = this.add.graphics();
    this.panelBg.fillStyle(0x0e131b, 0.88);
    this.panelBg.fillRoundedRect(14, 12, 280, 50, 8);
    this.panelBg.lineStyle(1.5, 0x2a3342, 0.9);
    this.panelBg.strokeRoundedRect(14, 12, 280, 50, 8);

    // Hearts (5)
    this.heartSprites = [];
    for (let i = 0; i < 5; i++) {
      const h = this.add.image(28 + i * 20, 26, 'pickup_heart').setScale(0.9);
      this.heartSprites.push(h);
    }

    // Coins & Score
    this.coinIcon = this.add.image(142, 26, 'pickup_coin').setScale(0.8);
    this.coinsText = this.add.text(154, 26, '00', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '16px',
      color: '#f2c14e',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(205, 26, '0', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '15px',
      color: '#ece6d6',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Key Slot
    this.keySlotBg = this.add.rectangle(268, 26, 24, 26, 0x141a24, 0.8)
      .setStrokeStyle(1.2, 0x4a5568, 0.9);

    this.keyIcon = this.add.image(268, 26, 'pickup_key')
      .setScale(0.85)
      .setAlpha(0.25);

    // Thunder Meter Bar inside the compact panel
    this.thunderBg = this.add.rectangle(24, 48, 240, 5, 0x141a24).setOrigin(0, 0.5);
    this.thunderBar = this.add.rectangle(24, 48, 0, 5, 0x7fd4ff).setOrigin(0, 0.5);
    this.thunderLabel = this.add.text(268, 48, '⚡', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '11px',
      color: '#7fd4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // --- Active Elemental Rune Badge ---
    this.runeBadge = this.add.container(304, 14);
    const runeBg = this.add.graphics();
    runeBg.fillStyle(0x0e131b, 0.88);
    runeBg.fillRoundedRect(0, 0, 84, 46, 6);
    runeBg.lineStyle(1.5, 0x7fd4ff, 0.8);
    runeBg.strokeRoundedRect(0, 0, 84, 46, 6);

    const runeIcon = this.add.text(14, 23, '⚡', { fontSize: '18px' }).setOrigin(0.5);
    const runeLabel = this.add.text(48, 16, 'RUNE', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '9px',
      color: '#98a0ae',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const runeName = this.add.text(48, 30, 'STORM', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '13px',
      color: '#7fd4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.runeBadge.add([runeBg, runeIcon, runeLabel, runeName]);
    this.runeBgGfx = runeBg;
    this.runeIconText = runeIcon;
    this.runeNameText = runeName;

    // Interactive: tap rune badge to swap rune!
    this.runeBadge.setSize(84, 46);
    this.runeBadge.setInteractive(new Phaser.Geom.Rectangle(0, 0, 84, 46), Phaser.Geom.Rectangle.Contains);
    this.runeBadge.on('pointerdown', () => {
      if (this.gameScene && this.gameScene.hero) {
        this.gameScene.hero.currentRuneIndex = (this.gameScene.hero.currentRuneIndex + 1) % this.gameScene.hero.runes.length;
        audio.playSfx('power');
      }
    });

    // --- Active Power-Up Badges ---
    this.powerContainer = this.add.container(398, 14);

    // Storm Badge
    this.stormBadge = this.createPowerBadge(0, 'pickup_storm', 0x7fd4ff);
    // Aegis Badge
    this.aegisBadge = this.createPowerBadge(42, 'pickup_shield', 0x9ef0e0);
    // Wings Badge
    this.wingsBadge = this.createPowerBadge(84, 'pickup_wings', 0xffffff, false);

    this.powerContainer.add([this.stormBadge.container, this.aegisBadge.container, this.wingsBadge.container]);

    // --- Top-Right Panel (Realm Name & Progress) ---
    this.realmText = this.add.text(W - 130, 22, '', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '24px',
      color: '#ece6d6'
    }).setOrigin(1, 0.5);

    this.realmSub = this.add.text(W - 130, 42, '', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '12px',
      color: '#98a0ae',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    // Gate Progress Bar
    this.progressBg = this.add.rectangle(W - 230, 56, 95, 4, 0x2a3342).setOrigin(0, 0.5);
    this.progressBar = this.add.rectangle(W - 230, 56, 0, 4, 0x7fd4ff).setOrigin(0, 0.5);
    this.gateMarker = this.add.rectangle(W - 135, 56, 4, 10, 0xf2c14e).setOrigin(0.5, 0.5);

    // --- Top-Right Action Buttons (Sound & Pause) ---
    this.soundBtn = this.createButton(W - 100, 32, audio.isMuted() ? '🔇' : '🔊', () => {
      const isMuted = audio.toggleMute();
      this.soundBtnText.setText(isMuted ? '🔇' : '🔊');
    });

    this.pauseBtn = this.createButton(W - 48, 32, '⏸', () => {
      this.scene.launch('PauseScene');
      this.scene.pause('GameScene');
      this.scene.pause();
    });

    // --- Bottom Boss Health Bar ---
    const H = this.scale.height;
    this.bossBarContainer = this.add.container(W / 2, H - 34).setVisible(false);

    const bossBarBg = this.add.graphics();
    bossBarBg.fillStyle(0x0e131b, 0.9);
    bossBarBg.fillRoundedRect(-180, -18, 360, 36, 8);
    bossBarBg.lineStyle(1.5, 0x9d3b3b, 0.9);
    bossBarBg.strokeRoundedRect(-180, -18, 360, 36, 8);

    this.bossNameText = this.add.text(0, -7, 'BOSS', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '18px',
      color: '#ece6d6'
    }).setOrigin(0.5);

    this.bossInnerBg = this.add.rectangle(-160, 8, 320, 8, 0x2a1414).setOrigin(0, 0.5);
    this.bossInnerBar = this.add.rectangle(-160, 8, 320, 8, 0xde3b3b).setOrigin(0, 0.5);

    this.bossBarContainer.add([bossBarBg, this.bossNameText, this.bossInnerBg, this.bossInnerBar]);

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
    const ready = this.sys.isActive() && this.keySlotBg && this.keySlotBg.scene && this.tweens;
    if (!ready) {
      this.pendingPulseKeySlot = true;
      return;
    }
    if (this.keySlotPulseTween && this.keySlotPulseTween.isPlaying()) return;

    this.keySlotPulseTween = this.tweens.add({
      targets: this.keySlotBg,
      scale: 1.15,
      yoyo: true,
      duration: 300,
      ease: 'Sine.easeInOut'
    });
  }

  showToast(msg, duration = 1200) {
    // HUD may not be running yet (launch is deferred a frame) or may still hold
    // destroyed objects from the previous realm. Queue the toast until create() runs.
    const ready = this.sys.isActive() && this.toastText && this.toastText.scene && this.toastBg && this.toastBg.scene;
    if (!ready) {
      this.pendingToast = { msg, duration };
      return;
    }
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
    if (this.pendingToast) {
      const t = this.pendingToast;
      this.pendingToast = null;
      this.showToast(t.msg, t.duration);
    }
    if (this.pendingPulseKeySlot) {
      this.pendingPulseKeySlot = false;
      this.pulseKeySlot();
    }

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

    // Active Rune Badge Dynamic Update
    const rune = hero.currentRune || 'storm';
    const runeMeta = {
      storm: { icon: '⚡', color: '#7fd4ff', hex: 0x7fd4ff },
      frost: { icon: '❄️', color: '#aef2ff', hex: 0xaef2ff },
      ember: { icon: '🔥', color: '#ff7722', hex: 0xff7722 },
      stone: { icon: '⛰️', color: '#cca677', hex: 0xcca677 }
    }[rune] || { icon: '⚡', color: '#7fd4ff', hex: 0x7fd4ff };

    if (this.currentRenderedRune !== rune) {
      this.currentRenderedRune = rune;
      this.runeIconText.setText(runeMeta.icon);
      this.runeNameText.setText(rune.toUpperCase());
      this.runeNameText.setColor(runeMeta.color);
      this.runeBgGfx.clear();
      this.runeBgGfx.fillStyle(0x0e131b, 0.88);
      this.runeBgGfx.fillRoundedRect(0, 0, 84, 46, 6);
      this.runeBgGfx.lineStyle(1.5, runeMeta.hex, 0.8);
      this.runeBgGfx.strokeRoundedRect(0, 0, 84, 46, 6);
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

    // Thunder Meter Bar inside the compact panel
    const thunderPct = Math.floor(hero.thunderMeter || 0);
    this.thunderBar.setSize(240 * (thunderPct / 100), 5);
    if (thunderPct >= 100) {
      this.thunderLabel.setText('⚡ READY');
      this.thunderLabel.setColor('#f2c14e');
      this.thunderBar.setFillStyle(0xf2c14e);
    } else {
      this.thunderLabel.setText('⚡');
      this.thunderLabel.setColor('#7fd4ff');
      this.thunderBar.setFillStyle(0x7fd4ff);
    }

    // Boss Health Bar (shows when boss arena entered)
    if (game.activeBoss && !game.activeBoss.isDead && game.activeBoss.isEngaged) {
      this.bossBarContainer.setVisible(true);
      const boss = game.activeBoss;
      this.bossNameText.setText(`${boss.bossName.toUpperCase()} [PHASE ${boss.phase || 1}]`);
      const hpFrac = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
      this.bossInnerBar.setSize(320 * hpFrac, 8);
    } else {
      this.bossBarContainer.setVisible(false);
    }

    // Realm info & Gate progress
    if (game.levelData) {
      this.realmText.setText(game.levelData.name);
      this.realmSub.setText(`REALM ${game.levelData.realm} OF 5`);

      const gateX = game.levelData.gate.x * 40;
      const progress = Phaser.Math.Clamp(hero.x / gateX, 0, 1);
      this.progressBar.setSize(110 * progress, 4);
    }
  }
}
