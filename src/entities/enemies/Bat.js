import { Pickup } from '../../objects/Pickup.js';

/**
 * Bat Enemy.
 * Flies freely through air, hovers around an anchor point, swoops down to attack hero.
 */
export class Bat extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_bat');
    this.scene = scene;
    this.homeX = x;
    this.homeY = y;
    this.hp = 1;
    this.maxHp = 1;
    this.isDead = false;
    this.t = Math.random() * 10;
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setSize(24, 18);
    this.setDepth(21);
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;
    this.t += dt;

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      return;
    }

    const dx = hero.x - this.x;
    const dy = hero.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 280) {
      // Swoop towards hero
      const speed = 150;
      this.setVelocity(
        (dx / dist) * speed,
        (dy / dist) * speed + Math.sin(this.t * 6) * 70
      );
      this.setFlipX(dx < 0);
    } else {
      // Hover around home point
      const targetX = this.homeX + Math.sin(this.t * 0.9) * 70;
      const targetY = this.homeY + Math.sin(this.t * 1.8) * 25;
      this.setVelocity(
        (targetX - this.x) * 2,
        (targetY - this.y) * 2
      );
      this.setFlipX(Math.cos(this.t * 0.9) < 0);
    }
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.15;
    this.scene.fx.flashWhite(this);

    const knockDir = Math.sign(this.x - sourceX) || 1;
    this.setVelocity(knockDir * 160, -80);

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    if (this.scene.hero) {
      this.scene.hero.kills += 1;
      this.scene.hero.score += 60;
    }

    this.scene.fx.burst(this.x, this.y, 14, [0x3b2a4a, 0x6b4a8a, 0xff5a5a], 180, 500, 400);

    if (Math.random() < 0.45) {
      const coin = new Pickup(this.scene, this.x, this.y, 'coin');
      this.scene.pickupsGroup.add(coin);
    }

    this.destroy();
  }
}
