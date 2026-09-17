//* =-=-=-=-=-=| PROJECT IMPORTS |=-=-=-=-=-=
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
  //* =-=-=-=-=-=| MATERIAL IMPORTS |=-=-=-=-=-=
import { waterMaterial } from './materials.js';

/* =-=-=-=-=-=| GRIP-CONTROLLED VR HAND |=-=-=-=-=-= */

AFRAME.registerComponent('finger-grip', {

  schema: {

    controller: {
      type: 'selector'
    },

    /* Rotation axis used to curl the fingers. */

    axis: {
      type: 'string',
      default: 'x'
    },

    /* Multiplier for the overall curl. 1.0 = normal. */

    curl: {
      type: 'number',
      default: 1
    }

  },

  init() {

    this.modelReady = false;

    this.fingers = {
      thumb: [],
      index: [],
      middle: [],
      ring: [],
      pinky: []
    };

    /* Store the rotations that came from the GLB. These are our OPEN-hand reference rotations. */

    this.baseRotations = new Map();

    /* A-Frame fires model-loaded once the GLB has been loaded and attached to this entity. */

    this.el.addEventListener('model-loaded', () => {

      this.setupHand();

    });

    /* The model may already have loaded before this component was attached. */

    if (this.el.object3D.children.length > 0) {

      this.setupHand();

    }

  },

  setupHand() {

    if (this.modelReady) {
      return;
    }

    /* These are the ACTUAL bone names from the GLB. */

    const boneNames = {
    
      thumb: [
        'Bone006',
        'Bone007'
      ],
    
      index: [
        'Bone008',
        'Bone009',
        'Bone010'
      ],
    
      middle: [
        '03_Middle',
        '03_Middle001',
        '03_Middle002',
        '03_Middle003'
      ],
    
      ring: [
        '04_Ring',
        '04_Ring001',
        '04_Ring002',
        '04_Ring003'
      ],
    
      pinky: [
        '05_Pinky',
        '05_Pinky001',
        '05_Pinky002',
        '05_Pinky003'
      ]
    
    };
    
    /* Search the entire imported GLTF hierarchy for bones. */

    this.el.object3D.traverse(object => {

      /* Check both object.type and isBone for compatibility with different Three.js versions. */

      if (object.type !== 'Bone' && !object.isBone) {
        return;
      }

      for (const [fingerName, names] of Object.entries(boneNames)) {

        if (!names.includes(object.name)) {
          continue;
        }

        this.fingers[fingerName].push(object);

        /* Save the GLB's original rotation. */

        this.baseRotations.set(object, {

          x: object.rotation.x,
          y: object.rotation.y,
          z: object.rotation.z

        });

        console.log(
          `[finger-grip] Found ${fingerName} bone: ${object.name}`
        );

      }

    });

    const totalBones =
      Object.values(this.fingers)
        .reduce(
          (total, bones) => total + bones.length,
          0
        );

    console.log(
      `[finger-grip] ${this.el.id}: found ${totalBones} finger bones`
    );

    console.log(
      '[finger-grip] finger structure:',
      this.fingers
    );

    /* Print every bone if the expected finger bones were not found. */

    if (totalBones === 0) {

      console.error(
        `[finger-grip] No finger bones found on ${this.el.id}.`
      );

      console.log(
        '[finger-grip] All bones in this model:'
      );

      this.el.object3D.traverse(object => {

        if (object.type === 'Bone' || object.isBone) {

          console.log(
            `  ${object.name}`
          );

        }

      });

      return;

    }

    this.modelReady = true;

  },

  /* =-=-=-=-=-=| FRAME UPDATE |=-=-=-=-=-= */

  tick() {

    if (!this.modelReady) {
      return;
    }

    const grip = this.getGripValue();

    this.updateFingers(grip);

  },

  /* =-=-=-=-=-=| GET CONTROLLER GRIP |=-=-=-=-=-= */

  getGripValue() {
    const scene = this.el.sceneEl;
  
    if (!scene || !scene.renderer) {
      return 0;
    }
  
    const renderer = scene.renderer;
  
    // A-Frame's WebGL/WebXR renderer
    const xr = renderer.xr;
  
    if (!xr || !xr.isPresenting) {
      return 0;
    }
  
    const session = xr.getSession();
  
    if (!session) {
      return 0;
    }
  
    const handedness =
      this.data.controller?.getAttribute('laser-controls')?.hand;
  
    for (const source of session.inputSources) {
      if (source.handedness !== handedness) {
        continue;
      }
  
      const gamepad = source.gamepad;
  
      if (!gamepad) {
        continue;
      }
  
      // Button 1 is normally squeeze/grip.
      return gamepad.buttons[1]?.value ?? 0;
    }
  
    return 0;
  },

  /* =-=-=-=-=-=| CURL FINGERS |=-=-=-=-=-= */

updateFingers(grip) {

  const maxCurl = {

    thumb:  35 * Math.PI / 180,
    index:  65 * Math.PI / 180,
    middle: 70 * Math.PI / 180,
    ring:   72 * Math.PI / 180,
    pinky:  75 * Math.PI / 180

  };

  /*
   * How much of the total curl each joint receives.
   */
  const jointMultipliers = {

    thumb:  [0.45, 0.55],
    index:  [0.35, 0.40, 0.25],
    middle: [0.35, 0.40, 0.25],
    ring:   [0.35, 0.40, 0.25],
    pinky:  [0.35, 0.40, 0.25]

  };

  /*
   * Multi-axis movement for each finger.
   *
   * X = primary curl
   * Y/Z = optional sideways/twist correction
   *
   * These are deliberately small on Y/Z.
   * You can tune them per finger if needed.
   */
  const fingerMotion = {

    thumb: {
      x: -1.00,
      y: 0.00,
      z: 1.00
    },

    index: {
      x: -1.00,
      y: 0.00,
      z: 0.00
    },

    middle: {
      x: 0.00,
      y: 0.00,
      z: -1.00
    },

    ring: {
      x: -1.00,
      y: 0.00,
      z: 0.00
    },

    pinky: {
      x: -1.00,
      y: 0.00,
      z: 0.00
    }

  };

  /*
   * Smooth controller input.
   */
  const smoothGrip =
    grip * grip * (3 - 2 * grip);


  for (const [fingerName, bones] of Object.entries(this.fingers)) {

    if (bones.length === 0) {
      continue;
    }

    const motion =
      fingerMotion[fingerName];

    const multipliers =
      jointMultipliers[fingerName];

    if (!motion || !multipliers) {
      continue;
    }

    const totalCurl =
      maxCurl[fingerName] *
      smoothGrip *
      this.data.curl;


    bones.forEach((bone, index) => {

      /*
       * Never rotate the finger root bones.
       */

      const boneName = bone.name;

      if (
        boneName === 'Thumb' ||
        boneName === 'Index' ||
        boneName === 'Middle' ||
        boneName === 'Ring' ||
        boneName === 'Pinky'
      ) {
        return;
      }


      const base =
        this.baseRotations.get(bone);

      if (!base) {
        return;
      }


      const multiplier =
        multipliers[index];

      if (multiplier === undefined) {
        return;
      }

      const amount =
        totalCurl * multiplier;

      /*
       * Restore Blender's original rotation first.
       */
      bone.rotation.set(
        base.x + 0.1,
        base.y,
        base.z
      );

      /*
       * Apply rotation on MULTIPLE axes.
       *
       * Each axis can have its own direction/amount.
       */
      bone.rotation.x +=
        motion.x * amount;

      bone.rotation.y +=
        motion.y * amount;

      bone.rotation.z +=
        motion.z * amount;

    });
  }
}

});