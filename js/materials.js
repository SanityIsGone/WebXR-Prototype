// Use for Three.JS material definitions; then reference individual
// materials in other files.

// ==================================================
// GENERIC WATER MATERIAL / REFRACTION TEST
// ==================================================

// --------------------------------------------------
// THREE.JS HELPERS
// --------------------------------------------------

const waterRenderTarget =
  new THREE.WebGLRenderTarget(
    768,
    768,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      depthBuffer: true,
      stencilBuffer: false
    }
  );

const waterVirtualCamera =
  new THREE.PerspectiveCamera();

waterVirtualCamera.matrixAutoUpdate =
  false;


// Projection matrix used by the water shader.

const waterTextureMatrix =
  new THREE.Matrix4();


// Plane representing the front-facing surface
// of the water object.

const waterPlane =
  new THREE.Plane();


// Temporary math objects.

const waterPlaneNormal =
  new THREE.Vector3();

const waterPlanePosition =
  new THREE.Vector3();

const waterPlaneQuaternion =
  new THREE.Quaternion();

const waterPlaneScale =
  new THREE.Vector3();

const waterCameraPosition =
  new THREE.Vector3();

const waterWorldPosition =
  new THREE.Vector3();

const waterRotationMatrix =
  new THREE.Matrix4();


// ==================================================
// WATER MATERIAL
// ==================================================

const waterMaterial =
  new THREE.ShaderMaterial({

    uniforms: {

      tDiffuse: {
        value: waterRenderTarget.texture
      },

      textureMatrix: {
        value: waterTextureMatrix
      },

      time: {
        value: 0
      },

      waterColor: {
        value: new THREE.Color(0x6fc9df)
      },
      
      refractionStrength: {
        value: 0.055
      },
      
      normalStrength: {
        value: 0.045
      },
      
      fresnelStrength: {
        value: 0.10
      },
      
      fresnelPower: {
        value: 4.5
      }

    },


    // ==================================================
    // VERTEX SHADER
    // ==================================================

    vertexShader: `

      uniform mat4 textureMatrix;
      uniform float time;


      varying vec4 vRefractionCoord;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;


      // ------------------------------------------------
      // Cheap procedural noise
      // ------------------------------------------------

      float hash(vec3 p) {

        p =
          fract(
            p * 0.3183099 +
            vec3(0.1, 0.2, 0.3)
          );

        p *= 17.0;

        return fract(
          p.x *
          p.y *
          p.z *
          (p.x + p.y + p.z)
        );
      }


      float noise(vec3 p) {

        vec3 i =
          floor(p);

        vec3 f =
          fract(p);

        f =
          f * f *
          (3.0 - 2.0 * f);


        return mix(

          mix(
            mix(
              hash(i),
              hash(
                i +
                vec3(1.0, 0.0, 0.0)
              ),
              f.x
            ),

            mix(
              hash(
                i +
                vec3(0.0, 1.0, 0.0)
              ),

              hash(
                i +
                vec3(1.0, 1.0, 0.0)
              ),

              f.x
            ),

            f.y
          ),

          mix(
            mix(
              hash(
                i +
                vec3(0.0, 0.0, 1.0)
              ),

              hash(
                i +
                vec3(1.0, 0.0, 1.0)
              ),

              f.x
            ),

            mix(
              hash(
                i +
                vec3(0.0, 1.0, 1.0)
              ),

              hash(
                i +
                vec3(1.0, 1.0, 1.0)
              ),

              f.x
            ),

            f.y
          ),

          f.z
        );
      }


      void main() {

        vec3 p =
          position;


        // ------------------------------------------------
        // Gentle shape displacement
        // ------------------------------------------------

        float n1 =
          noise(
            p * 3.5 +
            vec3(time * 0.20)
          );


        float n2 =
          noise(
            p * 8.0 -
            vec3(time * 0.13)
          );


        float displacement =
          (
            n1 * 0.75 +
            n2 * 0.25 -
            0.5
          ) *
          0.035;


        p +=
          normal *
          displacement;


        // ------------------------------------------------
        // World position
        // ------------------------------------------------

        vec4 worldPosition =
          modelMatrix *
          vec4(p, 1.0);


        vWorldPosition =
          worldPosition.xyz;


        vWorldNormal =
          normalize(
            mat3(modelMatrix) *
            normal
          );


        // ------------------------------------------------
        // Refraction projection
        // ------------------------------------------------

        vRefractionCoord =
        textureMatrix *
        vec4(position, 1.0);


        gl_Position =
          projectionMatrix *
          viewMatrix *
          worldPosition;

      }

    `,


    // ==================================================
    // FRAGMENT SHADER
    // ==================================================

    fragmentShader: `

      uniform sampler2D tDiffuse;

      uniform float time;

      uniform vec3 waterColor;

      uniform float opacity;

      uniform float refractionStrength;

      uniform float normalStrength;

      uniform float fresnelStrength;

      uniform float fresnelPower;


      varying vec4 vRefractionCoord;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;


      // ------------------------------------------------
      // Cheap procedural noise
      // ------------------------------------------------

      float hash(vec3 p) {

        p =
          fract(
            p * 0.3183099 +
            vec3(0.1, 0.2, 0.3)
          );

        p *= 17.0;

        return fract(
          p.x *
          p.y *
          p.z *
          (p.x + p.y + p.z)
        );
      }


      float noise(vec3 p) {

        vec3 i =
          floor(p);

        vec3 f =
          fract(p);

        f =
          f * f *
          (3.0 - 2.0 * f);


        return mix(

          mix(
            mix(
              hash(i),
              hash(
                i +
                vec3(1.0, 0.0, 0.0)
              ),
              f.x
            ),

            mix(
              hash(
                i +
                vec3(0.0, 1.0, 0.0)
              ),

              hash(
                i +
                vec3(1.0, 1.0, 0.0)
              ),

              f.x
            ),

            f.y
          ),

          mix(
            mix(
              hash(
                i +
                vec3(0.0, 0.0, 1.0)
              ),

              hash(
                i +
                vec3(1.0, 0.0, 1.0)
              ),

              f.x
            ),

            mix(
              hash(
                i +
                vec3(0.0, 1.0, 1.0)
              ),

              hash(
                i +
                vec3(1.0, 1.0, 1.0)
              ),

              f.x
            ),

            f.y
          ),

          f.z
        );
      }


      void main() {

        // ------------------------------------------------
        // Projected scene coordinates
        // ------------------------------------------------

        vec2 screenUV =
          vRefractionCoord.xy /
          vRefractionCoord.w;


        // ------------------------------------------------
        // Animated surface distortion
        // ------------------------------------------------

        vec3 noisePosition =
          vWorldPosition * 8.0;


        float nx =
          noise(
            noisePosition +
            vec3(time * 0.20, 0.0, 0.0)
          );


        float ny =
          noise(
            noisePosition -
            vec3(0.0, time * 0.17, 0.0)
          );


        vec2 distortion =
          vec2(
            nx - 0.5,
            ny - 0.5
          );


        distortion *=
          normalStrength;


        // ------------------------------------------------
        // Refracted scene
        // ------------------------------------------------

        vec2 refractedUV =
          screenUV +
          distortion *
          refractionStrength;


        refractedUV =
          clamp(
            refractedUV,
            vec2(0.001),
            vec2(0.999)
          );


        vec3 sceneColor =
          texture2D(
            tDiffuse,
            refractedUV
          ).rgb;


        // ------------------------------------------------
        // Fresnel
        // ------------------------------------------------

        vec3 N =
          normalize(vWorldNormal);


        vec3 V =
          normalize(
            cameraPosition -
            vWorldPosition
          );


        float facing =
          max(
            dot(N, V),
            0.0
          );


        float fresnel =
          pow(
            1.0 - facing,
            fresnelPower
          );


          // ------------------------------------------------
// Water coloration
// ------------------------------------------------

// Preserve the refracted environment, but give the
// water its own visible body color.

vec3 waterTint =
  waterColor;


// Slightly brighten the captured environment.
// This prevents dark environments from making the
// water disappear into a black blob.

vec3 refractedColor =
  sceneColor * 1.35;


// Blend a modest amount of cyan into the result.

vec3 finalColor =
  mix(
    refractedColor,
    waterTint,
    0.18
  );


// ------------------------------------------------
// Fresnel
// ------------------------------------------------

float edge =
  fresnel *
  fresnelStrength;


// Very restrained edge highlight.

finalColor +=
  vec3(0.85, 0.95, 1.0) *
  edge;


// ------------------------------------------------
// Small brightness floor
// ------------------------------------------------

// Keeps the water visibly colored even when the
// captured environment is extremely dark.

finalColor =
  max(
    finalColor,
    waterTint * 0.12
  );


gl_FragColor =
  vec4(
    finalColor,
    1.0
  );

      }

    `,


    transparent: false,

    depthWrite: true,

    side: THREE.FrontSide

  });


// ==================================================
// TEMPORARY WATER MESH
// ==================================================

const waterGeometry =
  new THREE.IcosahedronGeometry(
    0.3,
    4
  );


const waterMesh =
  new THREE.Mesh(
    waterGeometry,
    waterMaterial
  );


waterMesh.position.set(
  0,
  1.5,
  -1
);


document
  .querySelector('a-scene')
  .object3D
  .add(waterMesh);


// ==================================================
// UPDATE REFRACTOR CAMERA
// ==================================================

function updateWaterCamera(camera) {

    // ------------------------------------------------
    // Update water transform
    // ------------------------------------------------
  
    waterMesh.updateMatrixWorld(true);
  
  
    // ------------------------------------------------
    // Water plane
    // ------------------------------------------------
  
    waterMesh.matrixWorld.decompose(
      waterPlanePosition,
      waterPlaneQuaternion,
      waterPlaneScale
    );
  
  
    waterPlaneNormal
      .set(0, 0, 1)
      .applyQuaternion(
        waterPlaneQuaternion
      )
      .normalize();
  
  
    // Refractor uses the NEGATED normal so that
    // geometry on the water side is clipped.
  
    waterPlaneNormal.negate();
  
  
    waterPlane.setFromNormalAndCoplanarPoint(
      waterPlaneNormal,
      waterPlanePosition
    );
  
  
    // ------------------------------------------------
    // Copy the real camera
    // ------------------------------------------------
  
    waterVirtualCamera.matrixWorld.copy(
      camera.matrixWorld
    );
  
  
    waterVirtualCamera.matrixWorldInverse
      .copy(
        waterVirtualCamera.matrixWorld
      )
      .invert();
  
  
    waterVirtualCamera.projectionMatrix.copy(
      camera.projectionMatrix
    );
  
  
    waterVirtualCamera.far =
      camera.far;
  
  
    // ------------------------------------------------
    // Convert water plane into camera space
    // ------------------------------------------------
  
    const clipPlane =
      new THREE.Plane();
  
  
    const clipVector =
      new THREE.Vector4();
  
  
    const q =
      new THREE.Vector4();
  
  
    clipPlane.copy(
      waterPlane
    );
  
  
    clipPlane.applyMatrix4(
      waterVirtualCamera.matrixWorldInverse
    );
  
  
    clipVector.set(
      clipPlane.normal.x,
      clipPlane.normal.y,
      clipPlane.normal.z,
      clipPlane.constant
    );
  
  
    // ------------------------------------------------
    // Oblique projection
    //
    // This follows Three.js Refractor.
    // ------------------------------------------------
  
    const projectionMatrix =
      waterVirtualCamera.projectionMatrix;
  
  
    q.x =
      (
        Math.sign(clipVector.x) +
        projectionMatrix.elements[8]
      ) /
      projectionMatrix.elements[0];
  
  
    q.y =
      (
        Math.sign(clipVector.y) +
        projectionMatrix.elements[9]
      ) /
      projectionMatrix.elements[5];
  
  
    q.z =
      -1.0;
  
  
    q.w =
      (
        1.0 +
        projectionMatrix.elements[10]
      ) /
      projectionMatrix.elements[14];
  
  
    clipVector.multiplyScalar(
      2.0 /
      clipVector.dot(q)
    );
  
  
    projectionMatrix.elements[2] =
      clipVector.x;
  
  
    projectionMatrix.elements[6] =
      clipVector.y;
  
  
    projectionMatrix.elements[10] =
      clipVector.z + 1.0;
  
  
    projectionMatrix.elements[14] =
      clipVector.w;
  
  
    // ------------------------------------------------
    // Texture projection matrix
    // ------------------------------------------------
    //
    // IMPORTANT:
    // This includes waterMesh.matrixWorld.
    // ------------------------------------------------
  
    waterTextureMatrix.set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0
    );
  
  
    waterTextureMatrix
      .multiply(
        waterVirtualCamera.projectionMatrix
      );
  
  
    waterTextureMatrix
      .multiply(
        waterVirtualCamera.matrixWorldInverse
      );
  
  
    waterTextureMatrix
      .multiply(
        waterMesh.matrixWorld
      );
  
  }


// ==================================================
// CAPTURE THE SCENE
// ==================================================

waterMesh.onBeforeRender =
  function (
    renderer,
    scene,
    camera
  ) {

    waterMesh.visible = false;


    const previousTarget =
      renderer.getRenderTarget();

    const previousXREnabled =
      renderer.xr.enabled;

    const previousShadowAutoUpdate =
      renderer.shadowMap.autoUpdate;


    // Prevent Three.js from modifying the
    // virtual camera as an XR camera.

    renderer.xr.enabled = false;

    // Don't recompute shadows for the
    // secondary water render.

    renderer.shadowMap.autoUpdate = false;


    updateWaterCamera(
      camera
    );


    renderer.setRenderTarget(
      waterRenderTarget
    );


    if (!renderer.autoClear) {
      renderer.clear();
    }


    renderer.render(
      scene,
      waterVirtualCamera
    );


    renderer.xr.enabled =
      previousXREnabled;


    renderer.shadowMap.autoUpdate =
      previousShadowAutoUpdate;


    renderer.setRenderTarget(
      previousTarget
    );


    waterMesh.visible = true;

  };


// ==================================================
// ANIMATION
// ==================================================

function animateWater(
  time
) {

  waterMaterial
    .uniforms
    .time
    .value =
      time * 0.003;


  requestAnimationFrame(
    animateWater
  );

}


requestAnimationFrame(
  animateWater
);