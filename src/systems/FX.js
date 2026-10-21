/**
 * Stormhammer FX & Juice System
 * Handles hit-stop freeze frames, camera shakes, spark explosions, crate splinters,
 * chain lightning arcs, dust puffs, and ambient realm particles.
 */
export class FXSystem {
  constructor(scene) {
    this.scene = scene;
    this.ambientParticles = [];
    this.lightningGraphics = scene.add.graphics().setDepth(50);
    this.activeBolts = [];
  }

  // --- Hit Stop Frame Freeze ---
  hitStop(durationMs = 40) {
    if (this.scene.physics.world.isPaused) return;
    this.scene.physics.world.isPaused = true;
    this.scene.time.delayedCall(durationMs, () => {
      if (this.scene && this.scene.physics && this.scene.physics.world) {
        this.scene.physics.world.isPaused = false;
      }
    });
  }

  // --- Screen Shake ---
  shake(intensity = 0.012, duration = 180) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  // --- Flash Sprite White ---
  flashWhite(sprite, duration = 120) {
    if (!sprite || !sprite.setTintFill) return;
    sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(duration, () => {
      if (sprite && sprite.clearTint) {
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
      p.body.setGravityY(gravity);

      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 0.2,
        duration: lifespan,
        onComplete: () => p.destroy()
      });
    }
  }

  // --- Dust Puffs on Jump / Land ---
  dustPuff(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), 0xdcd2be, 0.6)
        .setDepth(35);
      this.scene.physics.add.existing(p);
      const vx = Phaser.Math.FloatBetween(-60, 60);
      const vy = Phaser.Math.FloatBetween(-30, -70);
      p.body.setVelocity(vx, vy);
      p.body.setGravityY(100);

      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 1.8,
        duration: 350,
        onComplete: () => p.destroy()
      });
    }
  }

  // --- Chain Lightning Arc ---
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
  }

  // --- Ambient Weather / Particles ---
  initAmbient(theme, width, height) {
    this.ambientTheme = theme;
    this.ambientTimer = this.scene.time.addEvent({
      delay: theme === 'fortress' ? 90 : 250,
      loop: true,
      callback: () => {
        const cam = this.scene.cameras.main;
        const x = Phaser.Math.FloatBetween(cam.scrollX - 50, cam.scrollX + cam.width + 50);

        if (theme === 'ember') {
          const y = cam.scrollY + cam.height + 10;
          const ember = this.scene.add.rectangle(x, y, Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 4), 0xff8a3d, 0.8)
            .setDepth(60);
          this.scene.physics.add.existing(ember);
          ember.body.setVelocity(Phaser.Math.FloatBetween(-30, 30), Phaser.Math.FloatBetween(-80, -160));
          this.scene.tweens.add({
            targets: ember,
            alpha: 0,
            duration: Phaser.Math.Between(2000, 3500),
            onComplete: () => ember.destroy()
          });
        } else if (theme === 'leaf') {
          const y = cam.scrollY - 10;
          const leaf = this.scene.add.ellipse(x, y, 6, 3, Math.random() < 0.5 ? 0x7aa85a : 0xd9a35a, 0.75)
            .setDepth(60);
          this.scene.physics.add.existing(leaf);
          leaf.body.setVelocity(Phaser.Math.FloatBetween(30, 60), Phaser.Math.FloatBetween(40, 80));
          this.scene.tweens.add({
            targets: leaf,
            rotation: Math.PI * 4,
            alpha: 0,
            duration: Phaser.Math.Between(3000, 5000),
            onComplete: () => leaf.destroy()
          });
        } else if (theme === 'dust') {
          const y = Phaser.Math.FloatBetween(cam.scrollY, cam.scrollY + cam.height);
          const mote = this.scene.add.circle(x, y, 1.5, 0xc8e6d2, 0.5)
            .setDepth(60);
          this.scene.physics.add.existing(mote);
          mote.body.setVelocity(Phaser.Math.FloatBetween(-15, 15), Phaser.Math.FloatBetween(-10, -25));
          this.scene.tweens.add({
            targets: mote,
            alpha: 0,
            duration: Phaser.Math.Between(2500, 4000),
            onComplete: () => mote.destroy()
          });
        }
      }
    });
  }

  update(time, delta) {
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
  }
}
