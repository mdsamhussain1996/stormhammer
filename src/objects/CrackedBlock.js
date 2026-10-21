import { audio } from '../systems/Audio.js';
import { Pickup } from './Pickup.js';

/**
 * CrackedBlock
 * Secret wall or floor block hiding hidden caches (coins, heart containers).
 * Can ONLY be smashed by a Charged Hammer Throw or Ground Slam!
 */
export class CrackedBlock extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, reward = 'coin') {
    // Generate or use a distinct cracked stone texture
    super(scene, x, y, 'tile_castle_block');
    this.scene = scene;
    this.reward = reward; // 'coin', 'heart', 'storm'
    this.broken = false;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body

    this.setDisplaySize(40, 40);
    this.setTint(0x8a929e);
    this.setDepth(15);

    // Cracked indicator overlay
    this.crackGfx = scene.add.graphics().setDepth(16);
    this.crackGfx.lineStyle(2, 0x1a2130, 0.9);
    this.crackGfx.beginPath();
    this.crackGfx.moveTo(x - 14, y - 14);
    this.crackGfx.lineTo(x - 2, y + 2);
    this.crackGfx.lineTo(x + 14, y - 4);
    this.crackGfx.moveTo(x - 2, y + 2);
    this.crackGfx.lineTo(x + 4, y + 16);
    this.crackGfx.strokePath();

    // Subtle golden glint for secret hint
    this.glint = scene.add.circle(x, y, 3, 0xf2c14e, 0.5).setDepth(17);
    scene.tweens.add({
      targets: this.glint,
      alpha: { from: 0.2, to: 0.8 },
      scale: { from: 0.8, to: 1.4 },
      yoyo: true,
      repeat: -1,
      duration: 1200
    });
  }

  smash() {
    if (this.broken) return;
    this.broken = true;

    if (this.crackGfx) this.crackGfx.destroy();
    if (this.glint) this.glint.destroy();

    audio.playSfx('break');
    this.scene.fx.shake(0.015, 250);
    this.scene.fx.burst(this.x, this.y, 16, [0x8a929e, 0x5a626e, 0xf2c14e, 0xffffff], 200, 450, 0);

    // Spawn secret reward!
    if (this.reward === 'heart') {
      this.scene.pickupsGroup.add(new Pickup(this.scene, this.x, this.y - 10, 'heart'));
    } else if (this.reward === 'storm') {
      this.scene.pickupsGroup.add(new Pickup(this.scene, this.x, this.y - 10, 'storm'));
    } else {
      for (let i = 0; i < 3; i++) {
        this.scene.pickupsGroup.add(new Pickup(this.scene, this.x + (i - 1) * 12, this.y - 8, 'coin'));
      }
    }

    if (this.scene.secretFound) {
      this.scene.secretFound();
    }

    const hud = this.scene.scene.get('HUDScene');
    hud?.showToast('★ SECRET DISCOVERED! Hidden cache revealed!');

    this.disableBody(true, true);
    this.destroy();
  }

  destroy(fromScene) {
    if (this.crackGfx) this.crackGfx.destroy();
    if (this.glint) this.glint.destroy();
    super.destroy(fromScene);
  }
}
