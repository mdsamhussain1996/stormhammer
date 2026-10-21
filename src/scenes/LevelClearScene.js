import { audio } from '../systems/Audio.js';

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

    // Onward button
    const isFinalRealm = this.realm >= 3;
    const btnText = isFinalRealm ? 'Claim Victory' : `Onward to Realm ${this.realm + 1} →`;

    const btnW = 240;
    const btnH = 46;
    const btnY = H / 2 + 100;

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
        this.scene.start('GameScene', {
          realm: this.realm + 1,
          playerState: {
            hp: 5,
            coins: this.coins,
            score: this.score,
            hasWingBoots: this.hasWingBoots
          }
        });
      }
    });

    this.input.keyboard.on('keydown-ENTER', () => hit.emit('pointerdown'));
    this.input.keyboard.on('keydown-SPACE', () => hit.emit('pointerdown'));
  }
}
