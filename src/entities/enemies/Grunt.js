import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';

/**
 * Grunt Enemy (Goblin / Skeleton / Ember Guard)
 * Patrols platforms, turns at ledges and walls, chases hero when in line of sight.
 */
export class Grunt extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, theme) {
    super(scene, x, y, `enemy_grunt_sheet_${theme}`, 0);
    this.scene = scene;
    this.theme = theme;
    this.hp = 2;
    this.maxHp = 2;
    this.isDead = false;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.patrolSpeed = 65;
    this.chaseSpeed = 120;
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(26, 36);
    this.body.setOffset(11, 8);
    this.setDepth(20);

    this.setFlipX(this.facing < 0);
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      this.anims.play(`grunt_anim_hurt_${this.theme}`, true);
      return;
    }

    this.anims.play(`grunt_anim_walk_${this.theme}`, true);

    if (!this.body.blocked.down) {
      // In air, keep current horizontal momentum
      return;
    }

    const dx = hero.x - this.x;
    const dy = hero.y - this.y;
    const isHeroNear = Math.abs(dx) < 220 && Math.abs(dy) < 60;

    let targetSpeed = this.patrolSpeed;
    if (isHeroNear) {
      targetSpeed = this.chaseSpeed;
      if (Math.abs(dx) > 15) {
        this.facing = Math.sign(dx);
      }
    }

    // Check ahead for wall or ledge
    const aheadX = this.x + this.facing * 18;
    const footY = this.y + 24;

    const tileAheadX = Math.floor(aheadX / 40);
    const tileAheadFootY = Math.floor(footY / 40);
    const tileBelowAheadY = Math.floor((footY + 20) / 40);

    const isWallAhead = this.body.blocked.left || this.body.blocked.right ||
                        (this.scene.isSolidTile && this.scene.isSolidTile(tileAheadX, tileAheadFootY));

    // Ledge detection: is ground missing ahead?
    const hasGroundAhead = this.scene.isSolidTile &&
      (this.scene.isSolidTile(tileAheadX, tileBelowAheadY) || this.scene.isPlatformTile(tileAheadX, tileBelowAheadY));

    const isSpikeAhead = this.scene.isSpikeTile && this.scene.isSpikeTile(tileAheadX, tileAheadFootY);

    if (isWallAhead || !hasGroundAhead || isSpikeAhead) {
      this.facing *= -1;
    }

    this.setVelocityX(this.facing * targetSpeed);
    this.setFlipX(this.facing < 0);
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.2;

    this.scene.fx.flashWhite(this);

    // Knockback
    const knockDir = Math.sign(this.x - sourceX) || 1;
    this.setVelocity(knockDir * 240, -220);

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

    const gruntColor = this.theme === 'fortress' ? 0xb8543c : this.theme === 'castle' ? 0xcdc5ae : 0x647f3c;
    this.scene.fx.burst(this.x, this.y, 16, [gruntColor, 0xffffff, 0xffd27a], 220, 600, 600);

    // 45% chance to drop coin
    if (Math.random() < 0.45) {
      const coin = new Pickup(this.scene, this.x, this.y, 'coin');
      this.scene.pickupsGroup.add(coin);
    }

    this.destroy();
  }
}
