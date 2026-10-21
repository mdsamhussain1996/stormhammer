import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';
import { Arrow } from './Arrow.js';

/**
 * Archer Enemy
 * Keeps distance from hero, retreats if too close, telegraphs bow draw (0.45s) and shoots smashable arrows.
 */
export class Archer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, theme) {
    super(scene, x, y, `enemy_grunt_sheet_${theme}`, 0);
    this.scene = scene;
    this.theme = theme;
    this.hp = 2;
    this.maxHp = 2;
    this.isDead = false;
    this.facing = -1;
    this.shotCooldown = 1.8 + Math.random();
    this.isDrawingBow = false;
    this.drawTimer = 0;
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(26, 38);
    this.body.setOffset(11, 6);
    this.setDepth(20);

    // Give green or distinct archer feather tint
    this.setTint(0x90e090);
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      return;
    }

    const dx = hero.x - this.x;
    const dy = hero.y - this.y;
    const dist = Math.abs(dx);

    this.facing = Math.sign(dx) || 1;
    this.setFlipX(this.facing < 0);

    // Spacing AI: if too close (<140px), back away; if too far (>300px), approach
    if (dist < 140 && Math.abs(dy) < 50) {
      this.setVelocityX(-this.facing * 80);
    } else if (dist > 320 && Math.abs(dy) < 60) {
      this.setVelocityX(this.facing * 70);
    } else {
      this.setVelocityX(0);
    }

    if (this.isDrawingBow) {
      this.drawTimer -= dt;
      this.setVelocityX(0);

      if (this.drawTimer <= 0) {
        this.fireArrow();
        this.isDrawingBow = false;
        this.shotCooldown = 2.4 + Math.random() * 0.6;
      }
    } else {
      this.shotCooldown -= dt;
      if (this.shotCooldown <= 0 && dist < 380 && Math.abs(dy) < 70) {
        this.isDrawingBow = true;
        this.drawTimer = 0.45; // 0.45s telegraph
        audio.playSfx('swing');
      }
    }
  }

  fireArrow() {
    audio.playSfx('throw');
    const arrow = new Arrow(this.scene, this.x + this.facing * 16, this.y - 4, this.facing);
    this.scene.arrowsGroup.add(arrow);
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.2;
    this.isDrawingBow = false;
    this.scene.fx.flashWhite(this);

    const knockDir = Math.sign(this.x - sourceX) || 1;
    this.setVelocity(knockDir * 200, -180);

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    if (this.scene.hero) {
      this.scene.hero.kills += 1;
      this.scene.hero.score += 90;
    }

    this.scene.fx.burst(this.x, this.y, 16, [0x90e090, 0xffffff, 0xc4a070], 200, 500, 500);

    if (Math.random() < 0.45) {
      const coin = new Pickup(this.scene, this.x, this.y, 'coin');
      this.scene.pickupsGroup.add(coin);
    }

    this.destroy();
  }
}
