import { audio } from '../systems/Audio.js';
import { Hammer } from './Hammer.js';

/**
 * Stormhammer Hero Entity
 * Original Norse-inspired warrior with winged helmet, fluttering cape, thunder hammer melee/throw.
 * Full platforming physics: acceleration, coyote time, jump buffer, variable jump, double jump, plank drop.
 */
export class Hero extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hero_idle');
    this.scene = scene;

    // Attributes
    this.hp = 5;
    this.maxHp = 5;
    this.score = 0;
    this.coins = 0;
    this.kills = 0;
    this.hasKey = false;
    this.hasWingBoots = false;

    // Power-up timers
    this.stormTimer = 0;
    this.shieldTimer = 0;
    this.invulnerableTimer = 0;

    // Movement tuning
    this.runSpeed = 270;
    this.jumpForce = 750;
    this.facing = 1; // 1 = right, -1 = left

    // Jump feel
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    this.canDoubleJump = false;
    this.wasOnGround = false;
    this.droppingThroughPlank = 0;

    // Checkpoint
    this.safeCheckpoint = { x: x, y: y };

    // Combat state
    this.isSwinging = false;
    this.swingTimer = 0;
    this.swingDuration = 0.3; // 0.3s
    this.swingHitEnemies = new Set();
    this.swingHitObjects = new Set();

    // Weapon
    this.hammer = new Hammer(scene, this);

    // Aegis shield aura
    this.shieldAura = scene.add.circle(0, 0, 32, 0x9ef0e0, 0.25).setVisible(false).setDepth(29);
    this.shieldAura.setStrokeStyle(2, 0x9ef0e0, 0.7);

    // Melee swing trail graphics
    this.swingGraphics = scene.add.graphics().setDepth(27);

    // Setup sprite and arcade physics body
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(26, 46);
    this.body.setOffset(19, 18);
    this.body.setGravityY(2000);
    this.body.setMaxVelocity(350, 950);
    this.setDepth(25);
  }

  update(time, delta, input) {
    const dt = delta / 1000;

    // Update timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      // Blinking visual feedback
      this.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.35 : 1.0);
    } else {
      this.setAlpha(1.0);
    }

    if (this.stormTimer > 0) this.stormTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.droppingThroughPlank > 0) this.droppingThroughPlank -= dt;

    // Update Shield Aura visual
    if (this.shieldTimer > 0) {
      this.shieldAura.setVisible(true);
      this.shieldAura.setPosition(this.x, this.y);
      this.shieldAura.setScale(1 + Math.sin(time / 100) * 0.08);
    } else {
      this.shieldAura.setVisible(false);
    }

    // Ground & Checkpoint tracking
    const onGround = this.body.blocked.down;
    if (onGround) {
      this.coyoteTime = 0.1;
      this.canDoubleJump = this.hasWingBoots;

      if (!this.wasOnGround) {
        // Landing dust puff
        this.scene.fx.dustPuff(this.x, this.y + 24, 5);
      }

      // Record safe checkpoint if standing on solid ground
      const tileX = Math.floor(this.x / 40);
      const tileY = Math.floor((this.y + 26) / 40);
      if (this.scene.isSolidTile && this.scene.isSolidTile(tileX, tileY) && this.invulnerableTimer <= 0.5) {
        this.safeCheckpoint.x = this.x;
        this.safeCheckpoint.y = this.y;
      }
    } else {
      this.coyoteTime = Math.max(0, this.coyoteTime - dt);
    }
    this.wasOnGround = onGround;

    // Horizontal Movement (Smooth acceleration & deceleration)
    let moveDir = 0;
    if (input.isLeft()) moveDir -= 1;
    if (input.isRight()) moveDir += 1;

    const currentSpeed = this.stormTimer > 0 ? this.runSpeed * 1.1 : this.runSpeed;
    const accel = onGround ? 1800 : 900;
    const drag = onGround ? 1600 : 600;

    if (moveDir !== 0) {
      this.facing = moveDir;
      this.setFlipX(this.facing < 0);
      const targetVx = moveDir * currentSpeed;
      this.setVelocityX(Phaser.Math.Linear(this.body.velocity.x, targetVx, Math.min(1, accel * dt / currentSpeed)));
    } else {
      // Decelerate smoothly
      const decelRate = Math.min(1, drag * dt / Math.max(1, Math.abs(this.body.velocity.x)));
      this.setVelocityX(Phaser.Math.Linear(this.body.velocity.x, 0, decelRate));
    }

    // Jump Buffering
    if (input.justJump()) {
      this.jumpBuffer = 0.13;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    // Drop through one-way plank (Down + Jump)
    if (this.jumpBuffer > 0 && input.isDown() && onGround) {
      this.droppingThroughPlank = 0.25;
      this.jumpBuffer = 0;
      this.y += 3;
    } else if (this.jumpBuffer > 0) {
      // Normal ground jump / coyote jump
      if (this.coyoteTime > 0) {
        this.setVelocityY(-this.jumpForce);
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        audio.playSfx('jump');
        this.scene.fx.dustPuff(this.x, this.y + 24, 6);
      } else if (this.canDoubleJump) {
        // Wing boots double jump
        this.setVelocityY(-this.jumpForce * 0.9);
        this.canDoubleJump = false;
        this.jumpBuffer = 0;
        audio.playSfx('jump');
        this.scene.fx.burst(this.x, this.y + 20, 8, [0xffffff, 0xcfe9ff], 140, 350, 200);
      }
    }

    // Variable jump height: release jump button early = short hop
    if (!input.isJumpHeld() && this.body.velocity.y < -300) {
      this.setVelocityY(-300);
    }

    // Melee Attack (Swing)
    if (input.justSwing() && !this.isSwinging && this.hammer.isHeld()) {
      this.startSwing();
    }

    // Thrown Hammer Attack
    if (input.justThrow() && !this.isSwinging && this.hammer.isHeld()) {
      this.hammer.throw(this.facing);
    }

    // Update ongoing swing attack
    this.updateSwing(dt);

    // Update Hammer instance
    this.hammer.update(time, delta);

    // Pit & Lava hazard check
    const worldBottom = this.scene.worldHeightPx || 560;
    if (this.y > worldBottom + 20) {
      this.fallIntoPit();
    }
  }

  startSwing() {
    this.isSwinging = true;
    this.swingTimer = this.swingDuration;
    this.swingHitEnemies.clear();
    this.swingHitObjects.clear();
    audio.playSfx('swing');
  }

  updateSwing(dt) {
    this.swingGraphics.clear();
    if (!this.isSwinging) return;

    this.swingTimer -= dt;
    const progress = 1 - (this.swingTimer / this.swingDuration);

    // Active hit window is the middle third (progress between 0.25 and 0.75)
    if (progress >= 0.25 && progress <= 0.75) {
      const isStorm = this.stormTimer > 0;
      const hitW = isStorm ? 65 : 50;
      const hitH = isStorm ? 68 : 56;
      const hitX = this.facing > 0 ? this.x + 8 : this.x - 8 - hitW;
      const hitY = this.y - hitH / 2;

      const hitRect = new Phaser.Geom.Rectangle(hitX, hitY, hitW, hitH);

      // White / blue motion trail arc
      this.swingGraphics.lineStyle(6, isStorm ? 0x7fd4ff : 0xffffff, 0.75);
      const startAngle = this.facing > 0 ? -Math.PI * 0.45 : -Math.PI * 0.55;
      const endAngle = this.facing > 0 ? Math.PI * 0.35 : Math.PI * 1.35;
      this.swingGraphics.beginPath();
      this.swingGraphics.arc(this.x + this.facing * 12, this.y - 6, 36, startAngle, endAngle, this.facing < 0);
      this.swingGraphics.strokePath();

      // Check hits against enemies
      if (this.scene.enemiesGroup) {
        this.scene.enemiesGroup.getChildren().forEach(enemy => {
          if (!enemy.isDead && !this.swingHitEnemies.has(enemy)) {
            const enemyBounds = enemy.getBounds();
            if (Phaser.Geom.Intersects.RectangleToRectangle(hitRect, enemyBounds)) {
              this.swingHitEnemies.add(enemy);
              const damage = isStorm ? 2 : 1;
              enemy.takeDamage(damage, this.x);

              this.scene.fx.hitStop(40);
              this.scene.fx.shake(0.008, 140);
              audio.playSfx('hit');

              if (isStorm) {
                this.scene.triggerChainLightning(enemy);
              }
            }
          }
        });
      }

      // Check hits against breakable crates
      if (this.scene.cratesGroup) {
        this.scene.cratesGroup.getChildren().forEach(crate => {
          if (!crate.broken && !this.swingHitObjects.has(crate)) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(hitRect, crate.getBounds())) {
              this.swingHitObjects.add(crate);
              crate.smash(isStorm);
            }
          }
        });
      }

      // Check hits against decorative urns
      if (this.scene.urnsGroup) {
        this.scene.urnsGroup.getChildren().forEach(urn => {
          if (!urn.broken && !this.swingHitObjects.has(urn)) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(hitRect, urn.getBounds())) {
              this.swingHitObjects.add(urn);
              urn.smash();
            }
          }
        });
      }

      // Destroy enemy fireballs
      if (this.scene.fireballsGroup) {
        this.scene.fireballsGroup.getChildren().forEach(fb => {
          if (!fb.isDead && Phaser.Geom.Intersects.RectangleToRectangle(hitRect, fb.getBounds())) {
            fb.smash();
          }
        });
      }
    }

    if (this.swingTimer <= 0) {
      this.isSwinging = false;
      this.swingGraphics.clear();
    }
  }

  takeHit(damage = 1, sourceX = 0) {
    // If shielded with Aegis, immune to damage and deal damage back to attacker!
    if (this.shieldTimer > 0) {
      audio.playSfx('hit');
      this.scene.fx.burst(this.x, this.y, 10, [0x9ef0e0, 0xffffff], 180, 300, 0);
      return;
    }

    if (this.invulnerableTimer > 0 || this.hp <= 0) return;

    this.hp -= damage;
    this.invulnerableTimer = 1.1; // 1.1s invulnerability
    audio.playSfx('hurt');

    this.scene.fx.shake(0.015, 250);
    this.scene.fx.burst(this.x, this.y, 12, [0xff5a5a, 0xffffff], 200, 400, 600);

    // Knockback
    const knockDir = sourceX ? Math.sign(this.x - sourceX) : -this.facing;
    this.setVelocity(knockDir * 280, -380);

    if (this.hp <= 0) {
      this.die();
    }
  }

  fallIntoPit() {
    this.hp -= 1;
    audio.playSfx('hurt');
    this.scene.fx.shake(0.018, 300);

    if (this.hp <= 0) {
      this.die();
      return;
    }

    // Auto checkpoint respawn
    this.setPosition(this.safeCheckpoint.x, this.safeCheckpoint.y - 10);
    this.setVelocity(0, 0);
    this.invulnerableTimer = 1.6;

    const hud = this.scene.scene.get('HUDScene');
    hud?.showToast('Careful at the edge! Respawned at safe ground.');
  }

  die() {
    audio.playSfx('die');
    this.scene.fx.burst(this.x, this.y, 28, [0x7fd4ff, 0xffffff, 0xa8323b], 350, 900, 600);
    this.scene.onHeroDeath();
  }

  destroy(fromScene) {
    if (this.shieldAura) this.shieldAura.destroy();
    if (this.swingGraphics) this.swingGraphics.destroy();
    if (this.hammer) this.hammer.destroy();
    super.destroy(fromScene);
  }
}
