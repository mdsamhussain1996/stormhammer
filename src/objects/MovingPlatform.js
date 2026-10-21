/**
 * MovingPlatform
 * Smooth oscillating one-way wooden or stone ledge moving between two waypoints.
 * The hero rides on top seamlessly.
 */
export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, startX, startY, endX, endY, speed = 60, theme = 'forest') {
    const tex = theme === 'castle' ? 'tile_castle_plank' : (theme === 'fortress' ? 'tile_fortress_plank' : 'tile_forest_plank');
    super(scene, startX, startY, tex);
    this.scene = scene;

    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.speed = speed;
    this.dir = 1;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;

    this.setDisplaySize(80, 16);
    this.setDepth(14);
  }

  update(time, delta) {
    const dt = delta / 1000;
    const isHorizontal = this.startX !== this.endX;

    if (isHorizontal) {
      this.x += this.dir * this.speed * dt;
      if (this.dir > 0 && this.x >= this.endX) {
        this.dir = -1;
      } else if (this.dir < 0 && this.x <= this.startX) {
        this.dir = 1;
      }
      this.body.velocity.x = this.dir * this.speed;
    } else {
      this.y += this.dir * this.speed * dt;
      if (this.dir > 0 && this.y >= this.endY) {
        this.dir = -1;
      } else if (this.dir < 0 && this.y <= this.startY) {
        this.dir = 1;
      }
      this.body.velocity.y = this.dir * this.speed;
    }
  }
}

/**
 * CrumblingPlatform
 * Shakes and crumbles 0.7s after the player stands on it, then respawns after 3s.
 */
export class CrumblingPlatform extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, theme = 'forest') {
    const tex = theme === 'castle' ? 'tile_castle_plank' : (theme === 'fortress' ? 'tile_fortress_plank' : 'tile_forest_plank');
    super(scene, x, y, tex);
    this.scene = scene;
    this.origX = x;
    this.origY = y;
    this.isCrumbling = false;
    this.isCollapsed = false;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body

    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;

    this.setDisplaySize(70, 16);
    this.setDepth(14);
  }

  stepOn() {
    if (this.isCrumbling || this.isCollapsed) return;
    this.isCrumbling = true;

    // Shake warning
    this.scene.tweens.add({
      targets: this,
      x: { from: this.origX - 3, to: this.origX + 3 },
      duration: 50,
      repeat: 12,
      yoyo: true,
      onComplete: () => this.collapse()
    });
  }

  collapse() {
    this.isCollapsed = true;
    this.disableBody(true, true);
    this.scene.fx.burst(this.origX, this.origY, 10, [0x8a929e, 0x5a626e, 0xffffff], 140, 300, 200);

    // Respawn after 3.2s
    this.scene.time.delayedCall(3200, () => {
      this.enableBody(true, this.origX, this.origY, true, true);
      this.setAlpha(0);
      this.scene.tweens.add({
        targets: this,
        alpha: 1,
        duration: 250
      });
      this.isCrumbling = false;
      this.isCollapsed = false;
    });
  }
}
