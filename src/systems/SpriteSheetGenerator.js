/**
 * Stormhammer Real Sprite Sheet & Animation Engine
 * Generates comprehensive multi-frame sprite sheets for Hero, Enemies, Tilesets, and Props.
 * Registers full Phaser 3 animations: idle, run, jump, apex, fall, land, swing, throw, catch, hurt, death, double-jump flip.
 */
export class SpriteSheetGenerator {
  constructor(scene) {
    this.scene = scene;
  }

  generateAll() {
    this.createHeroSheet();
    this.createGruntSheets();
    this.createBatSheet();
    this.createBruteSheet();
    this.createCasterSheets();
    this.createPropTextures();
    this.registerAnimations();
  }

  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // ==========================================
  // 1. HERO SPRITESHEET (64x64 per frame)
  // Total frames: 40 frames arranged in a 10x4 grid (640x256 px)
  // Frames 0-5: Idle (6f)
  // Frames 6-13: Run (8f)
  // Frames 14-17: Jump up (14), Apex (15), Fall (16), Land (17)
  // Frames 18-22: Swing melee (5f)
  // Frames 23-25: Throw (3f)
  // Frames 26-27: Catch (2f)
  // Frame 28: Hurt (1f)
  // Frames 29-34: Death (6f)
  // Frames 35-39: Double-jump flip (5f)
  // ==========================================
  createHeroSheet() {
    const FW = 64;
    const FH = 64;
    const cols = 10;
    const rows = 4;
    const canvas = this.createCanvas(FW * cols, FH * rows);
    const ctx = canvas.getContext('2d');

    const drawHeroFrame = (fx, fy, state, frameIndex, totalFrames) => {
      ctx.save();
      ctx.translate(fx * FW + 32, fy * FH + 54);

      const progress = frameIndex / Math.max(1, totalFrames - 1);

      // Animation parameters
      let legL = 0, legR = 0, bobY = 0, capeAngle = 0, torsoAngle = 0;
      let armAngle = 0, armExt = 0, flipAngle = 0, deathCollapse = 0, hurtFlash = false;

      if (state === 'idle') {
        bobY = Math.sin(progress * Math.PI * 2) * 2;
        capeAngle = Math.sin(progress * Math.PI * 2) * 0.15;
      } else if (state === 'run') {
        const cycle = progress * Math.PI * 2;
        legL = Math.sin(cycle) * 12;
        legR = -Math.sin(cycle) * 12;
        bobY = -Math.abs(Math.sin(cycle)) * 4;
        capeAngle = -0.45 + Math.sin(cycle) * 0.2;
        torsoAngle = 0.08;
      } else if (state === 'jump') {
        legL = -4; legR = 4; bobY = -2; capeAngle = -0.5;
      } else if (state === 'apex') {
        legL = -2; legR = 2; bobY = 0; capeAngle = -0.2;
      } else if (state === 'fall') {
        legL = 3; legR = -3; bobY = 1; capeAngle = 0.4;
      } else if (state === 'land') {
        bobY = frameIndex === 0 ? 5 : 2;
        legL = -6; legR = 6; capeAngle = 0.1;
      } else if (state === 'swing') {
        // 5 frames: 0=windup back, 1=slash start, 2=impact strike, 3=followthrough, 4=recover
        torsoAngle = [-0.15, 0.1, 0.25, 0.3, 0.1][frameIndex] || 0;
        armAngle = [-1.8, -0.6, 0.8, 1.6, 0.3][frameIndex] || 0;
        capeAngle = [-0.2, 0.1, 0.5, 0.6, 0.2][frameIndex] || 0;
      } else if (state === 'throw') {
        torsoAngle = [-0.2, 0.25, 0.35][frameIndex] || 0;
        armAngle = [-1.5, 0.6, 1.4][frameIndex] || 0;
        capeAngle = -0.4;
      } else if (state === 'catch') {
        torsoAngle = -0.1;
        armAngle = -0.8 + frameIndex * 0.4;
        capeAngle = 0.1;
      } else if (state === 'hurt') {
        torsoAngle = -0.3;
        bobY = 3;
        hurtFlash = true;
      } else if (state === 'death') {
        deathCollapse = progress * 24;
        torsoAngle = progress * 1.2;
        capeAngle = progress * 0.8;
      } else if (state === 'flip') {
        flipAngle = progress * Math.PI * 2;
      }

      if (flipAngle !== 0) {
        ctx.translate(0, -20);
        ctx.rotate(flipAngle);
        ctx.translate(0, 20);
      }

      ctx.translate(0, bobY + deathCollapse);
      ctx.rotate(torsoAngle);

      // --- Red Fluttering Cape ---
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#a8323b';
      ctx.beginPath();
      ctx.moveTo(-4, -36);
      ctx.quadraticCurveTo(-18 + capeAngle * 30, -22, -14 + capeAngle * 40, -4);
      ctx.lineTo(-2, -14);
      ctx.closePath();
      ctx.fill();

      // --- Legs & Boots ---
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#252d40';
      ctx.fillRect(-6 + legL, -16, 5, 12);
      ctx.fillRect(1 + legR, -16, 5, 12);

      ctx.fillStyle = hurtFlash ? '#ffffff' : '#4a2f1e'; // Leather boots
      ctx.fillRect(-7 + legL, -6, 7, 7);
      ctx.fillRect(0 + legR, -6, 7, 7);

      // --- Tunic & Chest Armor ---
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#2f5d8a';
      ctx.beginPath();
      ctx.roundRect(-9, -38, 18, 22, 4);
      ctx.fill();

      ctx.fillStyle = hurtFlash ? '#ffffff' : '#c4ccd4'; // Silver chestplate
      ctx.fillRect(-7, -36, 14, 8);
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#5a3a1e'; // Belt
      ctx.fillRect(-9, -20, 18, 4);
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#f2c14e'; // Golden buckle
      ctx.fillRect(-2, -20, 4, 4);

      // --- Head & Face ---
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#e2ad7f';
      ctx.beginPath();
      ctx.arc(1, -45, 8, 0, Math.PI * 2);
      ctx.fill();

      // --- Silver Winged Helmet ---
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#b8c2cc';
      ctx.beginPath();
      ctx.arc(1, -46, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-8, -47, 18, 3);

      // Norse Helmet Wing
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#f4f6f8';
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

      // --- Arm & Hands ---
      ctx.save();
      ctx.translate(2, -32);
      ctx.rotate(armAngle);
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#2f5d8a';
      ctx.fillRect(-3, 0, 6, 9);
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#e2ad7f';
      ctx.fillRect(-3, 8, 6, 6);
      ctx.restore();

      ctx.restore();
    };

    // Draw Idle (0-5)
    for (let i = 0; i < 6; i++) drawHeroFrame(i, 0, 'idle', i, 6);

    // Draw Run (6-13)
    for (let i = 0; i < 4; i++) drawHeroFrame(6 + i, 0, 'run', i, 8);
    for (let i = 0; i < 4; i++) drawHeroFrame(i, 1, 'run', 4 + i, 8);

    // Jump Up (14), Apex (15), Fall (16), Land (17)
    drawHeroFrame(4, 1, 'jump', 0, 1);
    drawHeroFrame(5, 1, 'apex', 0, 1);
    drawHeroFrame(6, 1, 'fall', 0, 1);
    drawHeroFrame(7, 1, 'land', 0, 2);
    drawHeroFrame(8, 1, 'land', 1, 2);

    // Melee Swing (18-22)
    drawHeroFrame(9, 1, 'swing', 0, 5);
    for (let i = 0; i < 4; i++) drawHeroFrame(i, 2, 'swing', 1 + i, 5);

    // Throw (23-25)
    for (let i = 0; i < 3; i++) drawHeroFrame(4 + i, 2, 'throw', i, 3);

    // Catch (26-27)
    for (let i = 0; i < 2; i++) drawHeroFrame(7 + i, 2, 'catch', i, 2);

    // Hurt (28)
    drawHeroFrame(9, 2, 'hurt', 0, 1);

    // Death (29-34)
    for (let i = 0; i < 6; i++) drawHeroFrame(i, 3, 'death', i, 6);

    // Double-jump flip (35-39)
    for (let i = 0; i < 4; i++) drawHeroFrame(6 + i, 3, 'flip', i, 5);

    this.scene.textures.addSpriteSheet('hero_sheet', canvas, {
      frameWidth: FW,
      frameHeight: FH
    });
  }

  // ==========================================
  // 2. ENEMY GRUNT SPRITESHEETS (48x48)
  // Walk 6f, Hurt 1f, Death 5f
  // ==========================================
  createGruntSheets() {
    const FW = 48;
    const FH = 48;
    const themes = [
      { name: 'forest', color: '#647f3c', belly: '#8aa358' },
      { name: 'castle', color: '#cdc5ae', belly: '#e7e0cb' },
      { name: 'fortress', color: '#b8543c', belly: '#e08454' }
    ];

    themes.forEach(t => {
      const canvas = this.createCanvas(FW * 12, FH);
      const ctx = canvas.getContext('2d');

      const drawGrunt = (idx, state, progress) => {
        ctx.save();
        ctx.translate(idx * FW + 24, 44);

        let walkY = 0, legL = 0, legR = 0, deathDrop = 0;
        if (state === 'walk') {
          const cycle = progress * Math.PI * 2;
          legL = Math.sin(cycle) * 6;
          legR = -Math.sin(cycle) * 6;
          walkY = -Math.abs(Math.sin(cycle)) * 3;
        } else if (state === 'death') {
          deathDrop = progress * 14;
        }

        ctx.translate(0, walkY + deathDrop);

        // Legs
        ctx.fillStyle = state === 'hurt' ? '#fff' : '#2a2420';
        ctx.fillRect(-8 + legL, -8, 5, 8);
        ctx.fillRect(3 + legR, -8, 5, 8);

        // Body
        ctx.fillStyle = state === 'hurt' ? '#fff' : t.color;
        ctx.beginPath();
        ctx.ellipse(0, -22, 14, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horns / Ears
        ctx.beginPath();
        ctx.moveTo(-10, -32);
        ctx.lineTo(-18, -42);
        ctx.lineTo(-6, -34);
        ctx.moveTo(10, -32);
        ctx.lineTo(18, -42);
        ctx.lineTo(6, -34);
        ctx.fill();

        // Belly
        ctx.fillStyle = state === 'hurt' ? '#fff' : t.belly;
        ctx.beginPath();
        ctx.ellipse(1, -18, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = state === 'hurt' ? '#ff3a3a' : '#fff6d0';
        ctx.fillRect(3, -26, 3, 4);
        ctx.fillRect(8, -26, 3, 4);

        ctx.restore();
      };

      // Walk (0-5)
      for (let i = 0; i < 6; i++) drawGrunt(i, 'walk', i / 6);
      // Hurt (6)
      drawGrunt(6, 'hurt', 1);
      // Death (7-11)
      for (let i = 0; i < 5; i++) drawGrunt(7 + i, 'death', i / 4);

      this.scene.textures.addSpriteSheet(`enemy_grunt_sheet_${t.name}`, canvas, {
        frameWidth: FW,
        frameHeight: FH
      });
    });
  }

  // ==========================================
  // 3. ENEMY BAT SPRITESHEET (36x36)
  // Fly 6f, Swoop 3f, Death 4f
  // ==========================================
  createBatSheet() {
    const FW = 36;
    const FH = 36;
    const canvas = this.createCanvas(FW * 13, FH);
    const ctx = canvas.getContext('2d');

    const drawBat = (idx, flapAngle, isSwoop) => {
      ctx.save();
      ctx.translate(idx * FW + 18, 18);

      ctx.fillStyle = '#2e2140';
      // Left Wing
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-16, -flapAngle);
      ctx.lineTo(-12, 4);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-4, 6);
      ctx.fill();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(16, -flapAngle);
      ctx.lineTo(12, 4);
      ctx.lineTo(8, 0);
      ctx.lineTo(4, 6);
      ctx.fill();

      // Body & Ears
      ctx.fillStyle = '#43305c';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Glowing red eyes
      ctx.fillStyle = '#ff4a4a';
      ctx.fillRect(-3, -2, 2, 2);
      ctx.fillRect(1, -2, 2, 2);

      ctx.restore();
    };

    // Fly (0-5)
    for (let i = 0; i < 6; i++) {
      const angle = Math.sin((i / 6) * Math.PI * 2) * 12;
      drawBat(i, angle, false);
    }

    // Swoop (6-8)
    for (let i = 0; i < 3; i++) {
      drawBat(6 + i, 8 + i * 4, true);
    }

    // Death (9-12)
    for (let i = 0; i < 4; i++) {
      drawBat(9 + i, -8, false);
    }

    this.scene.textures.addSpriteSheet('enemy_bat_sheet', canvas, {
      frameWidth: FW,
      frameHeight: FH
    });
  }

  // ==========================================
  // 4. ENEMY BRUTE SPRITESHEET (64x64)
  // Walk 6f, Windup 4f, Charge 4f, Death 5f
  // ==========================================
  createBruteSheet() {
    const FW = 64;
    const FH = 64;
    const canvas = this.createCanvas(FW * 19, FH);
    const ctx = canvas.getContext('2d');

    const drawBrute = (idx, state, progress) => {
      ctx.save();
      ctx.translate(idx * FW + 32, 58);

      let shakeX = 0, chargeLeg = 0;
      if (state === 'windup') {
        shakeX = (Math.random() - 0.5) * 4;
      } else if (state === 'charge') {
        chargeLeg = Math.sin(progress * Math.PI * 2) * 8;
      }

      ctx.translate(shakeX, 0);

      // Legs
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(-15 + chargeLeg, -12, 11, 12);
      ctx.fillRect(4 - chargeLeg, -12, 11, 12);

      // Torso
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

      ctx.fillStyle = '#e8e2d0'; // Horns
      ctx.beginPath();
      ctx.moveTo(-12, -54);
      ctx.lineTo(-20, -64);
      ctx.lineTo(-8, -56);
      ctx.moveTo(16, -54);
      ctx.lineTo(24, -64);
      ctx.lineTo(12, -56);
      ctx.fill();

      // Eyes (glowing menacing red during windup & charge)
      ctx.fillStyle = (state === 'windup' || state === 'charge') ? '#ff2a1a' : '#ffd27a';
      ctx.fillRect(3, -44, 4, 3);
      ctx.fillRect(10, -44, 4, 3);

      // Wooden club
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(16, -34, 7, 32);
      ctx.fillStyle = '#3e2814';
      ctx.beginPath();
      ctx.roundRect(13, -12, 13, 16, 4);
      ctx.fill();

      ctx.restore();
    };

    // Walk (0-5)
    for (let i = 0; i < 6; i++) drawBrute(i, 'walk', i / 6);
    // Windup (6-9)
    for (let i = 0; i < 4; i++) drawBrute(6 + i, 'windup', i / 4);
    // Charge (10-13)
    for (let i = 0; i < 4; i++) drawBrute(10 + i, 'charge', i / 4);
    // Death (14-18)
    for (let i = 0; i < 5; i++) drawBrute(14 + i, 'death', i / 5);

    this.scene.textures.addSpriteSheet('enemy_brute_sheet', canvas, {
      frameWidth: FW,
      frameHeight: FH
    });
  }

  // ==========================================
  // 5. ENEMY CASTER SPRITESHEET (48x56)
  // Hover 6f, Charge 4f, Cast 3f, Death 5f
  // ==========================================
  createCasterSheets() {
    const FW = 48;
    const FH = 56;

    ['castle', 'fortress'].forEach(themeName => {
      const canvas = this.createCanvas(FW * 18, FH);
      const ctx = canvas.getContext('2d');
      const robeColor = themeName === 'fortress' ? '#5a1f2a' : '#2c3e5a';

      const drawCaster = (idx, state, progress) => {
        ctx.save();
        ctx.translate(idx * FW + 24, 50);

        const hovY = Math.sin(progress * Math.PI * 2) * 4;
        ctx.translate(0, hovY);

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

        ctx.fillStyle = '#0a0810';
        ctx.beginPath();
        ctx.arc(3, -31, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffd27a';
        ctx.fillRect(2, -33, 2, 2);
        ctx.fillRect(6, -33, 2, 2);

        // Charging energy orb
        if (state === 'charge') {
          const r = 4 + progress * 8;
          ctx.fillStyle = 'rgba(255, 154, 61, 0.85)';
          ctx.beginPath();
          ctx.arc(16, -24, r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      };

      // Hover (0-5)
      for (let i = 0; i < 6; i++) drawCaster(i, 'hover', i / 6);
      // Charge (6-9)
      for (let i = 0; i < 4; i++) drawCaster(6 + i, 'charge', i / 4);
      // Cast (10-12)
      for (let i = 0; i < 3; i++) drawCaster(10 + i, 'cast', i / 3);
      // Death (13-17)
      for (let i = 0; i < 5; i++) drawCaster(13 + i, 'death', i / 5);

      this.scene.textures.addSpriteSheet(`enemy_caster_sheet_${themeName}`, canvas, {
        frameWidth: FW,
        frameHeight: FH
      });
    });
  }

  // ==========================================
  // 6. BACKGROUND PROPS TEXTURES
  // Lanterns, chains, banners, broken pillars, barrels
  // ==========================================
  createPropTextures() {
    // 1. Hanging Lantern
    {
      const c = this.createCanvas(24, 40);
      const ctx = c.getContext('2d');
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(12, 16);
      ctx.stroke();

      ctx.fillStyle = '#1e242c';
      ctx.fillRect(6, 16, 12, 16);
      ctx.fillStyle = '#ffcf7a';
      ctx.fillRect(8, 20, 8, 8);
      this.scene.textures.addCanvas('prop_lantern', c);
    }

    // 2. Hanging Chain
    {
      const c = this.createCanvas(12, 48);
      const ctx = c.getContext('2d');
      ctx.strokeStyle = '#3a424e';
      ctx.lineWidth = 2.5;
      for (let y = 4; y < 44; y += 8) {
        ctx.beginPath();
        ctx.ellipse(6, y, 3, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      this.scene.textures.addCanvas('prop_chain', c);
    }

    // 3. Gothic Castle Banner
    {
      const c = this.createCanvas(28, 56);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#1c2e40';
      ctx.fillRect(2, 0, 24, 44);
      ctx.beginPath();
      ctx.moveTo(2, 44);
      ctx.lineTo(14, 54);
      ctx.lineTo(26, 44);
      ctx.fill();

      // Gold crest
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(14, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      this.scene.textures.addCanvas('prop_banner', c);
    }

    // 4. Wooden Barrel
    {
      const c = this.createCanvas(28, 34);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#6b482b';
      ctx.beginPath();
      ctx.roundRect(2, 2, 24, 30, 4);
      ctx.fill();

      ctx.fillStyle = '#3a2718';
      ctx.fillRect(2, 8, 24, 3);
      ctx.fillRect(2, 23, 24, 3);
      this.scene.textures.addCanvas('prop_barrel', c);
    }
  }

  // ==========================================
  // 7. REGISTER PHASER ANIMATIONS
  // ==========================================
  registerAnimations() {
    const anims = this.scene.anims;

    // --- Hero Animations ---
    anims.create({
      key: 'hero_anim_idle',
      frames: anims.generateFrameNumbers('hero_sheet', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'hero_anim_run',
      frames: anims.generateFrameNumbers('hero_sheet', { start: 6, end: 13 }),
      frameRate: 14,
      repeat: -1
    });

    anims.create({
      key: 'hero_anim_jump_up',
      frames: [{ key: 'hero_sheet', frame: 14 }],
      frameRate: 1
    });

    anims.create({
      key: 'hero_anim_apex',
      frames: [{ key: 'hero_sheet', frame: 15 }],
      frameRate: 1
    });

    anims.create({
      key: 'hero_anim_fall',
      frames: [{ key: 'hero_sheet', frame: 16 }],
      frameRate: 1
    });

    anims.create({
      key: 'hero_anim_land',
      frames: anims.generateFrameNumbers('hero_sheet', { start: 17, end: 18 }),
      frameRate: 10,
      repeat: 0
    });

    anims.create({
      key: 'hero_anim_swing',
      frames: anims.generateFrameNumbers('hero_sheet', { start: 19, end: 23 }),
      frameRate: 16,
      repeat: 0
    });

    anims.create({
      key: 'hero_anim_throw',
      frames: anims.generateFrameNumbers('hero_sheet', { start: 24, end: 26 }),
      frameRate: 12,
      repeat: 0
    });

    anims.create({
      key: 'hero_anim_catch',
      frames: anims.generateFrameNumbers('hero_sheet', { start: 27, end: 28 }),
      frameRate: 10,
      repeat: 0
    });

    anims.create({
      key: 'hero_anim_hurt',
      frames: [{ key: 'hero_sheet', frame: 29 }],
      frameRate: 1
    });

    anims.create({
      key: 'hero_anim_death',
      frames: anims.generateFrameNumbers('hero_sheet', { start: 30, end: 35 }),
      frameRate: 8,
      repeat: 0
    });

    anims.create({
      key: 'hero_anim_flip',
      frames: anims.generateFrameNumbers('hero_sheet', { start: 36, end: 39 }),
      frameRate: 16,
      repeat: 0
    });

    // --- Enemy Grunt Animations ---
    ['forest', 'castle', 'fortress'].forEach(theme => {
      anims.create({
        key: `grunt_anim_walk_${theme}`,
        frames: anims.generateFrameNumbers(`enemy_grunt_sheet_${theme}`, { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });
      anims.create({
        key: `grunt_anim_hurt_${theme}`,
        frames: [{ key: `enemy_grunt_sheet_${theme}`, frame: 6 }],
        frameRate: 1
      });
      anims.create({
        key: `grunt_anim_death_${theme}`,
        frames: anims.generateFrameNumbers(`enemy_grunt_sheet_${theme}`, { start: 7, end: 11 }),
        frameRate: 10,
        repeat: 0
      });
    });

    // --- Enemy Bat Animations ---
    anims.create({
      key: 'bat_anim_fly',
      frames: anims.generateFrameNumbers('enemy_bat_sheet', { start: 0, end: 5 }),
      frameRate: 12,
      repeat: -1
    });

    // --- Enemy Brute Animations ---
    anims.create({
      key: 'brute_anim_walk',
      frames: anims.generateFrameNumbers('enemy_brute_sheet', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    });
    anims.create({
      key: 'brute_anim_windup',
      frames: anims.generateFrameNumbers('enemy_brute_sheet', { start: 6, end: 9 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: 'brute_anim_charge',
      frames: anims.generateFrameNumbers('enemy_brute_sheet', { start: 10, end: 13 }),
      frameRate: 12,
      repeat: -1
    });

    // --- Enemy Caster Animations ---
    ['castle', 'fortress'].forEach(theme => {
      anims.create({
        key: `caster_anim_idle_${theme}`,
        frames: anims.generateFrameNumbers(`enemy_caster_sheet_${theme}`, { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1
      });
      anims.create({
        key: `caster_anim_charge_${theme}`,
        frames: anims.generateFrameNumbers(`enemy_caster_sheet_${theme}`, { start: 6, end: 9 }),
        frameRate: 8,
        repeat: -1
      });
    });
  }
}
