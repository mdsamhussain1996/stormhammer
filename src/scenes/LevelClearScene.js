import { audio } from '../systems/Audio.js';
import { SaveSystem } from '../systems/Save.js';

/**
 * LevelClearScene
 * Celebrates completing a realm, tallies coins and defeated foes, and transitions onward.
 */
export class LevelClearScene extends Phaser.Scene {
  constructor() {
    super('LevelClearScene');
  }

  init(data) {
    this.realm = data.realm || 1;
    this.realmName = data.name || '';
    this.coins = data.coins || 0;
    this.kills = data.kills || 0;
    this.score = data.score || 0;
    this.hasWingBoots = !!data.hasWingBoots;
    this.hp = data.hp;
    this.stats = data.stats || { foundKey: false, allSecrets: false, died: false };
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    audio.playSfx('key');

    // Backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x080a10, 0.88);
    bg.fillRect(0, 0, W, H);

    // Card
    const cardW = 460;
    const cardH = 360;
    const card = this.add.graphics();
    card.fillStyle(0x141a23, 0.95);
    card.fillRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 12);
    card.lineStyle(1.5, 0x7fd4ff, 0.6);
    card.strokeRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 12);

    this.add.text(W / 2, H / 2 - 130, `REALM ${this.realm} CLEARED`, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '14px',
      color: '#7fd4ff',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 90, this.realmName, {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '52px',
      color: '#ece6d6'
    }).setOrigin(0.5);

    // Stat Boxes
    const statsY = H / 2 - 10;
    const stats = [
      { label: 'COINS', val: this.coins, color: '#f2c14e' },
      { label: 'FOES', val: this.kills, color: '#ff5a6a' },
      { label: 'SCORE', val: this.score, color: '#7fd4ff' }
    ];

    stats.forEach((s, idx) => {
      const x = W / 2 - 140 + idx * 140;

      this.add.text(x, statsY - 14, String(s.val), {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '36px',
        color: s.color,
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(x, statsY + 18, s.label, {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '13px',
        color: '#98a0ae',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    });

    // Star Rating Display (Key found, Secrets found, No deaths)
    const foundKey = true; // Gate reached implies key was found
    const allSecrets = !!this.stats.allSecrets;
    const noDeaths = !this.stats.died;
    const starsCount = (foundKey ? 1 : 0) + (allSecrets ? 1 : 0) + (noDeaths ? 1 : 0);

    // Save stars
    SaveSystem.setRealmStars(this.realm, {
      foundKey,
      allSecrets,
      noDeaths
    });

    const starY = H / 2 + 50;
    const starsContainer = this.add.container(W / 2, starY);
    const starGoals = [
      { achieved: foundKey, label: 'Key Found' },
      { achieved: allSecrets, label: 'All Secrets' },
      { achieved: noDeaths, label: 'No Deaths' }
    ];

    starGoals.forEach((sg, idx) => {
      const sx = (idx - 1) * 110;
      const starIcon = this.add.text(sx, -10, sg.achieved ? '★' : '☆', {
        fontSize: '28px',
        color: sg.achieved ? '#f2c14e' : '#555555'
      }).setOrigin(0.5);

      const subTxt = this.add.text(sx, 16, sg.label, {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '11px',
        color: sg.achieved ? '#ece6d6' : '#666666',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      starsContainer.add([starIcon, subTxt]);
    });

    // Onward button: Goes to The Thunder Forge (or Victory if Realm 3)
    const isFinalRealm = this.realm >= 3;
    const btnText = isFinalRealm ? 'Claim Victory' : `Visit Thunder Forge ➔`;

    const btnW = 250;
    const btnH = 46;
    const btnY = H / 2 + 115;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7fd4ff, 1.0);
    btnBg.fillRoundedRect(W / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    this.add.text(W / 2, btnY, btnText, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '20px',
      color: '#08131b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const hit = this.add.rectangle(W / 2, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      if (isFinalRealm) {
        this.scene.start('VictoryScene', {
          coins: this.coins,
          kills: this.kills,
          score: this.score
        });
      } else {
        this.scene.start('ForgeScene', {
          nextRealm: this.realm + 1,
          coins: this.coins,
          score: this.score,
          kills: this.kills,
          hp: this.hp,
          hasWingBoots: this.hasWingBoots,
          stats: this.stats
        });
      }
    });

    this.input.keyboard.on('keydown-ENTER', () => hit.emit('pointerdown'));
    this.input.keyboard.on('keydown-SPACE', () => hit.emit('pointerdown'));
  }
}
