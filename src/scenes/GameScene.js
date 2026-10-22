import level1Data from '../levels/level1.json';
import level2Data from '../levels/level2.json';
import level3Data from '../levels/level3.json';

import { Hero } from '../entities/Hero.js';
import { Grunt } from '../entities/enemies/Grunt.js';
import { Bat } from '../entities/enemies/Bat.js';
import { Brute } from '../entities/enemies/Brute.js';
import { Caster } from '../entities/enemies/Caster.js';
import { Archer } from '../entities/enemies/Archer.js';
import { ShieldKnight } from '../entities/enemies/ShieldKnight.js';
import { TreantBoss } from '../entities/enemies/TreantBoss.js';
import { WraithBoss } from '../entities/enemies/WraithBoss.js';
import { EmberJarlBoss } from '../entities/enemies/EmberJarlBoss.js';

import { Crate } from '../objects/Crate.js';
import { Urn } from '../objects/Urn.js';
import { Gate } from '../objects/Gate.js';
import { CrackedBlock } from '../objects/CrackedBlock.js';
import { MovingPlatform, CrumblingPlatform } from '../objects/MovingPlatform.js';

import { InputSystem } from '../systems/Input.js';
import { FXSystem } from '../systems/FX.js';
import { ParallaxSystem } from '../systems/Parallax.js';
import { audio } from '../systems/Audio.js';
import { SaveSystem } from '../systems/Save.js';
import { validateLevelReachability } from '../levels/validateLevels.js';

/**
 * GameScene — Core Platformer Gameplay
 * Manages tiles, entities, physics collisions, camera, and level progression.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.currentRealm = data.realm || 1;
    this.inheritedPlayerState = data.playerState || null;
  }

  create() {
    // 1. Select level JSON
    const levelMap = { 1: level1Data, 2: level2Data, 3: level3Data };
    this.levelData = levelMap[this.currentRealm] || level1Data;
    this.theme = this.levelData.theme;

    const cols = this.levelData.width;
    const rows = this.levelData.height;
    const TS = this.levelData.tileSize;
    this.worldWidthPx = cols * TS;
    this.worldHeightPx = rows * TS;

    // Dev-only reachability verification
    if (import.meta.env.DEV) {
      validateLevelReachability(this.levelData);
    }

    // Set Arcade Physics world bounds
    this.physics.world.setBounds(0, 0, this.worldWidthPx, this.worldHeightPx + 100);

    // 2. Systems
    this.fx = new FXSystem(this);
    this.inputSystem = new InputSystem(this);
    this.parallax = new ParallaxSystem(this, this.theme, this.worldWidthPx, this.worldHeightPx);

    // Weather & Ambient particles
    const ambientType = this.theme === 'fortress' ? 'ember' : this.theme === 'castle' ? 'dust' : 'leaf';
    this.fx.initAmbient(ambientType, this.worldWidthPx, this.worldHeightPx);

    // Start Realm Theme BGM
    audio.playThemeBgm(this.theme);

    // 3. Tile Storage for collision checks
    this.grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
    // 0=empty, 1=solid, 2=platform, 3=spike, 4=crate

    // Groups
    this.solidsGroup = this.physics.add.staticGroup();
    this.platformsGroup = this.physics.add.staticGroup();
    this.spikesGroup = this.physics.add.staticGroup();
    this.cratesGroup = this.physics.add.staticGroup();
    this.urnsGroup = this.add.group();
    this.pickupsGroup = this.physics.add.group();
    this.enemiesGroup = this.physics.add.group();
    this.fireballsGroup = this.physics.add.group();
    this.arrowsGroup = this.physics.add.group();
    this.crackedBlocksGroup = this.physics.add.staticGroup();
    this.movingPlatformsGroup = this.physics.add.group();
    this.crumblingPlatformsGroup = this.physics.add.staticGroup();

    this.activeBoss = null;

    // 3-Star and Secrets Tracking
    this.stats = { foundKey: false, allSecrets: false, died: false };
    this.totalSecretsInLevel = (this.levelData.crackedBlocks || []).length;
    this.secretsFoundCount = 0;
    this.secretFound = () => {
      this.secretsFoundCount++;
      if (this.secretsFoundCount >= this.totalSecretsInLevel) {
        this.stats.allSecrets = true;
      }
    };

    // Build map tiles
    this.buildLevelGeometry(cols, rows, TS);

    // 4. Hero Spawn & Persistent Upgrades
    const spawnX = this.levelData.start.x * TS;
    const spawnY = this.levelData.start.y * TS;
    this.hero = new Hero(this, spawnX, spawnY);

    const upgrades = SaveSystem.getUpgrades();
    this.hero.maxHp = 5 + (upgrades.maxHp || 0);
    this.hero.hp = this.hero.maxHp;
    this.hero.hammer.maxThrowDistance += (upgrades.throwRange || 0) * 60;

    // Restore inherited player state if continuing
    if (this.inheritedPlayerState) {
      this.hero.hp = Math.min(this.hero.maxHp, this.inheritedPlayerState.hp || 5);
      this.hero.coins = this.inheritedPlayerState.coins || 0;
      this.hero.score = this.inheritedPlayerState.score || 0;
      this.hero.hasWingBoots = !!this.inheritedPlayerState.hasWingBoots;
    }

    // 5. Gate Spawn
    this.gate = new Gate(this, this.levelData.gate.x, this.levelData.gate.y, this.worldHeightPx);

    // 6. Spawn Breakables, Pickups, and Special Mechanics
    this.spawnCratesAndUrns(TS);
    this.spawnCoins(TS);
    this.spawnProps(TS);
    this.spawnCrackedBlocks(TS);
    this.spawnSpecialPlatforms(TS);

    // 7. Spawn Enemies & Bosses
    this.spawnEnemies(TS);
    this.setupHazards();

    // 8. Collisions & Overlaps
    this.setupCollisions();

    // 9. Camera setup: deadzone + look-ahead in facing direction + smooth follow
    this.cameras.main.setBounds(0, 0, this.worldWidthPx, this.worldHeightPx);
    this.cameras.main.setDeadzone(90, 50);
    this.cameras.main.startFollow(this.hero, true, 0.08, 0.08, 0, -10);

    // 10. Lava lighting upward glow in Fortress realm
    if (this.theme === 'fortress') {
      const lavaLight = this.add.graphics().setDepth(18);
      lavaLight.fillGradientStyle(0x000000, 0x000000, 0xff7a2a, 0xff7a2a, 0, 0, 0.35, 0.35);
      lavaLight.fillRect(0, this.worldHeightPx - 100, this.worldWidthPx, 100);
      lavaLight.setBlendMode(Phaser.BlendModes.ADD);
    }

    // 11. Launch Parallel HUD
    this.scene.launch('HUDScene');

    // Ensure game canvas has focus so keyboard input is immediate
    if (this.game.canvas && this.game.canvas.focus) {
      this.game.canvas.focus();
    }

    // Display realm entrance toast (keep short: <= 1s)
    const hud = this.scene.get('HUDScene');
    hud?.showToast(`Realm ${this.currentRealm} · ${this.levelData.name}`, 1000);
  }

  buildLevelGeometry(cols, rows, TS) {
    const topTileKey = `tile_${this.theme}_top`;
    const midTileKey = `tile_${this.theme}_mid`;

    // Ceiling (if castle)
    if (this.levelData.ceiling) {
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < 2; r++) {
          this.setTile(c, r, 1);
          const block = this.solidsGroup.create(c * TS + TS / 2, r * TS + TS / 2, midTileKey);
          block.refreshBody();
        }
      }
    }

    // Ground segments
    this.levelData.ground.forEach(([startCol, endCol]) => {
      for (let c = startCol; c < endCol; c++) {
        // Ground top
        this.setTile(c, 12, 1);
        const top = this.solidsGroup.create(c * TS + TS / 2, 12 * TS + TS / 2, topTileKey);
        top.refreshBody();

        // Ground under
        this.setTile(c, 13, 1);
        const mid = this.solidsGroup.create(c * TS + TS / 2, 13 * TS + TS / 2, midTileKey);
        mid.refreshBody();
      }
    });

    // Solid blocks
    this.levelData.blocks.forEach(([bx, by, bw, bh]) => {
      for (let i = 0; i < bw; i++) {
        for (let j = 0; j < bh; j++) {
          const c = bx + i;
          const r = by + j;
          this.setTile(c, r, 1);
          const key = j === 0 ? topTileKey : midTileKey;
          const block = this.solidsGroup.create(c * TS + TS / 2, r * TS + TS / 2, key);
          block.refreshBody();
        }
      }
    });

    // One-way jump-through platforms
    this.levelData.plats.forEach(([px, py, plen]) => {
      for (let i = 0; i < plen; i++) {
        const c = px + i;
        const r = py;
        this.setTile(c, r, 2);
        const plat = this.platformsGroup.create(c * TS + TS / 2, r * TS + TS / 2, 'tile_plat');
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
        plat.refreshBody();
      }
    });

    // Spikes
    if (this.levelData.spikes) {
      this.levelData.spikes.forEach(([sx, sy, slen]) => {
        for (let i = 0; i < slen; i++) {
          const c = sx + i;
          const r = sy;
          this.setTile(c, r, 3);
          const spike = this.spikesGroup.create(c * TS + TS / 2, r * TS + TS / 2, 'tile_spike');
          spike.refreshBody();
        }
      });
    }
  }

  spawnCratesAndUrns(TS) {
    // Choose one random crate after tile 15 to hold the key
    const eligibleCrates = this.levelData.crates.filter(([cx]) => cx > 15);
    const keyCrateCoord = eligibleCrates[Math.floor(Math.random() * eligibleCrates.length)];

    this.levelData.crates.forEach(([cx, cy]) => {
      const isKey = cx === keyCrateCoord[0] && cy === keyCrateCoord[1];
      const crate = new Crate(this, cx * TS + TS / 2, cy * TS + TS / 2, isKey);
      this.cratesGroup.add(crate);
      this.setTile(cx, cy, 4);
    });

    // Urns
    this.levelData.urns.forEach(([ux, uy]) => {
      const urn = new Urn(this, ux * TS + TS / 2, uy * TS + TS / 2 + 5);
      this.urnsGroup.add(urn);
    });
  }

  spawnCoins(TS) {
    this.levelData.coins.forEach(([cx, cy, count]) => {
      for (let i = 0; i < count; i++) {
        const coin = this.physics.add.sprite((cx + i) * TS + TS / 2, cy * TS + TS / 2, 'pickup_coin');
        coin.body.setAllowGravity(false);
        coin.setDepth(24);
        coin.pickupType = 'coin';
        this.pickupsGroup.add(coin);
      }
    });
  }

  spawnProps(TS) {
    // Atmospheric props: barrels, lanterns, chains, banners
    this.levelData.plats.forEach(([px, py, plen], idx) => {
      // Place a hanging lantern or chain below some platforms
      if (idx % 3 === 0) {
        this.add.image((px + plen / 2) * TS, py * TS + 18, 'prop_lantern').setDepth(12);
      } else if (idx % 3 === 1) {
        this.add.image(px * TS + 10, py * TS + 22, 'prop_chain').setDepth(11);
      }
    });

    // Barrels along the ground near crates
    this.levelData.crates.forEach(([cx, cy], idx) => {
      if (idx % 2 === 0 && cy < 11) {
        this.add.image((cx + 1) * TS + 12, (cy + 1) * TS - 8, 'prop_barrel').setDepth(12);
      }
    });

    // Castle / Fortress Banners
    if (this.theme === 'castle' || this.theme === 'fortress') {
      for (let x = 18; x < this.levelData.width - 15; x += 24) {
        this.add.image(x * TS + 20, 4 * TS, 'prop_banner').setDepth(11);
      }
    }
  }

  spawnCrackedBlocks(TS) {
    if (!this.levelData.crackedBlocks) return;
    this.levelData.crackedBlocks.forEach(([bx, by, reward]) => {
      const block = new CrackedBlock(this, bx * TS + TS / 2, by * TS + TS / 2, reward);
      this.crackedBlocksGroup.add(block);
      this.setTile(bx, by, 1);
    });
  }

  spawnSpecialPlatforms(TS) {
    // Moving platforms
    if (this.levelData.movingPlats) {
      this.levelData.movingPlats.forEach(([sx, sy, ex, ey, spd]) => {
        const mp = new MovingPlatform(this, sx * TS + TS / 2, sy * TS + TS / 2, ex * TS + TS / 2, ey * TS + TS / 2, spd, this.theme);
        this.movingPlatformsGroup.add(mp);
      });
    }

    // Crumbling platforms
    if (this.levelData.crumblingPlats) {
      this.levelData.crumblingPlats.forEach(([cx, cy]) => {
        const cp = new CrumblingPlatform(this, cx * TS + TS / 2, cy * TS + TS / 2, this.theme);
        this.crumblingPlatformsGroup.add(cp);
      });
    }
  }

  setupHazards() {
    if (this.theme === 'fortress') {
      this.time.addEvent({
        delay: 3600,
        loop: true,
        callback: () => {
          if (!this.hero || this.hero.hp <= 0) return;
          const geyserX = this.hero.x + (Math.random() - 0.5) * 160;
          const geyserY = this.worldHeightPx - 20;
          this.fx.burst(geyserX, geyserY, 14, [0xff3300, 0xf2c14e, 0xffffff], 200, 600, -500);
          audio.playSfx('break');
          this.fx.shake(0.008, 150);
        }
      });
    } else if (this.theme === 'forest') {
      this.time.addEvent({
        delay: 4500,
        loop: true,
        callback: () => {
          if (!this.hero || this.hero.hp <= 0) return;
          const acornX = this.hero.x + (Math.random() - 0.5) * 120;
          const acorn = this.add.circle(acornX, 40, 6, 0x5a3d28).setDepth(20);
          this.physics.add.existing(acorn);
          acorn.body.setVelocityY(280);
          this.physics.add.overlap(acorn, this.hero, () => {
            this.hero.takeHit(1, acorn.x);
            acorn.destroy();
          });
          this.time.delayedCall(2200, () => {
            if (acorn.active) acorn.destroy();
          });
        }
      });
    }
  }

  spawnEnemies(TS) {
    this.levelData.enemies.forEach(eData => {
      let enemy = null;
      const ex = eData.x * TS + TS / 2;
      const ey = eData.y * TS + TS / 2;

      switch (eData.type) {
        case 'grunt':
          enemy = new Grunt(this, ex, ey, this.theme);
          break;
        case 'bat':
          enemy = new Bat(this, ex, ey);
          break;
        case 'brute':
          enemy = new Brute(this, ex, ey);
          break;
        case 'caster':
          enemy = new Caster(this, ex, ey, this.theme);
          break;
        case 'archer':
          enemy = new Archer(this, ex, ey, this.theme);
          break;
        case 'shield_knight':
          enemy = new ShieldKnight(this, ex, ey, this.theme);
          break;
        case 'treant_boss':
          enemy = new TreantBoss(this, ex, ey);
          this.activeBoss = enemy;
          break;
        case 'wraith_boss':
          enemy = new WraithBoss(this, ex, ey);
          this.activeBoss = enemy;
          break;
        case 'ember_jarl_boss':
          enemy = new EmberJarlBoss(this, ex, ey);
          this.activeBoss = enemy;
          break;
      }

      if (enemy) {
        this.enemiesGroup.add(enemy);
      }
    });
  }

  setupCollisions() {
    // Hero vs Solids & Cracked Blocks
    this.physics.add.collider(this.hero, this.solidsGroup);
    this.physics.add.collider(this.hero, this.crackedBlocksGroup);
    this.physics.add.collider(this.enemiesGroup, this.crackedBlocksGroup);

    // Hero vs One-way platforms (ignored while dropping down)
    this.physics.add.collider(this.hero, this.platformsGroup, null, () => {
      return this.hero.droppingThroughPlank <= 0;
    });

    // Hero vs Moving & Crumbling platforms
    this.physics.add.collider(this.hero, this.movingPlatformsGroup);
    this.physics.add.collider(this.hero, this.crumblingPlatformsGroup, (hero, cp) => {
      if (cp.stepOn) cp.stepOn();
    });

    // Hero vs Crates (solid)
    this.physics.add.collider(this.hero, this.cratesGroup);

    // Pickups vs Solids & Crates
    this.physics.add.collider(this.pickupsGroup, this.solidsGroup);
    this.physics.add.collider(this.pickupsGroup, this.cratesGroup);

    // Enemies vs Solids & Crates
    this.physics.add.collider(this.enemiesGroup, this.solidsGroup);
    this.physics.add.collider(this.enemiesGroup, this.cratesGroup);
    this.physics.add.collider(this.enemiesGroup, this.platformsGroup);

    // Hero vs Pickups
    this.physics.add.overlap(this.hero, this.pickupsGroup, (hero, pickup) => {
      if (pickup.collect) {
        pickup.collect(hero);
      } else if (pickup.pickupType === 'coin') {
        hero.coins += 1;
        hero.score += 10;
        audio.playSfx('coin');
        this.fx.burst(pickup.x, pickup.y, 6, [0xf2c14e, 0xfff3c0], 120, 300, 0);
        pickup.destroy();
      }
    });

    // Hero vs Enemies
    this.physics.add.overlap(this.hero, this.enemiesGroup, (hero, enemy) => {
      if (enemy.isDead) return;
      if (hero.shieldTimer > 0) {
        enemy.takeDamage(1, hero.x);
      } else {
        hero.takeHit(1, enemy.x);
      }
    });

    // Hero vs Fireballs & Arrows
    this.physics.add.overlap(this.hero, this.fireballsGroup, (hero, fireball) => {
      if (!fireball.isDead) {
        fireball.explode();
        hero.takeHit(1, fireball.x);
      }
    });

    this.physics.add.overlap(this.hero, this.arrowsGroup, (hero, arrow) => {
      hero.takeHit(1, arrow.x);
      arrow.destroy();
    });

    // Hero vs Spikes
    this.physics.add.overlap(this.hero, this.spikesGroup, (hero, spike) => {
      hero.takeHit(1, spike.x);
    });

    // Thrown Hammer vs Enemies
    this.physics.add.overlap(this.hero.hammer, this.enemiesGroup, (hammer, enemy) => {
      this.hero.hammer.checkHitEnemy(enemy);
    });

    // Thrown Hammer vs Crates
    this.physics.add.overlap(this.hero.hammer, this.cratesGroup, (hammer, crate) => {
      if (!crate.broken && !hammer.isHeld()) {
        crate.smash(this.hero.stormTimer > 0);
        if (!hammer.isCharged) hammer.turnAround();
      }
    });

    // Thrown Hammer vs Urns
    this.physics.add.overlap(this.hero.hammer, this.urnsGroup, (hammer, urn) => {
      if (!urn.broken && !hammer.isHeld()) {
        urn.smash();
      }
    });

    // Thrown Hammer vs Fireballs & Arrows
    this.physics.add.overlap(this.hero.hammer, this.fireballsGroup, (hammer, fireball) => {
      if (!fireball.isDead && !hammer.isHeld()) {
        fireball.smash();
      }
    });

    this.physics.add.overlap(this.hero.hammer, this.arrowsGroup, (hammer, arrow) => {
      if (!hammer.isHeld()) {
        audio.playSfx('hit');
        this.fx.burst(arrow.x, arrow.y, 5, [0x7fd4ff, 0xffffff], 90, 220, 0);
        arrow.destroy();
      }
    });
  }

  // --- Storm Chain Lightning Helper ---
  triggerChainLightning(sourceEnemy) {
    const srcX = sourceEnemy.x;
    const srcY = sourceEnemy.y;

    // Find 2 nearest enemies within 230px
    const candidates = this.enemiesGroup.getChildren()
      .filter(e => !e.isDead && e !== sourceEnemy)
      .map(e => ({ enemy: e, dist: Phaser.Math.Distance.Between(srcX, srcY, e.x, e.y) }))
      .filter(item => item.dist <= 230)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2);

    if (candidates.length > 0) {
      audio.playSfx('zap');
      candidates.forEach(item => {
        this.fx.chainLightning(srcX, srcY, item.enemy.x, item.enemy.y);
        item.enemy.takeDamage(1, srcX);
      });
    }
  }

  update(time, delta) {
    // Check Pause
    if (this.inputSystem.justPause()) {
      this.scene.launch('PauseScene');
      this.scene.pause();
      return;
    }

    // Update Hero & Input
    this.hero.update(time, delta, this.inputSystem);

    // Update Crates (sparkle hints)
    this.cratesGroup.getChildren().forEach(crate => {
      crate.update(time, delta, this.hero);
    });

    // Update Enemies
    this.enemiesGroup.getChildren().forEach(enemy => {
      enemy.update(time, delta, this.hero);
    });

    // Update Moving Platforms
    this.movingPlatformsGroup.getChildren().forEach(mp => {
      mp.update(time, delta);
    });

    // Update Fireballs & Arrows
    this.fireballsGroup.getChildren().forEach(fb => {
      fb.update(time, delta);
    });

    this.arrowsGroup.getChildren().forEach(arr => {
      arr.update(time, delta);
    });

    // Check Gate Proximity & Level Complete
    this.gate.checkHeroApproach(this.hero);
    if (this.gate.isPassable(this.hero)) {
      this.levelClear();
    }

    // Camera look-ahead in facing direction
    const targetOffset = -this.hero.facing * 50;
    this.cameras.main.followOffset.x = Phaser.Math.Linear(this.cameras.main.followOffset.x, targetOffset, 0.05);

    // Update FX (with hero for verlet cape simulation) & Parallax ambient drift
    this.fx.update(time, delta, this.hero);
    this.parallax.update(time, delta);
  }

  levelClear() {
    // Save progression
    SaveSystem.setHighestRealm(this.currentRealm + 1);
    SaveSystem.setBestScore(this.currentRealm, this.hero.score);
    SaveSystem.addTotalCoins(this.hero.coins);

    this.scene.stop('HUDScene');
    this.scene.start('LevelClearScene', {
      realm: this.currentRealm,
      name: this.levelData.name,
      coins: this.hero.coins,
      kills: this.hero.kills,
      score: this.hero.score,
      hasWingBoots: this.hero.hasWingBoots,
      stats: this.stats
    });
  }

  onHeroDeath() {
    this.stats.died = true;
    this.time.delayedCall(800, () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', {
        realm: this.currentRealm,
        name: this.levelData.name,
        coins: this.hero.coins,
        score: this.hero.score,
        hasWingBoots: this.hero.hasWingBoots
      });
    });
  }

  // --- Grid tile querying utilities ---
  setTile(c, r, val) {
    if (r >= 0 && r < this.grid.length && c >= 0 && c < this.grid[0].length) {
      this.grid[r][c] = val;
    }
  }

  getTile(c, r) {
    if (c < 0 || c >= this.grid[0].length) return 1;
    if (r < 0 || r >= this.grid.length) return 0;
    return this.grid[r][c];
  }

  isSolidTile(c, r) {
    const t = this.getTile(c, r);
    return t === 1 || t === 4;
  }

  isPlatformTile(c, r) {
    return this.getTile(c, r) === 2;
  }

  isSpikeTile(c, r) {
    return this.getTile(c, r) === 3;
  }
}
