/**
 * Stormhammer Real Sprite Sheet & Animation Engine
 * Generates comprehensive multi-frame sprite sheets for Hero, Enemies, Tilesets, and Props.
 * Hero is scaled up to 96x96 (character ~80px tall) with dark outlines, 3-tone shading, and rim lighting.
 * Enemies & Bosses redesigned with distinct readable silhouettes and telegraphed animation frames.
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
  // 1. HERO SPRITESHEET (96x96 per frame, hero ~80px tall)
  // Total frames: 40 frames arranged in a 10x4 grid (960x384 px)
  // Character design: Original Storm-Smith warrior
  // Silver winged/horned storm-smith helm with glowing cyan visor slit,
  // Layered stormplate chest with golden runic lightning core,
  // Deep indigo/navy tunic with gold trim, thick leather boots with steel greaves,
  // 3-tone shading + warm key rim lighting + 2-3px dark cartoon outlines.
  // ==========================================
  createHeroSheet() {
    const FW = 96;
    const FH = 96;
    const cols = 10;
    const rows = 4;
    const canvas = this.createCanvas(FW * cols, FH * rows);
    const ctx = canvas.getContext('2d');

    const drawHeroFrame = (fx, fy, state, frameIndex, totalFrames) => {
      ctx.save();
      // Feet baseline at y = 88
      ctx.translate(fx * FW + 48, fy * FH + 88);

      const progress = frameIndex / Math.max(1, totalFrames - 1);

      // Animation parameters
      let legL = 0, legR = 0, bobY = 0, capeAngle = 0, torsoAngle = 0;
      let armAngle = 0, flipAngle = 0, deathCollapse = 0, hurtFlash = false;
      let hammerGlowArcs = false;

      if (state === 'idle') {
        bobY = Math.sin(progress * Math.PI * 2) * 2.5;
        capeAngle = Math.sin(progress * Math.PI * 2) * 0.18;
      } else if (state === 'run') {
        const cycle = progress * Math.PI * 2;
        legL = Math.sin(cycle) * 16;
        legR = -Math.sin(cycle) * 16;
        bobY = -Math.abs(Math.sin(cycle)) * 6;
        capeAngle = -0.5 + Math.sin(cycle) * 0.25;
        torsoAngle = 0.1;
      } else if (state === 'jump') {
        legL = -6; legR = 6; bobY = -3; capeAngle = -0.6; torsoAngle = -0.05;
      } else if (state === 'apex') {
        legL = -3; legR = 3; bobY = 0; capeAngle = -0.2;
      } else if (state === 'fall') {
        legL = 5; legR = -5; bobY = 2; capeAngle = 0.5; torsoAngle = 0.05;
      } else if (state === 'land') {
        bobY = frameIndex === 0 ? 7 : 3;
        legL = -8; legR = 8; capeAngle = 0.15;
      } else if (state === 'swing') {
        // 5 frames: 0=windup, 1=slash start, 2=impact strike, 3=followthrough, 4=recover
        torsoAngle = [-0.22, 0.12, 0.32, 0.38, 0.12][frameIndex] || 0;
        armAngle = [-2.1, -0.8, 0.9, 1.8, 0.4][frameIndex] || 0;
        capeAngle = [-0.3, 0.2, 0.65, 0.75, 0.25][frameIndex] || 0;
        hammerGlowArcs = frameIndex >= 1 && frameIndex <= 3;
      } else if (state === 'throw') {
        torsoAngle = [-0.25, 0.3, 0.42][frameIndex] || 0;
        armAngle = [-1.7, 0.8, 1.6][frameIndex] || 0;
        capeAngle = -0.45;
      } else if (state === 'catch') {
        torsoAngle = -0.12;
        armAngle = -0.9 + frameIndex * 0.5;
        capeAngle = 0.12;
      } else if (state === 'hurt') {
        torsoAngle = -0.35;
        bobY = 4;
        hurtFlash = true;
      } else if (state === 'death') {
        deathCollapse = progress * 32;
        torsoAngle = progress * 1.35;
        capeAngle = progress * 0.9;
      } else if (state === 'flip') {
        flipAngle = progress * Math.PI * 2;
      }

      if (flipAngle !== 0) {
        ctx.translate(0, -35);
        ctx.rotate(flipAngle);
        ctx.translate(0, 35);
      }

      ctx.translate(0, bobY + deathCollapse);
      ctx.rotate(torsoAngle);

      // --- 1. Fluttering Cape (Verlet-inspired red cape with dark outline and 3-tone shading) ---
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hurtFlash ? '#ffffff' : '#14080a';
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#881f26'; // Base deep crimson

      ctx.beginPath();
      ctx.moveTo(-6, -56);
      ctx.quadraticCurveTo(-28 + capeAngle * 42, -34, -22 + capeAngle * 56, -6);
      ctx.lineTo(-4, -22);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Cape highlight / rim light
      if (!hurtFlash) {
        ctx.fillStyle = '#b8323a'; // Mid tone
        ctx.beginPath();
        ctx.moveTo(-6, -56);
        ctx.quadraticCurveTo(-22 + capeAngle * 35, -34, -16 + capeAngle * 46, -10);
        ctx.lineTo(-4, -22);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#e8625a'; // Warm rim highlight
        ctx.beginPath();
        ctx.moveTo(-6, -56);
        ctx.quadraticCurveTo(-14 + capeAngle * 25, -36, -10 + capeAngle * 34, -14);
        ctx.lineTo(-4, -24);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // --- 2. Legs, Greaves & Boots ---
      // Left leg
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hurtFlash ? '#ffffff' : '#121620';
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#1c2434'; // Dark navy trousers
      ctx.fillRect(-10 + legL, -26, 8, 18);
      ctx.strokeRect(-10 + legL, -26, 8, 18);

      // Right leg
      ctx.fillRect(2 + legR, -26, 8, 18);
      ctx.strokeRect(2 + legR, -26, 8, 18);

      // Steel greaves / armored knee pads
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#8ca0b4';
      ctx.fillRect(-11 + legL, -24, 10, 8);
      ctx.fillRect(1 + legR, -24, 10, 8);

      // Sturdy leather boots
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#3d2516'; // Deep brown
      ctx.fillRect(-12 + legL, -10, 11, 10);
      ctx.strokeRect(-12 + legL, -10, 11, 10);
      ctx.fillRect(1 + legR, -10, 11, 10);
      ctx.strokeRect(1 + legR, -10, 11, 10);

      // Boot rim light / gold clasp
      if (!hurtFlash) {
        ctx.fillStyle = '#f2c14e';
        ctx.fillRect(-11 + legL, -8, 3, 4);
        ctx.fillRect(2 + legR, -8, 3, 4);
      }
      ctx.restore();

      // --- 3. Tunic & Storm-Smith Plate Armor ---
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hurtFlash ? '#ffffff' : '#121620';

      // Navy Blue under-tunic
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#234468';
      ctx.beginPath();
      ctx.roundRect(-14, -60, 28, 36, 6);
      ctx.fill();
      ctx.stroke();

      // Heavy Silver-Cyan Stormplate Chestplate
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#72889e'; // Dark silver shade
      ctx.beginPath();
      ctx.roundRect(-12, -58, 24, 20, 4);
      ctx.fill();

      ctx.fillStyle = hurtFlash ? '#ffffff' : '#a8bed0'; // Mid-tone steel
      ctx.fillRect(-10, -56, 20, 15);

      ctx.fillStyle = hurtFlash ? '#ffffff' : '#d8e8f4'; // High specular light
      ctx.fillRect(-10, -56, 6, 14);

      // Glowing Runic Lightning Core in center of chestplate
      if (!hurtFlash) {
        ctx.fillStyle = '#7fd4ff';
        ctx.beginPath();
        ctx.moveTo(0, -54);
        ctx.lineTo(-4, -48);
        ctx.lineTo(-1, -48);
        ctx.lineTo(-3, -42);
        ctx.lineTo(3, -47);
        ctx.lineTo(0, -47);
        ctx.closePath();
        ctx.fill();
      }

      // Leather belt with gold thunder buckle
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#422817';
      ctx.fillRect(-14, -32, 28, 6);
      ctx.strokeRect(-14, -32, 28, 6);

      ctx.fillStyle = hurtFlash ? '#ffffff' : '#f2c14e'; // Golden buckle
      ctx.fillRect(-4, -33, 8, 8);
      ctx.fillStyle = '#ffeaa7';
      ctx.fillRect(-2, -31, 4, 4);
      ctx.restore();

      // --- 4. Storm-Smith Warrior Helmet & Head ---
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hurtFlash ? '#ffffff' : '#121620';

      // Strong bearded jaw / face
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#e0a576';
      ctx.beginPath();
      ctx.arc(1, -68, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hero beard (Dark auburn / bronze storm-smith beard)
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#522915';
      ctx.beginPath();
      ctx.moveTo(-7, -66);
      ctx.lineTo(1, -54);
      ctx.lineTo(9, -66);
      ctx.closePath();
      ctx.fill();

      // Heavy Silver Storm-Smith Helmet (3-tone shading)
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#687e94'; // Shadow
      ctx.beginPath();
      ctx.arc(1, -70, 14, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = hurtFlash ? '#ffffff' : '#9bb0c4'; // Midtone
      ctx.fillRect(-12, -72, 26, 6);
      ctx.strokeRect(-12, -72, 26, 6);

      // Specular dome highlight
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#dcedfa';
      ctx.beginPath();
      ctx.arc(1, -72, 11, Math.PI * 1.1, Math.PI * 1.5);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#dcedfa';
      ctx.stroke();

      // Original Storm-Smith Wing Flanges (curved storm-wing crests, distinct from any Norse god)
      ctx.strokeStyle = hurtFlash ? '#ffffff' : '#121620';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#eef4f8';
      ctx.beginPath();
      ctx.moveTo(-8, -74);
      ctx.lineTo(-24, -88);
      ctx.lineTo(-18, -80);
      ctx.lineTo(-26, -82);
      ctx.lineTo(-11, -68);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Cyan Glowing Visor Slit
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#7fd4ff';
      ctx.fillRect(4, -68, 5, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, -67, 2, 2);
      ctx.restore();

      // --- 5. Arm & Gauntlets ---
      ctx.save();
      ctx.translate(4, -50);
      ctx.rotate(armAngle);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = hurtFlash ? '#ffffff' : '#121620';

      // Shoulder Pauldron (Curved layered steel with gold rim)
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#8ca0b4';
      ctx.beginPath();
      ctx.arc(0, 0, 7, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#f2c14e';
      ctx.fillRect(-6, -1, 12, 3);

      // Arm sleeve
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#234468';
      ctx.fillRect(-4, 2, 8, 14);
      ctx.strokeRect(-4, 2, 8, 14);

      // Heavy Steel Gauntlet
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#8ca0b4';
      ctx.fillRect(-5, 14, 10, 10);
      ctx.strokeRect(-5, 14, 10, 10);

      // Crackling lightning sparks on gauntlet when swinging
      if (hammerGlowArcs && !hurtFlash) {
        ctx.strokeStyle = '#7fd4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(2, 20);
        ctx.lineTo(12, 16);
        ctx.lineTo(8, 26);
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore();
    };

    // Draw Idle (0-5)
    for (let i = 0; i < 6; i++) drawHeroFrame(i, 0, 'idle', i, 6);

    // Draw Run (6-13)
    for (let i = 0; i < 4; i++) drawHeroFrame(6 + i, 0, 'run', i, 8);
    for (let i = 0; i < 4; i++) drawHeroFrame(i, 1, 'run', 4 + i, 8);

    // Jump Up (14), Apex (15), Fall (16), Land (17, 18)
    drawHeroFrame(4, 1, 'jump', 0, 1);
    drawHeroFrame(5, 1, 'apex', 0, 1);
    drawHeroFrame(6, 1, 'fall', 0, 1);
    drawHeroFrame(7, 1, 'land', 0, 2);
    drawHeroFrame(8, 1, 'land', 1, 2);

    // Melee Swing (18-22) — 5 frames: windup, slash start, impact strike, followthrough, recover
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
  // 2. ENEMY GRUNT SPRITESHEETS (64x64)
  // Walk 6f, Hurt 1f, Death 5f
  // 3-tone cel shading, bold 2.5px dark outline, distinct silhouette
  // ==========================================
  createGruntSheets() {
    const FW = 64;
    const FH = 64;
    const themes = [
      { name: 'forest', color: '#4a6b28', light: '#729840', dark: '#283c14', belly: '#92b45a' },
      { name: 'castle', color: '#7a8594', light: '#aab8ca', dark: '#485260', belly: '#cad6e4' },
      { name: 'fortress', color: '#9e3a24', light: '#d45e42', dark: '#5e1e12', belly: '#e88862' },
      { name: 'frost', color: '#3b789e', light: '#6ec2e8', dark: '#1e445e', belly: '#a8def8' },
      { name: 'storm', color: '#56388e', light: '#8c60d8', dark: '#2f1a56', belly: '#c8a8f8' }
    ];

    themes.forEach(t => {
      const canvas = this.createCanvas(FW * 12, FH);
      const ctx = canvas.getContext('2d');

      const drawGrunt = (idx, state, progress) => {
        ctx.save();
        ctx.translate(idx * FW + 32, 58);

        let walkY = 0, legL = 0, legR = 0, deathDrop = 0;
        if (state === 'walk') {
          const cycle = progress * Math.PI * 2;
          legL = Math.sin(cycle) * 8;
          legR = -Math.sin(cycle) * 8;
          walkY = -Math.abs(Math.sin(cycle)) * 4;
        } else if (state === 'death') {
          deathDrop = progress * 18;
        }

        ctx.translate(0, walkY + deathDrop);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = state === 'hurt' ? '#ffffff' : '#141416';

        // Legs
        ctx.fillStyle = state === 'hurt' ? '#ffffff' : '#221b18';
        ctx.fillRect(-11 + legL, -12, 7, 12);
        ctx.strokeRect(-11 + legL, -12, 7, 12);
        ctx.fillRect(4 + legR, -12, 7, 12);
        ctx.strokeRect(4 + legR, -12, 7, 12);

        // Body (3-tone shading)
        ctx.fillStyle = state === 'hurt' ? '#ffffff' : t.dark;
        ctx.beginPath();
        ctx.ellipse(0, -30, 18, 19, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = state === 'hurt' ? '#ffffff' : t.color;
        ctx.beginPath();
        ctx.ellipse(0, -32, 16, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rim highlight
        ctx.fillStyle = state === 'hurt' ? '#ffffff' : t.light;
        ctx.beginPath();
        ctx.arc(-4, -36, 12, Math.PI * 0.8, Math.PI * 1.6);
        ctx.lineWidth = 3;
        ctx.strokeStyle = state === 'hurt' ? '#ffffff' : t.light;
        ctx.stroke();

        // Horns / Pointed Ears
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = state === 'hurt' ? '#ffffff' : '#141416';
        ctx.fillStyle = state === 'hurt' ? '#ffffff' : t.dark;
        ctx.beginPath();
        ctx.moveTo(-13, -42);
        ctx.lineTo(-24, -54);
        ctx.lineTo(-8, -45);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(13, -42);
        ctx.lineTo(24, -54);
        ctx.lineTo(8, -45);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // Belly
        ctx.fillStyle = state === 'hurt' ? '#ffffff' : t.belly;
        ctx.beginPath();
        ctx.ellipse(1, -25, 11, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Eyes
        ctx.fillStyle = state === 'hurt' ? '#ff2222' : '#fff2a8';
        ctx.fillRect(3, -36, 4, 5);
        ctx.fillRect(10, -36, 4, 5);
        ctx.fillStyle = '#0a0a0e';
        ctx.fillRect(4, -35, 2, 3);
        ctx.fillRect(11, -35, 2, 3);

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
  // 3. ENEMY BAT SPRITESHEET (48x48)
  // Fly 6f, Swoop 3f, Death 4f
  // ==========================================
  createBatSheet() {
    const FW = 48;
    const FH = 48;
    const canvas = this.createCanvas(FW * 13, FH);
    const ctx = canvas.getContext('2d');

    const drawBat = (idx, flapAngle, isSwoop) => {
      ctx.save();
      ctx.translate(idx * FW + 24, 24);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0e0b16';
      ctx.fillStyle = '#2b1b3e'; // Dark shadow

      // Left Wing
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-22, -flapAngle);
      ctx.lineTo(-16, 6);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-5, 8);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(22, -flapAngle);
      ctx.lineTo(16, 6);
      ctx.lineTo(10, 0);
      ctx.lineTo(5, 8);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Body & Ears
      ctx.fillStyle = '#4c2e68';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();

      // Glowing crimson eyes
      ctx.fillStyle = '#ff3344';
      ctx.fillRect(-4, -3, 3, 3);
      ctx.fillRect(1, -3, 3, 3);

      ctx.restore();
    };

    // Fly (0-5)
    for (let i = 0; i < 6; i++) {
      const angle = Math.sin((i / 6) * Math.PI * 2) * 16;
      drawBat(i, angle, false);
    }

    // Swoop (6-8)
    for (let i = 0; i < 3; i++) {
      drawBat(6 + i, 10 + i * 5, true);
    }

    // Death (9-12)
    for (let i = 0; i < 4; i++) {
      drawBat(9 + i, -10, false);
    }

    this.scene.textures.addSpriteSheet('enemy_bat_sheet', canvas, {
      frameWidth: FW,
      frameHeight: FH
    });
  }

  // ==========================================
  // 4. ENEMY BRUTE SPRITESHEET (96x96, massive 3-tone tank)
  // Walk 6f, Windup 4f, Charge 4f, Death 5f
  // ==========================================
  createBruteSheet() {
    const FW = 96;
    const FH = 96;
    const canvas = this.createCanvas(FW * 19, FH);
    const ctx = canvas.getContext('2d');

    const drawBrute = (idx, state, progress) => {
      ctx.save();
      ctx.translate(idx * FW + 48, 86);

      let shakeX = 0, chargeLeg = 0;
      if (state === 'windup') {
        shakeX = (Math.random() - 0.5) * 6;
      } else if (state === 'charge') {
        chargeLeg = Math.sin(progress * Math.PI * 2) * 12;
      }

      ctx.translate(shakeX, 0);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#120e0a';

      // Heavy Legs
      ctx.fillStyle = '#2e2016';
      ctx.fillRect(-22 + chargeLeg, -18, 16, 18);
      ctx.strokeRect(-22 + chargeLeg, -18, 16, 18);
      ctx.fillRect(6 - chargeLeg, -18, 16, 18);
      ctx.strokeRect(6 - chargeLeg, -18, 16, 18);

      // Huge Muscular Torso (3-tone)
      ctx.fillStyle = '#544234'; // Dark
      ctx.beginPath();
      ctx.roundRect(-32, -68, 64, 54, 14);
      ctx.stroke();
      ctx.fill();

      ctx.fillStyle = '#7a6452'; // Mid
      ctx.beginPath();
      ctx.roundRect(-28, -65, 56, 48, 10);
      ctx.fill();

      // Belly
      ctx.fillStyle = '#9e846e'; // Light
      ctx.beginPath();
      ctx.roundRect(-16, -48, 32, 28, 8);
      ctx.fill();

      // Iron Helm & Horns
      ctx.fillStyle = '#424850';
      ctx.beginPath();
      ctx.arc(0, -68, 20, Math.PI, 0);
      ctx.stroke();
      ctx.fill();

      // Massive curved tusks/horns
      ctx.fillStyle = '#f0ecd8';
      ctx.beginPath();
      ctx.moveTo(-18, -76);
      ctx.lineTo(-30, -92);
      ctx.lineTo(-12, -80);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(18, -76);
      ctx.lineTo(30, -92);
      ctx.lineTo(12, -80);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Menacing Eyes
      ctx.fillStyle = (state === 'windup' || state === 'charge') ? '#ff1a0a' : '#ffcf40';
      ctx.fillRect(4, -64, 6, 5);
      ctx.fillRect(14, -64, 6, 5);

      // Massive Spiked Tree Club
      ctx.fillStyle = '#3d2514';
      ctx.fillRect(24, -48, 10, 46);
      ctx.strokeRect(24, -48, 10, 46);

      ctx.fillStyle = '#221408';
      ctx.beginPath();
      ctx.roundRect(19, -16, 20, 24, 6);
      ctx.stroke();
      ctx.fill();

      // Iron spikes on club
      ctx.fillStyle = '#d8e0e8';
      ctx.fillRect(17, -12, 4, 4);
      ctx.fillRect(37, -6, 4, 4);

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
  // 5. ENEMY CASTER SPRITESHEET (64x80)
  // Hover 6f, Charge 4f, Cast 3f, Death 5f
  // ==========================================
  createCasterSheets() {
    const FW = 64;
    const FH = 80;

    ['castle', 'fortress'].forEach(themeName => {
      const canvas = this.createCanvas(FW * 18, FH);
      const ctx = canvas.getContext('2d');
      const robeDark = themeName === 'fortress' ? '#46141e' : '#1e2c40';
      const robeMid = themeName === 'fortress' ? '#782634' : '#324a6c';
      const robeLight = themeName === 'fortress' ? '#aa3e50' : '#4e70a0';

      const drawCaster = (idx, state, progress) => {
        ctx.save();
        ctx.translate(idx * FW + 32, 70);

        const hovY = Math.sin(progress * Math.PI * 2) * 6;
        ctx.translate(0, hovY);

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0e0e14';

        // Flowing Robe (3-tone)
        ctx.fillStyle = robeDark;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-11, -44);
        ctx.lineTo(11, -44);
        ctx.lineTo(18, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = robeMid;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-8, -42);
        ctx.lineTo(8, -42);
        ctx.lineTo(12, 0);
        ctx.closePath();
        ctx.fill();

        // Rim highlight
        ctx.fillStyle = robeLight;
        ctx.fillRect(-16, -2, 4, 2);
        ctx.fillRect(12, -2, 4, 2);

        // Deep Hood
        ctx.fillStyle = robeDark;
        ctx.beginPath();
        ctx.arc(0, -44, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();

        // Pitch Black Face Interior
        ctx.fillStyle = '#06050a';
        ctx.beginPath();
        ctx.arc(4, -43, 10, 0, Math.PI * 2);
        ctx.fill();

        // Piercing Golden / Orange Eyes
        ctx.fillStyle = '#ffcf50';
        ctx.fillRect(3, -46, 3, 3);
        ctx.fillRect(8, -46, 3, 3);

        // Charging energy orb
        if (state === 'charge') {
          const r = 6 + progress * 12;
          const grad = ctx.createRadialGradient(22, -34, 2, 22, -34, r);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.4, '#ff9a3d');
          grad.addColorStop(1, 'rgba(255, 60, 20, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(22, -34, r, 0, Math.PI * 2);
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
  // Lanterns, chains, banners, barrels
  // ==========================================
  createPropTextures() {
    // 1. Hanging Lantern
    {
      const c = this.createCanvas(32, 50);
      const ctx = c.getContext('2d');
      ctx.strokeStyle = '#1e242c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(16, 20);
      ctx.stroke();

      ctx.fillStyle = '#141820';
      ctx.fillRect(8, 20, 16, 22);
      ctx.strokeRect(8, 20, 16, 22);

      // Warm candle light
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(11, 25, 10, 12);
      this.scene.textures.addCanvas('prop_lantern', c);
    }

    // 2. Hanging Chain
    {
      const c = this.createCanvas(16, 56);
      const ctx = c.getContext('2d');
      ctx.strokeStyle = '#2b3340';
      ctx.lineWidth = 3;
      for (let y = 5; y < 50; y += 10) {
        ctx.beginPath();
        ctx.ellipse(8, y, 4, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      this.scene.textures.addCanvas('prop_chain', c);
    }

    // 3. Castle Banner
    {
      const c = this.createCanvas(36, 68);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#162536';
      ctx.fillRect(3, 0, 30, 54);
      ctx.beginPath();
      ctx.moveTo(3, 54);
      ctx.lineTo(18, 66);
      ctx.lineTo(33, 54);
      ctx.fill();

      // Gold thunder crest
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(18, 24, 8, 0, Math.PI * 2);
      ctx.fill();
      this.scene.textures.addCanvas('prop_banner', c);
    }

    // 4. Wooden Barrel
    {
      const c = this.createCanvas(36, 42);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#5c3a20';
      ctx.beginPath();
      ctx.roundRect(3, 3, 30, 36, 6);
      ctx.fill();
      ctx.strokeStyle = '#26170d';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#26170d';
      ctx.fillRect(3, 10, 30, 4);
      ctx.fillRect(3, 28, 30, 4);
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
    ['forest', 'castle', 'fortress', 'frost', 'storm'].forEach(theme => {
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
