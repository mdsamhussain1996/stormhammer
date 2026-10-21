import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';
import { Fireball } from './Fireball.js';

/**
 * Caster Enemy (Hooded Mage)
 * Stationary on ledges, faces hero, charges glowing fireball telegraph (0.45s) and casts aimed fireballs.
 */
export class Caster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, theme) {
    super(scene, x, y, `enemy_caster_${theme}`);
    this.scene = scene;
    this.theme = theme;
    this.hp = 2;
    this.maxHp = 2;
    this.isDead = false;
    this.facing = 1;
    this.castCooldown = 2.0 + Math.random();
    this.state = 'idle'; // 'idle', 'charging'
    this.chargeTimer = 0;
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(26, 42);
    this.body.setOffset(3, 4);
    this.body.setImmovable(true);
    this.body.setGravityY(1600);
    this.setDepth(20);

    // Glowing charging orb
    this.chargeOrb = scene.add.circle(0, 0, 7, 0xff9a3d, 0.85).setVisible(false).setDepth(21);
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;

    const dx = hero.x - this.x;
    const dy = hero.y - this.y;
    this.facing = Math.sign(dx) || 1;
    this.setFlipX(this.facing < 0);

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      return;
    }

    const dist = Math.hypot(dx, dy);

    if (this.state === 'idle') {
      this.chargeOrb.setVisible(false);
      this.castCooldown -= dt;

      if (this.castCooldown <= 0 && dist < 480) {
        this.state = 'charging';
        this.chargeTimer = 0.45; // 0.45s telegraph
        this.chargeOrb.setVisible(true);
      }
    } else if (this.state === 'charging') {
      this.chargeTimer -= dt;

      // Position glowing orb at hands
      this.chargeOrb.setPosition(this.x + this.facing * 18, this.y - 4);
      this.chargeOrb.setScale(1 + (1 - this.chargeTimer / 0.45) * 0.8);

      if (this.chargeTimer <= 0) {
        this.fire(hero);
        this.state = 'idle';
        this.chargeCooldown = 2.5 + Math.random() * 0.8;
        this.chargeOrb.setVisible(false);
      }
    }
  }

  fire(hero) {
    audio.playSfx('fire');
    const spawnX = this.x + this.facing * 18;
    const spawnY = this.y - 4;
    const fireball = new Fireball(this.scene, spawnX, spawnY, hero.x, hero.y - 10);
    this.scene.fireballsGroup.add(fireball);
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.2;
    this.scene.fx.flashWhite(this);

    // Interrupt charge
    if (this.state === 'charging') {
      this.state = 'idle';
      this.castCooldown = 1.5;
      this.chargeOrb.setVisible(false);
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    if (this.chargeOrb) this.chargeOrb.destroy();

    if (this.scene.hero) {
      this.scene.hero.kills += 1;
      this.scene.hero.score += 120;
    }

    const robeColor = this.theme === 'fortress' ? 0x5a1f2a : 0x2c3e5a;
    this.scene.fx.burst(this.x, this.y, 18, [robeColor, 0xffa040, 0xffffff], 200, 600, 500);

    if (Math.random() < 0.45) {
      const coin = new Pickup(this.scene, this.x, this.y, 'coin');
      this.scene.pickupsGroup.add(coin);
    }

    this.destroy();
  }

  destroy(fromScene) {
    if (this.chargeOrb) this.chargeOrb.destroy();
    super.destroy(fromScene);
  }
}
