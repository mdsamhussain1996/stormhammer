import { audio } from '../../systems/Audio.js';

/**
 * Caster Fireball Projectile.
 * Can be reflected/destroyed by hammer strikes.
 */
export class Fireball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, targetX, targetY) {
    super(scene, x, y, 'proj_fireball');
    this.scene = scene;
    this.isDead = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setCircle(8, 4, 4);
    this.setDepth(26);

    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const speed = 270;
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Lifespan
    this.lifetimer = scene.time.delayedCall(4000, () => {
      this.explode();
    });
  }

  update(time, delta) {
    if (this.isDead) return;

    // Fire trail particles
    if (Math.random() < 0.5) {
      this.scene.fx.burst(this.x, this.y, 1, [0xff8a3d, 0xffd27a], 30, 250, 0);
    }

    // Tile collision
    const tx = Math.floor(this.x / 40);
    const ty = Math.floor(this.y / 40);
    if (this.scene.isSolidTile && this.scene.isSolidTile(tx, ty)) {
      this.explode();
    }
  }

  smash() {
    if (this.isDead) return;
    this.isDead = true;
    audio.playSfx('hit');
    this.scene.fx.burst(this.x, this.y, 10, [0xffb060, 0xffffff, 0xff5a3a], 180, 300, 0);
    if (this.lifetimer) this.lifetimer.remove();
    this.destroy();
  }

  explode() {
    if (this.isDead) return;
    this.isDead = true;
    this.scene.fx.burst(this.x, this.y, 8, [0xff8a3d, 0xff4a3a], 120, 250, 0);
    if (this.lifetimer) this.lifetimer.remove();
    this.destroy();
  }
}
