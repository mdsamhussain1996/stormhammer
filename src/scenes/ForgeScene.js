import { audio } from '../systems/Audio.js';
import { SaveSystem } from '../systems/Save.js';

/**
 * ForgeScene — The Thunder Forge
 * Intermediate progression shop between realms.
 * Spend hard-earned coins on permanent upgrades: Max Hearts, Hammer Damage, Throw Range, and Storm Duration.
 */
export class ForgeScene extends Phaser.Scene {
  constructor() {
    super('ForgeScene');
  }

  init(data) {
    this.nextRealm = data.nextRealm || 2;
    this.coins = data.coins || 0;
    this.score = data.score || 0;
    this.stats = data.stats || {};
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Dark glowing forge background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0f0a, 0x1a0f0a, 0x0a0504, 0x0a0504, 1);
    bg.fillRect(0, 0, W, H);

    // Decorative anvil & ember particles
    for (let i = 0; i < 25; i++) {
      const ember = this.add.circle(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(H - 40, H), Phaser.Math.Between(1, 3), 0xff7722, 0.7);
      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(120, 280),
        x: ember.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(1600, 3200),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Title & Header
    this.add.text(W / 2, 48, 'THE THUNDER FORGE', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '44px',
      color: '#f2c14e'
    }).setOrigin(0.5);

    this.add.text(W / 2, 84, 'Reforge your war gear with coins gathered in battle', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '16px',
      color: '#98a0ae'
    }).setOrigin(0.5);

    // Coins Counter Display
    const coinPanel = this.add.graphics();
    coinPanel.fillStyle(0x141a24, 0.8);
    coinPanel.fillRoundedRect(W / 2 - 90, 110, 180, 40, 8);
    coinPanel.lineStyle(1.5, 0xf2c14e, 0.8);
    coinPanel.strokeRoundedRect(W / 2 - 90, 110, 180, 40, 8);

    this.add.image(W / 2 - 60, 130, 'pickup_coin').setScale(1.1);
    this.coinsText = this.add.text(W / 2 - 40, 130, `COINS: ${this.coins}`, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '20px',
      color: '#f2c14e',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Upgrade items definition
    const upgrades = SaveSystem.getUpgrades();
    this.upgradeItems = [
      {
        id: 'maxHp',
        title: '+1 MAX HEART',
        desc: 'Endure heavier blows in the next trial',
        cost: 15,
        maxLevel: 3,
        level: upgrades.maxHp || 0,
        icon: 'pickup_heart'
      },
      {
        id: 'hammerDamage',
        title: '+1 HAMMER DAMAGE',
        desc: 'Melee swings strike with brutal force',
        cost: 20,
        maxLevel: 2,
        level: upgrades.hammerDamage || 0,
        icon: 'weapon_hammer'
      },
      {
        id: 'throwRange',
        title: '+60PX THROW RANGE',
        desc: 'Hammer flies further before returning',
        cost: 15,
        maxLevel: 3,
        level: upgrades.throwRange || 0,
        icon: 'pickup_wings'
      },
      {
        id: 'stormDuration',
        title: '+4S STORM SURGE',
        desc: 'Electrified chain lightning lasts longer',
        cost: 15,
        maxLevel: 3,
        level: upgrades.stormDuration || 0,
        icon: 'pickup_storm'
      }
    ];

    // Render Upgrade Cards in 2x2 grid
    const startX = W / 2 - 210;
    const startY = 175;
    const cardW = 200;
    const cardH = 130;
    const gapX = 20;
    const gapY = 16;

    this.upgradeCards = [];

    this.upgradeItems.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      const card = this.createUpgradeCard(cx, cy, cardW, cardH, item);
      this.upgradeCards.push(card);
    });

    // Continue to next realm button
    const contBtn = this.add.container(W / 2, H - 56);
    const contBg = this.add.graphics();
    contBg.fillStyle(0x234e70, 0.9);
    contBg.fillRoundedRect(-140, -22, 280, 44, 10);
    contBg.lineStyle(2, 0x7fd4ff, 0.9);
    contBg.strokeRoundedRect(-140, -22, 280, 44, 10);

    const contTxt = this.add.text(0, 0, `ENTER REALM ${this.nextRealm} ➔`, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '20px',
      color: '#ece6d6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    contBtn.add([contBg, contTxt]);
    contBtn.setSize(280, 44);
    contBtn.setInteractive(new Phaser.Geom.Rectangle(-140, -22, 280, 44), Phaser.Geom.Rectangle.Contains);

    contBtn.on('pointerover', () => {
      contBg.clear();
      contBg.fillStyle(0x2f6b9a, 1.0);
      contBg.fillRoundedRect(-140, -22, 280, 44, 10);
      contBg.lineStyle(2, 0xffffff, 1.0);
      contBg.strokeRoundedRect(-140, -22, 280, 44, 10);
    });

    contBtn.on('pointerout', () => {
      contBg.clear();
      contBg.fillStyle(0x234e70, 0.9);
      contBg.fillRoundedRect(-140, -22, 280, 44, 10);
      contBg.lineStyle(2, 0x7fd4ff, 0.9);
      contBg.strokeRoundedRect(-140, -22, 280, 44, 10);
    });

    contBtn.on('pointerdown', () => {
      audio.playSfx('power');
      this.scene.start('GameScene', {
        realm: this.nextRealm,
        score: this.score,
        coins: this.coins
      });
    });
  }

  createUpgradeCard(x, y, w, h, item) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    const isMax = item.level >= item.maxLevel;
    const canAfford = this.coins >= item.cost && !isMax;

    this.drawCardBg(bg, w, h, canAfford, isMax);

    const icon = this.add.image(28, 30, item.icon).setScale(1.1);

    const title = this.add.text(54, 20, item.title, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '14px',
      color: '#f2c14e',
      fontStyle: 'bold'
    });

    const desc = this.add.text(12, 54, item.desc, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '11px',
      color: '#98a0ae',
      wordWrap: { width: w - 24 }
    });

    const levelText = this.add.text(12, 98, `LVL: ${item.level}/${item.maxLevel}`, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '12px',
      color: '#ece6d6',
      fontStyle: 'bold'
    });

    const costLabel = isMax ? 'MAXED' : `${item.cost} COINS`;
    const costText = this.add.text(w - 14, 98, costLabel, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '13px',
      color: isMax ? '#7fd4ff' : (canAfford ? '#f2c14e' : '#666666'),
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    container.add([bg, icon, title, desc, levelText, costText]);

    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      if (isMax || this.coins < item.cost) {
        audio.playSfx('hurt');
        return;
      }

      // Purchase!
      this.coins -= item.cost;
      item.level += 1;
      audio.playSfx('power');

      // Update save system
      const currentUpgrades = SaveSystem.getUpgrades();
      currentUpgrades[item.id] = item.level;
      SaveSystem.setUpgrades(currentUpgrades);

      // Refresh UI
      this.coinsText.setText(`COINS: ${this.coins}`);
      levelText.setText(`LVL: ${item.level}/${item.maxLevel}`);
      const nowMax = item.level >= item.maxLevel;
      costText.setText(nowMax ? 'MAXED' : `${item.cost} COINS`);
      costText.setColor(nowMax ? '#7fd4ff' : (this.coins >= item.cost ? '#f2c14e' : '#666666'));
      this.drawCardBg(bg, w, h, this.coins >= item.cost && !nowMax, nowMax);
    });

    return container;
  }

  drawCardBg(gfx, w, h, canAfford, isMax) {
    gfx.clear();
    gfx.fillStyle(0x141a24, 0.85);
    gfx.fillRoundedRect(0, 0, w, h, 8);
    const strokeCol = isMax ? 0x7fd4ff : (canAfford ? 0xf2c14e : 0x2a3342);
    gfx.lineStyle(1.5, strokeCol, 0.8);
    gfx.strokeRoundedRect(0, 0, w, h, 8);
  }
}
