/**
 * Dev-only Level Reachability Validator
 * Verifies that every one-way platform and breakable crate is reachable
 * within standard single-jump constraints (vertical gap <= 3 tiles, horizontal gap <= 4 tiles).
 */
export function validateLevelReachability(levelData) {
  const { name, realm, ground, blocks, plats, crates, start } = levelData;
  const violations = [];

  // Build grid of reachable surface tiles: Set of "x,y" keys representing standing surfaces (top of tiles)
  const surfaceTiles = new Map(); // "x,y" => { x, y, type }

  // 1. Add all ground surfaces
  ground.forEach(([x1, x2]) => {
    for (let x = x1; x < x2; x++) {
      surfaceTiles.set(`${x},12`, { x, y: 12, type: 'ground' });
    }
  });

  // 2. Add solid blocks top surfaces
  blocks.forEach(([bx, by, bw, bh]) => {
    for (let i = 0; i < bw; i++) {
      surfaceTiles.set(`${bx + i},${by}`, { x: bx + i, y: by, type: 'block' });
    }
  });

  // 3. Collect targets to test: platforms and crates
  const targets = [];
  plats.forEach(([px, py, plen], idx) => {
    targets.push({ id: `Platform #${idx + 1}`, x: px, y: py, width: plen, type: 'plat' });
  });

  crates.forEach(([cx, cy], idx) => {
    targets.push({ id: `Crate #${idx + 1}`, x: cx, y: cy, width: 1, type: 'crate' });
  });

  // 4. Reachability flood fill: iterative BFS
  // A target is reachable from an existing surface (sx, sy) if:
  // - Target vertical distance: (sy - target.y) <= 3 (upwards climb <= 3 tiles)
  //   or target.y >= sy (downward jump/drop)
  // - Target horizontal distance: min distance between sx and [target.x, target.x + target.width - 1] <= 4
  const reachableSurfaces = new Set();
  // Start from hero spawn x,y
  surfaceTiles.forEach((val, key) => reachableSurfaces.add(key));

  let expanded = true;
  const reachableTargets = new Set();

  while (expanded) {
    expanded = false;

    targets.forEach(target => {
      if (reachableTargets.has(target.id)) return;

      // Check if reachable from any currently reachable surface
      let canReach = false;
      for (const surfKey of reachableSurfaces) {
        const [sx, sy] = surfKey.split(',').map(Number);

        const dy = sy - target.y; // positive means target is higher than surface
        // Max vertical single jump climb is 3 tiles (3.6 apex minus hero height tolerance)
        const vReachable = dy <= 3 && dy >= -8; // can jump up 3 tiles or drop down up to 8 tiles

        // Horizontal distance from surface x to target segment [target.x, target.x + target.width - 1]
        let hDist = 0;
        if (sx < target.x) hDist = target.x - sx;
        else if (sx > target.x + target.width - 1) hDist = sx - (target.x + target.width - 1);

        const hReachable = hDist <= 4; // Max horizontal reach is 4 tiles

        if (vReachable && hReachable) {
          canReach = true;
          break;
        }
      }

      if (canReach) {
        reachableTargets.add(target.id);
        expanded = true;
        // Add this target's surface to reachable surfaces
        for (let i = 0; i < target.width; i++) {
          reachableSurfaces.add(`${target.x + i},${target.y}`);
        }
      }
    });
  }

  // Check unreached targets
  targets.forEach(target => {
    if (!reachableTargets.has(target.id)) {
      violations.push({
        id: target.id,
        type: target.type,
        pos: `[x: ${target.x}, y: ${target.y}]`,
        reason: 'Exceeds single jump threshold (vertical > 3 tiles or horizontal > 4 tiles from nearest surface)'
      });
    }
  });

  if (violations.length > 0) {
    console.warn(`[LevelValidator] ⚠️ Realm ${realm} ("${name}"): ${violations.length} unreachable targets found:`, violations);
  } else {
    console.log(`[LevelValidator] ✓ Realm ${realm} ("${name}"): All ${plats.length} platforms and ${crates.length} crates verified reachable.`);
  }

  return violations;
}
