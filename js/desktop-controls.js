AFRAME.registerComponent('desktop-controls', {
  schema: {
    enabled: {
      type: 'boolean',
      default: true
    },

    moveSpeed: {
      type: 'number',
      default: 3
    }
  },

  init: function () {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  },

  tick: function (time, deltaTime) {
    if (!this.data.enabled) {
      return;
    }

    // Don't use desktop movement while in VR.
    if (this.el.sceneEl.is('vr-mode')) {
      return;
    }

    const delta = Math.min(deltaTime / 1000, 0.1);

    let forward = 0;
    let sideways = 0;

    if (this.keys.forward) {
      forward += 1;
    }

    if (this.keys.backward) {
      forward -= 1;
    }

    if (this.keys.right) {
      sideways += 1;
    }

    if (this.keys.left) {
      sideways -= 1;
    }

    if (forward === 0 && sideways === 0) {
      return;
    }

    // Normalize diagonal movement.
    const length = Math.sqrt(
      forward * forward +
      sideways * sideways
    );

    forward /= length;
    sideways /= length;

    const speed = this.data.moveSpeed * delta;

    const camera = this.el.querySelector('[camera]');

    if (!camera) {
      return;
    }

    // Get the camera's world-space forward direction.
    const forwardDirection = new THREE.Vector3();

    camera.object3D.getWorldDirection(forwardDirection);

    // Ignore vertical camera rotation.
    forwardDirection.y = 0;

    if (forwardDirection.lengthSq() > 0) {
      forwardDirection.normalize();
    }

    // Calculate the camera's right direction.
    const rightDirection = new THREE.Vector3(
      -forwardDirection.z,
      0,
      forwardDirection.x
    );

    // Combine forward/backward and left/right movement.
    const movement = new THREE.Vector3();

    movement.addScaledVector(
      forwardDirection,
      forward
    );

    movement.addScaledVector(
      rightDirection,
      sideways
    );

    movement.normalize();

    this.el.object3D.position.x +=
      movement.x * -1 * speed;

    this.el.object3D.position.z +=
      movement.z * -1 * speed;
  },

  onKeyDown: function (event) {
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = true;
        break;

      case 'KeyS':
        this.keys.backward = true;
        break;

      case 'KeyA':
        this.keys.left = true;
        break;

      case 'KeyD':
        this.keys.right = true;
        break;
    }
  },

  onKeyUp: function (event) {
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = false;
        break;

      case 'KeyS':
        this.keys.backward = false;
        break;

      case 'KeyA':
        this.keys.left = false;
        break;

      case 'KeyD':
        this.keys.right = false;
        break;
    }
  },

  remove: function () {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
});
