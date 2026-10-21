import { audio } from '../systems/Audio.js';

/**
 * Level Gate with Stone Tower, Portcullis, and Flickering Torches.
 * Reaches the ceiling so it cannot be jumped over.
 */
export class Gate {
  constructor(scene, tileX, tileY, worldHeight) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.worldX = tileX * 40;
    this.worldY = tileY * 40;
    this.isOpen = false;
    this.isOpening = false;
    this.openProgress = 0;

    this.container = scene.add.container(this.worldX, 0).setDepth(16);

    // Stone tower wall extending all the way to top of map (y=0 to y=8*40)
    for (let r = 0; r < 8; r++) {
      const stone = scene.add.image(20, r * 40 + 20, 'tile_castle_mid');
      this.container.add(stone);
    }

    // Portal arch & pillars
    const arch = scene.add.rectangle(20, 8 * 40 - 10, 80, 20, 0x4a4e55);
    const pillarL = scene.add.rectangle(-10, 10 * 40, 20, 4 * 40, 0x3d4148);
    const pillarR = scene.add.rectangle(50, 10 * 40, 20, 4 * 40, 0x3d4148);
    this.container.add([arch, pillarL, pillarR]);

    // Torches
    [-20, 60].forEach(tx => {
      const torch = scene.add.rectangle(tx, 9 * 40, 6, 16, 0x3a2a1a);
      const flame = scene.add.ellipse(tx, 9 * 40 - 10, 10, 18, 0xffa040);
      this.container.add([torch, flame]);

      scene.tweens.add({
        targets: flame,
        scaleY: 1.25,
        alpha: 0.8,
        yoyo: true,
        repeat: -1,
        duration: 150 + Math.random() * 80
      });
    });

    // Portcullis (iron grating)
    this.portcullis = scene.add.rectangle(20, 10 * 40, 40, 4 * 40, 0x22262c);
    this.container.add(this.portcullis);

    // Glowing keyhole / seal
    this.seal = scene.add.circle(20, 10 * 40, 8, 0xf2c14e, 0.85);
    this.container.add(this.seal);
    scene.tweens.add({
      targets: this.seal,
      scale: 1.3,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 700
    });

    // Solid collision barrier for the gate when closed
    this.barrier = scene.physics.add.staticBody(this.worldX, 0, 40, 12 * 40);
  }

  checkHeroApproach(hero) {
    if (this.isOpen || this.isOpening || !hero) return;

    const dist = Math.abs(hero.x - (this.worldX + 20));
    if (dist < 60 && hero.y > 6 * 40) {
      if (hero.hasKey) {
        this.open();
      } else {
        const hud = this.scene.scene.get('HUDScene');
        hud?.showToast('Sealed. The key is hidden inside one of the crates.');
      }
    }
  }

  open() {
    this.isOpening = true;
    audio.playSfx('gate');
    this.scene.fx.shake(0.012, 600);

    const hud = this.scene.scene.get('HUDScene');
    hud?.showToast('The portcullis grinds open!');

    this.scene.tweens.add({
      targets: this.portcullis,
      y: 6 * 40,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        this.isOpen = true;
        this.isOpening = false;
        // Remove collision barrier so hero can walk through
        if (this.barrier) {
          this.scene.physics.world.remove(this.barrier);
        }
      }
    });

    this.scene.tweens.add({
      targets: this.seal,
      alpha: 0,
      duration: 300
    });
  }

  isPassable(hero) {
    return this.isOpen && hero.x > this.worldX + 35;
  }
}
