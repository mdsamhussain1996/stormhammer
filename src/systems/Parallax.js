/**
 * Stormhammer Parallax Background System
 * Handles multi-layered background scrolling with atmospheric depth.
 */
export class ParallaxSystem {
  constructor(scene, theme, worldWidth, worldHeight) {
    this.scene = scene;
    this.theme = theme;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.layers = [];
    this.drift1 = 0;
    this.drift2 = 0;

    this.createLayers();
  }

  createLayers() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;

    // Base sky (fixed)
    const sky = this.scene.add.image(0, 0, `bg_sky_${this.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDisplaySize(W, H)
      .setDepth(-100);
    this.layers.push(sky);

    // Parallax Layer 1 (Drifting distant clouds / smoke / mist)
    const layer1 = this.scene.add.tileSprite(0, 0, W, H, `bg_l1_${this.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-90);
    this.layers.push(layer1);

    // Parallax Layer 2 (Far mountains / distant towers / high masonry)
    const layer2 = this.scene.add.tileSprite(0, 0, W, H, `bg_l2_${this.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-80);
    this.layers.push(layer2);

    // Parallax Layer 3 (Mid tree trunks / tall bookshelves / crenellated walls)
    const layer3 = this.scene.add.tileSprite(0, 0, W, H, `bg_l3_${this.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-70);
    this.layers.push(layer3);
  }

  update(time, delta) {
    const dt = (delta || 16) / 1000;
    const cam = this.scene.cameras.main;
    const camX = cam ? cam.scrollX : 0;

    // Ambient slow drift: drifting clouds/smoke (layer 1) and gentle parallax sway
    this.drift1 += 4.5 * dt;
    this.drift2 += 1.8 * dt;

    if (this.layers[1]) {
      this.layers[1].tilePositionX = camX * 0.08 + this.drift1;
    }
    if (this.layers[2]) {
      this.layers[2].tilePositionX = camX * 0.22 + this.drift2;
    }
    if (this.layers[3]) {
      this.layers[3].tilePositionX = camX * 0.42;
    }
  }

  destroy() {
    this.layers.forEach(l => l.destroy());
    this.layers = [];
  }
}

