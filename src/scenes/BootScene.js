import level1Data from '../levels/level1.json';
import level2Data from '../levels/level2.json';
import level3Data from '../levels/level3.json';
import { validateLevelReachability } from '../levels/validateLevels.js';

/**
 * BootScene
 * Initializes basic configuration, runs dev-only level validator, and transitions to PreloadScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Run reachability validator on all three levels in dev mode
    if (import.meta.env.DEV) {
      console.log('--- Validating Level Reachability for all realms ---');
      const v1 = validateLevelReachability(level1Data);
      const v2 = validateLevelReachability(level2Data);
      const v3 = validateLevelReachability(level3Data);
      const totalViolations = (v1?.length || 0) + (v2?.length || 0) + (v3?.length || 0);
      if (totalViolations > 0) {
        console.warn(`[LevelValidator] Total violations found across all levels: ${totalViolations}`);
      } else {
        console.log('[LevelValidator] ✓ All 3 levels passed reachability validation.');
      }
    }

    this.scene.start('PreloadScene');
  }
}
