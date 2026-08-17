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
    512,
    512,
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
        value: new THREE.Color(0x8fcbd8)
      },

      opacity: {
        value: 0.20
      },

      refractionStrength: {
        value: 0.035
      },

      normalStrength: {
        value: 0.08
      },

      fresnelStrength: {
        value: 0.12
      },

      fresnelPower: {
        value: 5.0
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
          worldPosition;


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
        // Water tint
        // ------------------------------------------------

        vec3 finalColor =
          mix(
            sceneColor,
            sceneColor * waterColor,
            0.22
          );


        // Subtle edge highlight.
        finalColor +=
          vec3(1.0) *
          fresnel *
          fresnelStrength;


        float finalOpacity =
          opacity +
          fresnel * 0.04;


        gl_FragColor =
          vec4(
            finalColor,
            finalOpacity
          );

      }

    `,


    transparent: true,

    depthWrite: false,

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

function updateWaterCamera(
  camera
) {

  // ------------------------------------------------
  // Water plane
  // ------------------------------------------------

  waterMesh.updateMatrixWorld(
    true
  );


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


  // The water's local +Z plane.
  waterPlane.setFromNormalAndCoplanarPoint(
    waterPlaneNormal.clone().negate(),
    waterPlanePosition
  );


  // ------------------------------------------------
  // Copy main camera
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


  // ------------------------------------------------
  // Oblique clipping
  // ------------------------------------------------

  const clipPlane =
    waterPlane.clone();

  clipPlane.applyMatrix4(
    waterVirtualCamera.matrixWorldInverse
  );


  const clipVector =
    new THREE.Vector4(
      clipPlane.normal.x,
      clipPlane.normal.y,
      clipPlane.normal.z,
      clipPlane.constant
    );


  const inverseProjection =
    waterVirtualCamera
      .projectionMatrix
      .clone()
      .invert();


  const clipCorner =
    new THREE.Vector4(
      Math.sign(clipVector.x),
      Math.sign(clipVector.y),
      1.0,
      1.0
    );


  clipCorner.applyMatrix4(
    inverseProjection
  );


  const scale =
    2.0 /
    clipVector.dot(clipCorner);


  clipVector.multiplyScalar(
    scale
  );


  waterVirtualCamera.projectionMatrix.elements[2] =
    clipVector.x -
    waterVirtualCamera.projectionMatrix.elements[3];


  waterVirtualCamera.projectionMatrix.elements[6] =
    clipVector.y -
    waterVirtualCamera.projectionMatrix.elements[7];


  waterVirtualCamera.projectionMatrix.elements[10] =
    clipVector.z -
    waterVirtualCamera.projectionMatrix.elements[11];


  waterVirtualCamera.projectionMatrix.elements[14] =
    clipVector.w -
    waterVirtualCamera.projectionMatrix.elements[15];


  // ------------------------------------------------
  // Texture projection matrix
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

    // Don't capture the water itself.
    waterMesh.visible = false;


    // Update virtual camera using
    // the actual camera being rendered.

    updateWaterCamera(
      camera
    );


    const previousTarget =
      renderer.getRenderTarget();


    renderer.setRenderTarget(
      waterRenderTarget
    );


    renderer.clear();


    renderer.render(
      scene,
      waterVirtualCamera
    );


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