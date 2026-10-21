import { Pickup } from './Pickup.js';
import { audio } from '../systems/Audio.js';

/**
 * Non-solid decorative urn / pot.
 * Smashes on hammer impact and yields coins or a heart.
 */
export class Urn extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'obj_urn');
    this.scene = scene;
    this.broken = false;

    scene.add.existing(this);
    this.setDepth(14);
  }

  smash() {
    if (this.broken) return;
    this.broken = true;

    audio.playSfx('break');
    this.scene.fx.burst(this.x, this.y, 14, [0xb0643a, 0x7a3f22, 0xe3a070], 220, 500, 600);

    const hero = this.scene.hero;
    const dropHeart = Math.random() < 0.35 && hero && hero.hp < hero.maxHp;

    if (dropHeart) {
      const p = new Pickup(this.scene, this.x, this.y, 'heart');
      this.scene.pickupsGroup.add(p);
    } else {
      const count = Phaser.Math.Between(1, 3);
      for (let i = 0; i < count; i++) {
        const coin = new Pickup(this.scene, this.x + (i - 1) * 8, this.y, 'coin');
        this.scene.pickupsGroup.add(coin);
      }
    }

    this.destroy();
  }
}
