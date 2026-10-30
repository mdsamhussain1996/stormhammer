import { audio } from '../../systems/Audio.js';
import { Pickup } from '../../objects/Pickup.js';

/**
 * Realm 2 Boss: Ink Wraith Librarian
 * HP 15, 2 phases (ethereal teleportation + book storm).
 * Attacks:
 * 1. Teleports across the arena, leaving spectral afterimages.
 * 2. Summons flying razor books that home in or spiral outward.
 * 3. Phase 2: Inky shockwave burst and rapid dual-shot curses.
 */
export class WraithBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_caster_sheet_castle', 0);
    this.scene = scene;
    this.hp = 15;
    this.maxHp = 15;
    this.isDead = false;
    this.isBoss = true;
    this.bossName = 'Ink Wraith Librarian';
    this.facing = -1;
    this.phase = 1;
    this.actionTimer = 2.0;
    this.actionState = 'hover'; // 'hover', 'telegraph', 'summon', 'teleport'
    this.hurtTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setSize(40, 52);
    this.body.setOffset(12, 6);
    this.setScale(1.3);
    this.setTint(0x7090b8);
    this.setDepth(22);

    // Ethereal aura
    this.aura = scene.add.circle(x, y, 32, 0x486581, 0.4).setDepth(21);
    this.isEngaged = false;
  }

  update(time, delta, hero) {
    if (this.isDead) return;
    const dt = delta / 1000;

    if (!this.isEngaged) {
      if (Math.abs(hero.x - this.x) < 480) {
        this.isEngaged = true;
        audio.playSfx('power');
        const hud = this.scene.scene.get('HUDScene');
        hud?.showToast(`⚠️ BOSS: ${this.bossName} emerges!`);
      } else {
        this.setVelocityX(0);
        return;
      }
    }

    this.aura.setPosition(this.x, this.y);
    this.aura.setScale(1.0 + Math.sin(time / 150) * 0.15);

    if (this.hp <= 7 && this.phase === 1) {
      this.phase = 2;
      this.setTint(0x9d54c0);
      this.scene.fx.shake(0.015, 400);
      this.scene.fx.flashScreen(0x9d54c0, 100);
      audio.playSfx('power');
      const hud = this.scene.scene.get('HUDScene');
      hud?.showToast('The Ink Wraith summons the Forbidden Grimoire!');
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      return;
    }

    const dx = hero.x - this.x;
    this.facing = Math.sign(dx) || -1;
    this.setFlipX(this.facing < 0);

    this.actionTimer -= dt;

    if (this.actionState === 'hover') {
      // Gentle floating bob
      this.y += Math.sin(time / 200) * 0.8;
      this.setVelocityX(this.facing * (this.phase === 2 ? 60 : 35));

      if (this.actionTimer <= 0) {
        if (Math.random() < 0.5) {
          // Teleport
          this.actionState = 'teleport';
          this.actionTimer = 0.4;
          this.scene.fx.burst(this.x, this.y, 14, [0x7090b8, 0x9d54c0, 0xffffff], 180, 400, 0);
          audio.playSfx('swing');
        } else {
          // Summon flying book barrage
          this.actionState = 'summon';
          this.actionTimer = this.phase === 2 ? 0.4 : 0.7;
          audio.playSfx('power');
        }
      }
    } else if (this.actionState === 'teleport') {
      if (this.actionTimer <= 0) {
        // Reappear near hero but at safe distance
        const side = Math.random() < 0.5 ? 1 : -1;
        this.x = Phaser.Math.Clamp(hero.x + side * (120 + Math.random() * 80), 80, (this.scene.worldWidthPx || 2000) - 80);
        this.y = hero.y - 40 - Math.random() * 40;
        this.scene.fx.burst(this.x, this.y, 16, [0x9d54c0, 0x7fd4ff, 0xffffff], 220, 500, 0);
        audio.playSfx('catch');

        this.actionState = 'summon';
        this.actionTimer = 0.3;
      }
    } else if (this.actionState === 'summon') {
      if (this.actionTimer <= 0) {
        this.launchGrimoire(hero);
        this.actionState = 'hover';
        this.actionTimer = this.phase === 2 ? 1.5 : 2.4;
      }
    }
  }

  launchGrimoire(hero) {
    audio.playSfx('throw');
    const count = this.phase === 2 ? 3 : 2;

    for (let i = 0; i < count; i++) {
      const spreadAngle = (i - (count - 1) / 2) * 0.28;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, hero.x, hero.y) + spreadAngle;

      const book = this.scene.add.rectangle(this.x, this.y, 16, 12, 0xd8c29d)
        .setStrokeStyle(1.5, 0x5a3d28, 1.0)
        .setDepth(24);
      this.scene.physics.add.existing(book);
      book.body.setAllowGravity(false);
      book.body.setVelocity(Math.cos(angle) * 260, Math.sin(angle) * 260);

      this.scene.physics.add.overlap(book, this.scene.hero, () => {
        this.scene.hero.takeHit(1, this.x);
        book.destroy();
      });

      // Dissipate after 3.2s
      this.scene.time.delayedCall(3200, () => {
        if (book.active) {
          this.scene.fx.burst(book.x, book.y, 4, [0xd8c29d, 0xffffff], 60, 200, 0);
          book.destroy();
        }
      });
    }
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 0.15;
    this.scene.fx.flashWhite(this);
    if (this.scene.fx.showDamageNumber) {
      this.scene.fx.showDamageNumber(this.x, this.y - 25, amount, true);
    }
    this.scene.fx.hitStop(120);
    this.scene.fx.zoomPunch(1.06, 120);
    audio.playSfx('hit');

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    if (this.aura) this.aura.destroy();

    if (this.scene.hero) {
      this.scene.hero.kills += 1;
      this.scene.hero.score += 750;
    }

    audio.playSfx('die');
    this.scene.fx.burst(this.x, this.y, 40, [0x9d54c0, 0x7090b8, 0xffffff], 340, 1000, 0);
    this.scene.fx.shake(0.02, 600);
    if (this.scene.fx.slowMoFinish) {
      this.scene.fx.slowMoFinish(400);
    } else {
      this.scene.fx.zoomPunch(1.12, 250);
    }

    for (let i = 0; i < 6; i++) {
      this.scene.pickupsGroup.add(new Pickup(this.scene, this.x + (i - 2.5) * 12, this.y, 'coin'));
    }
    this.scene.pickupsGroup.add(new Pickup(this.scene, this.x - 20, this.y, 'heart'));
    this.scene.pickupsGroup.add(new Pickup(this.scene, this.x + 20, this.y, 'storm'));

    const hud = this.scene.scene.get('HUDScene');
    hud?.showToast('Ink Wraith Librarian Banished! Path to the gate unsealed!');

    this.destroy();
  }

  destroy(fromScene) {
    if (this.aura) this.aura.destroy();
    super.destroy(fromScene);
  }
}
