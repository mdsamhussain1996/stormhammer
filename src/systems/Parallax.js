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

    // Parallax Layer 1 (Far background)
    const layer1 = this.scene.add.tileSprite(0, 0, this.worldWidth * 1.5, H, `bg_l1_${this.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0.12, 0.05)
      .setDepth(-90);
    this.layers.push(layer1);

    // Parallax Layer 2 (Mid background)
    const layer2 = this.scene.add.tileSprite(0, 0, this.worldWidth * 1.5, H, `bg_l2_${this.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0.28, 0.1)
      .setDepth(-80);
    this.layers.push(layer2);

    // Parallax Layer 3 (Near silhouettes / pillars / near foliage)
    const layer3 = this.scene.add.tileSprite(0, 0, this.worldWidth * 1.5, H, `bg_l3_${this.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0.52, 0.18)
      .setDepth(-70);
    this.layers.push(layer3);
  }

  update() {
    // Sub-pixel drifting or animation can be added if needed
  }

  destroy() {
    this.layers.forEach(l => l.destroy());
    this.layers = [];
  }
}
