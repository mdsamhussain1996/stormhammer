/**
 * BootScene
 * Initializes basic configuration and transitions to PreloadScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
