// ==================================================
// SPELL CASTING SYSTEM | abilities.js
// ==================================================


// ==================================================
// GLOBAL CONTROLLER REFERENCES
// ==================================================

const headset =
  document.querySelector('#camera');

// The casting hand is a setting so the same spell input can follow a
// dominant-hand accessibility preference.
let castingHand = 'right';


function getCastingController() {

  return document.querySelector(
    `#${castingHand}-controller`
  );
}


// With the WebXR standard mapping, button 4 is the primary action. The
// active input source determines whether that physical control is A or X.
function getPrimaryButton(gamepad) {

  if (
    !gamepad ||
    !gamepad.buttons
  ) {
    return null;
  }


  if (
    gamepad.mapping === 'xr-standard'
  ) {
    return gamepad.buttons[4] ?? null;
  }


  // Preserve the current emulator behavior for non-standard mappings until
  // a controller-profile mapping table is needed.
  return gamepad.buttons[4] ?? null;
}


function isPrimaryPressed(gamepad) {
  return !!getPrimaryButton(gamepad)?.pressed;
}


// ==================================================
// GET HAND POSITION RELATIVE TO HEADSET
// ==================================================

function getHandRelativeToHeadset() {

  const controller =
    getCastingController();

  if (!headset || !controller) {

    console.error(
      '❌ Headset or right controller not found.'
    );

    return null;
  }

  const headsetPosition =
    new THREE.Vector3();

  const handPosition =
    new THREE.Vector3();

  headset.object3D.getWorldPosition(
    headsetPosition
  );

  controller.object3D.getWorldPosition(
    handPosition
  );

  const relative =
    new THREE.Vector3()
      .subVectors(
        handPosition,
        headsetPosition
      );

  const forward =
    new THREE.Vector3();

  headset.object3D.getWorldDirection(
    forward
  );

  forward.y = 0;
  forward.normalize();

  const right =
    new THREE.Vector3(
      -forward.z,
      0,
      forward.x
    );

  const headsetQuaternion =
    headset.object3D.quaternion;

  const controllerQuaternion =
    controller.object3D.quaternion;

  const relativeRotation =
    new THREE.Quaternion()
      .copy(headsetQuaternion)
      .invert()
      .multiply(controllerQuaternion);

  const relativeRotationEuler =
    new THREE.Euler()
      .setFromQuaternion(
        relativeRotation,
        'XYZ'
      );

  return {

    leftRight:
      relative.dot(right),

    upDown:
      relative.y,

    forwardBack:
      relative.dot(forward),

    distance:
      relative.length(),

    rotation: {
      radians: {
        x: relativeRotationEuler.x,
        y: relativeRotationEuler.y,
        z: relativeRotationEuler.z
      },

      degrees: {
        x: THREE.MathUtils.radToDeg(
          relativeRotationEuler.x
        ),
        y: THREE.MathUtils.radToDeg(
          relativeRotationEuler.y
        ),
        z: THREE.MathUtils.radToDeg(
          relativeRotationEuler.z
        )
      }
    }

  };

}


// ==================================================
// SPELL CASTING FLAGS
// ==================================================

let óthisiCasting = false;


let élxiActive = false;


let élxiTarget = null;


// ==================================================
// ÓTHISI CASTING POSITIONS
// ==================================================

let óthisiInitialPosition =
  null;


let óthisiInitialTime =
  null;


// ==================================================
// CASTING STATES
// ==================================================

const CastingState = {

  IDLE: 'IDLE',

  ARMED: 'ARMED',

  CAST: 'CAST'

};


let castingState =
  CastingState.IDLE;


function setCastingHand(hand) {

  const nextHand =
    hand === 'left'
      ? 'left'
      : 'right';

  if (nextHand !== castingHand) {
    óthisiCasting = false;
    óthisiInitialPosition = null;
    óthisiInitialTime = null;
    castingState = CastingState.IDLE;
  }

  castingHand = nextHand;
}


// ==================================================
// CASTING SETTINGS
// ==================================================

const CASTING_CONFIG = {

  triggerThreshold: 0.95,

  // Minimum distance the hand
  // must travel to complete Óthisi.
  óthisiMinimumTravel: 0.05,

  // Distance at which the spell
  // reaches maximum power.

  óthisiMaximumTravel: 0.5,

  // Minimum impulse strength.

  óthisiMinimumPower: 10,

  // Maximum impulse strength.

  óthisiMaximumPower: 100,

  // Approximate local controller orientation for the initial Óthisi pose.
  óthisiInitialRotation: {
    order: 'YXZ',
    x: 1.06,
    y: 1.64,
    z: 2.89
  },

  // Per-axis tolerance, in radians.
  óthisiInitialRotationTolerance: {
    x: 0.25,
    y: 0.25,
    z: 0.25
  },

  // Maximum time allowed between the initial and final Óthisi gestures.
  óthisiMaximumGestureDuration: 10.0,

  // Timing curve controls. Higher strength/exponent penalizes slower casts.
  óthisiTimingStrength: 1.5,
  óthisiTimingExponent: 1.0,
  óthisiMinimumTimingMultiplier: 0.1,

  // Élxi requires a half-pressed grip while the trigger is held.
  élxiGripThreshold: 0.4,

  // Independent local controller orientation for the initial Élxi pose.
  élxiInitialRotation: {
    order: 'YXZ',
    x: 0.71,
    y: -1.79,
    z: -0.40
  },

  élxiInitialRotationTolerance: {
    x: 0.25,
    y: 0.25,
    z: 0.25
  },

  // Sustained force applied toward the casting hand.
  élxiPullForce: 75

};


function isInitialRotationValid(
  controller,
  targetRotation,
  rotationTolerance,
  handSide
) {

  const targetEuler =
    new THREE.Euler(
      targetRotation.x,
      targetRotation.y * handSide,
      targetRotation.z * handSide,
      targetRotation.order
    );

  const targetQuaternion =
    new THREE.Quaternion()
      .setFromEuler(
        targetEuler
      );

  const rotationError =
    new THREE.Quaternion()
      .copy(
        targetQuaternion
      );

  rotationError.invert();

  const headsetWorldQuaternion =
    headset.object3D
      .getWorldQuaternion(
        new THREE.Quaternion()
      );

  const controllerWorldQuaternion =
    controller.object3D
      .getWorldQuaternion(
        new THREE.Quaternion()
      );

  const headsetRelativeControllerQuaternion =
    headsetWorldQuaternion
      .invert()
      .multiply(
        controllerWorldQuaternion
      );

  rotationError.multiply(
    headsetRelativeControllerQuaternion
  );

  const rotationErrorEuler =
    new THREE.Euler()
      .setFromQuaternion(
        rotationError,
        targetRotation.order
      );

  return (
    Math.abs(
      rotationErrorEuler.x
    ) < rotationTolerance.x &&
    Math.abs(
      rotationErrorEuler.y
    ) < rotationTolerance.y &&
    Math.abs(
      rotationErrorEuler.z
    ) < rotationTolerance.z
  );
}


function getÓthisiTimingMultiplier(
  elapsedSeconds
) {

  const curveValue =
    1 / Math.pow(
      1 + (
        elapsedSeconds *
        CASTING_CONFIG.óthisiTimingStrength
      ),
      CASTING_CONFIG.óthisiTimingExponent
    );

  return Math.max(
    CASTING_CONFIG.óthisiMinimumTimingMultiplier,
    curveValue
  );
}


const ÓTHISI_RAY_LENGTH = 20;


const ÓTHISI_RAY_OFFSET =
  new THREE.Euler(
    THREE.MathUtils.degToRad(-15),
    THREE.MathUtils.degToRad(90),
    THREE.MathUtils.degToRad(0),
    'YXZ'
  );


// This is the single source of truth for the Óthisi ray origin and direction.
// Both the live visualizer and the actual spell cast use its returned values.
function getÓthisiRay() {

  const controller =
    getCastingController();

  if (!controller) {
    return null;
  }

  const handPosition =
    new THREE.Vector3();

  controller.object3D
    .getWorldPosition(
      handPosition
    );

  const direction =
    new THREE.Vector3(
      0,
      0,
      -1
    );

  direction.applyEuler(
    ÓTHISI_RAY_OFFSET
  );

  const controllerQuaternion =
    controller.object3D
      .getWorldQuaternion(
        new THREE.Quaternion()
      );

  direction.applyQuaternion(
    controllerQuaternion
  );

  direction.normalize();

  const rayEnd =
    handPosition
      .clone()
      .addScaledVector(
        direction,
        ÓTHISI_RAY_LENGTH
      );

  return {
    handPosition,
    direction,
    rayEnd
  };
}


// ==================================================
// UNIVERSAL CASTING SYSTEM
// ==================================================

AFRAME.registerComponent(
  'casting-system',
  {

    schema: {
      hand: {
        type: 'string',
        default: 'right'
      }
    },

    init() {

      this.rayGeometry =
        new THREE.BufferGeometry();

      this.rayGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array(6),
          3
        )
      );

      this.rayMaterial =
        new THREE.LineBasicMaterial({
          color: 0x9b59ff,
          linewidth: 1
        });

      this.rayLine =
        new THREE.Line(
          this.rayGeometry,
          this.rayMaterial
        );

      this.rayLine.frustumCulled = false;
      this.rayLine.visible = false;

      this.el.object3D.add(
        this.rayLine
      );

      setCastingHand(
        this.data.hand
      );

      if (!getCastingController()) {

        console.error(
          `❌ ${castingHand} casting controller not found.`
        );

        return;
      }

      console.log(
        '✅ Casting system initialized.'
      );

    },


    update() {

      setCastingHand(
        this.data.hand
      );

    },


    tick() {

      const controller =
        getCastingController();

      if (!controller) {
        this.rayLine.visible = false;
        return;
      }

      this.updateRayVisualization();

      const trackedControls =
        controller.components[
          'tracked-controls'
        ];

      if (!trackedControls) {
        return;
      }


      const webxrController =
        trackedControls.controller;

      if (!webxrController) {
        return;
      }


      const gamepad =
        webxrController.gamepad;

      if (!gamepad) {
        endÉlxi(
          'gamepad unavailable'
        );
        return;
      }


      const triggerValue =
        gamepad.buttons[0]?.value ?? 0;


      const triggerPressed =
        triggerValue >=
        CASTING_CONFIG.triggerThreshold;

      const gripButton =
        gamepad.buttons[1];

      const gripValue =
        gripButton?.value ??
        (gripButton?.pressed ? 1 : 0);


      // ==================================================
      // UNIVERSAL IDLE / ARMED STATE
      // ==================================================

      if (triggerPressed) {

        castingState =
          CastingState.ARMED;

      } else {

        castingState =
          CastingState.IDLE;


        // Trigger released before
        // completing the spell.

        óthisiCasting =
          false;

        óthisiInitialPosition =
          null;

        óthisiInitialTime =
          null;

      }


      // ==================================================
      // ÓTHISI INITIAL GESTURE
      // ==================================================

      if (
        castingState ===
        CastingState.ARMED &&

        !óthisiCasting
      ) {

        const initialDetected =
          checkÓthisiInitialGesture(
            gamepad,
            triggerPressed
          );


        if (initialDetected) {

          óthisiCasting =
            true;


          // Store the exact world position
          // where the initial gesture occurred.

          óthisiInitialPosition =
            new THREE.Vector3();

          controller.object3D
            .getWorldPosition(
              óthisiInitialPosition
            );

          óthisiInitialTime =
            performance.now();


          console.log(
            '🟢 ÓTHISI CASTING: WAITING FOR FINAL GESTURE'
          );

        }

      }


      // ==================================================
      // ÓTHISI FINAL GESTURE
      // ==================================================

  if (
    óthisiCasting
  ) {

    const transitionDuration =
      (
        performance.now() -
        óthisiInitialTime
      ) / 1000;

    if (
      transitionDuration >
      CASTING_CONFIG.óthisiMaximumGestureDuration
    ) {

      console.log(
        '⏱️ Óthisi gesture timed out:',
        transitionDuration
      );

      óthisiCasting =
        false;

      óthisiInitialPosition =
        null;

      óthisiInitialTime =
        null;

      castingState =
        CastingState.IDLE;

      return;
    }

    checkÓthisiFinalGesture(
          gamepad,
          triggerPressed
        );

      }


      // ==================================================
      // ÉLXI INITIAL / ACTIVE STATE
      // ==================================================

      if (élxiActive) {

        updateÉlxi(
          triggerPressed,
          gripValue
        );

      } else if (
        checkÉlxiInitialGesture(
          triggerPressed,
          gripValue
        )
      ) {

        activateÉlxi();
      }

    },


    updateRayVisualization() {

      const ray =
        getÓthisiRay();

      if (!ray) {
        this.rayLine.visible = false;
        return;
      }

      const positions =
        this.rayGeometry.getAttribute(
          'position'
        );

      positions.setXYZ(
        0,
        ray.handPosition.x,
        ray.handPosition.y,
        ray.handPosition.z
      );

      positions.setXYZ(
        1,
        ray.rayEnd.x,
        ray.rayEnd.y,
        ray.rayEnd.z
      );

      positions.needsUpdate = true;
      this.rayLine.visible = true;
    },


    remove() {

      this.el.object3D.remove(
        this.rayLine
      );

      this.rayGeometry.dispose();
      this.rayMaterial.dispose();
    }

  }
);


// ==================================================
// ÓTHISI — FORCE PUSH
// ==================================================

function Óthisi(
  pushStrength
) {

  if (
    castingState !==
    CastingState.ARMED
  ) {

    return;

  }


  performÓthisi(
    pushStrength
  );

}


// ==================================================
// ÓTHISI — ACTUAL FORCE PUSH
// ==================================================

function performÓthisi(
  pushStrength = 50
) {

  // ==================================================
  // GET PHYSICS WORLD
  // ==================================================

  const world =
    Physics.world;

  if (!world) {

    console.error(
      '❌ Ammo physics world not found.'
    );

    return;
  }


  const ray =
    getÓthisiRay();

  if (!ray) {
    return;
  }

  const handPosition =
    ray.handPosition;

  const direction =
    ray.direction;

  const rayEnd =
    ray.rayEnd;


  const hitBody =
    Physics.raycast(
      handPosition,
      rayEnd
    );


  if (!hitBody) {

    console.log(
      '💨 Óthisi missed.'
    );

    return;
  }


  if (!Physics.isValidSpellTarget(hitBody)) {

    console.log(
      '💨 Óthisi hit a non-target physics body.'
    );

    return;
  }


  Physics.applySpellImpulse(
    hitBody,
    direction,
    pushStrength
  );


  console.log(
    '💨 Óthisi pushed the physics body!'
  );

  console.log(
    '💪 Óthisi power:',
    pushStrength
  );

}


// =========================================================================
// ÉLXI — PULL
// =========================================================================

function checkÉlxiInitialGesture(
  triggerPressed,
  gripValue
) {

  const handRelative =
    getHandRelativeToHeadset();

  if (!handRelative) {
    return false;
  }

  const handSide =
    castingHand === 'left'
      ? -1
      : 1;

  const initialPositionValid =
    handRelative.leftRight * handSide < 0 &&
    handRelative.upDown < 0 &&
    handRelative.forwardBack < 0 &&
    handRelative.distance < 0.6;

  const controller =
    getCastingController();

  if (!controller) {
    return false;
  }

  const targetRotation =
    CASTING_CONFIG.élxiInitialRotation;

  const rotationTolerance =
    CASTING_CONFIG.élxiInitialRotationTolerance;

  const initialRotationValid =
    isInitialRotationValid(
      controller,
      targetRotation,
      rotationTolerance,
      handSide
    );

  const initialButtonsValid =
    triggerPressed &&
    gripValue >= CASTING_CONFIG.élxiGripThreshold;

    console.log('🧪 Élxi INITIAL CHECK:', {
      leftRight: handRelative.leftRight,
      upDown: handRelative.upDown,
      forwardBack: handRelative.forwardBack,
      distance: handRelative.distance,
  
      initialPositionValid,
      initialRotationValid,
      initialButtonsValid,
  
      triggerPressed,
      gripValue
    });

  return (
    initialPositionValid &&
    initialRotationValid &&
    initialButtonsValid
  );
}


function endÉlxi(
  reason
) {

  if (!élxiActive) {
    return;
  }

  console.log(
    '🟣 Élxi ended:',
    reason
  );

  élxiActive = false;
  élxiTarget = null;
}

function activateÉlxi() {

  const ray =
    getÓthisiRay();

  if (!ray) {
    return false;
  }

  const hitBody =
    Physics.raycast(
      ray.handPosition,
      ray.rayEnd
    );

  if (
    !hitBody ||
    !Physics.isValidSpellTarget(hitBody)
  ) {
    return false;
  }

  if (
    Physics.bodyKey(hitBody) ===
      Physics.bodyKey(Physics.ballBody) &&
    Physics.grabbedBall.hand
  ) {
    return false;
  }

  élxiTarget =
    hitBody;

  élxiActive =
    true;

  console.log(
    '🟣 Élxi activated.'
  );

  return true;
}


function updateÉlxi(
  triggerPressed,
  gripValue,
) {

  if (!élxiActive) {
    return;
  }

  if (
    !triggerPressed ||
    gripValue < CASTING_CONFIG.élxiGripThreshold
  ) {
    endÉlxi(
      'required input released'
    );
    return;
  }

  if (
    !élxiTarget ||
    !Physics.isValidSpellTarget(élxiTarget)
  ) {
    endÉlxi(
      'target is no longer valid'
    );
    return;
  }

  if (
    Physics.bodyKey(élxiTarget) ===
      Physics.bodyKey(Physics.ballBody) &&
    Physics.grabbedBall.hand
  ) {
    endÉlxi(
      'target was grabbed'
    );
    return;
  }

  const controller =
    getCastingController();

  if (!controller) {
    endÉlxi(
      'casting controller unavailable'
    );
    return;
  }

  const handPosition =
    new THREE.Vector3();

  controller.object3D
    .getWorldPosition(
      handPosition
    );

  const pullApplied =
    Physics.applySpellPull(
      élxiTarget,
      handPosition,
      CASTING_CONFIG.élxiPullForce
    );

  if (!pullApplied) {
    endÉlxi(
      'pull could not be applied'
    );
  }
}


// =========================================================================
// SPELL-SPECIFIC GESTURE CHECKS
// =========================================================================


// ==================================================
// ÓTHISI INITIAL GESTURE CHECK
// ==================================================

function checkÓthisiInitialGesture(
  gamepad,
  triggerPressed
) {

  const handRelative =
    getHandRelativeToHeadset();

  if (!handRelative) {

    return false;

  }


  // ==================================================
  // POSITION CHECK
  // ==================================================

  const handSide =
    castingHand === 'left'
      ? -1
      : 1;

  const initialPositionValid =

    handRelative.leftRight * handSide < 0 &&

    handRelative.upDown < 0 &&

    handRelative.forwardBack < 0 &&

    handRelative.distance < 0.6;


  // ==================================================
  // ROTATION CHECK
  // ==================================================

  const controller =
    getCastingController();

  if (!controller) {
    return false;
  }


  const rotationTarget =
    CASTING_CONFIG.óthisiInitialRotation;

  const rotationTolerance =
    CASTING_CONFIG.óthisiInitialRotationTolerance;


  const initialRotationValid =
    isInitialRotationValid(
      controller,
      rotationTarget,
      rotationTolerance,
      handSide
    );


  // ==================================================
  // BUTTON CHECK
  // ==================================================

  const primaryPressed =
    isPrimaryPressed(gamepad);


  const gripPressed =
    gamepad.buttons[1]?.pressed;


  const initialButtonsValid =

    gripPressed &&

    triggerPressed &&

    primaryPressed;


  // ==================================================
  // ALL REQUIREMENTS MET
  // ==================================================

  if (

    initialButtonsValid &&

    initialPositionValid &&

    initialRotationValid

  ) {

    console.log(
      '🟢 Óthisi INITIAL POSITION DETECTED'
    );

    return true;

  }


  return false;

}


// ==================================================
// ÓTHISI FINAL GESTURE CHECK
// ==================================================

function checkÓthisiFinalGesture(
  gamepad,
  triggerPressed
) {

  if (
    !óthisiInitialPosition
  ) {

    return;

  }


  // ==================================================
  // GET CURRENT HAND POSITION
  // ==================================================

  const currentHandPosition =
    new THREE.Vector3();

  const controller =
    getCastingController();

  if (!controller) {
    return;
  }


  controller.object3D
    .getWorldPosition(
      currentHandPosition
    );


  // ==================================================
  // CALCULATE HAND TRAVEL
  // ==================================================

  const handTravel =
    currentHandPosition.distanceTo(
      óthisiInitialPosition
    );


  // ==================================================
  // FINAL BUTTONS
  // ==================================================

  const gripReleased =
    !(gamepad.buttons[1]?.pressed);


  const primaryPressed =
    isPrimaryPressed(gamepad);


  const finalButtonsValid =

    triggerPressed &&

    primaryPressed &&

    gripReleased;


  // ==================================================
  // FINAL POSITION
  // ==================================================

  const finalPositionValid =

    handTravel >=
    CASTING_CONFIG.óthisiMinimumTravel;


  // ==================================================
  // DEBUG
  // ==================================================

  console.log(
    '🧪 Óthisi FINAL CHECK:',
    {

      travel:
        handTravel,

      position:
        finalPositionValid,

      gripReleased,

      triggerPressed,

      primaryPressed

    }
  );


  // ==================================================
  // FINAL GESTURE DETECTED
  // ==================================================

  if (

    finalPositionValid &&

    finalButtonsValid

  ) {

    console.log(
      '🔴 ÓTHISI FINAL POSITION DETECTED'
    );


    // ==================================================
    // CALCULATE POWER
    // ==================================================

    const minTravel =
      CASTING_CONFIG
        .óthisiMinimumTravel;


    const maxTravel =
      CASTING_CONFIG
        .óthisiMaximumTravel;


    const minPower =
      CASTING_CONFIG
        .óthisiMinimumPower;


    const maxPower =
      CASTING_CONFIG
        .óthisiMaximumPower;


    const powerRatio =
      THREE.MathUtils.clamp(

        (
          handTravel -
          minTravel
        ) /

        (
          maxTravel -
          minTravel
        ),

        0,

        1

      );


    const pushStrength =

      minPower +

      (
        maxPower -
        minPower
      ) *

      powerRatio;

    const transitionDuration =
      (
        performance.now() -
        óthisiInitialTime
      ) / 1000;

    const timingMultiplier =
      getÓthisiTimingMultiplier(
        transitionDuration
      );

    const timedPushStrength =
      pushStrength *
      timingMultiplier;

    console.log(
      '⏱️ Óthisi transition duration:',
      transitionDuration,
      'seconds'
    );

    console.log(
      '⏱️ Óthisi timing multiplier:',
      timingMultiplier
    );


    console.log(
      '💪 Óthisi calculated power:',
      timedPushStrength
    );


    // ==================================================
    // PERFORM SPELL
    // ==================================================

    óthisiCasting =
      false;

    óthisiInitialPosition =
      null;

    óthisiInitialTime =
      null;

    castingState =
      CastingState.CAST;


    performÓthisi(
      timedPushStrength
    );


    // Return to ARMED
    // because trigger is still held.

    if (
      triggerPressed
    ) {

      castingState =
        CastingState.ARMED;

    } else {

      castingState =
        CastingState.IDLE;

    }

  }

}


// =========================================================================
// PC DEBUG — PRESS 1 TO FORCE CAST
// =========================================================================

window.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key === '1'
    ) {

      console.log(
        '🖥️ PC DEBUG: Casting Óthisi'
      );

      performÓthisi();

    }

  }
);


// =========================================================================
// PC DEBUG — PRESS 2 TO LOG HAND POSITION
// =========================================================================

window.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key === '2'
    ) {

      console.log(
        '🖥️ PC DEBUG: Casting Élxi',

        activateÉlxi(),

      );

    }

  }
);

window.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key === '3'
    ) {

      const controller =
    getCastingController();
      const controllerRotation =
    controller.object3D.rotation;
      console.log('rotation:', controllerRotation);
    }

  }
);
