import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';

/**
 * Realm 1 Boss: Thornback Treant
 * HP 12, 2 phases (standard + rage mode).
 * Attacks: Ground crack telegraphed root spikes and heavy branch sweeps.
 * Displays large boss health bar at screen bottom.
 */
export class TreantBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_brute_sheet', 0);
    this.scene = scene;
    this.hp = 12;
    this.maxHp = 12;
    this.isDead = false;
    this.isBoss = true;
    this.bossName = 'Thornback Treant';
    this.facing = -1;
    this.phase = 1;
    this.actionTimer = 2.0;
    this.actionState = 'idle'; // 'idle', 'telegraph', 'attack'
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(54, 58);
    this.body.setOffset(5, 4);
    this.setScale(1.35); // Imposing boss size
    this.setTint(0x4a7a3a); // Forest moss-wood tint
    this.setDepth(22);

    // Root spike graphics
    this.spikeGraphics = scene.add.graphics().setDepth(23);
    this.isEngaged = false;
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;

    if (!this.isEngaged) {
      if (Math.abs(hero.x - this.x) < 480) {
        this.isEngaged = true;
        audio.playSfx('power');
        const hud = this.scene.scene.get('HUDScene');
        hud?.showToast(`⚠️ BOSS: ${this.bossName} emerges!`);
      } else {
        this.setVelocityX(0);
        return;
      }
    }

    if (this.hp <= 6 && this.phase === 1) {
      this.phase = 2;
      this.setTint(0x8a5a2a);
      this.scene.fx.shake(0.015, 400);
      audio.playSfx('power');
      const hud = this.scene.scene.get('HUDScene');
      hud?.showToast('Thornback Treant enrages! Ground trembles!');
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      return;
    }

    const dx = hero.x - this.x;
    this.facing = Math.sign(dx) || -1;
    this.setFlipX(this.facing < 0);

    this.actionTimer -= dt;

    if (this.actionState === 'idle') {
      this.setVelocityX(this.facing * (this.phase === 2 ? 70 : 45));

      if (this.actionTimer <= 0) {
        this.actionState = 'telegraph';
        this.actionTimer = this.phase === 2 ? 0.45 : 0.7; // Telegraph ground cracks
        this.setVelocityX(0);

        // Telegraph cracks on the ground near hero
        this.telegraphX = hero.x;
        this.telegraphY = hero.y + 20;
        this.spikeGraphics.clear();
        this.spikeGraphics.lineStyle(2, 0xd4a040, 0.9);
        this.spikeGraphics.beginPath();
        this.spikeGraphics.moveTo(this.telegraphX - 30, this.telegraphY);
        this.spikeGraphics.lineTo(this.telegraphX + 30, this.telegraphY);
        this.spikeGraphics.strokePath();

        this.scene.fx.shake(0.006, 200);
      }
    } else if (this.actionState === 'telegraph') {
      if (this.actionTimer <= 0) {
        // Erupt root spikes!
        this.actionState = 'attack';
        this.actionTimer = 0.5;
        this.eruptSpikes();
      }
    } else if (this.actionState === 'attack') {
      if (this.actionTimer <= 0) {
        this.actionState = 'idle';
        this.actionTimer = this.phase === 2 ? 1.6 : 2.5;
        this.spikeGraphics.clear();
      }
    }
  }

  eruptSpikes() {
    audio.playSfx('break');
    this.scene.fx.shake(0.012, 300);
    this.spikeGraphics.clear();

    // Draw wood root spikes
    this.spikeGraphics.fillStyle(0x3a2414, 1.0);
    for (let i = -2; i <= 2; i++) {
      const sx = this.telegraphX + i * 16;
      const sy = this.telegraphY;
      this.spikeGraphics.beginPath();
      this.spikeGraphics.moveTo(sx - 8, sy);
      this.spikeGraphics.lineTo(sx, sy - 36);
      this.spikeGraphics.lineTo(sx + 8, sy);
      this.spikeGraphics.fill();
    }

    // Check hit against hero
    const hero = this.scene.hero;
    if (hero && Math.abs(hero.x - this.telegraphX) < 38 && Math.abs(hero.y - this.telegraphY) < 40) {
      hero.takeHit(1, this.x);
    }
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.15;
    this.scene.fx.flashWhite(this);
    audio.playSfx('hit');

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.spikeGraphics.destroy();

    if (this.scene.hero) {
      this.scene.hero.kills += 1;
      this.scene.hero.score += 500;
    }

    audio.playSfx('die');
    this.scene.fx.burst(this.x, this.y, 36, [0x4a7a3a, 0x8a5a2a, 0xf2c14e, 0xffffff], 320, 1000, 600);
    this.scene.fx.shake(0.02, 600);
    this.scene.fx.zoomPunch(1.12, 250);

    // Drop loot reward: 5 coins + 1 Heart + 1 Storm
    for (let i = 0; i < 5; i++) {
      this.scene.pickupsGroup.add(new Pickup(this.scene, this.x + (i - 2) * 12, this.y, 'coin'));
    }
    this.scene.pickupsGroup.add(new Pickup(this.scene, this.x - 20, this.y, 'heart'));
    this.scene.pickupsGroup.add(new Pickup(this.scene, this.x + 20, this.y, 'storm'));

    const hud = this.scene.scene.get('HUDScene');
    hud?.showToast('Thornback Treant Defeated! The way to the gate is open!');

    this.destroy();
  }

  destroy(fromScene) {
    if (this.spikeGraphics) this.spikeGraphics.destroy();
    super.destroy(fromScene);
  }
}
