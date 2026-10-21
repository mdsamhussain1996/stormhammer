import { audio } from '../systems/Audio.js';

/**
 * Stormhammer Interactive Pickup
 * Heart, Storm, Wing Boots, Aegis Shield, Key, Coins.
 */
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    super(scene, x, y, `pickup_${type}`);
    this.scene = scene;
    this.pickupType = type;
    this.canCollect = false;
    this.creationTime = scene.time.now;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(25);
    this.body.setBounce(0.4);
    this.body.setCollideWorldBounds(true);

    // Initial pop impulse
    const vx = Phaser.Math.Between(-60, 60);
    const vy = Phaser.Math.Between(-280, -380);
    this.setVelocity(vx, vy);

    // Glowing aura
    this.glowTween = scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.15 },
      alpha: { from: 0.9, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 600
    });

    // 250ms pickup delay
    scene.time.delayedCall(250, () => {
      this.canCollect = true;
    });
  }

  collect(hero) {
    if (!this.canCollect || !this.active) return;
    this.canCollect = false;

    const hud = this.scene.scene.get('HUDScene');
    const fx = this.scene.fx;

    switch (this.pickupType) {
      case 'coin':
        hero.coins += 1;
        hero.score += 10;
        audio.playSfx('coin');
        fx.burst(this.x, this.y, 6, [0xf2c14e, 0xfff3c0], 120, 300, 0);
        break;

      case 'heart':
        if (hero.hp < hero.maxHp) {
          hero.hp = Math.min(hero.maxHp, hero.hp + 1);
          audio.playSfx('power');
          hud?.showToast('+1 Heart Restored!');
          fx.burst(this.x, this.y, 12, [0xff5a6a, 0xffffff], 160, 450, 0);
        } else {
          hero.coins += 3;
          hero.score += 30;
          audio.playSfx('coin');
          hud?.showToast('Full Health! +3 Coins');
        }
        break;

      case 'storm':
        hero.stormTimer = 15.0; // 15 seconds
        audio.playSfx('power');
        hud?.showToast('Storm charged — hits arc to nearby foes!');
        fx.burst(this.x, this.y, 20, [0x7fd4ff, 0xffffff], 240, 600, 0);
        break;

      case 'shield':
        hero.shieldTimer = 8.0; // 8 seconds
        audio.playSfx('power');
        hud?.showToast('Aegis Shield — 8s invulnerable to harm!');
        fx.burst(this.x, this.y, 16, [0x9ef0e0, 0xffffff], 200, 500, 0);
        break;

      case 'wings':
        hero.hasWingBoots = true;
        audio.playSfx('power');
        hud?.showToast('Wing Boots — Double jump unlocked for this run!');
        fx.burst(this.x, this.y, 18, [0xffffff, 0xcfe9ff], 220, 500, 0);
        break;

      case 'key':
        hero.hasKey = true;
        hero.score += 100;
        audio.playSfx('key');
        hud?.showToast('The Key! Now find the Gate →');
        fx.burst(this.x, this.y, 28, [0xf2c14e, 0xffe58a, 0xffffff], 280, 800, 0);
        break;
    }

    this.destroy();
  }

  destroy(fromScene) {
    if (this.glowTween) this.glowTween.stop();
    super.destroy(fromScene);
  }
}
