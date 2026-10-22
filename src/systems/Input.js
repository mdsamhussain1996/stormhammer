/**
 * Stormhammer Unified Input System
 * Supports Keyboard, Gamepad, and Mobile On-Screen Multi-Touch with >=64px hit areas.
 */
export function triggerHaptic(duration = 35) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(duration);
    } catch (e) {}
  }
}

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
      l: Phaser.Input.Keyboard.KeyCodes.L,
      c: Phaser.Input.Keyboard.KeyCodes.C,
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
      throwHeldDuration: 0,
      thunder: false,
      thunderJustPressed: false,
      pauseJustPressed: false
    };

    this.throwHoldTimer = 0;
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
    const gap = btnSize + 14; // centre-to-centre spacing so buttons never overlap

    // Buttons are drawn with scrollFactor 0, but hit-testing is done manually
    // against every active pointer in screen (game) coordinates. This avoids
    // Phaser's camera-dependent hit areas (camera scroll / zoom-punch) and
    // supports true multi-touch (e.g. hold Right + tap Jump).
    this.touchZones = [];
    const createBtn = (x, y, label, sub, onDown, onUp) => {
      const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(9999);
      const bg = this.scene.add.circle(0, 0, btnSize / 2, 0x141a24, 0.6)
        .setStrokeStyle(2, 0x7fd4ff, 0.5);
      const text = this.scene.add.text(0, sub ? -8 : 0, label, {
        fontFamily: "'Alegreya Sans SC', sans-serif",
        fontSize: '22px',
        color: '#ece6d6',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      const children = [bg, text];
      if (sub) {
        children.push(this.scene.add.text(0, 12, sub, {
          fontFamily: "'Alegreya Sans SC', sans-serif",
          fontSize: '11px',
          color: '#7fd4ff',
          fontStyle: 'bold'
        }).setOrigin(0.5));
      }
      children.forEach(c => c.setScrollFactor(0));
      container.add(children);
      this.touchZones.push({ x, y, r: btnSize / 2 + 6, bg, onDown, onUp, pressed: false });
      this.touchButtons.push(container);
      return container;
    };

    // Allow up to 4 simultaneous fingers
    const im = this.scene.input;
    while (im.manager.pointersTotal < 5) im.addPointer(1);

    this._pollTouch = () => {
      const pointers = im.manager.pointers;
      for (const z of this.touchZones) {
        let down = false;
        for (const ptr of pointers) {
          if (ptr.isDown) {
            const dx = ptr.x - z.x, dy = ptr.y - z.y;
            if (dx * dx + dy * dy <= z.r * z.r) { down = true; break; }
          }
        }
        if (down && !z.pressed) {
          z.pressed = true; z.bg.setFillStyle(0x7fd4ff, 0.35); triggerHaptic(25); z.onDown();
        } else if (!down && z.pressed) {
          z.pressed = false; z.bg.setFillStyle(0x141a24, 0.6); z.onUp();
        }
      }
    };
    this.scene.events.on('preupdate', this._pollTouch);
    this.scene.events.once('shutdown', () => this.scene.events.off('preupdate', this._pollTouch));

    // Left, Down & Right (bottom left)
    createBtn(pad + btnSize / 2, H - pad - btnSize / 2, '◀', '',
      () => { this.touchState.left = true; },
      () => { this.touchState.left = false; }
    );

    createBtn(pad + btnSize / 2 + gap, H - pad - btnSize / 2, '▼', 'SLAM',
      () => { this.touchState.down = true; },
      () => { this.touchState.down = false; }
    );

    createBtn(pad + btnSize / 2 + gap * 2, H - pad - btnSize / 2, '▶', '',
      () => { this.touchState.right = true; },
      () => { this.touchState.right = false; }
    );

    // Actions (bottom right): Thunder, Throw, Swing, Jump
    createBtn(W - pad - btnSize / 2 - gap * 3, H - pad - btnSize / 2, '⚡', 'THUNDER',
      () => { this.touchState.thunder = true; this.touchState.thunderJustPressed = true; },
      () => { this.touchState.thunder = false; }
    );

    createBtn(W - pad - btnSize / 2 - gap * 2, H - pad - btnSize / 2, '🔨', 'THROW',
      () => { this.touchState.throw = true; this.touchState.throwJustPressed = true; },
      () => { this.touchState.throw = false; }
    );

    createBtn(W - pad - btnSize / 2 - gap, H - pad - btnSize / 2, '⚔', 'SWING',
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

  isThrowHeld() {
    const pad = this.getGamepad();
    const padThrow = pad && pad.buttons[1] && pad.buttons[1].value > 0.1;
    return this.keys.k.isDown || this.keys.x.isDown || this.touchState.throw || padThrow;
  }

  justThrowReleased() {
    const pad = this.getGamepad();
    const keyRel = Phaser.Input.Keyboard.JustUp(this.keys.k) || Phaser.Input.Keyboard.JustUp(this.keys.x);
    return keyRel;
  }

  justThunder() {
    const pad = this.getGamepad();
    const padY = pad && pad.buttons[3] && pad.buttons[3].pressed; // Y button
    const keyThunder = Phaser.Input.Keyboard.JustDown(this.keys.l) || Phaser.Input.Keyboard.JustDown(this.keys.c);
    const touchThunder = this.touchState.thunderJustPressed;
    this.touchState.thunderJustPressed = false;
    return keyThunder || touchThunder || padY;
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
    if (this._pollTouch) this.scene.events.off('preupdate', this._pollTouch);
    this.touchButtons.forEach(btn => btn.destroy());
    this.touchButtons = [];
  }
}
