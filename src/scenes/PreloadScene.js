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
    const canvas = this.createCanvas(48, 56);
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(24, 28);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#121620';

    // Wooden handle with leather grip wrappings
    ctx.fillStyle = '#5c381e';
    ctx.fillRect(-3.5, -6, 7, 34);
    ctx.strokeRect(-3.5, -6, 7, 34);

    // Leather diamond grip bindings
    ctx.fillStyle = '#3a2010';
    for (let y = -2; y < 24; y += 6) {
      ctx.fillRect(-4, y, 8, 2.5);
    }

    // Heavy carved stone/iron hammer head (3-tone)
    // Dark base / outline
    ctx.fillStyle = '#4c5664';
    ctx.beginPath();
    ctx.roundRect(-20, -26, 40, 22, 4);
    ctx.stroke();
    ctx.fill();

    // Mid-tone steel body
    ctx.fillStyle = '#7a8698';
    ctx.fillRect(-17, -24, 34, 18);

    // Specular top highlight & bevel
    ctx.fillStyle = '#c4d2e0';
    ctx.fillRect(-17, -24, 34, 3);
    ctx.fillRect(-17, -24, 6, 18);

    // Golden rune inlay glowing with thunder energy
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(-8, -16, 16, 3);
    ctx.fillRect(-2, -21, 4, 12);
    ctx.fillStyle = '#7fd4ff';
    ctx.fillRect(-1, -19, 2, 8);

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

    // Helper: draw weathered cracks on stone
    const drawCracks = (ctx, x1, y1, x2, y2, color = 'rgba(18, 22, 28, 0.65)') => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 6;
      const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 6;
      ctx.lineTo(mx, my);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    // 1. Forest Ground (Top & Mid)
    // Top: Rich loamy soil, vibrant hanging moss & grass tufts, dangling hanging roots
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      // Dark earthy base
      ctx.fillStyle = '#261a12';
      ctx.fillRect(0, 0, TS, TS);

      // Mid-tone rich dirt
      ctx.fillStyle = '#3d2b1e';
      ctx.fillRect(0, 0, TS, 28);
      ctx.fillStyle = '#4e3726';
      ctx.fillRect(0, 0, TS, 16);

      // Hanging roots dipping below
      ctx.strokeStyle = '#22150d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 14);
      ctx.quadraticCurveTo(6, 26, 10, 36);
      ctx.moveTo(28, 14);
      ctx.quadraticCurveTo(32, 24, 26, 38);
      ctx.stroke();

      // Thick lush emerald grass cap with dark outline
      ctx.fillStyle = '#1c3e18'; // Dark grass base / shadow
      ctx.fillRect(0, 0, TS, 11);

      ctx.fillStyle = '#3e7a2b'; // Mid green
      ctx.fillRect(0, 0, TS, 7);

      ctx.fillStyle = '#6ec244'; // Bright sunlit grass blades
      for (let x = 2; x < TS; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, 4);
        ctx.lineTo(x + 2, -3);
        ctx.lineTo(x + 4, 4);
        ctx.fill();
      }

      // Small moss drops hanging over ledge
      ctx.fillStyle = '#2a5a1c';
      ctx.beginPath();
      ctx.arc(8, 11, 4, 0, Math.PI);
      ctx.arc(22, 11, 5, 0, Math.PI);
      ctx.arc(34, 11, 3.5, 0, Math.PI);
      ctx.fill();

      // Top edge dark cartoon border
      ctx.strokeStyle = '#10220e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(TS, 1);
      ctx.stroke();

      this.textures.addCanvas('tile_forest_top', c);
    }
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      // Deep underground strata with buried stones & embedded roots
      ctx.fillStyle = '#22160e';
      ctx.fillRect(0, 0, TS, TS);

      // Embedded smooth river stones
      ctx.fillStyle = '#3a2d24';
      ctx.beginPath();
      ctx.ellipse(12, 16, 8, 6, 0.2, 0, Math.PI * 2);
      ctx.ellipse(30, 26, 9, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Stone highlight
      ctx.fillStyle = '#524236';
      ctx.beginPath();
      ctx.ellipse(10, 14, 5, 3, 0.2, 0, Math.PI * 2);
      ctx.ellipse(28, 24, 6, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Entangled roots
      ctx.strokeStyle = '#180e08';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(18, 12, 40, 6);
      ctx.moveTo(6, 22);
      ctx.quadraticCurveTo(22, 34, 38, 20);
      ctx.stroke();

      this.textures.addCanvas('tile_forest_mid', c);
    }

    // 2. Castle / Library Stone (Top & Mid)
    // Top: Carved gothic flagstones, emerald candlelight rim, moss creeping through mortar
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#1e2824'; // Mortar dark base
      ctx.fillRect(0, 0, TS, TS);

      // Hand-chiseled stone block
      ctx.fillStyle = '#32443c';
      ctx.fillRect(2, 4, TS - 4, TS - 6);

      // Chiseled bevel highlights
      ctx.fillStyle = '#587466'; // Emerald candlelight top highlight
      ctx.fillRect(2, 4, TS - 4, 3);
      ctx.fillStyle = '#22322a'; // Bottom shadow bevel
      ctx.fillRect(2, TS - 4, TS - 4, 2);

      // Mortar borders (dark cartoon outline)
      ctx.strokeStyle = '#0e1612';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 3, TS - 2, TS - 4);

      // Weathered cracks on stone
      drawCracks(ctx, 10, 8, 18, 22, '#141e18');
      drawCracks(ctx, 24, 14, 32, 28, '#141e18');

      // Subtle green moss creeping in corners
      ctx.fillStyle = '#2f6044';
      ctx.fillRect(2, 4, 6, 3);
      ctx.fillRect(30, 4, 7, 3);

      this.textures.addCanvas('tile_castle_top', c);
    }
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      // Sub-floor alternating masonry bricks
      ctx.fillStyle = '#121815';
      ctx.fillRect(0, 0, TS, TS);

      // Two staggered stone courses
      const drawBrick = (bx, by, bw, bh) => {
        ctx.fillStyle = '#2a3832';
        ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
        ctx.fillStyle = '#465e52';
        ctx.fillRect(bx + 1, by + 1, bw - 2, 2);
        ctx.strokeStyle = '#0e1612';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      };

      drawBrick(0, 0, 20, 20);
      drawBrick(20, 0, 20, 20);
      drawBrick(-10, 20, 20, 20);
      drawBrick(10, 20, 20, 20);
      drawBrick(30, 20, 20, 20);

      this.textures.addCanvas('tile_castle_mid', c);
    }

    // 3. Fortress / Ramparts Stone (Top & Mid)
    // Top: Black volcanic basalt, glowing ember cracks, warm orange rim light
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#181214';
      ctx.fillRect(0, 0, TS, TS);

      // Basalt block
      ctx.fillStyle = '#3a2d32';
      ctx.fillRect(2, 4, TS - 4, TS - 6);

      // Warm molten rim reflection
      ctx.fillStyle = '#ff7a3d';
      ctx.fillRect(2, 3, TS - 4, 2);
      ctx.fillStyle = '#9e4a38';
      ctx.fillRect(2, 5, TS - 4, 3);

      // Dark outlines
      ctx.strokeStyle = '#120c0e';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 3, TS - 2, TS - 4);

      // Glowing magma fissures running through stone
      ctx.strokeStyle = '#ff5500';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.lineTo(14, 18);
      ctx.lineTo(24, 22);
      ctx.lineTo(28, 34);
      ctx.stroke();

      // Yellow core heat
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(9, 7);
      ctx.lineTo(14, 18);
      ctx.lineTo(23, 21);
      ctx.stroke();

      this.textures.addCanvas('tile_fortress_top', c);
    }
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#120c0e';
      ctx.fillRect(0, 0, TS, TS);

      // Deep volcanic masonry with ash stains
      const drawFortBrick = (bx, by, bw, bh) => {
        ctx.fillStyle = '#2c2226';
        ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
        ctx.fillStyle = '#4a383e';
        ctx.fillRect(bx + 1, by + 1, bw - 2, 2);
        ctx.strokeStyle = '#100a0c';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      };

      drawFortBrick(0, 0, 20, 20);
      drawFortBrick(20, 0, 20, 20);
      drawFortBrick(-10, 20, 20, 20);
      drawFortBrick(10, 20, 20, 20);
      drawFortBrick(30, 20, 20, 20);

      this.textures.addCanvas('tile_fortress_mid', c);
    }

    // 4. Frostspire Peaks (Glacial Ice & Snow)
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      // Deep glacial ice base
      ctx.fillStyle = '#102232';
      ctx.fillRect(0, 0, TS, TS);

      // Crystalline blue ice block
      ctx.fillStyle = '#2b587a';
      ctx.fillRect(2, 4, TS - 4, TS - 6);

      // Ice highlights
      ctx.fillStyle = '#6ab8e6';
      ctx.fillRect(2, 4, TS - 4, 3);

      // Fresh snow cap with overhangs & hanging icicles
      ctx.fillStyle = '#eef8ff';
      ctx.fillRect(0, 0, TS, 10);
      // Icicles
      ctx.beginPath();
      ctx.moveTo(6, 10); ctx.lineTo(9, 18); ctx.lineTo(12, 10);
      ctx.moveTo(22, 10); ctx.lineTo(25, 22); ctx.lineTo(28, 10);
      ctx.moveTo(32, 10); ctx.lineTo(35, 17); ctx.lineTo(38, 10);
      ctx.fill();

      // Dark cartoon outline
      ctx.strokeStyle = '#0a1622';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 1, TS - 2, TS - 2);

      this.textures.addCanvas('tile_frost_top', c);
    }
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0a1622';
      ctx.fillRect(0, 0, TS, TS);

      // Compressed glacial masonry with ice bubbles
      const drawIceBrick = (bx, by, bw, bh) => {
        ctx.fillStyle = '#1b3b55';
        ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
        ctx.fillStyle = '#3c729c';
        ctx.fillRect(bx + 1, by + 1, bw - 2, 2);
        // Frozen air bubble
        ctx.fillStyle = '#8ecbee';
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#08121c';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      };

      drawIceBrick(0, 0, 20, 20);
      drawIceBrick(20, 0, 20, 20);
      drawIceBrick(-10, 20, 20, 20);
      drawIceBrick(10, 20, 20, 20);
      drawIceBrick(30, 20, 20, 20);

      this.textures.addCanvas('tile_frost_mid', c);
    }

    // 5. The Storm Citadel (Celestial Brass & Storm Stone)
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      // Dark runic obsidian base
      ctx.fillStyle = '#181224';
      ctx.fillRect(0, 0, TS, TS);

      // Electrum brass block
      ctx.fillStyle = '#564228';
      ctx.fillRect(2, 4, TS - 4, TS - 6);

      // Gold rim highlight
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(2, 3, TS - 4, 3);

      // Cyan glowing lightning conduit running through
      ctx.strokeStyle = '#7fd4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 18); ctx.lineTo(16, 24); ctx.lineTo(24, 14); ctx.lineTo(36, 22);
      ctx.stroke();

      ctx.strokeStyle = '#0e0b16';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 3, TS - 2, TS - 4);

      this.textures.addCanvas('tile_storm_top', c);
    }
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0e0b16';
      ctx.fillRect(0, 0, TS, TS);

      const drawCitadelBrick = (bx, by, bw, bh) => {
        ctx.fillStyle = '#2c223c';
        ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
        ctx.fillStyle = '#483860';
        ctx.fillRect(bx + 1, by + 1, bw - 2, 2);
        ctx.strokeStyle = '#0e0b16';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      };

      drawCitadelBrick(0, 0, 20, 20);
      drawCitadelBrick(20, 0, 20, 20);
      drawCitadelBrick(-10, 20, 20, 20);
      drawCitadelBrick(10, 20, 20, 20);
      drawCitadelBrick(30, 20, 20, 20);

      this.textures.addCanvas('tile_storm_mid', c);
    }

    // 6. One-way wooden log platform (Enhanced with timber grain & metal end-brackets)
    {
      const c = this.createCanvas(TS, TS);
      const ctx = c.getContext('2d');
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22140a';

      // Carved wooden plank with 3-tone shading
      ctx.fillStyle = '#4e331c'; // Shadow
      ctx.beginPath();
      ctx.roundRect(0, 2, TS, 16, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#7a522f'; // Mid tone
      ctx.fillRect(2, 4, TS - 4, 10);

      ctx.fillStyle = '#b07f4e'; // Sunlit grain highlight
      ctx.fillRect(3, 4, TS - 6, 2.5);

      // Wood grain lines
      ctx.strokeStyle = '#3d2612';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(6, 9);
      ctx.lineTo(34, 9);
      ctx.moveTo(12, 12);
      ctx.lineTo(28, 12);
      ctx.stroke();

      // Iron rivet bands at ends
      ctx.fillStyle = '#9aa4b2';
      ctx.fillRect(4, 3, 3, 14);
      ctx.fillRect(TS - 7, 3, 3, 14);
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

    // 1. Forest (Dusky golden sunset + misty teal shadows; 5 parallax layers)
    {
      // Layer 0: Sky with golden sunset and misty teal upper gradient
      const c = this.createCanvas(W, H);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#10222a'); // Misty deep teal
      grad.addColorStop(0.45, '#3a5866');
      grad.addColorStop(0.8, '#c97f48'); // Warm golden amber sunset
      grad.addColorStop(1, '#e8aa62');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Sunset sun orb glow
      const sun = ctx.createRadialGradient(280, 310, 15, 280, 310, 300);
      sun.addColorStop(0, 'rgba(255, 235, 175, 0.95)');
      sun.addColorStop(0.3, 'rgba(235, 155, 80, 0.45)');
      sun.addColorStop(1, 'rgba(200, 100, 50, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas('bg_sky_forest', c);
    }
    {
      // Layer 1: Far mountain ridges in deep teal mist
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(38, 64, 76, 0.88)';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= LW; x += 16) {
        const y = 280 + Math.sin(x * 0.004) * 60 + Math.sin(x * 0.012) * 30;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(LW, H);
      ctx.fill();
      this.textures.addCanvas('bg_l1_forest', c);
    }
    {
      // Layer 2: Mid structures / ancient mossy stone ruins & distant tree silhouettes
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (let x = 50; x < LW; x += 150) {
        // Tree trunks
        ctx.fillStyle = '#213635';
        ctx.fillRect(x, 0, 36, H);
        ctx.fillStyle = 'rgba(235, 170, 100, 0.15)';
        ctx.fillRect(x + 24, 0, 8, H);
        // Ruin arches
        if (x % 300 === 50) {
          ctx.fillStyle = '#1a2b2c';
          ctx.fillRect(x + 40, 200, 70, H - 200);
          ctx.clearRect(x + 52, 240, 46, H - 240);
        }
      }
      this.textures.addCanvas('bg_l2_forest', c);
    }
    {
      // Layer 3: Near ancient giant tree trunks & dangling hanging moss/roots
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (let x = 100; x < LW; x += 280) {
        ctx.fillStyle = '#14221f';
        ctx.fillRect(x, 0, 58, H);
        // Hanging roots / vines
        ctx.strokeStyle = '#264228';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x + 12, 0);
        ctx.quadraticCurveTo(x + 40, 180, x + 24, 340);
        ctx.stroke();
      }
      this.textures.addCanvas('bg_l3_forest', c);
    }
    {
      // Layer 4: FOREGROUND silhouettes passing in front of camera at 28% alpha
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(8, 14, 12, 0.28)';
      for (let x = 160; x < LW; x += 480) {
        // Massive foreground tree trunk passing right by camera
        ctx.fillRect(x, 0, 90, H);
        // Foreground foliage canopy fringe dipping from top
        ctx.beginPath();
        ctx.arc(x + 45, 0, 160, 0, Math.PI);
        ctx.fill();
      }
      this.textures.addCanvas('bg_fg_forest', c);
    }

    // 2. Castle / Library (Emerald candlelight + dusty gold; 5 parallax layers)
    {
      // Layer 0: Sky / Room Gloom with dusty gold candlelight warmth
      const c = this.createCanvas(W, H);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#06120e'); // Deep emerald night
      grad.addColorStop(0.5, '#12261e');
      grad.addColorStop(1, '#243222'); // Dusty gold ambience
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Warm candlelight radial glow
      const glow = ctx.createRadialGradient(W / 2, H * 0.6, 20, W / 2, H * 0.6, 360);
      glow.addColorStop(0, 'rgba(235, 195, 110, 0.35)');
      glow.addColorStop(0.5, 'rgba(120, 160, 110, 0.15)');
      glow.addColorStop(1, 'rgba(10, 30, 20, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas('bg_sky_castle', c);
    }
    {
      // Layer 1: Far grand arched gothic windows casting emerald-green god rays
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0c1813';
      ctx.fillRect(0, 0, LW, H);
      for (let x = 120; x < LW; x += 320) {
        const wg = ctx.createLinearGradient(0, 70, 0, 440);
        wg.addColorStop(0, 'rgba(130, 215, 165, 0.45)'); // Emerald light
        wg.addColorStop(0.8, 'rgba(70, 130, 95, 0.12)');
        wg.addColorStop(1, 'rgba(30, 60, 45, 0)');
        ctx.fillStyle = wg;
        ctx.beginPath();
        ctx.moveTo(x, 440);
        ctx.lineTo(x, 160);
        ctx.arc(x + 55, 160, 55, Math.PI, 0);
        ctx.lineTo(x + 110, 440);
        ctx.fill();
      }
      this.textures.addCanvas('bg_l1_castle', c);
    }
    {
      // Layer 2: Massive antique bookcases with multi-colored tome spines
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      const bookColors = ['#6e2626', '#264e6e', '#3c6e26', '#8a6e26', '#4e266e', '#884422'];
      for (let x = 40; x < LW; x += 280) {
        ctx.fillStyle = '#1a120c';
        ctx.fillRect(x, 130, 210, H - 130);
        for (let shelfY = 150; shelfY < H - 40; shelfY += 52) {
          ctx.fillStyle = '#0a0705';
          ctx.fillRect(x + 8, shelfY, 194, 42);
          let bx = x + 10;
          while (bx < x + 196) {
            const bw = 9 + (bx % 7);
            const bh = 26 + (bx % 14);
            ctx.fillStyle = bookColors[(bx) % bookColors.length];
            ctx.fillRect(bx, shelfY + 42 - bh, bw, bh);
            // Gold gilded leaf spine lines
            if (bx % 3 === 0) {
              ctx.fillStyle = '#e8c255';
              ctx.fillRect(bx + 2, shelfY + 42 - bh + 4, bw - 4, 2);
            }
            bx += bw + 2;
          }
        }
      }
      this.textures.addCanvas('bg_l2_castle', c);
    }
    {
      // Layer 3: Near gothic carved stone pillars & hanging brass lanterns
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (let x = 160; x < LW; x += 420) {
        ctx.fillStyle = '#0a1410';
        ctx.fillRect(x, 0, 68, H);
        ctx.fillStyle = '#1c342a';
        ctx.fillRect(x + 8, 0, 8, H);
        // Pillar capitals / base
        ctx.fillStyle = '#223e32';
        ctx.fillRect(x - 6, 80, 80, 16);
        ctx.fillRect(x - 6, H - 60, 80, 16);
      }
      this.textures.addCanvas('bg_l3_castle', c);
    }
    {
      // Layer 4: FOREGROUND library gothic pillars passing in front of camera at 28% alpha
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(4, 10, 8, 0.28)';
      for (let x = 220; x < LW; x += 520) {
        ctx.fillRect(x, 0, 110, H);
      }
      this.textures.addCanvas('bg_fg_castle', c);
    }

    // 3. Fortress / Ramparts (Ember orange + smoky purple; 5 parallax layers)
    {
      // Layer 0: Burning sky with ember orange & deep smoky purple zenith
      const c = this.createCanvas(W, H);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#220e24'); // Smoky dark purple
      grad.addColorStop(0.35, '#561c3a');
      grad.addColorStop(0.7, '#ba4828'); // Intense ember orange
      grad.addColorStop(1, '#f29c48');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas('bg_sky_fortress', c);
    }
    {
      // Layer 1: Billowing billowing volcanic smoke columns & ash plumes
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (const px of [220, 680, 1180, 1640]) {
        let x = px, y = H, r = 45;
        while (y > -60) {
          ctx.fillStyle = 'rgba(46, 26, 40, 0.45)';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          y -= r * 0.58;
          r *= 1.05;
          x += 12;
        }
      }
      this.textures.addCanvas('bg_l1_fortress', c);
    }
    {
      // Layer 2: Distant obsidian watchtowers with glowing molten lava slits
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      for (let x = 80; x < LW; x += 210) {
        const h = 210 + (x % 140);
        ctx.fillStyle = '#422430';
        ctx.fillRect(x, H - h, 56, h);
        // Molten windows
        ctx.fillStyle = 'rgba(255, 140, 45, 0.9)';
        for (let k = 0; k < 3; k++) {
          ctx.fillRect(x + 24, H - h + 32 + k * 44, 8, 14);
        }
      }
      this.textures.addCanvas('bg_l2_fortress', c);
    }
    {
      // Layer 3: Crenellated basalt rampart battlements
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#2a141e';
      ctx.fillRect(0, 410, LW, H - 410);
      for (let x = 0; x < LW; x += 44) {
        ctx.fillRect(x, 390, 26, 22);
      }
      this.textures.addCanvas('bg_l3_fortress', c);
    }
    {
      // Layer 4: FOREGROUND basalt battlements & hanging iron chains passing by camera at 32% alpha
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(18, 6, 12, 0.32)';
      for (let x = 180; x < LW; x += 540) {
        ctx.fillRect(x, 0, 100, H);
        // Massive hanging chains
        for (let y = 0; y < H; y += 40) {
          ctx.beginPath();
          ctx.ellipse(x + 50, y, 16, 26, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      this.textures.addCanvas('bg_fg_fortress', c);
    }

    // 4. Frostspire Peaks (Glacial Aurora + Blizzard 5 Parallax Layers)
    {
      const c = this.createCanvas(W, H);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a1626');
      grad.addColorStop(0.4, '#1b3d5c');
      grad.addColorStop(0.8, '#4a8bb8');
      grad.addColorStop(1, '#a6d9f8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas('bg_sky_frost', c);
    }
    {
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      // Drifting snow clouds
      for (const px of [180, 620, 1100, 1580]) {
        ctx.fillStyle = 'rgba(210, 235, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(px, 120, 80, 0, Math.PI * 2);
        ctx.arc(px + 60, 110, 100, 0, Math.PI * 2);
        ctx.fill();
      }
      this.textures.addCanvas('bg_l1_frost', c);
    }
    {
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      // Sharp snowy mountain silhouettes
      ctx.fillStyle = '#264e72';
      for (let x = 0; x < LW; x += 180) {
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.lineTo(x + 90, H - 240);
        ctx.lineTo(x + 180, H);
        ctx.fill();
        // Snow caps
        ctx.fillStyle = '#d8efff';
        ctx.beginPath();
        ctx.moveTo(x + 60, H - 160);
        ctx.lineTo(x + 90, H - 240);
        ctx.lineTo(x + 120, H - 160);
        ctx.fill();
        ctx.fillStyle = '#264e72';
      }
      this.textures.addCanvas('bg_l2_frost', c);
    }
    {
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      // Frosted pine trees & ice pillars
      ctx.fillStyle = '#142d44';
      for (let x = 40; x < LW; x += 90) {
        ctx.fillRect(x + 8, H - 160, 12, 160);
        for (let t = 0; t < 4; t++) {
          ctx.beginPath();
          ctx.moveTo(x - 14 + t * 4, H - 80 - t * 24);
          ctx.lineTo(x + 14, H - 110 - t * 24);
          ctx.lineTo(x + 42 - t * 4, H - 80 - t * 24);
          ctx.fill();
        }
      }
      this.textures.addCanvas('bg_l3_frost', c);
    }
    {
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(180, 220, 255, 0.28)';
      // Giant hanging icicles in foreground
      for (let x = 120; x < LW; x += 480) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x + 20, 140); ctx.lineTo(x + 40, 0);
        ctx.moveTo(x + 35, 0); ctx.lineTo(x + 50, 190); ctx.lineTo(x + 65, 0);
        ctx.fill();
      }
      this.textures.addCanvas('bg_fg_frost', c);
    }

    // 5. The Storm Citadel (Thunder Indigo + Floating Islands 5 Parallax Layers)
    {
      const c = this.createCanvas(W, H);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#100b20');
      grad.addColorStop(0.4, '#261642');
      grad.addColorStop(0.8, '#482a72');
      grad.addColorStop(1, '#7242a8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas('bg_sky_storm', c);
    }
    {
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      // Dark churning thunderstorm clouds
      for (const px of [150, 580, 1050, 1500]) {
        ctx.fillStyle = 'rgba(38, 22, 66, 0.55)';
        ctx.beginPath();
        ctx.arc(px, 140, 95, 0, Math.PI * 2);
        ctx.arc(px + 70, 120, 120, 0, Math.PI * 2);
        ctx.fill();
      }
      this.textures.addCanvas('bg_l1_storm', c);
    }
    {
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      // Distant floating sky islands with towers
      ctx.fillStyle = '#321d4e';
      for (let x = 60; x < LW; x += 260) {
        ctx.beginPath();
        ctx.ellipse(x + 70, 260, 75, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 50, 180, 40, 80);
      }
      this.textures.addCanvas('bg_l2_storm', c);
    }
    {
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      // Citadel battlements and brass lightning towers
      ctx.fillStyle = '#1c102c';
      ctx.fillRect(0, 420, LW, H - 420);
      for (let x = 80; x < LW; x += 180) {
        ctx.fillRect(x, 340, 24, 80);
        // Lightning rod tip
        ctx.fillStyle = '#7fd4ff';
        ctx.fillRect(x + 10, 310, 4, 30);
        ctx.fillStyle = '#1c102c';
      }
      this.textures.addCanvas('bg_l3_storm', c);
    }
    {
      const c = this.createCanvas(LW, H);
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(16, 8, 30, 0.32)';
      // Spires passing by in foreground
      for (let x = 200; x < LW; x += 520) {
        ctx.fillRect(x, 0, 80, H);
        ctx.fillStyle = 'rgba(127, 212, 255, 0.25)';
        ctx.fillRect(x + 36, 0, 8, H);
        ctx.fillStyle = 'rgba(16, 8, 30, 0.32)';
      }
      this.textures.addCanvas('bg_fg_storm', c);
    }
  }
}
