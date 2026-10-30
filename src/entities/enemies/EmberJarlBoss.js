import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';
import { Fireball } from './Fireball.js';

/**
 * Realm 3 Boss: Ember Jarl
 * HP 18, 2 phases (flame warrior + volcanic tempest).
 * Attacks:
 * 1. Heavy charge rush leaving a trail of fire.
 * 2. Ground hammer slam producing sweeping lava shockwaves.
 * 3. Phase 2: Rains fireballs from the fiery sky and moves at blazing speed.
 */
export class EmberJarlBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_brute_sheet', 0);
    this.scene = scene;
    this.hp = 18;
    this.maxHp = 18;
    this.isDead = false;
    this.isBoss = true;
    this.bossName = 'Ember Jarl';
    this.facing = -1;
    this.phase = 1;
    this.actionTimer = 2.0;
    this.actionState = 'idle'; // 'idle', 'charge', 'slam', 'meteor'
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(56, 60);
    this.body.setOffset(4, 2);
    this.setScale(1.4);
    this.setTint(0xde5a2a);
    this.setDepth(22);

    // Fiery aura
    this.flameGlow = scene.add.circle(x, y, 36, 0xff5a20, 0.35).setDepth(21);
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

    this.flameGlow.setPosition(this.x, this.y);
    this.flameGlow.setScale(1.0 + Math.sin(time / 100) * 0.15);

    if (this.hp <= 9 && this.phase === 1) {
      this.phase = 2;
      this.setTint(0xff3300);
      this.scene.fx.shake(0.02, 500);
      this.scene.fx.flashScreen(0xff5500, 120);
      audio.playSfx('power');
      const hud = this.scene.scene.get('HUDScene');
      hud?.showToast('Ember Jarl unleashes the Volcanic Tempest!');
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      return;
    }

    const dx = hero.x - this.x;
    if (this.actionState !== 'charge') {
      this.facing = Math.sign(dx) || -1;
      this.setFlipX(this.facing < 0);
    }

    this.actionTimer -= dt;

    if (this.actionState === 'idle') {
      this.setVelocityX(this.facing * (this.phase === 2 ? 80 : 50));

      if (this.actionTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.45) {
          // Charge attack
          this.actionState = 'charge';
          this.actionTimer = 1.0;
          this.setVelocityX(this.facing * (this.phase === 2 ? 320 : 250));
          audio.playSfx('swing');
          this.scene.fx.shake(0.008, 300);
        } else if (roll < 0.8) {
          // Hammer Ground Slam -> Lava waves
          this.actionState = 'slam';
          this.actionTimer = 0.6;
          this.setVelocityX(0);
        } else {
          // Sky fireball rain
          this.actionState = 'meteor';
          this.actionTimer = 0.8;
          this.setVelocityX(0);
          this.rainFireballs(hero);
        }
      }
    } else if (this.actionState === 'charge') {
      // Spawn trailing flame embers
      if (Math.random() < 0.3) {
        this.scene.fx.burst(this.x, this.y + 20, 2, [0xff5500, 0xf2c14e], 60, 200, -200);
      }

      if (this.actionTimer <= 0 || (this.body.blocked.left || this.body.blocked.right)) {
        this.actionState = 'idle';
        this.actionTimer = this.phase === 2 ? 1.2 : 2.0;
        this.setVelocityX(0);
      }
    } else if (this.actionState === 'slam') {
      if (this.actionTimer <= 0) {
        this.performLavaSlam();
        this.actionState = 'idle';
        this.actionTimer = this.phase === 2 ? 1.4 : 2.2;
      }
    } else if (this.actionState === 'meteor') {
      if (this.actionTimer <= 0) {
        this.actionState = 'idle';
        this.actionTimer = this.phase === 2 ? 1.6 : 2.4;
      }
    }
  }

  performLavaSlam() {
    audio.playSfx('break');
    this.scene.fx.shake(0.015, 350);
    this.scene.fx.burst(this.x, this.y + 24, 18, [0xff3300, 0xf2c14e, 0xffffff], 220, 500, -300);

    // Send two crawling fire waves left and right
    [-1, 1].forEach(dir => {
      if (this.scene.fireballsGroup) {
        const wave = new Fireball(this.scene, this.x + dir * 20, this.y + 16, dir, 240);
        this.scene.fireballsGroup.add(wave);
      }
    });
  }

  rainFireballs(hero) {
    audio.playSfx('power');
    this.scene.fx.flashScreen(0xff4400, 80);

    const count = this.phase === 2 ? 4 : 3;
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 180, () => {
        if (!this.active || this.isDead) return;
        const targetX = hero.x + (Math.random() - 0.5) * 200;
        const fb = this.scene.add.circle(targetX, hero.y - 300, 9, 0xff4400).setDepth(24);
        this.scene.physics.add.existing(fb);
        fb.body.setVelocityY(380);

        this.scene.physics.add.overlap(fb, this.scene.hero, () => {
          this.scene.hero.takeHit(1, fb.x);
          fb.destroy();
        });

        this.scene.time.delayedCall(1600, () => {
          if (fb.active) {
            this.scene.fx.burst(fb.x, fb.y, 6, [0xff5500, 0xf2c14e], 90, 250, 0);
            fb.destroy();
          }
        });
      });
    }
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.15;
    this.scene.fx.flashWhite(this);
    if (this.scene.fx.showDamageNumber) {
      this.scene.fx.showDamageNumber(this.x, this.y - 25, amount, true);
    }
    this.scene.fx.hitStop(120);
    this.scene.fx.zoomPunch(1.08, 120);
    audio.playSfx('hit');

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    if (this.flameGlow) this.flameGlow.destroy();

    if (this.scene.hero) {
      this.scene.hero.kills += 1;
      this.scene.hero.score += 1000;
    }

    audio.playSfx('die');
    this.scene.fx.burst(this.x, this.y, 45, [0xff3300, 0xff7700, 0xf2c14e, 0xffffff], 360, 1200, 600);
    this.scene.fx.shake(0.025, 700);
    if (this.scene.fx.slowMoFinish) {
      this.scene.fx.slowMoFinish(450);
    } else {
      this.scene.fx.zoomPunch(1.15, 300);
    }

    for (let i = 0; i < 8; i++) {
      this.scene.pickupsGroup.add(new Pickup(this.scene, this.x + (i - 3.5) * 12, this.y, 'coin'));
    }
    this.scene.pickupsGroup.add(new Pickup(this.scene, this.x - 24, this.y, 'heart'));
    this.scene.pickupsGroup.add(new Pickup(this.scene, this.x + 24, this.y, 'storm'));

    const hud = this.scene.scene.get('HUDScene');
    hud?.showToast('Ember Jarl Vanquished! The realm gate is open!');

    this.destroy();
  }

  destroy(fromScene) {
    if (this.flameGlow) this.flameGlow.destroy();
    super.destroy(fromScene);
  }
}
