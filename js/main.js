const scene = document.querySelector('a-scene');

// ==================================================
// VR LOCOMOTION COMPONENT
// ==================================================

AFRAME.registerComponent('vr-locomotion', {

  schema: {
    speed: {
      type: 'number',
      default: 3
    },

    deadzone: {
      type: 'number',
      default: 0.15
    }
  },


  init() {

    // ----------------------------------------------
    // References
    // ----------------------------------------------

    this.player =
      this.el;

    this.camera =
      document.querySelector('#camera');

    this.rightController =
      document.querySelector(
        '#right-controller'
      );


    // ----------------------------------------------
    // Joystick state
    // ----------------------------------------------

    this.joystick = {
      x: 0,
      y: 0
    };


    // ----------------------------------------------
    // Listen for joystick movement
    // ----------------------------------------------

    this.rightController.addEventListener(
      'axismove',
      (event) => {

        const axis =
          event.detail.axis;

        // Your emulator uses axes 2 and 3.
        const x =
          axis[2];

        const y =
          axis[3];


        // Ignore invalid axis updates.
        if (
          typeof x !== 'number' ||
          typeof y !== 'number'
        ) {
          return;
        }


        this.joystick.x =
          x;

        this.joystick.y =
          y;


        console.log(
          '🎮 STORED:',
          this.joystick.x,
          this.joystick.y
        );
      }
    );


    console.log(
      '✅ VR locomotion initialized.'
    );
  },


  // ==================================================
  // A-FRAME FRAME UPDATE
  // ==================================================

  tick(time, deltaTime) {

    let x =
      this.joystick.x;

    let y =
      this.joystick.y;


    // ----------------------------------------------
    // Deadzone
    // ----------------------------------------------

    if (
      Math.abs(x) <
      this.data.deadzone
    ) {
      x = 0;
    }

    if (
      Math.abs(y) <
      this.data.deadzone
    ) {
      y = 0;
    }


    if (
      x === 0 &&
      y === 0
    ) {
      return;
    }


    // ----------------------------------------------
    // Movement direction
    // ----------------------------------------------

    const forward =
      new THREE.Vector3();

    this.camera.object3D
      .getWorldDirection(
        forward
      );


    // Ignore vertical head tilt.
    forward.y = 0;

    forward.normalize();


    const right =
      new THREE.Vector3(
        -forward.z,
        0,
        forward.x
      );

// ----------------------------------------------
// Calculate movement
// ----------------------------------------------

const movement =
  new THREE.Vector3();


// Joystick forward/backward
movement.addScaledVector(
  forward,
  y
);


// Joystick left/right
movement.addScaledVector(
  right,
  -x
);


if (
  movement.lengthSq() === 0
) {
  return;
}


movement.normalize();


    // ----------------------------------------------
    // Apply movement
    // ----------------------------------------------

    const delta =
      Math.min(
        deltaTime / 1000,
        0.1
      );


    this.player.object3D
      .position.x +=
        movement.x *
        this.data.speed *
        delta;


    this.player.object3D
      .position.z +=
        movement.z *
        this.data.speed *
        delta;
  }

});

// ==================================================
// SIMPLE LOW-POLY VR HAND
// ==================================================

AFRAME.registerComponent('vr-hand', {

  schema: {
    hand: {
      type: 'string',
      default: 'right'
    }
  },


  init() {

// ==================================================
// HAND GROUP
// ==================================================

this.handGroup =
  new THREE.Group();

// position entire hand.

if (this.data.hand === 'right') {

  this.handGroup.position.set(
    0.0,
    -0.02,
    0.02
  );

} else {

  this.handGroup.position.set(
    0.0,
    -0.02,
    0.02
  );

}

// rotate entire hand.

if (this.data.hand === 'right') {

  this.handGroup.rotation.set(
    1.5,
    -1.2,
    3.6
  );

} else {

  this.handGroup.rotation.set(
    1.5,
    1.2,
    -3.6
  );

}

// scale hands

this.handGroup.scale.set(
  0.7,
  0.7,
  0.7
);


this.el.object3D.add(
  this.handGroup
);

    // ==================================================
    // MATERIAL
    // ==================================================

    this.handMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.0
      });


    // ==================================================
    // PALM
    // ==================================================

    const palmGeometry =
      new THREE.BoxGeometry(
        0.08,
        0.10,
        0.02
      );

    this.palm =
      new THREE.Mesh(
        palmGeometry,
        this.handMaterial
      );

    this.palm.position.set(
      0,
      0,
      -0.04
    );

    this.handGroup.add(
      this.palm
    );


    // ==================================================
    // FINGERS
    // ==================================================

    this.fingers = [];


    const fingerPositions = [
      -0.038,
      -0.013,
       0.013,
       0.038
    ];


    for (
      let i = 0;
      i < 4;
      i++
    ) {

      const finger =
        this.createFinger(
          i
        );


        finger.position.set(
          fingerPositions[i],
          0.04,
          -0.04
        );


        // Slight natural spread/rotation.
        // Index and pinky angle outward more.

        const fingerRotations = [
          0.12,  // Index
          0.03,  // Middle
          -0.03,  // Ring
          -0.12   // Pinky
        ];

        finger.rotation.z =
          fingerRotations[i];


      this.handGroup.add(
        finger
      );


      this.fingers.push(
        finger
      );
    }


    // ==================================================
    // THUMB
    // ==================================================

    this.thumb =
      this.createThumb();


    this.thumb.position.set(
      this.data.hand === 'left'
        ? -0.035
        : 0.035,

      0.005,

      -0.04
    );

 this.thumb.rotation.z =
  this.data.hand === 'left'
    ? 1.2
    : -1.2;

this.thumb.rotation.x =
  this.data.hand === 'left'
    ? 0
    : 0;

    this.handGroup.add(
      this.thumb
    );


    // ==================================================
    // CONTROLLER
    // ==================================================

    this.trackedControls =
      this.el.components[
        'tracked-controls'
      ];


    this.controller =
      null;


    console.log(
      `🤚 ${this.data.hand} hand initialized`
    );
  },


  // ==================================================
  // CREATE FINGER
  // ==================================================

  createFinger(index) {

    const fingerGroup =
      new THREE.Group();


    // Finger lengths.
    const lengths = [
      0.035,
      0.03,
      0.022
    ];


    // Slightly vary finger lengths.
    const scale =
      index === 0
        ? 0.85
        : index === 3
          ? 0.9
          : 1.0;


    let parent =
      fingerGroup;


    this.createFingerSegment(
      parent,
      lengths[0] * scale
    );


    const middle =
      parent.children[0];


    const middleJoint =
      new THREE.Group();


    middleJoint.position.y =
      lengths[0] * scale;


    parent.add(
      middleJoint
    );


    this.createFingerSegment(
      middleJoint,
      lengths[1] * scale
    );


    const tip =
      middleJoint.children[0];


    const tipJoint =
      new THREE.Group();


    tipJoint.position.y =
      lengths[1] * scale;


    middleJoint.add(
      tipJoint
    );


    this.createFingerSegment(
      tipJoint,
      lengths[2] * scale
    );


    // Store joints for animation.
    fingerGroup.userData.middleJoint =
      middleJoint;

    fingerGroup.userData.tipJoint =
      tipJoint;


    return fingerGroup;
  },


  // ==================================================
  // CREATE FINGER SEGMENT
  // ==================================================

  createFingerSegment(
    parent,
    length
  ) {

    const geometry =
      new THREE.CapsuleGeometry(
        0.009,
        length,
        4,
        8
      );


    const segment =
      new THREE.Mesh(
        geometry,
        this.handMaterial
      );


    segment.position.y =
      length / 2;


    parent.add(
      segment
    );
  },


  // ==================================================
  // CREATE THUMB
  // ==================================================

  createThumb() {

    const thumb =
      new THREE.Group();


    const base =
      new THREE.Group();


    const tip =
      new THREE.Group();


    const baseGeometry =
      new THREE.CapsuleGeometry(
        0.011,
        0.04,
        4,
        8
      );


    const baseSegment =
      new THREE.Mesh(
        baseGeometry,
        this.handMaterial
      );


    baseSegment.position.y =
      0.02;


    base.add(
      baseSegment
    );


    const tipGeometry =
      new THREE.CapsuleGeometry(
        0.010,
        0.03,
        4,
        8
      );


    const tipSegment =
      new THREE.Mesh(
        tipGeometry,
        this.handMaterial
      );


    tipSegment.position.y =
      0.015;


    tip.add(
      tipSegment
    );


    tip.position.y =
      0.04;


    base.add(
      tip
    );


    thumb.add(
      base
    );


    thumb.userData.base =
      base;

    thumb.userData.tip =
      tip;


    return thumb;
  },


  // ==================================================
  // UPDATE
  // ==================================================

  tick() {

    if (
      !this.trackedControls
    ) {

      this.trackedControls =
        this.el.components[
          'tracked-controls'
        ];

      return;
    }


    if (
      !this.trackedControls.controller
    ) {
      return;
    }


    this.controller =
      this.trackedControls.controller;


    const gamepad =
      this.controller.gamepad;


    if (!gamepad) {
      return;
    }


    // ==================================================
    // GRIP VALUE
    // ==================================================

    let gripValue = 0;


    if (
      gamepad.buttons &&
      gamepad.buttons[1]
    ) {

      gripValue =
        gamepad.buttons[1].value;
    }


    gripValue =
      THREE.MathUtils.clamp(
        gripValue,
        0,
        1
      );

// ==================================================
// HAND CONTRACTION
// ==================================================

const contraction = gripValue;

// Palm contracts slightly.
const palmScaleX =
  THREE.MathUtils.lerp(
    1.0,
    0.88,
    contraction
  );

const palmScaleY =
  THREE.MathUtils.lerp(
    1.0,
    0.92,
    contraction
  );

this.palm.scale.x =
  palmScaleX;

this.palm.scale.y =
  palmScaleY;


    // ==================================================
    // FINGER CURL
    // ==================================================

    // Open = 0
    // Closed = 1


    const curl =
      THREE.MathUtils.lerp(
        0,
        1.7,
        gripValue
      );


    for (
      let i = 0;
      i < this.fingers.length;
      i++
    ) {

      const finger =
        this.fingers[i];


      const middleJoint =
        finger.userData.middleJoint;


      const tipJoint =
        finger.userData.tipJoint;


      // Base curl.
      finger.rotation.x =
        curl * 0.55;


      // Middle joint.
      middleJoint.rotation.x =
        curl * 0.75;


      // Fingertip.
      tipJoint.rotation.x =
        curl * 0.9;
    }


    // ==================================================
    // THUMB CURL
    // ==================================================

    const thumbBase =
      this.thumb.userData.base;

    const thumbTip =
      this.thumb.userData.tip;


    thumbBase.rotation.x =
      curl * 0.5;


    thumbTip.rotation.x =
      curl * 0.7;
  }

});

// ==================================================
// CONTROLLER DEBUGGING
// ==================================================

scene.addEventListener(
  'loaded',
  () => {

    console.log(
      'WebXR prototype initialized.'
    );

    console.log(
      'A-Frame Version:',
      AFRAME.version
    );

    console.log(
      'Left controller:',
      document.querySelector(
        '#left-controller'
      )
    );

    console.log(
      'Right controller:',
      document.querySelector(
        '#right-controller'
      )
    );
  }
);
