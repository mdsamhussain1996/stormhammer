import { Pickup } from './Pickup.js';
import { audio } from '../systems/Audio.js';

/**
 * Solid destructible crate.
 * Supports standing on top, breaks on hammer contact.
 */
export class Crate extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, hasKey = false) {
    super(scene, x, y, 'tile_crate');
    this.scene = scene;
    this.hasKey = hasKey;
    this.broken = false;
    this.lastSparkleTime = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body so entities can stand on it

    this.setDepth(15);
    this.refreshBody();
  }

  update(time, delta, hero) {
    if (this.broken || !this.hasKey || !hero) return;

    // Key hint sparkles when hero is within ~5 tiles (200px)
    const dist = Phaser.Math.Distance.Between(this.x, this.y, hero.x, hero.y);
    if (dist < 200) {
      if (time - this.lastSparkleTime > 700) {
        this.lastSparkleTime = time;
        this.scene.fx.burst(
          this.x + Phaser.Math.Between(-12, 12),
          this.y + Phaser.Math.Between(-12, 12),
          2,
          [0xf2c14e, 0xffffff],
          50,
          400,
          0
        );

        // Notify HUD to pulse key slot
        const hud = this.scene.scene.get('HUDScene');
        hud?.pulseKeySlot();
      }
    }
  }

  smash(byStorm = false) {
    if (this.broken) return;
    this.broken = true;

    audio.playSfx('break');
    this.scene.fx.shake(0.008, 120);
    this.scene.fx.burst(this.x, this.y, 16, [0x8a5a32, 0x5a3a1e, 0xc49a6c], 240, 600, 700);

    // Score
    if (this.scene.hero) {
      this.scene.hero.score += 20;
    }

    // Drop loot
    if (this.hasKey) {
      const p = new Pickup(this.scene, this.x, this.y, 'key');
      this.scene.pickupsGroup.add(p);
    } else {
      const roll = Math.random();
      const hero = this.scene.hero;

      let type = 'coin';
      if (roll < 0.26) {
        type = 'storm';
      } else if (roll < 0.46) {
        type = 'heart';
      } else if (roll < 0.62) {
        type = 'shield';
      } else if (roll < 0.74 && hero && !hero.hasWingBoots) {
        type = 'wings';
      } else {
        // Drop 3 coins
        for (let i = 0; i < 3; i++) {
          const coin = new Pickup(this.scene, this.x + (i - 1) * 8, this.y, 'coin');
          this.scene.pickupsGroup.add(coin);
        }
        this.destroy();
        return;
      }

      const p = new Pickup(this.scene, this.x, this.y, type);
      this.scene.pickupsGroup.add(p);
    }

    this.destroy();
  }
}
