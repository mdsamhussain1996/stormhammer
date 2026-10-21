import { audio } from '../../systems/Audio.js';

/**
 * Arrow projectile fired by Archer enemy.
 * Travels horizontally and can be smashed or deflected by hammer swings.
 */
export class Arrow extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, direction) {
    super(scene, x, y, 'proj_arrow');
    this.scene = scene;
    this.direction = direction;
    this.isDead = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setSize(20, 6);
    this.setDepth(26);

    this.setVelocityX(direction * 360);
    this.setFlipX(direction < 0);

    // Auto-destroy after 3s
    this.lifetimer = scene.time.delayedCall(3000, () => this.destroy());
  }

  update(time, delta) {
    if (this.isDead) return;

    const tx = Math.floor(this.x / 40);
    const ty = Math.floor(this.y / 40);
    if (this.scene.isSolidTile && this.scene.isSolidTile(tx, ty)) {
      this.smash();
    }
  }

  smash() {
    if (this.isDead) return;
    this.isDead = true;
    audio.playSfx('hit');
    this.scene.fx.burst(this.x, this.y, 6, [0xc4a070, 0xffffff], 120, 200, 400);
    if (this.lifetimer) this.lifetimer.remove();
    this.destroy();
  }
}
