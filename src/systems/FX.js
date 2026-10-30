/**
 * Stormhammer FX & Juice System
 * Handles hit-stop freeze frames (50-80ms), camera shake scaled to damage,
 * zoom-punch on brute kills, 1-frame lightning screen flashes,
 * verlet cape physics, additive lighting/torch glows, and weather particle systems.
 */
export class FXSystem {
  constructor(scene) {
    this.scene = scene;
    this.ambientParticles = [];
    this.lightningGraphics = scene.add.graphics().setDepth(50);
    this.capeGraphics = scene.add.graphics().setDepth(24);
    this.flashGraphics = scene.add.graphics().setDepth(100).setScrollFactor(0);
    this.activeBolts = [];

    // Verlet Cape state (4 linked points)
    this.capeNodes = [
      { x: 0, y: 0, oldX: 0, oldY: 0 },
      { x: 0, y: 0, oldX: 0, oldY: 0 },
      { x: 0, y: 0, oldX: 0, oldY: 0 },
      { x: 0, y: 0, oldX: 0, oldY: 0 }
    ];
    this.capeSegmentLength = 10;
    this.trauma = 0; // Trauma-based camera shake
    this.vignetteGraphics = scene.add.graphics().setDepth(90).setScrollFactor(0);
  }

  // --- Hit Stop Frame Freeze (60–90 ms regular, 120 ms boss) ---
  hitStop(durationMs = 75) {
    if (this.scene.physics.world.isPaused) return;
    this.scene.physics.world.isPaused = true;
    this.scene.time.delayedCall(durationMs, () => {
      if (this.scene?.physics?.world) {
        this.scene.physics.world.isPaused = false;
      }
    });
  }

  // --- Trauma-based Camera Shake (decays smoothly with ease-out) ---
  addTrauma(amount = 0.4) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  shake(intensity = 0.012, duration = 180) {
    this.addTrauma(intensity * 30);
    this.scene.cameras.main.shake(duration, intensity);
  }

  // --- Damage Numbers (Small, stylised arcade popups) ---
  showDamageNumber(x, y, amount, isCrit = false) {
    const txt = this.scene.add.text(x, y - 10, String(amount), {
      fontFamily: "'Alegreya Sans SC', sans-serif",
      fontSize: isCrit ? '20px' : '16px',
      color: isCrit ? '#f2c14e' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(80);

    this.scene.tweens.add({
      targets: txt,
      y: y - 40,
      scale: { from: 1.3, to: 0.9 },
      alpha: { from: 1, to: 0 },
      duration: 650,
      ease: 'Back.easeOut',
      onComplete: () => txt.destroy()
    });
  }

  // --- Chromatic Flash + Slow-motion (0.4s) on boss or final arena kill ---
  slowMoFinish(duration = 400) {
    this.flashScreen(0xffffff, 80);
    this.zoomPunch(1.15, 180);
    this.scene.time.timeScale = 0.25;
    this.scene.time.delayedCall(duration, () => {
      this.scene.time.timeScale = 1.0;
    });
  }

  // --- Low HP Vignette Pulse (when HP is 1) ---
  pulseLowHpVignette(active = true) {
    this.vignetteGraphics.clear();
    if (!active) return;
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    this.vignetteGraphics.fillStyle(0xff1122, 0.18);
    this.vignetteGraphics.fillRect(0, 0, W, H);
  }

  // --- Zoom Punch on Boss / Heavy hits ---
  zoomPunch(targetZoom = 1.09, duration = 120) {
    const cam = this.scene.cameras.main;
    this.scene.tweens.add({
      targets: cam,
      zoom: targetZoom,
      duration: duration,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        cam.setZoom(1.0);
      }
    });
  }

  // --- Lightning Screen Flash (1-2 frames) ---
  flashScreen(color = 0xffffff, duration = 60) {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    this.flashGraphics.clear();
    this.flashGraphics.fillStyle(color, 0.45);
    this.flashGraphics.fillRect(0, 0, W, H);

    this.scene.time.delayedCall(duration, () => {
      this.flashGraphics.clear();
    });
  }

  // --- Flash Sprite White ---
  flashWhite(sprite, duration = 120) {
    if (!sprite?.setTintFill) return;
    sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(duration, () => {
      if (sprite?.clearTint) {
        sprite.clearTint();
      }
    });
  }

  // --- Spark / Splinter Bursts ---
  burst(x, y, count = 12, colors = [0xffffff, 0xf2c14e, 0xff8a3d], speed = 220, lifespan = 500, gravity = 600) {
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const spd = speed * Phaser.Math.FloatBetween(0.3, 1.0);
      const color = colors[i % colors.length];

      const p = this.scene.add.rectangle(x, y, Phaser.Math.Between(3, 5), Phaser.Math.Between(3, 5), color)
        .setDepth(40);

      this.scene.physics.add.existing(p);
      p.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd - speed * 0.3);

      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 0.2,
        duration: lifespan,
        onComplete: () => p.destroy()
      });
    }
  }

  // --- Dust Puffs on Run / Jump / Land ---
  dustPuff(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), 0xdcd2be, 0.6)
        .setDepth(35);
      this.scene.physics.add.existing(p);
      const vx = Phaser.Math.FloatBetween(-60, 60);
      const vy = Phaser.Math.FloatBetween(-30, -70);
      p.body.setVelocity(vx, vy);

      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 1.8,
        duration: 350,
        onComplete: () => p.destroy()
      });
    }
  }

  // --- Chain Lightning Arc & Screen Flash ---
  chainLightning(x1, y1, x2, y2, duration = 250) {
    const segments = 8;
    const points = [{ x: x1, y: y1 }];

    for (let i = 1; i < segments; i++) {
      const k = i / segments;
      const nx = x1 + (x2 - x1) * k + Phaser.Math.FloatBetween(-24, 24);
      const ny = y1 + (y2 - y1) * k + Phaser.Math.FloatBetween(-24, 24);
      points.push({ x: nx, y: ny });
    }
    points.push({ x: x2, y: y2 });

    const bolt = { points, remaining: duration, total: duration };
    this.activeBolts.push(bolt);

    // 1-frame screen flash
    this.flashScreen(0x7fd4ff, 50);
  }

  // --- Ambient Weather / Particles ---
  initAmbient(theme, width, height) {
    this.ambientTheme = theme;
    this.ambientTimer = this.scene.time.addEvent({
      delay: theme === 'fortress' ? 80 : 160,
      loop: true,
      callback: () => {
        const cam = this.scene.cameras.main;
        const x = Phaser.Math.FloatBetween(cam.scrollX - 50, cam.scrollX + cam.width + 50);

        if (theme === 'ember') {
          // Rising embers + ash
          const y = cam.scrollY + cam.height + 10;
          const ember = this.scene.add.rectangle(x, y, Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 4), 0xff8a3d, 0.8)
            .setDepth(60);
          this.scene.physics.add.existing(ember);
          ember.body.setVelocity(Phaser.Math.FloatBetween(-30, 30), Phaser.Math.FloatBetween(-80, -180));
          this.scene.tweens.add({
            targets: ember,
            alpha: 0,
            duration: Phaser.Math.Between(2000, 3200),
            onComplete: () => ember.destroy()
          });
        } else if (theme === 'leaf') {
          // Falling leaves & Fireflies
          if (Math.random() < 0.35) {
            // Glowing Firefly (yellow-green bobbing light with additive blend)
            const fy = Phaser.Math.FloatBetween(cam.scrollY + 50, cam.scrollY + cam.height - 50);
            const firefly = this.scene.add.circle(x, fy, 2, 0xd4ff70, 0.9)
              .setBlendMode(Phaser.BlendModes.ADD)
              .setDepth(65);
            this.scene.tweens.add({
              targets: firefly,
              x: x + Phaser.Math.FloatBetween(-40, 40),
              y: fy + Phaser.Math.FloatBetween(-20, 20),
              alpha: { from: 0.3, to: 1.0 },
              yoyo: true,
              repeat: -1,
              duration: 800
            });
            this.scene.time.delayedCall(4000, () => firefly.destroy());
          } else {
            // Rain droplet / leaf
            const y = cam.scrollY - 10;
            const drop = this.scene.add.rectangle(x, y, 1.5, 8, 0x8ab4d4, 0.5)
              .setDepth(60);
            this.scene.physics.add.existing(drop);
            drop.body.setVelocity(40, 450);
            this.scene.time.delayedCall(1200, () => drop.destroy());
          }
        } else if (theme === 'dust') {
          // Castle dust motes catching window light
          const y = Phaser.Math.FloatBetween(cam.scrollY, cam.scrollY + cam.height);
          const mote = this.scene.add.circle(x, y, 1.5, 0xc8e6d2, 0.55)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(60);
          this.scene.physics.add.existing(mote);
          mote.body.setVelocity(Phaser.Math.FloatBetween(-15, 15), Phaser.Math.FloatBetween(-10, -25));
        } else if (theme === 'snow') {
          // Drifting blizzard snowflakes
          const y = cam.scrollY - 10;
          const flake = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(1.5, 3.0), 0xe8f6ff, 0.75)
            .setDepth(60);
          this.scene.physics.add.existing(flake);
          flake.body.setVelocity(Phaser.Math.FloatBetween(40, 120), Phaser.Math.FloatBetween(80, 160));
          this.scene.tweens.add({
            targets: flake,
            x: x + Phaser.Math.FloatBetween(30, 80),
            duration: 2500,
            onComplete: () => flake.destroy()
          });
        } else if (theme === 'storm') {
          // Heavy slanted storm rain + occasional lightning flicker
          const y = cam.scrollY - 10;
          const rain = this.scene.add.rectangle(x, y, 2, 12, 0xaed8f2, 0.65)
            .setRotation(0.2)
            .setDepth(60);
          this.scene.physics.add.existing(rain);
          rain.body.setVelocity(Phaser.Math.FloatBetween(120, 200), Phaser.Math.FloatBetween(600, 800));
          this.scene.time.delayedCall(900, () => rain.destroy());

          // Rare ambient sky lightning arc
          if (Math.random() < 0.04) {
            this.flashScreen(0x7fd4ff, 50);
          }
        }
      }
    });
  }

  // --- Verlet Rope Cape Simulation ---
  updateCape(hero) {
    if (!hero || !hero.active) return;
    this.capeGraphics.clear();

    const anchorX = hero.x - hero.facing * 6;
    const anchorY = hero.y - 12;

    // Anchor first point
    this.capeNodes[0].x = anchorX;
    this.capeNodes[0].y = anchorY;

    // Verlet integration for points 1-3
    const gravityY = 0.35;
    const windX = -hero.body.velocity.x * 0.02;

    for (let i = 1; i < this.capeNodes.length; i++) {
      const p = this.capeNodes[i];
      const vx = (p.x - p.oldX) * 0.85 + windX;
      const vy = (p.y - p.oldY) * 0.85 + gravityY;

      p.oldX = p.x;
      p.oldY = p.y;
      p.x += vx;
      p.y += vy;
    }

    // Constraint relaxation (keep segments at capeSegmentLength)
    for (let iter = 0; iter < 4; iter++) {
      for (let i = 0; i < this.capeNodes.length - 1; i++) {
        const p1 = this.capeNodes[i];
        const p2 = this.capeNodes[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy) || 1;
        const diff = (dist - this.capeSegmentLength) / dist;

        if (i === 0) {
          // Only move p2
          p2.x -= dx * diff;
          p2.y -= dy * diff;
        } else {
          p1.x += dx * diff * 0.5;
          p1.y += dy * diff * 0.5;
          p2.x -= dx * diff * 0.5;
          p2.y -= dy * diff * 0.5;
        }
      }
    }

    // Render trailing cape ribbon with smooth curve
    this.capeGraphics.fillStyle(0xa8323b, 0.85);
    this.capeGraphics.beginPath();
    this.capeGraphics.moveTo(this.capeNodes[0].x, this.capeNodes[0].y - 4);
    for (let i = 1; i < this.capeNodes.length; i++) {
      this.capeGraphics.lineTo(this.capeNodes[i].x, this.capeNodes[i].y);
    }
    this.capeGraphics.lineTo(this.capeNodes[this.capeNodes.length - 1].x, this.capeNodes[this.capeNodes.length - 1].y + 6);
    this.capeGraphics.lineTo(this.capeNodes[0].x, this.capeNodes[0].y + 4);
    this.capeGraphics.closePath();
    this.capeGraphics.fillPath();
  }

  update(time, delta, hero) {
    if (hero) {
      this.updateCape(hero);
    }

    this.lightningGraphics.clear();
    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      const b = this.activeBolts[i];
      b.remaining -= delta;
      if (b.remaining <= 0) {
        this.activeBolts.splice(i, 1);
        continue;
      }

      const alpha = b.remaining / b.total;
      this.lightningGraphics.lineStyle(4, 0x7fd4ff, alpha * 0.9);
      this.lightningGraphics.beginPath();
      b.points.forEach((pt, idx) => {
        if (idx === 0) this.lightningGraphics.moveTo(pt.x, pt.y);
        else this.lightningGraphics.lineTo(pt.x, pt.y);
      });
      this.lightningGraphics.strokePath();

      // Core white bolt
      this.lightningGraphics.lineStyle(1.5, 0xffffff, alpha);
      this.lightningGraphics.beginPath();
      b.points.forEach((pt, idx) => {
        if (idx === 0) this.lightningGraphics.moveTo(pt.x, pt.y);
        else this.lightningGraphics.lineTo(pt.x, pt.y);
      });
      this.lightningGraphics.strokePath();
    }
  }

  destroy() {
    if (this.ambientTimer) {
      this.ambientTimer.remove();
    }
    this.lightningGraphics.destroy();
    this.capeGraphics.destroy();
    this.flashGraphics.destroy();
  }
}
