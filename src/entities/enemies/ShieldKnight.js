import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';

/**
 * ShieldKnight Enemy
 * Carries a heavy tower shield that deflects all frontal melee and hammer hits.
 * Vulnerable only from behind or via Ground Slam shockwaves!
 */
export class ShieldKnight extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, theme) {
    super(scene, x, y, `enemy_grunt_sheet_${theme}`, 0);
    this.scene = scene;
    this.theme = theme;
    this.hp = 3;
    this.maxHp = 3;
    this.isDead = false;
    this.facing = -1;
    this.speed = 50;
    this.hurtTimer = 0;
    this.freezeTimer = 0;
    this.burnTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(30, 42);
    this.body.setOffset(9, 6);
    this.setDepth(20);

    // Silver metallic knight tint
    this.setTint(0xd0d8e8);

    // Visual tower shield
    this.shieldSprite = scene.add.rectangle(0, 0, 8, 36, 0x8fa0b8)
      .setStrokeStyle(1.5, 0xffffff, 0.9)
      .setDepth(21);
  }

  freeze(duration = 3.5) {
    if (this.isDead) return;
    this.freezeTimer = duration;
    this.setTint(0xaef2ff);
    this.setVelocity(0, 0);
  }

  burn(duration = 3.0) {
    if (this.isDead) return;
    this.burnTimer = duration;
    this.setTint(0xff7722);
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;

    if (this.shieldSprite) {
      this.shieldSprite.setPosition(this.x + this.facing * 14, this.y);
    }

    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      this.setVelocity(0, 0);
      if (this.freezeTimer <= 0) this.setTint(0xd0d8e8);
      return;
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      if (Math.random() < 0.15) {
        this.takeDamage(0.3, this.x, true);
        this.scene.fx.burst(this.x, this.y, 2, [0xff5500, 0xf2c14e], 40, 120, 0);
      }
      if (this.burnTimer <= 0) this.setTint(0xd0d8e8);
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      return;
    }

    const dx = hero.x - this.x;
    if (Math.abs(dx) > 10) {
      this.facing = Math.sign(dx);
      this.setFlipX(this.facing < 0);
    }

    this.setVelocityX(this.facing * this.speed);
  }

  takeDamage(amount, sourceX, isSlam = false) {
    if (this.isDead) return;

    // Stone Rune or Ground Slam or Frozen state shatters shield defense!
    const hero = this.scene.hero;
    const hasStoneRune = hero && hero.currentRune === 'stone';
    const hitFromFront = (sourceX > this.x && this.facing > 0) || (sourceX < this.x && this.facing < 0);

    if (hitFromFront && !isSlam && !hasStoneRune && this.freezeTimer <= 0) {
      // Blocked!
      audio.playSfx('hit');
      this.scene.fx.burst(this.x + this.facing * 14, this.y, 8, [0xffffff, 0x8fa0b8, 0x7fd4ff], 160, 200, 0);
      this.scene.fx.shake(0.005, 80);
      const hud = this.scene.scene.get('HUDScene');
      hud?.showToast('Blocked! Strike from behind, use Stone Rune, or Ground Slam!', 900);
      return;
    }

    // Damage penetrates!
    this.hp -= amount;
    this.hurtTimer = 0.2;
    this.scene.fx.flashWhite(this);
    if (this.scene.fx.showDamageNumber) {
      this.scene.fx.showDamageNumber(this.x, this.y - 12, amount);
    }
    audio.playSfx('hit');

    const knockDir = Math.sign(this.x - sourceX) || -this.facing;
    this.setVelocity(knockDir * 180, -160);

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    if (this.shieldSprite) this.shieldSprite.destroy();

    if (this.scene.hero) {
      this.scene.hero.kills += 1;
      this.scene.hero.score += 140;
    }

    this.scene.fx.burst(this.x, this.y, 20, [0xd0d8e8, 0x8fa0b8, 0xffffff], 220, 600, 600);

    if (Math.random() < 0.5) {
      const dropType = Math.random() < 0.3 ? 'heart' : 'coin';
      const p = new Pickup(this.scene, this.x, this.y, dropType);
      this.scene.pickupsGroup.add(p);
    }

    this.destroy();
  }

  destroy(fromScene) {
    if (this.shieldSprite) this.shieldSprite.destroy();
    super.destroy(fromScene);
  }
}
