/**
 * Stormhammer Unified Input System
 * Supports Keyboard, Gamepad, and Mobile On-Screen Multi-Touch with >=64px hit areas.
 */
export class InputSystem {
  constructor(scene) {
    this.scene = scene;

    // Keyboard state
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      j: Phaser.Input.Keyboard.KeyCodes.J,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      k: Phaser.Input.Keyboard.KeyCodes.K,
      x: Phaser.Input.Keyboard.KeyCodes.X,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC
    });

    // Mobile touch state
    this.touchState = {
      left: false,
      right: false,
      down: false,
      jump: false,
      jumpJustPressed: false,
      swing: false,
      swingJustPressed: false,
      throw: false,
      throwJustPressed: false,
      pauseJustPressed: false
    };

    this.touchButtons = [];
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (this.isTouchDevice) {
      this.createTouchControls();
    }
  }

  createTouchControls() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const btnSize = 68;
    const pad = 24;

    const createBtn = (x, y, label, sub, onDown, onUp) => {
      const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(9999);

      const bg = this.scene.add.circle(0, 0, btnSize / 2, 0x141a24, 0.6)
        .setStrokeStyle(2, 0x7fd4ff, 0.5)
        .setInteractive(new Phaser.Geom.Circle(0, 0, btnSize / 2), Phaser.Geom.Circle.Contains);

      const text = this.scene.add.text(0, sub ? -8 : 0, label, {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '22px',
        color: '#ece6d6',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      if (sub) {
        this.scene.add.text(0, 12, sub, {
          fontFamily: "'Alegreya Sans SC', sans-serif",
          fontSize: '11px',
          color: '#7fd4ff',
          fontStyle: 'bold'
        }).setOrigin(0.5);
      }

      container.add([bg, text]);

      bg.on('pointerdown', (pointer) => {
        bg.setFillStyle(0x7fd4ff, 0.35);
        onDown();
      });

      const release = () => {
        bg.setFillStyle(0x141a24, 0.6);
        onUp();
      };

      bg.on('pointerup', release);
      bg.on('pointerout', release);
      bg.on('pointercancel', release);

      this.touchButtons.push(container);
      return container;
    };

    // Left & Right (bottom left)
    createBtn(pad + btnSize / 2, H - pad - btnSize / 2, '◀', '',
      () => { this.touchState.left = true; },
      () => { this.touchState.left = false; }
    );

    createBtn(pad + btnSize * 1.7, H - pad - btnSize / 2, '▶', '',
      () => { this.touchState.right = true; },
      () => { this.touchState.right = false; }
    );

    // Actions (bottom right): Throw, Swing, Jump
    createBtn(W - pad - btnSize * 2.7, H - pad - btnSize / 2, '🔨', 'THROW',
      () => { this.touchState.throw = true; this.touchState.throwJustPressed = true; },
      () => { this.touchState.throw = false; }
    );

    createBtn(W - pad - btnSize * 1.5, H - pad - btnSize / 2, '⚔', 'SWING',
      () => { this.touchState.swing = true; this.touchState.swingJustPressed = true; },
      () => { this.touchState.swing = false; }
    );

    createBtn(W - pad - btnSize / 2, H - pad - btnSize / 2, '▲', 'JUMP',
      () => { this.touchState.jump = true; this.touchState.jumpJustPressed = true; },
      () => { this.touchState.jump = false; }
    );
  }

  isLeft() {
    const pad = this.getGamepad();
    const padLeft = pad && (pad.left || pad.axes[0] < -0.3);
    return this.cursors.left.isDown || this.keys.a.isDown || this.touchState.left || padLeft;
  }

  isRight() {
    const pad = this.getGamepad();
    const padRight = pad && (pad.right || pad.axes[0] > 0.3);
    return this.cursors.right.isDown || this.keys.d.isDown || this.touchState.right || padRight;
  }

  isDown() {
    const pad = this.getGamepad();
    const padDown = pad && (pad.down || pad.axes[1] > 0.3);
    return this.cursors.down.isDown || this.keys.s.isDown || this.touchState.down || padDown;
  }

  justJump() {
    const pad = this.getGamepad();
    const padA = pad && pad.A && Phaser.Input.Keyboard.JustDown(this.keys.space); // fallback
    const keyJump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                    Phaser.Input.Keyboard.JustDown(this.keys.w) ||
                    Phaser.Input.Keyboard.JustDown(this.keys.space);
    const touchJump = this.touchState.jumpJustPressed;
    this.touchState.jumpJustPressed = false;
    return keyJump || touchJump || (pad && pad.buttons[0] && pad.buttons[0].pressed);
  }

  isJumpHeld() {
    const pad = this.getGamepad();
    const padJump = pad && pad.buttons[0] && pad.buttons[0].value > 0.1;
    return this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown || this.touchState.jump || padJump;
  }

  justSwing() {
    const pad = this.getGamepad();
    const padSwing = pad && pad.buttons[2] && pad.buttons[2].pressed; // X button
    const keySwing = Phaser.Input.Keyboard.JustDown(this.keys.j) || Phaser.Input.Keyboard.JustDown(this.keys.z);
    const touchSwing = this.touchState.swingJustPressed;
    this.touchState.swingJustPressed = false;
    return keySwing || touchSwing || padSwing;
  }

  justThrow() {
    const pad = this.getGamepad();
    const padThrow = pad && pad.buttons[1] && pad.buttons[1].pressed; // B button
    const keyThrow = Phaser.Input.Keyboard.JustDown(this.keys.k) || Phaser.Input.Keyboard.JustDown(this.keys.x);
    const touchThrow = this.touchState.throwJustPressed;
    this.touchState.throwJustPressed = false;
    return keyThrow || touchThrow || padThrow;
  }

  justPause() {
    const pad = this.getGamepad();
    const padStart = pad && pad.buttons[9] && pad.buttons[9].pressed;
    const keyPause = Phaser.Input.Keyboard.JustDown(this.keys.p) || Phaser.Input.Keyboard.JustDown(this.keys.esc);
    return keyPause || padStart;
  }

  getGamepad() {
    if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
      return this.scene.input.gamepad.getPad(0);
    }
    return null;
  }

  destroy() {
    this.touchButtons.forEach(btn => btn.destroy());
    this.touchButtons = [];
  }
}
