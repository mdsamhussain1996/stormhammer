import { SpriteSheetGenerator } from '../systems/SpriteSheetGenerator.js';

/**
 * PreloadScene
 * Programmatically generates rich painted textures and animated sprite sheets for entities,
 * tilesets, items, and multi-layer parallax environments matching Refs A, B, and C.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Loading screen visual
    this.add.rectangle(W / 2, H / 2, W, H, 0x090c10);

    const title = this.add.text(W / 2, H / 2 - 40, 'STORMHAMMER', {
      fontFamily: "'Pirata One', Georgia, serif",
      fontSize: '48px',
      color: '#7fd4ff'
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(W / 2, H / 2 + 30, 320, 10, 0x1a212d);
    const barFill = this.add.rectangle(W / 2 - 160, H / 2 + 30, 0, 10, 0x7fd4ff).setOrigin(0, 0.5);

    this.tweens.add({
      targets: barFill,
      width: 320,
      duration: 500,
      onComplete: () => {
        this.generateAllTextures();
        this.scene.start('TitleScene');
      }
    });
  }

  generateAllTextures() {
    // Generate real animated sprite sheets & register Phaser anims
    new SpriteSheetGenerator(this).generateAll();

    this.generateHeroTextures();
    this.generateWeaponTextures();
    this.generateEnemyTextures();
    this.generateTileAndObjectTextures();
    this.generatePickupTextures();
    this.generateParallaxTextures();
  }

  // --- Helper canvas creation ---
  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // --- Hero Textures ---
  generateHeroTextures() {
    const canvas = this.createCanvas(64, 64);
    const ctx = canvas.getContext('2d');

    // Hero: Silver winged helmet, blue tunic, red cape, leather boots
    ctx.save();
    ctx.translate(32, 54);

    // Cape (fluttering red)
    ctx.fillStyle = '#a8323b';
    ctx.beginPath();
    ctx.moveTo(-4, -36);
    ctx.quadraticCurveTo(-18, -24, -16, -6);
    ctx.lineTo(-2, -14);
    ctx.closePath();
    ctx.fill();

    // Legs / Boots
    ctx.fillStyle = '#252d40';
    ctx.fillRect(-6, -18, 5, 12);
    ctx.fillRect(1, -18, 5, 12);
    ctx.fillStyle = '#4a2f1e';
    ctx.fillRect(-7, -8, 7, 8);
    ctx.fillRect(0, -8, 7, 8);

    // Blue Tunic & Armor
    ctx.fillStyle = '#2f5d8a';
    ctx.beginPath();
    ctx.roundRect(-9, -38, 18, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#c4ccd4'; // Silver chestplate
    ctx.fillRect(-7, -36, 14, 8);
    ctx.fillStyle = '#5a3a1e'; // Belt
    ctx.fillRect(-9, -20, 18, 4);
    ctx.fillStyle = '#f2c14e'; // Golden buckle
    ctx.fillRect(-2, -20, 4, 4);

    // Face / Head
    ctx.fillStyle = '#e2ad7f';
    ctx.beginPath();
    ctx.arc(1, -45, 8, 0, Math.PI * 2);
    ctx.fill();

    // Silver Winged Helmet
    ctx.fillStyle = '#b8c2cc';
    ctx.beginPath();
    ctx.arc(1, -46, 9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-8, -47, 18, 3);
    // Helmet Wing (Norse feather wing)
    ctx.fillStyle = '#f4f6f8';
    ctx.beginPath();
    ctx.moveTo(-6, -50);
    ctx.lineTo(-17, -59);
    ctx.lineTo(-13, -53);
    ctx.lineTo(-19, -54);
    ctx.lineTo(-8, -46);
    ctx.fill();

    // Eye slit
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(3, -44, 2, 3);

    // Arm holding hammer
    ctx.fillStyle = '#2f5d8a';
    ctx.fillRect(2, -34, 7, 8);
    ctx.fillStyle = '#e2ad7f';
    ctx.fillRect(2, -26, 6, 6);

    ctx.restore();

    this.textures.addCanvas('hero_idle', canvas);
  }

  // --- Hammer Weapon Texture ---
  generateWeaponTextures() {
    const canvas = this.createCanvas(32, 40);
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(16, 20);

    // Wooden handle
    ctx.fillStyle = '#6b4426';
    ctx.fillRect(-2.5, -4, 5, 26);
    ctx.fillStyle = '#3a2416';
    for (let y = 0; y < 20; y += 5) {
      ctx.fillRect(-3, y, 6, 2);
    }

    // Heavy carved stone/iron hammer head
    ctx.fillStyle = '#8f979f';
    ctx.beginPath();
    ctx.roundRect(-14, -18, 28, 16, 2);
    ctx.fill();

    // Beveled edges
    ctx.fillStyle = '#6b7178';
    ctx.fillRect(-14, -18, 5, 16);
    ctx.fillRect(9, -18, 5, 16);

    // Carved rune
    ctx.fillStyle = '#50565d';
    ctx.fillRect(-6, -11, 12, 2);
    ctx.fillRect(-1, -14, 2, 8);

    // Specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-14, -18, 28, 2);

    ctx.restore();

    this.textures.addCanvas('weapon_hammer', canvas);
  }

  // --- Enemy Textures ---
  generateEnemyTextures() {
    const themes = [
      { name: 'forest', color: '#647f3c', belly: '#8aa358' },
      { name: 'castle', color: '#cdc5ae', belly: '#e7e0cb' },
      { name: 'fortress', color: '#b8543c', belly: '#e08454' }
    ];

    // Grunts for 3 realms
    themes.forEach(t => {
      const c = this.createCanvas(40, 48);
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.translate(20, 44);

      // Legs
      ctx.fillStyle = '#2a2420';
      ctx.fillRect(-8, -8, 5, 8);
      ctx.fillRect(3, -8, 5, 8);

      // Body
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.ellipse(0, -22, 14, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ears / horns
      ctx.beginPath();
      ctx.moveTo(-10, -32);
      ctx.lineTo(-18, -42);
      ctx.lineTo(-6, -34);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -32);
      ctx.lineTo(18, -42);
      ctx.lineTo(6, -34);
      ctx.fill();

      // Belly
      ctx.fillStyle = t.belly;
      ctx.beginPath();
      ctx.ellipse(1, -18, 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#fff6d0';
      ctx.beginPath();
      ctx.ellipse(2, -26, 3, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -26, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a120c';
      ctx.fillRect(3, -26, 2, 3);
      ctx.fillRect(9, -26, 2, 3);

      // Dagger / Spear
      ctx.strokeStyle = '#5a3a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -14);
      ctx.lineTo(20, -28);
      ctx.stroke();
      ctx.fillStyle = '#c9cfd6';
      ctx.beginPath();
      ctx.moveTo(18, -28);
      ctx.lineTo(24, -36);
      ctx.lineTo(23, -26);
      ctx.fill();

      ctx.restore();
      this.textures.addCanvas(`enemy_grunt_${t.name}`, c);
    });

    // Bat
    {
      const c = this.createCanvas(36, 28);
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.translate(18, 14);

      ctx.fillStyle = '#2e2140';
      // Wings
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-16, -8);
      ctx.lineTo(-12, 4);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-4, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(16, -8);
      ctx.lineTo(12, 4);
      ctx.lineTo(8, 0);
      ctx.lineTo(4, 6);
      ctx.fill();

      // Body & Ears
      ctx.fillStyle = '#43305c';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(-3, -10);
      ctx.lineTo(-1, -5);
      ctx.moveTo(5, -4);
      ctx.lineTo(3, -10);
      ctx.lineTo(1, -5);
      ctx.fill();

      // Glowing red eyes
      ctx.fillStyle = '#ff4a4a';
      ctx.fillRect(-3, -2, 2, 2);
      ctx.fillRect(1, -2, 2, 2);

      ctx.restore();
      this.textures.addCanvas('enemy_bat', c);
    }

    // Brute (Mini-boss ogre with horn and club)
    {
      const c = this.createCanvas(56, 64);
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.translate(28, 58);

      // Legs
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(-15, -12, 11, 12);
      ctx.fillRect(4, -12, 11, 12);

      // Large torso
      ctx.fillStyle = '#6b5a4a';
      ctx.beginPath();
      ctx.roundRect(-22, -48, 44, 38, 10);
      ctx.fill();

      // Belly
      ctx.fillStyle = '#8a7560';
      ctx.beginPath();
      ctx.roundRect(-12, -34, 24, 20, 6);
      ctx.fill();

      // Helmet & Horns
      ctx.fillStyle = '#4f555c';
      ctx.beginPath();
      ctx.arc(0, -48, 14, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-14, -50, 28, 4);

      ctx.fillStyle = '#e8e2d0'; // Horns
      ctx.beginPath();
      ctx.moveTo(-12, -54);
      ctx.lineTo(-20, -64);
      ctx.lineTo(-8, -56);
      ctx.moveTo(16, -54);
      ctx.lineTo(24, -64);
      ctx.lineTo(12, -56);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = '#ffd27a';
      ctx.fillRect(3, -44, 4, 3);
      ctx.fillRect(10, -44, 4, 3);

      // Heavy wooden spiky club
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(16, -34, 7, 32);
      ctx.fillStyle = '#3e2814';
      ctx.beginPath();
      ctx.roundRect(13, -12, 13, 16, 4);
      ctx.fill();

      ctx.restore();
      this.textures.addCanvas('enemy_brute', c);
    }

    // Caster (Mage with robe)
    ['castle', 'fortress'].forEach(themeName => {
      const c = this.createCanvas(40, 52);
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.translate(20, 48);

      const robeColor = themeName === 'fortress' ? '#5a1f2a' : '#2c3e5a';
      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-8, -32);
      ctx.lineTo(8, -32);
      ctx.lineTo(14, 0);
      ctx.fill();

      // Hood
      ctx.beginPath();
      ctx.arc(0, -32, 10, 0, Math.PI * 2);
      ctx.fill();

      // Deep shadow within hood
      ctx.fillStyle = '#0a0810';
      ctx.beginPath();
      ctx.arc(3, -31, 7, 0, Math.PI * 2);
      ctx.fill();

      // Glowing eyes
      ctx.fillStyle = '#ffd27a';
      ctx.fillRect(2, -33, 2, 2);
      ctx.fillRect(6, -33, 2, 2);

      ctx.restore();
      this.textures.addCanvas(`enemy_caster_${themeName}`, c);
    });

    // Fireball projectile
    {
      const c = this.createCanvas(24, 24);
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(12, 12, 1, 12, 12, 11);
      grad.addColorStop(0, '#fff6c8');
      grad.addColorStop(0.4, '#ff8a3d');
      grad.addColorStop(1, 'rgba(255, 60, 30, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(12, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('proj_fireball', c);
    }
  }

  // --- Tileset & Object Textures ---
  generateTileAndObjectTextures() {
    const TS = 40;

    // 1. Forest Ground Top & Mid
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#3b2a1f';
      ctx.fillRect(0, 0, TS, TS);
      ctx.fillStyle = '#3a7030';
      ctx.fillRect(0, 0, TS, 10);
      ctx.fillStyle = '#4f8f3c';
      ctx.fillRect(0, 0, TS, 6);
      // Grass blades
      ctx.fillStyle = '#6fb04f';
      for (let x = 3; x < TS; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x + 2, -4);
        ctx.lineTo(x + 4, 2);
        ctx.fill();
      }
      this.textures.addCanvas('tile_forest_top', c);
    }
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#3b2a1f';
      ctx.fillRect(0, 0, TS, TS);
      ctx.fillStyle = '#2c1f17';
      ctx.fillRect(4, 8, 12, 8);
      ctx.fillRect(22, 20, 14, 10);
      this.textures.addCanvas('tile_forest_mid', c);
    }

    // 2. Castle Stone Top & Mid
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#38443d';
      ctx.fillRect(0, 0, TS, TS);
      ctx.fillStyle = '#5a685e';
      ctx.fillRect(0, 0, TS, 5);
      ctx.strokeStyle = '#2a332e';
      ctx.strokeRect(0, 5, TS, TS - 5);
      this.textures.addCanvas('tile_castle_top', c);
    }
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#38443d';
      ctx.fillRect(0, 0, TS, TS);
      ctx.strokeStyle = '#2a332e';
      ctx.strokeRect(0, 0, TS, 20);
      ctx.strokeRect(10, 20, TS, 20);
      this.textures.addCanvas('tile_castle_mid', c);
    }

    // 3. Fortress Stone Top & Mid
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#5e5452';
      ctx.fillRect(0, 0, TS, TS);
      ctx.fillStyle = '#8a7e78';
      ctx.fillRect(0, 0, TS, 5);
      ctx.fillStyle = 'rgba(255, 140, 60, 0.2)';
      ctx.fillRect(0, 0, TS, 2);
      this.textures.addCanvas('tile_fortress_top', c);
    }
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#5e5452';
      ctx.fillRect(0, 0, TS, TS);
      ctx.strokeStyle = '#463e3c';
      ctx.strokeRect(0, 0, TS, 20);
      ctx.strokeRect(12, 20, TS, 20);
      this.textures.addCanvas('tile_fortress_mid', c);
    }

    // 4. One-way wooden log platform
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#6b4a2e';
      ctx.beginPath();
      ctx.roundRect(0, 2, TS, 14, 6);
      ctx.fill();
      ctx.strokeStyle = '#523822';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(2, 8);
      ctx.lineTo(38, 8);
      ctx.stroke();
      ctx.fillStyle = '#8a6440';
      ctx.fillRect(2, 3, 36, 2);
      this.textures.addCanvas('tile_plat', c);
    }

    // 5. Spikes
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      for (let i = 0; i < 4; i++) {
        const x = i * 10;
        ctx.fillStyle = '#b9bec7';
        ctx.beginPath();
        ctx.moveTo(x, TS);
        ctx.lineTo(x + 5, 18);
        ctx.lineTo(x + 10, TS);
        ctx.fill();
        ctx.fillStyle = '#6b707a';
        ctx.beginPath();
        ctx.moveTo(x + 5, 18);
        ctx.lineTo(x + 10, TS);
        ctx.lineTo(x + 6, TS);
        ctx.fill();
      }
      this.textures.addCanvas('tile_spike', c);
    }

    // 6. Solid Breakable Crate
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#8a5a32';
      ctx.fillRect(1, 1, 38, 38);
      ctx.strokeStyle = '#5a3a1e';
      ctx.lineWidth = 4;
      ctx.strokeRect(3, 3, 34, 34);
      // Cross braces
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(5, 5);
      ctx.lineTo(35, 35);
      ctx.moveTo(35, 5);
      ctx.lineTo(5, 35);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(3, 3, 34, 2);
      this.textures.addCanvas('tile_crate', c);
    }

    // 7. Decorative Urn
    {
      const c = this.createCanvas(24, 30);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#9a5634';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(18, 0);
      ctx.lineTo(17, 5);
      ctx.quadraticCurveTo(24, 12, 22, 27);
      ctx.lineTo(19, 30);
      ctx.lineTo(5, 30);
      ctx.lineTo(2, 27);
      ctx.quadraticCurveTo(0, 12, 7, 5);
      ctx.fill();
      ctx.fillStyle = '#c27a48';
      ctx.fillRect(3, 13, 18, 3);
      this.textures.addCanvas('obj_urn', c);
    }
  }

  // --- Pickup Textures ---
  generatePickupTextures() {
    const sz = 24;

    // Coin
    {
      const c = this.createCanvas(sz, sz);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#c48e22';
      ctx.beginPath();
      ctx.arc(12, 12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(12, 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3c0';
      ctx.fillRect(11, 7, 2, 10);
      this.textures.addCanvas('pickup_coin', c);
    }

    // Heart
    {
      const c = this.createCanvas(sz, sz);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ff5a6a';
      ctx.beginPath();
      ctx.moveTo(12, 19);
      ctx.bezierCurveTo(0, 11, 5, 3, 12, 8);
      ctx.bezierCurveTo(19, 3, 24, 11, 12, 19);
      ctx.fill();
      this.textures.addCanvas('pickup_heart', c);
    }

    // Storm Orb
    {
      const c = this.createCanvas(sz, sz);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#1d3a52';
      ctx.beginPath();
      ctx.arc(12, 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7fd4ff';
      ctx.beginPath();
      ctx.moveTo(14, 4);
      ctx.lineTo(8, 13);
      ctx.lineTo(12, 13);
      ctx.lineTo(10, 20);
      ctx.lineTo(16, 11);
      ctx.lineTo(12, 11);
      ctx.fill();
      this.textures.addCanvas('pickup_storm', c);
    }

    // Aegis Shield
    {
      const c = this.createCanvas(sz, sz);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#9ef0e0';
      ctx.beginPath();
      ctx.moveTo(12, 3);
      ctx.lineTo(20, 6);
      ctx.lineTo(18, 16);
      ctx.lineTo(12, 21);
      ctx.lineTo(6, 16);
      ctx.lineTo(4, 6);
      ctx.fill();
      ctx.fillStyle = '#2b6a60';
      ctx.fillRect(11, 6, 2, 12);
      this.textures.addCanvas('pickup_shield', c);
    }

    // Wing Boots
    {
      const c = this.createCanvas(sz, sz);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(10 + i * 3, 8 + i * 3, 8 - i, 3, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#4a2f1e';
      ctx.fillRect(8, 14, 8, 6);
      this.textures.addCanvas('pickup_wings', c);
    }

    // Key
    {
      const c = this.createCanvas(sz, sz);
      const ctx = c.getContext('2d');
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(8, 12, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(12, 10.5, 9, 3);
      ctx.fillRect(17, 12, 2.5, 5);
      ctx.fillRect(19.5, 12, 1.5, 4);
      this.textures.addCanvas('pickup_key', c);
    }
  }

  // --- Parallax Multi-Layer Background Textures ---
  generateParallaxTextures() {
    const W = 960;
    const H = 540;
    const LW = 1920;

    // 1. Forest (Ref B: Dusky blue/amber sky, warm sun glow, far mountains, tree trunks, mossy ledges)
    {
      // Sky
      const c = this.createCanvas(W, H);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1f2b47');
      grad.addColorStop(0.5, '#566a8c');
      grad.addColorStop(1, '#dba468');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // Warm sun glow
      const sun = ctx.createRadialGradient(250, 320, 10, 250, 320, 320);
      sun.addColorStop(0, 'rgba(255, 222, 150, 0.9)');
      sun.addColorStop(0.2, 'rgba(255, 180, 100, 0.45)');
      sun.addColorStop(1, 'rgba(255, 150, 80, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas('bg_sky_forest', c);
    }
    {
      // Far Mountains
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(70, 86, 116, 0.85)';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= LW; x += 16) {
        const y = 300 + Math.sin(x * 0.005) * 50 + Math.sin(x * 0.015) * 25;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(LW, H);
      ctx.fill();
      this.textures.addCanvas('bg_l1_forest', c);
    }
    {
      // Mid tree trunks
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (let x = 60; x < LW; x += 140) {
        ctx.fillStyle = '#33454a';
        ctx.fillRect(x, 0, 30, H);
        ctx.fillStyle = 'rgba(255, 190, 120, 0.12)';
        ctx.fillRect(x + 20, 0, 6, H);
      }
      this.textures.addCanvas('bg_l2_forest', c);
    }
    {
      // Near trunks & hanging vines
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (let x = 120; x < LW; x += 260) {
        ctx.fillStyle = '#1b2823';
        ctx.fillRect(x, 0, 50, H);
        // Vines
        ctx.strokeStyle = '#2c4a30';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 10, 0);
        ctx.quadraticCurveTo(x + 35, 180, x + 20, 320);
        ctx.stroke();
      }
      this.textures.addCanvas('bg_l3_forest', c);
    }

    // 2. Castle (Ref A: Dark green gloom, tall arched windows, bookshelves, lanterns, pillars)
    {
      // Sky / Room Gloom
      const c = this.createCanvas(W, H);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#08100d');
      grad.addColorStop(1, '#172820');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas('bg_sky_castle', c);
    }
    {
      // Far wall & tall arched windows letting in green light
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#111c17';
      ctx.fillRect(0, 0, LW, H);
      for (let x = 120; x < LW; x += 320) {
        const wg = ctx.createLinearGradient(0, 80, 0, 420);
        wg.addColorStop(0, 'rgba(120, 190, 150, 0.35)');
        wg.addColorStop(1, 'rgba(60, 110, 80, 0.05)');
        ctx.fillStyle = wg;
        ctx.beginPath();
        ctx.moveTo(x, 420);
        ctx.lineTo(x, 170);
        ctx.arc(x + 50, 170, 50, Math.PI, 0);
        ctx.lineTo(x + 100, 420);
        ctx.fill();
      }
      this.textures.addCanvas('bg_l1_castle', c);
    }
    {
      // Bookshelves with colorful spines & hanging lanterns
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      const bookColors = ['#5b2e2e', '#2e4a5b', '#4a5b2e', '#6b5a2e', '#3d2e5b'];
      for (let x = 40; x < LW; x += 280) {
        ctx.fillStyle = '#24180f';
        ctx.fillRect(x, 140, 200, H - 140);
        // Books
        for (let shelfY = 160; shelfY < H - 40; shelfY += 50) {
          ctx.fillStyle = '#120c07';
          ctx.fillRect(x + 8, shelfY, 184, 40);
          let bx = x + 10;
          while (bx < x + 186) {
            const bw = 8 + (bx % 7);
            const bh = 24 + (bx % 12);
            ctx.fillStyle = bookColors[(bx) % bookColors.length];
            ctx.fillRect(bx, shelfY + 40 - bh, bw, bh);
            bx += bw + 2;
          }
        }
      }
      this.textures.addCanvas('bg_l2_castle', c);
    }
    {
      // Foreground pillars
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (let x = 180; x < LW; x += 440) {
        ctx.fillStyle = '#0b120f';
        ctx.fillRect(x, 0, 60, H);
        ctx.fillStyle = '#1c2b23';
        ctx.fillRect(x + 8, 0, 8, H);
      }
      this.textures.addCanvas('bg_l3_castle', c);
    }

    // 3. Fortress (Ref C: Purple/red/orange burning sky, smoke columns, towers, crenellated walls)
    {
      // Burning Sky
      const c = this.createCanvas(W, H);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#2a1426');
      grad.addColorStop(0.45, '#8a3a3a');
      grad.addColorStop(0.8, '#e5824a');
      grad.addColorStop(1, '#f3b46a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas('bg_sky_fortress', c);
    }
    {
      // Smoke columns
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (const px of [250, 750, 1350]) {
        let x = px, y = H, r = 40;
        while (y > -50) {
          ctx.fillStyle = 'rgba(58, 40, 50, 0.45)';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          y -= r * 0.6;
          r *= 1.05;
          x += 10;
        }
      }
      this.textures.addCanvas('bg_l1_fortress', c);
    }
    {
      // Distant Towers with glowing windows
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (let x = 60; x < LW; x += 180) {
        const h = 180 + (x % 120);
        ctx.fillStyle = '#5b3a42';
        ctx.fillRect(x, H - h, 50, h);
        // Glowing windows
        ctx.fillStyle = 'rgba(255, 170, 90, 0.8)';
        for (let k = 0; k < 3; k++) {
          ctx.fillRect(x + 22, H - h + 30 + k * 40, 6, 12);
        }
      }
      this.textures.addCanvas('bg_l2_fortress', c);
    }
    {
      // Crenellated stone battlement walls
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#3a242b';
      ctx.fillRect(0, 420, LW, H - 420);
      for (let x = 0; x < LW; x += 40) {
        ctx.fillRect(x, 400, 24, 20);
      }
      this.textures.addCanvas('bg_l3_fortress', c);
    }
  }
}
