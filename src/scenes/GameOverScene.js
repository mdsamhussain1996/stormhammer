import { audio } from '../systems/Audio.js';

/**
 * GameOverScene
 * "The hammer drops" — offers "Rise again", restarting the current realm with 3 HP while keeping
 * collected coins and permanent upgrades.
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.realm = data.realm || 1;
    this.realmName = data.name || '';
    this.coins = data.coins || 0;
    this.score = data.score || 0;
    this.hasWingBoots = !!data.hasWingBoots;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Dark reddish gloom
    const bg = this.add.graphics();
    bg.fillStyle(0x0e080b, 0.92);
    bg.fillRect(0, 0, W, H);

    // Modal Card
    const cardW = 440;
    const cardH = 340;
    const card = this.add.graphics();
    card.fillStyle(0x181216, 0.95);
    card.fillRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 12);
    card.lineStyle(1.5, 0x5a2a30, 1.0);
    card.strokeRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 12);

    this.add.text(W / 2, H / 2 - 110, 'FALLEN', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '14px',
      color: '#ff5a5a',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 70, 'The Hammer Drops', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '52px',
      color: '#ece6d6'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 10, `${this.realmName} claimed you this time.\nYour hard-earned coins and wing boots remain with you.`, {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '16px',
      color: '#cfd5de',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    // "Rise Again" Button
    const btnW = 220;
    const btnH = 46;
    const btnY = H / 2 + 70;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7fd4ff, 1.0);
    btnBg.fillRoundedRect(W / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    this.add.text(W / 2, btnY, 'Rise Again (3 HP)', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '20px',
      color: '#08131b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const hit = this.add.rectangle(W / 2, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      audio.playSfx('catch');
      this.scene.start('GameScene', {
        realm: this.realm,
        playerState: {
          hp: 3,
          coins: this.coins,
          score: this.score,
          hasWingBoots: this.hasWingBoots
        }
      });
    });

    // Main Menu secondary button
    const menuTxt = this.add.text(W / 2, H / 2 + 124, 'Return to Title Menu', {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: '14px',
      color: '#98a0ae'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuTxt.on('pointerdown', () => {
      audio.stopBgm();
      this.scene.start('TitleScene');
    });

    this.input.keyboard.on('keydown-ENTER', () => hit.emit('pointerdown'));
    this.input.keyboard.on('keydown-SPACE', () => hit.emit('pointerdown'));
  }
}
