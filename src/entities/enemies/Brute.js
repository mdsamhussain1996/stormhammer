import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';

/**
 * Brute Enemy (Horned Ogre Mini-Boss)
 * HP 6, telegraph wind-up (0.55s), devastating charge (1.1s), stops at walls with screen shake,
 * renders an above-head health bar, and always drops a Heart or Storm on defeat.
 */
export class Brute extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_brute_sheet', 0);
    this.scene = scene;
    this.hp = 6;
    this.maxHp = 6;
    this.isDead = false;
    this.mode = 'walk'; // 'walk', 'windup', 'charge'
    this.modeTimer = 0;
    this.cooldown = 1.0;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.walkSpeed = 45;
    this.chargeSpeed = 240;
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(44, 52);
    this.body.setOffset(10, 8);
    this.setDepth(22);

    // HP Bar Graphics
    this.hpBar = scene.add.graphics().setDepth(23);
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;

    this.updateHpBar();

    // Play appropriate state animation
    if (this.mode === 'windup') {
      this.anims.play('brute_anim_windup', true);
    } else if (this.mode === 'charge') {
      this.anims.play('brute_anim_charge', true);
    } else {
      this.anims.play('brute_anim_walk', true);
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      return;
    }

    const dx = hero.x - this.x;
    const dy = hero.y - this.y;

    if (this.mode === 'walk') {
      this.cooldown -= dt;
      this.setVelocityX(this.facing * this.walkSpeed);

      // Check if hero is in charge trigger window
      if (this.cooldown <= 0 && Math.abs(dx) < 300 && Math.abs(dy) < 70) {
        this.mode = 'windup';
        this.modeTimer = 0.55; // 0.55s telegraph
        this.facing = Math.sign(dx) || 1;
        this.setVelocityX(0);
      }

      // Turn at wall or ledge
      this.checkLedgeOrWall();
    } else if (this.mode === 'windup') {
      this.modeTimer -= dt;
      this.setVelocityX(0);

      // Shake visual telegraph
      this.x += (Math.random() - 0.5) * 3;

      if (this.modeTimer <= 0) {
        this.mode = 'charge';
        this.modeTimer = 1.1; // 1.1s charge
      }
    } else if (this.mode === 'charge') {
      this.modeTimer -= dt;
      this.setVelocityX(this.facing * this.chargeSpeed);

      // Charge smoke / dust
      if (Math.random() < 0.4) {
        this.scene.fx.burst(this.x, this.y + 24, 2, [0xc8b4a0, 0xffffff], 50, 300, 100);
      }

      // Check wall impact
      if (this.body.blocked.left || this.body.blocked.right) {
        this.scene.fx.shake(0.015, 200);
        audio.playSfx('hit');
        this.mode = 'walk';
        this.cooldown = 1.4;
        this.facing *= -1;
      }

      // Don't charge off ledges
      const aheadX = this.x + this.facing * 28;
      const footY = this.y + 32;
      const tileAheadX = Math.floor(aheadX / 40);
      const tileBelowAheadY = Math.floor((footY + 20) / 40);

      const hasGround = this.scene.isSolidTile &&
        (this.scene.isSolidTile(tileAheadX, tileBelowAheadY) || this.scene.isPlatformTile(tileAheadX, tileBelowAheadY));

      if (!hasGround) {
        this.mode = 'walk';
        this.cooldown = 1.4;
        this.setVelocityX(0);
        this.facing *= -1;
      }

      if (this.modeTimer <= 0) {
        this.mode = 'walk';
        this.cooldown = 1.4;
      }
    }

    this.setFlipX(this.facing < 0);
  }

  checkLedgeOrWall() {
    const aheadX = this.x + this.facing * 26;
    const footY = this.y + 30;

    const tileAheadX = Math.floor(aheadX / 40);
    const tileAheadFootY = Math.floor(footY / 40);
    const tileBelowAheadY = Math.floor((footY + 20) / 40);

    const isWall = this.body.blocked.left || this.body.blocked.right ||
                   (this.scene.isSolidTile && this.scene.isSolidTile(tileAheadX, tileAheadFootY));

    const hasGround = this.scene.isSolidTile &&
      (this.scene.isSolidTile(tileAheadX, tileBelowAheadY) || this.scene.isPlatformTile(tileAheadX, tileBelowAheadY));

    if (isWall || !hasGround) {
      this.facing *= -1;
    }
  }

  updateHpBar() {
    this.hpBar.clear();
    if (this.isDead || this.hp <= 0) return;

    const barW = 44;
    const barH = 5;
    const barX = this.x - barW / 2;
    const barY = this.y - 34;

    // Background
    this.hpBar.fillStyle(0x0a0d14, 0.7);
    this.hpBar.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // Current health
    const healthW = Math.max(0, (this.hp / this.maxHp) * barW);
    this.hpBar.fillStyle(0xff5a5a, 1.0);
    this.hpBar.fillRect(barX, barY, healthW, barH);
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.18;
    this.scene.fx.flashWhite(this);

    // If not charging, small stagger
    if (this.mode !== 'charge') {
      const knockDir = Math.sign(this.x - sourceX) || 1;
      this.setVelocity(knockDir * 120, -140);
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.hpBar.destroy();

    if (this.scene.hero) {
      this.scene.hero.kills += 1;
      this.scene.hero.score += 200;
    }

    this.scene.fx.burst(this.x, this.y, 24, [0x6b5a4a, 0x8a7560, 0xff5a5a, 0xffffff], 280, 800, 700);
    this.scene.fx.shake(0.018, 300);
    this.scene.fx.zoomPunch(1.08, 140); // Brief zoom-punch impact on mini-boss kill

    // Always drops Heart or Storm
    const dropType = Math.random() < 0.5 ? 'heart' : 'storm';
    const pickup = new Pickup(this.scene, this.x, this.y, dropType);
    this.scene.pickupsGroup.add(pickup);

    this.destroy();
  }

  destroy(fromScene) {
    if (this.hpBar) this.hpBar.destroy();
    super.destroy(fromScene);
  }
}
