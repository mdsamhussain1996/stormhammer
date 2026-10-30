import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';

/**
 * Realm 5 Boss: Stormcaller — The Rival Storm-Smith
 * 3-Phase Mirror Duel on the Sky Arena of The Storm Citadel.
 * Phase 1: Thunder lunges and lightning hammer throws.
 * Phase 2: Electric aerial dives, ball lightning projectile spreads (parryable!).
 * Phase 3: Overcharged Tempest — rains lightning bolts across the sky islands!
 */
export class StormcallerBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hero_sheet', 0);
    this.scene = scene;
    this.hp = 22;
    this.maxHp = 22;
    this.isDead = false;
    this.isBoss = true;
    this.bossName = 'Stormcaller (Rival Storm-Smith)';
    this.facing = -1;
    this.phase = 1;
    this.actionTimer = 1.8;
    this.actionState = 'idle'; // 'idle', 'lunge', 'throw', 'skydive', 'tempest'
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(44, 76);
    this.body.setOffset(26, 12);
    this.setScale(1.25);
    // Dark indigo/violet storm plate with electric cyan visor
    this.setTint(0xb088ff);
    this.setDepth(23);

    // Lightning aura
    this.stormAura = scene.add.circle(x, y, 42, 0xa877ff, 0.35).setDepth(22);
    this.isEngaged = false;
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;

    if (!this.isEngaged) {
      if (Math.abs(hero.x - this.x) < 500) {
        this.isEngaged = true;
        audio.playSfx('power');
        this.scene.fx.shake(0.015, 300);
        const hud = this.scene.scene.get('HUDScene');
        hud?.showToast(`⚡ FINAL TRIAL: ${this.bossName} Challenges You!`, 1400);
      } else {
        this.setVelocityX(0);
        return;
      }
    }

    this.stormAura.setPosition(this.x, this.y);
    this.stormAura.setScale(1.0 + Math.sin(time / 100) * 0.15);

    // Phase Transitions
    if (this.hp <= 14 && this.phase === 1) {
      this.phase = 2;
      this.setTint(0x7fd4ff);
      this.scene.fx.shake(0.02, 450);
      this.scene.fx.flashScreen(0x7fd4ff, 120);
      audio.playSfx('power');
      const hud = this.scene.scene.get('HUDScene');
      hud?.showToast('Stormcaller unleashes Ball Lightning and Sky Dives!', 1200);
    } else if (this.hp <= 7 && this.phase === 2) {
      this.phase = 3;
      this.setTint(0xffd700);
      this.scene.fx.shake(0.025, 550);
      this.scene.fx.flashScreen(0xffffff, 150);
      audio.playSfx('power');
      const hud = this.scene.scene.get('HUDScene');
      hud?.showToast('TEMPEST OVERLOAD! Raging Lightning Strikes Everywhere!', 1400);
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
      const spd = this.phase === 3 ? 160 : (this.phase === 2 ? 110 : 70);
      this.setVelocityX(this.facing * spd);

      if (this.actionTimer <= 0) {
        const moves = this.phase === 3 ? ['lunge', 'throw', 'skydive', 'tempest'] :
                      this.phase === 2 ? ['lunge', 'throw', 'skydive'] : ['lunge', 'throw'];
        this.actionState = Phaser.Utils.Array.GetRandom(moves);
        this.actionTimer = 0.55; // Telegraph windup
      }
    } else if (this.actionState === 'lunge') {
      this.setVelocityX(this.facing * (this.phase === 3 ? 420 : 320));
      this.scene.fx.burst(this.x, this.y, 2, [0x7fd4ff, 0xffffff], 50, 160, 0);

      if (this.actionTimer <= 0) {
        this.actionState = 'idle';
        this.actionTimer = 1.0;
      }
    } else if (this.actionState === 'throw') {
      // Hurls ball lightning projectile
      if (this.actionTimer <= 0) {
        audio.playSfx('throw');
        this.fireElectricBall();
        this.actionState = 'idle';
        this.actionTimer = 1.2;
      }
    } else if (this.actionState === 'skydive') {
      // Leaps high and crashes down
      this.setVelocityY(-650);
      this.actionTimer = 0.7;
      this.actionState = 'diving';
    } else if (this.actionState === 'diving') {
      if (this.body.blocked.down || this.actionTimer <= 0) {
        audio.playSfx('break');
        this.scene.fx.shake(0.02, 350);
        this.scene.fx.burst(this.x, this.y + 20, 18, [0x7fd4ff, 0xffffff, 0xa877ff], 240, 480, -200);

        // Ground shockwave
        const shock = this.scene.add.circle(this.x, this.y + 16, 16, 0x7fd4ff, 0.7).setDepth(22);
        this.scene.tweens.add({
          targets: shock,
          scaleX: 6,
          scaleY: 1.5,
          alpha: 0,
          duration: 300,
          onComplete: () => shock.destroy()
        });

        // Damage hero if near ground impact
        if (Math.abs(hero.x - this.x) < 140 && Math.abs(hero.y - this.y) < 50) {
          hero.takeHit(2, this.x);
        }

        this.actionState = 'idle';
        this.actionTimer = 1.4;
      }
    } else if (this.actionState === 'tempest') {
      // Lightning strikes rain from the sky across arena
      audio.playSfx('power');
      this.scene.fx.shake(0.018, 350);
      for (let i = 0; i < 4; i++) {
        const lx = this.x + (i - 1.5) * 120 + (Math.random() - 0.5) * 40;
        const bolt = this.scene.add.graphics().setDepth(30);
        bolt.lineStyle(4, 0x7fd4ff, 1);
        bolt.beginPath();
        bolt.moveTo(lx, 0);
        bolt.lineTo(lx, this.y + 30);
        bolt.strokePath();
        this.scene.time.delayedCall(150, () => bolt.destroy());

        if (Math.abs(hero.x - lx) < 35 && hero.y < this.y + 40) {
          hero.takeHit(1, lx);
        }
      }
      this.actionState = 'idle';
      this.actionTimer = 1.6;
    }
  }

  fireElectricBall() {
    const ball = this.scene.add.circle(this.x + this.facing * 30, this.y - 10, 12, 0x7fd4ff, 0.9).setDepth(25);
    this.scene.physics.add.existing(ball);
    ball.body.setAllowGravity(false);
    ball.body.setVelocity(this.facing * 280, 0);

    const hitHero = this.scene.physics.add.overlap(ball, this.scene.hero, (b, h) => {
      h.takeHit(1, b.x);
      this.scene.fx.burst(b.x, b.y, 8, [0x7fd4ff, 0xffffff], 120, 240, 0);
      b.destroy();
    });

    this.scene.time.delayedCall(2200, () => {
      if (ball.active) ball.destroy();
    });
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.18;

    this.scene.fx.flashWhite(this);
    if (this.scene.fx.showDamageNumber) {
      this.scene.fx.showDamageNumber(this.x, this.y - 20, amount);
    }
    this.scene.fx.bossHitStop(this.hp <= 0);

    const knockDir = Math.sign(this.x - sourceX) || -this.facing;
    this.setVelocity(knockDir * 180, -140);

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.hp = 0;
    this.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.stormAura.destroy();

    this.scene.fx.slowMoFinish();
    audio.playSfx('die');
    this.scene.fx.shake(0.03, 700);
    this.scene.fx.burst(this.x, this.y, 40, [0x7fd4ff, 0xffffff, 0xffd700, 0xa877ff], 320, 800, -300);

    // Guaranteed Storm Shard & Coins drop
    for (let i = 0; i < 8; i++) {
      new Pickup(this.scene, this.x + (i - 4) * 16, this.y - 20, 'coin');
    }
    new Pickup(this.scene, this.x, this.y - 25, 'storm');

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 30,
      duration: 1000,
      onComplete: () => this.destroy()
    });

    const hud = this.scene.scene.get('HUDScene');
    hud?.showToast('🏆 STORMCALLER DEFEATED! Gate Opened!', 2500);

    if (this.scene.gate) {
      this.scene.gate.unlock();
    }
  }
}
