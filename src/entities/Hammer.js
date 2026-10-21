import { audio } from '../systems/Audio.js';

/**
 * Thunder Hammer — Norse-style war weapon.
 * Can be swung for a melee arc or thrown to spin forward and home back to the hero.
 */
export class Hammer extends Phaser.GameObjects.Container {
  constructor(scene, hero) {
    super(scene, hero.x, hero.y);
    this.scene = scene;
    this.hero = hero;

    // Hammer visual sprite
    this.sprite = scene.add.sprite(0, 0, 'weapon_hammer').setOrigin(0.5, 0.8);
    this.add(this.sprite);

    // Glow effect when storm charged
    this.glow = scene.add.circle(0, -10, 18, 0x7fd4ff, 0.45).setVisible(false);
    this.add(this.glow);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setSize(32, 32);
    this.body.setOffset(-16, -16);

    this.state = 'held'; // 'held', 'thrown_out', 'returning'
    this.thrownDistance = 0;
    this.maxThrowDistance = 320;
    this.throwSpeed = 700;
    this.returnSpeed = 780;
    this.throwTimer = 0;
    this.hitEnemies = new Set();
    this.setDepth(28);

    this.setVisible(false);
  }

  isHeld() {
    return this.state === 'held';
  }

  throw(faceDirection) {
    if (this.state !== 'held') return;

    this.state = 'thrown_out';
    this.thrownDistance = 0;
    this.maxThrowDistance = this.hero.stormTimer > 0 ? 380 : 320;
    this.throwTimer = 0;
    this.hitEnemies.clear();

    this.setPosition(this.hero.x + faceDirection * 20, this.hero.y - 10);
    this.setVisible(true);

    this.body.setVelocity(faceDirection * this.throwSpeed, 0);
    audio.playSfx('throw');
  }

  update(time, delta) {
    const dt = delta / 1000;
    const isStorm = this.hero.stormTimer > 0;
    this.glow.setVisible(isStorm);

    if (this.state === 'held') {
      this.setVisible(false);
      return;
    }

    this.setVisible(true);
    this.throwTimer += dt;

    // Spin animation
    this.sprite.rotation += dt * 26 * Math.sign(this.body.velocity.x || this.hero.facing);

    // Force return after 3s to guarantee it never gets stuck
    if (this.throwTimer > 3.0 && this.state !== 'returning') {
      this.turnAround();
    }

    if (this.state === 'thrown_out') {
      this.thrownDistance += Math.abs(this.body.velocity.x) * dt;

      // Check distance threshold
      if (this.thrownDistance >= this.maxThrowDistance) {
        this.turnAround();
      }

      // Check collision with solid tiles
      const tileX = Math.floor(this.x / 40);
      const tileY = Math.floor(this.y / 40);
      if (this.scene.isSolidTile && this.scene.isSolidTile(tileX, tileY)) {
        this.scene.fx.burst(this.x, this.y, 6, [0xffffff, 0xcfd6de], 140, 250, 0);
        audio.playSfx('hit');
        this.turnAround();
      }
    } else if (this.state === 'returning') {
      // Home directly to hero's hand
      const targetX = this.hero.x;
      const targetY = this.hero.y - 12;

      const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

      const spd = this.returnSpeed + this.throwTimer * 180;
      this.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);

      // Catch check
      if (dist < 28 || this.throwTimer > 4.5) {
        this.catch();
      }
    }

    // Storm lightning sparks while flying
    if (isStorm && Math.random() < 0.4) {
      this.scene.fx.burst(this.x, this.y, 1, [0x7fd4ff, 0xffffff], 40, 200, 0);
    }
  }

  turnAround() {
    this.state = 'returning';
    this.hitEnemies.clear(); // Can hit enemies again on the way back
  }

  catch() {
    this.state = 'held';
    this.body.setVelocity(0, 0);
    this.setVisible(false);
    audio.playSfx('catch');
    this.scene.fx.burst(this.hero.x, this.hero.y - 12, 6, [0xffffff, 0x7fd4ff], 80, 200, 0);
  }

  checkHitEnemy(enemy) {
    if (this.state === 'held' || this.hitEnemies.has(enemy) || enemy.isDead) return;

    this.hitEnemies.add(enemy);
    const damage = this.hero.stormTimer > 0 ? 2 : 1;
    enemy.takeDamage(damage, this.x);

    this.scene.fx.hitStop(40);
    this.scene.fx.shake(0.008, 140);
    audio.playSfx('hit');

    // Storm chain lightning
    if (this.hero.stormTimer > 0) {
      this.scene.triggerChainLightning(enemy);
    }
  }
}
