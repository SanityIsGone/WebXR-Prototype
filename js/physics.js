// ==================================================
// PHYSICS.JS
// Ammo.js Physics System
// ==================================================

const Physics = {

  world: null,

  ballBody: null,
  ballEntity: null,

  playerBody: null,
  playerShape: null,
  playerTransform: null,

  previousPlayerPosition:
    new THREE.Vector3(),

  playerVelocity:
    new THREE.Vector3(),

    handHitboxes: {
      left: null,
      right: null
    },

    handBallContacts: {
      left: false,
      right: false
    },

    grabbedBall: {
      hand: null,
      controller: null
    },

    grabOffset:
      new THREE.Vector3(),

    wasGripping: {
      left: false,
      right: false
    },

  tmpTransform: null,

  // Reused Ammo values for per-frame updates and spell raycasts.
  ammo: {
    gravity: null,
    origin: null,
    zero: null,
    inertia: null,
    impulse: null,
    pullForce: null,
    rayStart: null,
    rayEnd: null,
    tmpTransform: null,
    grabTransform: null
  },

  // Only bodies registered here may receive spell effects.
  spellTargets: new Map(),

  ready: false,

    // ==================================================
    // INITIALIZE
    // ==================================================

    init() {

      console.log(
        'Initializing Ammo.js physics...'
      );

      // Ammo.js 0.0.10 exposes Ammo as an already initialized object.

      if (typeof Ammo === 'undefined') {

        console.error(
          '❌ Ammo.js is not available.'
        );

        return;
      }

      console.log(
        'Ammo.js available.'
      );

      this.ammo.gravity =
        new Ammo.btVector3(
          0,
          -9.81,
          0
        );

      this.ammo.origin =
        new Ammo.btVector3(
          0,
          0,
          0
        );

      this.ammo.zero =
        new Ammo.btVector3(
          0,
          0,
          0
        );

      this.ammo.inertia =
        new Ammo.btVector3(
          0,
          0,
          0
        );

      this.ammo.impulse =
        new Ammo.btVector3(
          0,
          0,
          0
        );

      this.ammo.pullForce =
        new Ammo.btVector3(
          0,
          0,
          0
        );

      this.ammo.rayStart =
        new Ammo.btVector3(
          0,
          0,
          0
        );

      this.ammo.rayEnd =
        new Ammo.btVector3(
          0,
          0,
          0
        );

      this.ammo.tmpTransform =
        new Ammo.btTransform();

      this.ammo.grabTransform =
        new Ammo.btTransform();

      // ==================================================
      // CREATE PHYSICS WORLD
      // ==================================================

      const collisionConfiguration =
        new Ammo.btDefaultCollisionConfiguration();


      const dispatcher =
        new Ammo.btCollisionDispatcher(
          collisionConfiguration
        );


      const broadphase =
        new Ammo.btDbvtBroadphase();


      const solver =
        new Ammo.btSequentialImpulseConstraintSolver();


      this.world =
        new Ammo.btDiscreteDynamicsWorld(
          dispatcher,
          broadphase,
          solver,
          collisionConfiguration
        );


      // ==================================================
      // GRAVITY
      // ==================================================

      this.world.setGravity(
        this.ammo.gravity
      );


      // Temporary transform used
      // when reading physics bodies.

      this.tmpTransform =
        this.ammo.tmpTransform;


      // ==================================================
      // CREATE Physics Objects & Initialize Runtime
      // ==================================================

      this.createGround();

      this.createBall();

      this.createPlayer();

      this.createHandHitboxes();

      this.ready = true;


      console.log(
        '✅ Ammo.js physics initialized.'
      );
    },


    bodyKey(body) {

      return body?.ptr ?? body;
    },


    registerSpellTarget(body, metadata = {}) {

      if (!body) {
        return;
      }

      this.spellTargets.set(
        this.bodyKey(body),
        {
          body,
          ...metadata
        }
      );
    },


    isValidSpellTarget(body) {

      const target =
        this.spellTargets.get(
          this.bodyKey(body)
        );

      if (!target) {
        return false;
      }

      return target.type === 'dynamic';
    },


    raycast(start, end) {

      if (!this.world) {
        return null;
      }

      this.ammo.rayStart.setValue(
        start.x,
        start.y,
        start.z
      );

      this.ammo.rayEnd.setValue(
        end.x,
        end.y,
        end.z
      );

      const callback =
        new Ammo.ClosestRayResultCallback(
          this.ammo.rayStart,
          this.ammo.rayEnd
        );

      this.world.rayTest(
        this.ammo.rayStart,
        this.ammo.rayEnd,
        callback
      );

      let hitBody = null;

      if (callback.hasHit()) {
        const hitObject =
          callback.get_m_collisionObject();

        if (hitObject) {
          hitBody = Ammo.castObject(
            hitObject,
            Ammo.btRigidBody
          );
        }
      }

      Ammo.destroy(callback);

      return hitBody;
    },


    applySpellImpulse(body, direction, strength) {

      if (!this.isValidSpellTarget(body)) {
        return false;
      }

      this.ammo.impulse.setValue(
        direction.x * strength,
        direction.y * strength,
        direction.z * strength
      );

      body.applyCentralImpulse(
        this.ammo.impulse
      );

      body.activate();

      return true;
    },


    applySpellPull(body, targetPosition, strength) {
     console.log('Ball being pulled!')
      if (
        !this.isValidSpellTarget(body) ||
        !targetPosition ||
        !this.ammo.pullForce
      ) {
        return false;
      }

      const motionState =
        body.getMotionState();

      if (!motionState) {
        return false;
      }

      motionState.getWorldTransform(
        this.tmpTransform
      );

      const origin =
        this.tmpTransform.getOrigin();

      const deltaX =
        targetPosition.x - origin.x();

      const deltaY =
        targetPosition.y - origin.y();

      const deltaZ =
        targetPosition.z - origin.z();

      const distance =
        Math.sqrt(
          deltaX * deltaX +
          deltaY * deltaY +
          deltaZ * deltaZ
        );

      if (distance === 0) {
        return true;
      }

      this.ammo.pullForce.setValue(
        deltaX / distance * strength,
        deltaY / distance * strength,
        deltaZ / distance * strength
      );

      body.applyCentralForce(
        this.ammo.pullForce
      );

      body.activate();

      return true;
    },


    // ==================================================
    // CREATE GROUND
    // ==================================================

    createGround() {

      // Ground is 10m x 10m.

      const groundShape =
        new Ammo.btBoxShape(
          new Ammo.btVector3(
            5,
            0.05,
            5
          )
        );


      // Position the physics surface
      // directly underneath y = 0.

      const transform =
        new Ammo.btTransform();

      transform.setIdentity();

      transform.setOrigin(
        new Ammo.btVector3(
          0,
          -0.05,
          0
        )
      );


      const motionState =
        new Ammo.btDefaultMotionState(
          transform
        );


      // Mass 0 = static object.

      const mass = 0;


      const localInertia =
        new Ammo.btVector3(
          0,
          0,
          0
        );


      const rbInfo =
        new Ammo.btRigidBodyConstructionInfo(
          mass,
          motionState,
          groundShape,
          localInertia
        );


      const groundBody =
        new Ammo.btRigidBody(
          rbInfo
        );


        groundBody.setFriction(10);


      this.world.addRigidBody(
        groundBody
      );


      console.log(
        '✅ Physics ground created.'
      );
    },


    // ==================================================
    // CREATE BALL
    // ==================================================

    createBall() {
      const radius = 0.25;
      const mass = 3;

      // ==================================================
      // CREATE A-FRAME VISUAL
      // ==================================================

      const scene =
        document.querySelector(
          'a-scene'
        );


      this.ballEntity =
        document.createElement(
          'a-sphere'
        );

        this.ballEntity.setAttribute(
            'id',
            'physics-ball'
          );

          this.ballEntity.setAttribute(
            'radius',
            radius
          );
          
          const ballMesh =
            this.ballEntity.getObject3D('mesh');
          
          if (ballMesh) {
            ballMesh.material =
              waterMaterial;
          }
          
          this.ballEntity.setAttribute(
            'position',
            '0 2 -2'
          );

          this.ballEntity.setAttribute(
            'shadow',
            'cast: true; receive: true'
          );


      scene.appendChild(
        this.ballEntity
      );


      // ==================================================
      // CREATE AMMO COLLISION SHAPE
      // ==================================================

      const ballShape =
        new Ammo.btSphereShape(
          radius
        );


      ballShape.setMargin(
        0.05
      );


      // ==================================================
      // INITIAL TRANSFORM
      // ==================================================

      const transform =
        new Ammo.btTransform();

      transform.setIdentity();

      transform.setOrigin(
        new Ammo.btVector3(
          0,
          2,
          -2
        )
      );


      // ==================================================
      // MOTION STATE
      // ==================================================

      const motionState =
        new Ammo.btDefaultMotionState(
          transform
        );


      // ==================================================
      // INERTIA
      // ==================================================

      const localInertia =
        new Ammo.btVector3(
          0,
          0,
          0
        );


      ballShape.calculateLocalInertia(
        mass,
        localInertia
      );


      // ==================================================
      // RIGID BODY
      // ==================================================

      const rbInfo =
        new Ammo.btRigidBodyConstructionInfo(
          mass,
          motionState,
          ballShape,
          localInertia
        );


      this.ballBody =
        new Ammo.btRigidBody(
          rbInfo
        );


      // ==================================================
      // MATERIAL PROPERTIES
      // ==================================================

      this.ballBody.setFriction(0.5);
      this.ballBody.setRestitution(0.6);
      this.ballBody.setDamping(0.4, 0.7);

      // ==================================================
      // ADD TO PHYSICS WORLD
      // ==================================================

      this.world.addRigidBody(
        this.ballBody
      );

      this.registerSpellTarget(
        this.ballBody,
        {
          type: 'dynamic',
          entity: this.ballEntity
        }
      );
    },

    // ==================================================
// CREATE PLAYER COLLIDER
// ==================================================

createPlayer() {

    const player =
      document.querySelector(
        '#player'
      );

    if (!player) {
      return;
    }


    // ==================================================
    // PLAYER COLLIDER DIMENSIONS
    // ==================================================

    // Capsule radius.

    const radius = 0.3;

    // Distance between the two
    // hemispherical ends of the capsule.

    const height = 1.2;


    this.playerShape =
      new Ammo.btCapsuleShape(
        radius,
        height
      );


    // ==================================================
    // INITIAL POSITION
    // ==================================================

    const playerPosition =
      player.object3D.position;


    this.playerTransform =
      new Ammo.btTransform();

    this.playerTransform.setIdentity();


    // Center the capsule roughly
    // around the player's body.

    this.playerTransform.setOrigin(
      new Ammo.btVector3(
        playerPosition.x,
        playerPosition.y + 0.9,
        playerPosition.z
      )
    );

    // ==================================================
    // MOTION STATE
    // ==================================================

    const motionState =
      new Ammo.btDefaultMotionState(
        this.playerTransform
      );

    // ==================================================
    // KINEMATIC BODY
    // ==================================================

    const localInertia =
      new Ammo.btVector3(
        0,
        0,
        0
      );

    // Mass 0 because the player
    // is controlled manually.

    const mass = 0;
    const rbInfo =
      new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        this.playerShape,
        localInertia
      );

    this.playerBody =
      new Ammo.btRigidBody(
        rbInfo
      );

    // ==================================================
    // MARK AS KINEMATIC
    // ==================================================

    this.playerBody.setCollisionFlags(
      this.playerBody.getCollisionFlags() | 2
    );

    // Keep the body active.

    this.playerBody.setActivationState(
      4
    );

    // ==================================================
    // PLAYER MATERIAL
    // ==================================================

    this.playerBody.setFriction(
      0.0
    );

    // ==================================================
    // ADD TO PHYSICS WORLD
    // ==================================================

    this.world.addRigidBody(
      this.playerBody
    );

    console.log(
      '✅ Player physics collider created.'
    );
  },

  // ==================================================
// CREATE HAND HITBOXES
// ==================================================

createHandHitboxes() {

  const leftController =
    document.querySelector(
      '#left-controller'
    );

  const rightController =
    document.querySelector(
      '#right-controller'
    );


  // ==================================================
  // HITBOX SIZE
  // ==================================================

  // This is intentionally slightly larger than the visible palm.
  const radius = 0.09;

  // ==================================================
  // CREATE LEFT HITBOX
  // ==================================================

  if (leftController) {

    this.handHitboxes.left =
      new THREE.Sphere();

    this.handHitboxes.left.radius =
      radius;

    console.log(
      '✅ Left hand hitbox created.'
    );
  }


  // ==================================================
  // CREATE RIGHT HITBOX
  // ==================================================

  if (rightController) {

    this.handHitboxes.right =
      new THREE.Sphere();

    this.handHitboxes.right.radius =
      radius;

    console.log(
      '✅ Right hand hitbox created.'
    );
  }
},

// ==================================================
// UPDATE HAND HITBOXES
// ==================================================

updateHandHitboxes() {

  const leftController =
    document.querySelector(
      '#left-controller'
    );

  const rightController =
    document.querySelector(
      '#right-controller'
    );


  // ==================================================
  // LEFT HAND
  // ==================================================

  if (
    leftController &&
    this.handHitboxes.left
  ) {

    const position =
      new THREE.Vector3();

    leftController.object3D
      .getWorldPosition(
        position
      );


    this.handHitboxes.left.center
      .copy(
        position
      );
  }


  // ==================================================
  // RIGHT HAND
  // ==================================================

  if (
    rightController &&
    this.handHitboxes.right
  ) {

    const position =
      new THREE.Vector3();

    rightController.object3D
      .getWorldPosition(
        position
      );


    this.handHitboxes.right.center
      .copy(
        position
      );
  }
},

// ==================================================
// HAND → BALL INTERSECTION
// ==================================================

checkHandBallContacts() {

  if (
    !this.ballBody
  ) {
    return;
  }


  // ==================================================
  // GET BALL POSITION
  // ==================================================

  this.ballBody
    .getMotionState()
    .getWorldTransform(
      this.tmpTransform
    );


  const origin =
    this.tmpTransform.getOrigin();


  const ballPosition =
    new THREE.Vector3(
      origin.x(),
      origin.y(),
      origin.z()
    );


  // Ball radius.

  const ballRadius =
    0.25;


  // ==================================================
  // CHECK EACH HAND
  // ==================================================

  for (
    const hand
    of ['left', 'right']
  ) {

    const hitbox =
      this.handHitboxes[
        hand
      ];


    if (!hitbox) {
      continue;
    }


    // Distance between hand
    // and ball.

    const distance =
      hitbox.center.distanceTo(
        ballPosition
      );


    const touching =
      distance <=
      hitbox.radius +
      ballRadius;


    // Detect state change.

    const wasTouching =
      this.handBallContacts[
        hand
      ];


    this.handBallContacts[
      hand
    ] =
      touching;


    // ==================================================
    // ENTER CONTACT
    // ==================================================

    if (
      touching &&
      !wasTouching
    ) {

      console.log(
        `🖐️ ${hand} hand touched ball`
      );


      const controller =
        document.querySelector(
          `#${hand}-controller`
        );


      if (controller) {

        controller.emit(
          'ball-touch-start'
        );
      }
    }


    // ==================================================
    // EXIT CONTACT
    // ==================================================

    if (
      !touching &&
      wasTouching
    ) {

      console.log(
        `🖐️ ${hand} hand left ball`
      );


      const controller =
        document.querySelector(
          `#${hand}-controller`
        );


      if (controller) {

        controller.emit(
          'ball-touch-end'
        );
      }
    }
  }
},

// ==================================================
// CHECK IF HAND IS TOUCHING BALL
// ==================================================

isHandTouchingBall(hand) {
  return !!this.handBallContacts[hand];
},

// ==================================================
// GET BALL POSITION
// ==================================================

getBallPosition() {

  if (
    !this.ballBody ||
    !this.ballBody.getMotionState()
  ) {
    return null;
  }

  this.ballBody
    .getMotionState()
    .getWorldTransform(
      this.tmpTransform
    );

  const origin =
    this.tmpTransform.getOrigin();

  return new THREE.Vector3(
    origin.x(),
    origin.y(),
    origin.z()
  );
},

// ==================================================
// GRAB BALL
// ==================================================

grabBall(hand) {

  // Don't grab if already holding.
  if (
    this.grabbedBall.hand
  ) {
    return false;
  }


  // Hand must be touching ball.
  if (
    !this.isHandTouchingBall(hand)
  ) {
    return false;
  }


  const controller =
    document.querySelector(
      `#${hand}-controller`
    );


  if (!controller) {
    return false;
  }


  const ballPosition =
    this.getBallPosition();


  if (!ballPosition) {
    return false;
  }


  const handPosition =
    new THREE.Vector3();


  controller.object3D
    .getWorldPosition(
      handPosition
    );


  // Remember the distance between
  // the controller and ball.

  this.grabOffset
    .copy(
      ballPosition
    )
    .sub(
      handPosition
    );


  this.grabbedBall.hand =
    hand;

  this.grabbedBall.controller =
    controller;


  // Stop current movement.

  this.ballBody
    .setLinearVelocity(
      this.ammo.zero
    );

  this.ballBody
    .setAngularVelocity(
      this.ammo.zero
    );

  console.log(
    `🤝 ${hand} hand grabbed ball`
  );


  return true;
},

// ==================================================
// RELEASE BALL
// ==================================================

releaseBall() {

  if (
    !this.grabbedBall.hand
  ) {
    return;
  }

  
  console.log(
    `✋ ${this.grabbedBall.hand} hand released ball`
  );


  this.grabbedBall.hand =
    null;

  this.grabbedBall.controller =
    null;

  this.ballBody.activate();
},

// ==================================================
// UPDATE GRABBED BALL
// ==================================================

updateGrabbedBall() {

  if (
    !this.grabbedBall.hand ||
    !this.grabbedBall.controller
  ) {
    return;
  }

  const handPosition =
    new THREE.Vector3();


  this.grabbedBall.controller
    .object3D
    .getWorldPosition(
      handPosition
    );


  const newPosition =
    handPosition
      .clone()
      .add(
        this.grabOffset
      );


  // Move the Ammo body.

  const transform =
    this.ammo.grabTransform;

  transform.setIdentity();

  this.ammo.origin.setValue(
    newPosition.x,
    newPosition.y,
    newPosition.z
  );

  transform.setOrigin(
    this.ammo.origin
  );

  this.ballBody
    .setWorldTransform(
      transform
    );


  this.ballBody
    .getMotionState()
    .setWorldTransform(
      transform
    );

  // Stop physics movement while held.

  this.ballBody
    .setLinearVelocity(
      this.ammo.zero
    );

  this.ballBody
    .setAngularVelocity(
      this.ammo.zero
    );

},

// ==================================================
// UPDATE GRAB INPUT
// ==================================================

updateGrabInput() {

  for (
    const hand
    of ['left', 'right']
  ) {

    const controller =
      document.querySelector(
        `#${hand}-controller`
      );


    if (!controller) {
      continue;
    }


    const trackedControls =
      controller.components[
        'tracked-controls'
      ];


    if (
      !trackedControls ||
      !trackedControls.controller
    ) {
      continue;
    }


    const gamepad =
      trackedControls.controller.gamepad;


    if (!gamepad) {
      continue;
    }


    // Meta Quest grip is normally
    // button index 1.

    let gripValue = 0;


    if (
      gamepad.buttons &&
      gamepad.buttons[1]
    ) {

      gripValue =
        gamepad.buttons[1].value;
    }


    const gripping =
      gripValue > 0.5;

    // ----------------------------------------------
    // GRIP PRESSED
    // ----------------------------------------------

    if (
      gripping &&
      !this.wasGripping[hand]
    ) {

      this.grabBall(
        hand
      );
    }


    // ----------------------------------------------
    // GRIP RELEASED
    // ----------------------------------------------

    if (
      !gripping &&
      this.wasGripping[hand]
    ) {

      if (
        this.grabbedBall.hand ===
        hand
      ) {

        this.releaseBall();
      }
    }


    this.wasGripping[hand] =
      gripping;
  }
},

    // ==================================================
    // UPDATE
    // ==================================================

    update(deltaTime) {

      if (
        !this.ready
      ) {
        return;
      }

// ==================================================
// UPDATE PLAYER COLLIDER
// ==================================================

const player =
  document.querySelector(
    '#player'
  );

if (
  player &&
  this.playerBody
) {

  const playerPosition =
    player.object3D.position;

  this.playerTransform.setIdentity();

  this.ammo.origin.setValue(
    playerPosition.x,
    playerPosition.y + 0.9,
    playerPosition.z
  );

  this.playerTransform.setOrigin(
    this.ammo.origin
  );

  this.playerBody.setWorldTransform(
    this.playerTransform
  );

  this.playerBody
    .getMotionState()
    .setWorldTransform(
      this.playerTransform
    );
}

      // Convert milliseconds
      // to seconds.

      const delta =
        Math.min(
          deltaTime / 1000,
          0.1
        );

      // ==================================================
      // STEP PHYSICS
      // ==================================================

      this.world.stepSimulation(
        delta,
        10
      );

// ==================================================
// UPDATE HAND COLLISION HITBOXES
// ==================================================

this.updateHandHitboxes();

this.updateGrabbedBall();

// ==================================================
// CHECK HAND → BALL CONTACT
// ==================================================

this.checkHandBallContacts();

      // ==================================================
      // READ BALL POSITION
      // ==================================================

      const motionState =
        this.ballBody.getMotionState();

      if (
        !motionState
      ) {
        return;
      }

      motionState.getWorldTransform(
        this.tmpTransform
      );

      const origin =
        this.tmpTransform.getOrigin();

      const rotation =
        this.tmpTransform.getRotation();

      // ==================================================
      // SYNC A-FRAME ENTITY
      // ==================================================

      this.ballEntity.object3D.position.set(
        origin.x(),
        origin.y(),
        origin.z()
      );


      this.ballEntity.object3D.quaternion.set(
        rotation.x(),
        rotation.y(),
        rotation.z(),
        rotation.w()
      );

      this.updateGrabInput();

    }
  };

  // ==================================================
  // A-FRAME PHYSICS COMPONENT
  // ==================================================

  AFRAME.registerComponent(
    'physics-manager',
    {

      init() {

        Physics.init();

      },


      tick(
        time,
        deltaTime
      ) {

        Physics.update(
          deltaTime
        );

      }

    }
  );
