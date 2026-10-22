import { audio } from '../systems/Audio.js';
import { triggerHaptic } from '../systems/Input.js';
import { Hammer } from './Hammer.js';

/**
 * Stormhammer Hero Entity
 * Original Norse-inspired warrior with winged helmet, fluttering cape, thunder hammer melee/throw.
 * Full platforming physics: acceleration, coyote time, jump buffer, variable jump, double jump, plank drop.
 */
export class Hero extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hero_sheet', 0);
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
    this.jumpForce = 760; // Apex ≈ 3.6 tiles (144px) with world gravity 2000
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

    // Thunder Meter & Special Moves
    this.thunderMeter = 0; // 0 to 100
    this.throwChargeTimer = 0;
    this.hasPlayedChargeCue = false;
    this.isSlamming = false;
    this.slamHitEnemies = new Set();
    this.slamGraphics = scene.add.graphics().setDepth(26);

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
    // Rely exclusively on world gravity (2000) to avoid double gravity
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
        // Landing dust puff & squash animation
        this.scene.fx.dustPuff(this.x, this.y + 24, 5);
        this.setScale(1.22, 0.82);
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 160,
          ease: 'Quad.easeOut'
        });
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

        // Jump stretch
        this.setScale(0.86, 1.18);
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 160,
          ease: 'Quad.easeOut'
        });
      } else if (this.canDoubleJump) {
        // Wing boots double jump
        this.setVelocityY(-this.jumpForce * 0.9);
        this.canDoubleJump = false;
        this.jumpBuffer = 0;
        audio.playSfx('jump');
        this.scene.fx.burst(this.x, this.y + 20, 8, [0xffffff, 0xcfe9ff], 140, 350, 200);

        this.setScale(0.86, 1.18);
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 160,
          ease: 'Quad.easeOut'
        });
      }
    }

    // Variable jump height: release jump button early = short hop
    if (!input.isJumpHeld() && this.body.velocity.y < -300) {
      this.setVelocityY(-300);
    }

    // Active Ground Slam Dive
    if (this.isSlamming) {
      this.setVelocityX(0);
      this.setVelocityY(880);
      this.slamGraphics.clear();
      this.slamGraphics.lineStyle(6, 0x7fd4ff, 0.85);
      this.slamGraphics.lineBetween(this.x, this.y - 32, this.x, this.y + 16);

      if (onGround) {
        this.performGroundSlamImpact();
      }
      this.hammer.update(time, delta);
      return;
    }

    // Ground Slam Trigger: press ↓ + J in mid-air
    if (!onGround && input.isDown() && input.justSwing()) {
      this.startGroundSlam();
      return;
    }

    // Thunder Strike Trigger: press L when meter full
    if (input.justThunder() && this.thunderMeter >= 100) {
      this.useThunderStrike();
    }

    // Melee Attack (Swing)
    if (input.justSwing() && !this.isSwinging && this.hammer.isHeld()) {
      this.startSwing();
    }

    // Thrown Hammer Attack & Charged Throw & Recall Pull
    if (this.hammer.isHeld() && !this.isSwinging) {
      if (input.isThrowHeld()) {
        this.throwChargeTimer += dt;
        if (this.throwChargeTimer >= 0.6) {
          if (!this.hasPlayedChargeCue) {
            audio.playSfx('power');
            this.scene.fx.shake(0.005, 80);
            this.hasPlayedChargeCue = true;
          }
          // Visual golden/cyan lightning sparks around hero
          this.scene.fx.burst(this.x + this.facing * 12, this.y - 10, 1, [0xf2c14e, 0x7fd4ff], 40, 160, 0);
        }
      } else if (this.throwChargeTimer > 0 || input.justThrowReleased()) {
        const isCharged = this.throwChargeTimer >= 0.6;
        this.hammer.throw(this.facing, isCharged);
        this.throwChargeTimer = 0;
        this.hasPlayedChargeCue = false;
      } else if (input.justThrow()) {
        this.hammer.throw(this.facing, false);
      }
    } else if (!this.hammer.isHeld()) {
      // Recall pull: pressing K while hammer is out recalls it instantly and pulls small enemies
      if (input.justThrow()) {
        this.hammer.recallPull();
      }
    }

    // Update ongoing swing attack
    this.updateSwing(dt);

    // Update Hammer instance
    this.hammer.update(time, delta);

    // Update Sprite Animations
    if (this.hp > 0) {
      if (this.isSwinging) {
        this.anims.play('hero_anim_swing', true);
      } else if (!this.hammer.isHeld() && this.hammer.state === 'thrown_out' && this.hammer.throwTimer < 0.25) {
        this.anims.play('hero_anim_throw', true);
      } else if (this.invulnerableTimer > 0.8) {
        this.anims.play('hero_anim_hurt', true);
      } else if (!onGround) {
        if (this.body.velocity.y < -150) {
          this.anims.play('hero_anim_jump_up', true);
        } else if (this.body.velocity.y <= 150) {
          this.anims.play('hero_anim_apex', true);
        } else {
          this.anims.play('hero_anim_fall', true);
        }
      } else {
        if (Math.abs(this.body.velocity.x) > 25) {
          this.anims.play('hero_anim_run', true);
        } else {
          this.anims.play('hero_anim_idle', true);
        }
      }
    }

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
              this.addThunderMeter(12);

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

      // Destroy enemy fireballs & smash incoming arrows
      if (this.scene.fireballsGroup) {
        this.scene.fireballsGroup.getChildren().forEach(fb => {
          if (!fb.isDead && Phaser.Geom.Intersects.RectangleToRectangle(hitRect, fb.getBounds())) {
            fb.smash();
          }
        });
      }

      if (this.scene.arrowsGroup) {
        this.scene.arrowsGroup.getChildren().forEach(arr => {
          if (arr.active && Phaser.Geom.Intersects.RectangleToRectangle(hitRect, arr.getBounds())) {
            audio.playSfx('hit');
            this.scene.fx.burst(arr.x, arr.y, 6, [0x7fd4ff, 0xffffff], 90, 220, 0);
            arr.destroy();
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
    triggerHaptic(50);

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
    this.anims.play('hero_anim_death', true);
    audio.playSfx('die');
    this.scene.fx.burst(this.x, this.y, 28, [0x7fd4ff, 0xffffff, 0xa8323b], 350, 900, 600);
    this.scene.onHeroDeath();
  }

  startGroundSlam() {
    this.isSlamming = true;
    this.slamHitEnemies.clear();
    this.setVelocityX(0);
    this.setVelocityY(880);
    audio.playSfx('swing');
  }

  performGroundSlamImpact() {
    this.isSlamming = false;
    this.slamGraphics.clear();
    audio.playSfx('break');

    this.scene.fx.shake(0.02, 350);
    this.scene.fx.burst(this.x, this.y + 20, 24, [0x7fd4ff, 0xf2c14e, 0xffffff], 280, 500, -250);

    // Shockwave rectangle: covers both left and right (width 200, height 50)
    const shockRect = new Phaser.Geom.Rectangle(this.x - 100, this.y - 10, 200, 50);

    // Shockwave ring visual
    const shockCircle = this.scene.add.circle(this.x, this.y + 16, 12, 0x7fd4ff, 0.6).setDepth(23);
    this.scene.tweens.add({
      targets: shockCircle,
      scaleX: 7.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => shockCircle.destroy()
    });

    // Damage enemies in shockwave (bypasses frontal shields!)
    if (this.scene.enemiesGroup) {
      this.scene.enemiesGroup.getChildren().forEach(enemy => {
        if (!enemy.isDead && !this.slamHitEnemies.has(enemy)) {
          if (Phaser.Geom.Intersects.RectangleToRectangle(shockRect, enemy.getBounds())) {
            this.slamHitEnemies.add(enemy);
            enemy.takeDamage(3, this.x, true); // true = isSlam
            this.addThunderMeter(18);
          }
        }
      });
    }

    // Break cracked floors & secret walls
    if (this.scene.crackedBlocksGroup) {
      this.scene.crackedBlocksGroup.getChildren().forEach(block => {
        if (block.active && Phaser.Geom.Intersects.RectangleToRectangle(shockRect, block.getBounds())) {
          block.smash();
        }
      });
    }

    // Smash nearby crates and urns
    if (this.scene.cratesGroup) {
      this.scene.cratesGroup.getChildren().forEach(crate => {
        if (!crate.broken && Phaser.Geom.Intersects.RectangleToRectangle(shockRect, crate.getBounds())) {
          crate.smash(true);
        }
      });
    }
  }

  addThunderMeter(amount) {
    const prev = this.thunderMeter;
    this.thunderMeter = Phaser.Math.Clamp(this.thunderMeter + amount, 0, 100);
    if (prev < 100 && this.thunderMeter >= 100) {
      audio.playSfx('power');
      this.scene.fx.flashWhite(this);
      const hud = this.scene.scene.get('HUDScene');
      hud?.showToast('⚡ THUNDER READY! Press [L] or tap Thunder!');
    }
  }

  useThunderStrike() {
    this.thunderMeter = 0;
    audio.playSfx('power');
    this.scene.fx.flashScreen(0x7fd4ff, 100);
    this.scene.fx.shake(0.025, 550);

    const hud = this.scene.scene.get('HUDScene');
    hud?.showToast('⚡ THUNDER WRATH! All foes struck down!');

    // Strike all active enemies on the screen!
    if (this.scene.enemiesGroup) {
      const cam = this.scene.cameras.main;
      const camView = cam.worldView;

      this.scene.enemiesGroup.getChildren().forEach(enemy => {
        if (!enemy.isDead && Phaser.Geom.Intersects.RectangleToRectangle(camView, enemy.getBounds())) {
          // Lightning bolt visual down from sky
          const bolt = this.scene.add.graphics().setDepth(30);
          bolt.lineStyle(4, 0xffffff, 1.0);
          bolt.beginPath();
          bolt.moveTo(enemy.x + (Math.random() - 0.5) * 20, camView.y);
          bolt.lineTo(enemy.x, enemy.y);
          bolt.strokePath();
          this.scene.time.delayedCall(120, () => bolt.destroy());

          this.scene.fx.burst(enemy.x, enemy.y, 16, [0x7fd4ff, 0xffffff], 220, 450, 0);
          enemy.takeDamage(4, enemy.x);
        }
      });
    }
  }

  destroy(fromScene) {
    if (this.shieldAura) this.shieldAura.destroy();
    if (this.swingGraphics) this.swingGraphics.destroy();
    if (this.slamGraphics) this.slamGraphics.destroy();
    if (this.hammer) this.hammer.destroy();
    super.destroy(fromScene);
  }
}
