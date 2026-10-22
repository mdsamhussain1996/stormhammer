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
      throwJustReleased: false,
      throwHeldDuration: 0,
      thunder: false,
      thunderJustPressed: false,
      pauseJustPressed: false
    };

    this.throwHoldTimer = 0;
    this.throwTouchStartTime = 0;
    this.touchButtons = [];
    this.touchControlsVisible = true;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Track keys held before scene start (handles holding -> when clicking start)
    this._heldKeyCodes = new Set();
    this._onKeyDown = (e) => this._heldKeyCodes.add(e.code);
    this._onKeyUp = (e) => this._heldKeyCodes.delete(e.code);
    this._onBlur = () => this._heldKeyCodes.clear();
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);

    // Gamepad edge detection state
    this.padPrevButtons = new Array(16).fill(false);
    this.padJustDown = new Array(16).fill(false);
    this.padJustUp = new Array(16).fill(false);

    if (this.isTouchDevice) {
      this.createTouchControls();
    }

    // Hide touch controls when keyboard or gamepad is used, show on touch
    this._onKeyForTouchToggle = () => this.setTouchButtonsVisible(false);
    this._onTouchForTouchToggle = () => this.setTouchButtonsVisible(true);
    window.addEventListener('keydown', this._onKeyForTouchToggle);
    window.addEventListener('touchstart', this._onTouchForTouchToggle, { passive: true });

    // Poll gamepad and touch on preupdate
    this._preUpdate = (time, delta) => {
      this._pollGamepad();
      if (this.isTouchDevice && this._pollTouch) {
        this._pollTouch(time, delta);
      }
    };
    this.scene.events.on('preupdate', this._preUpdate);
    this.scene.events.once('shutdown', () => {
      this.scene.events.off('preupdate', this._preUpdate);
    });
  }

  setTouchButtonsVisible(visible) {
    if (this.touchControlsVisible === visible) return;
    this.touchControlsVisible = visible;
    this.touchButtons.forEach(btn => btn.setVisible(visible));
  }

  createTouchControls() {
    this.repositionTouchControls();

    // Allow up to 5 simultaneous fingers
    const im = this.scene.input;
    while (im.manager.pointersTotal < 5) im.addPointer(1);

    this._pollTouch = (time, delta) => {
      if (!this.touchControlsVisible) return;
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
          z.pressed = true;
          z.bg.setFillStyle(0x7fd4ff, 0.35);
          triggerHaptic(25);
          z.onDown();
        } else if (!down && z.pressed) {
          z.pressed = false;
          z.bg.setFillStyle(0x141a24, 0.6);
          z.onUp();
        }
      }

      // Update throwHeldDuration while THROW is held
      if (this.touchState.throw) {
        const dt = (delta || 16.6) / 1000;
        this.throwHoldTimer += dt;
        this.touchState.throwHeldDuration = this.throwHoldTimer;
      }
    };

    this._onScaleResize = () => this.repositionTouchControls();
    this.scene.scale.on('resize', this._onScaleResize);
  }

  repositionTouchControls() {
    // If existing buttons, destroy them first
    this.touchButtons.forEach(btn => btn.destroy());
    this.touchButtons = [];
    this.touchZones = [];

    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const btnSize = 68;
    const pad = 24;
    const gap = btnSize + 14;

    const createBtn = (x, y, label, sub, onDown, onUp) => {
      const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(9999);
      container.setVisible(this.touchControlsVisible);
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
      () => {
        this.touchState.throw = true;
        this.touchState.throwJustPressed = true;
        this.throwHoldTimer = 0;
        this.touchState.throwHeldDuration = 0;
      },
      () => {
        this.touchState.throw = false;
        this.touchState.throwJustReleased = true;
        this.throwHoldTimer = 0;
        this.touchState.throwHeldDuration = 0;
      }
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

  _pollGamepad() {
    const pad = this.getGamepad();
    if (!pad) {
      this.padJustDown.fill(false);
      this.padJustUp.fill(false);
      this.padPrevButtons.fill(false);
      return;
    }

    let padActive = false;
    // Check axes movement
    if (pad.axes) {
      for (const axis of pad.axes) {
        if (Math.abs(axis) > 0.3) {
          padActive = true;
          break;
        }
      }
    }

    for (let i = 0; i < 16; i++) {
      const btn = pad.buttons && pad.buttons[i];
      const isDown = !!(btn && (btn.pressed || btn.value > 0.5));
      const wasDown = !!this.padPrevButtons[i];
      this.padJustDown[i] = isDown && !wasDown;
      this.padJustUp[i] = !isDown && wasDown;
      this.padPrevButtons[i] = isDown;
      if (isDown) padActive = true;
    }

    if (padActive) {
      this.setTouchButtonsVisible(false);
    }
  }

  consumePadJustDown(index) {
    const val = this.padJustDown[index];
    this.padJustDown[index] = false;
    return !!val;
  }

  consumePadJustUp(index) {
    const val = this.padJustUp[index];
    this.padJustUp[index] = false;
    return !!val;
  }

  isLeft() {
    const pad = this.getGamepad();
    const padLeft = pad && (pad.left || (pad.axes && pad.axes[0] < -0.3));
    const winKey = this._heldKeyCodes.has('ArrowLeft') || this._heldKeyCodes.has('KeyA');
    return this.cursors.left.isDown || this.keys.a.isDown || winKey || this.touchState.left || padLeft;
  }

  isRight() {
    const pad = this.getGamepad();
    const padRight = pad && (pad.right || (pad.axes && pad.axes[0] > 0.3));
    const winKey = this._heldKeyCodes.has('ArrowRight') || this._heldKeyCodes.has('KeyD');
    return this.cursors.right.isDown || this.keys.d.isDown || winKey || this.touchState.right || padRight;
  }

  isDown() {
    const pad = this.getGamepad();
    const padDown = pad && (pad.down || (pad.axes && pad.axes[1] > 0.3));
    const winKey = this._heldKeyCodes.has('ArrowDown') || this._heldKeyCodes.has('KeyS');
    return this.cursors.down.isDown || this.keys.s.isDown || winKey || this.touchState.down || padDown;
  }

  justJump() {
    const keyJump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                    Phaser.Input.Keyboard.JustDown(this.keys.w) ||
                    Phaser.Input.Keyboard.JustDown(this.keys.space);
    const touchJump = this.touchState.jumpJustPressed;
    this.touchState.jumpJustPressed = false;
    const padJump = this.consumePadJustDown(0);
    return keyJump || touchJump || padJump;
  }

  isJumpHeld() {
    const pad = this.getGamepad();
    const padJump = pad && pad.buttons && pad.buttons[0] && pad.buttons[0].value > 0.1;
    const winKey = this._heldKeyCodes.has('ArrowUp') || this._heldKeyCodes.has('KeyW') || this._heldKeyCodes.has('Space');
    return this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown || winKey || this.touchState.jump || padJump;
  }

  justSwing() {
    const keySwing = Phaser.Input.Keyboard.JustDown(this.keys.j) || Phaser.Input.Keyboard.JustDown(this.keys.z);
    const touchSwing = this.touchState.swingJustPressed;
    this.touchState.swingJustPressed = false;
    const padSwing = this.consumePadJustDown(2); // X button
    return keySwing || touchSwing || padSwing;
  }

  justThrow() {
    const keyThrow = Phaser.Input.Keyboard.JustDown(this.keys.k) || Phaser.Input.Keyboard.JustDown(this.keys.x);
    const touchThrow = this.touchState.throwJustPressed;
    this.touchState.throwJustPressed = false;
    const padThrow = this.consumePadJustDown(1); // B button
    return keyThrow || touchThrow || padThrow;
  }

  isThrowHeld() {
    const pad = this.getGamepad();
    const padThrow = pad && pad.buttons && pad.buttons[1] && pad.buttons[1].value > 0.1;
    const winKey = this._heldKeyCodes.has('KeyK') || this._heldKeyCodes.has('KeyX');
    return this.keys.k.isDown || this.keys.x.isDown || winKey || this.touchState.throw || padThrow;
  }

  justThrowReleased() {
    const keyRel = Phaser.Input.Keyboard.JustUp(this.keys.k) || Phaser.Input.Keyboard.JustUp(this.keys.x);
    const touchRel = this.touchState.throwJustReleased;
    this.touchState.throwJustReleased = false;
    const padRel = this.consumePadJustUp(1);
    return keyRel || touchRel || padRel;
  }

  justThunder() {
    const keyThunder = Phaser.Input.Keyboard.JustDown(this.keys.l) || Phaser.Input.Keyboard.JustDown(this.keys.c);
    const touchThunder = this.touchState.thunderJustPressed;
    this.touchState.thunderJustPressed = false;
    const padY = this.consumePadJustDown(3); // Y button
    return keyThunder || touchThunder || padY;
  }

  justPause() {
    const keyPause = Phaser.Input.Keyboard.JustDown(this.keys.p) || Phaser.Input.Keyboard.JustDown(this.keys.esc);
    const padStart = this.consumePadJustDown(9); // Start button
    return keyPause || padStart;
  }

  getGamepad() {
    if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
      return this.scene.input.gamepad.getPad(0);
    }
    return null;
  }

  destroy() {
    if (this._preUpdate) this.scene.events.off('preupdate', this._preUpdate);
    if (this._onScaleResize) this.scene.scale.off('resize', this._onScaleResize);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    window.removeEventListener('keydown', this._onKeyForTouchToggle);
    window.removeEventListener('touchstart', this._onTouchForTouchToggle);
    this.touchButtons.forEach(btn => btn.destroy());
    this.touchButtons = [];
  }
}
