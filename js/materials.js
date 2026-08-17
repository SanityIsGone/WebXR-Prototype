// Use for Three.JS material definitions; then reference individual materials in other files.

// ==================================================
// WATER MATERIAL TEST
// ==================================================

// WATER SETTINGS

const WATER_COLOR =
  new THREE.Color(0x8fcbd8);


// Quarter-resolution render target.
// This is intentionally low for standalone VR.

const waterRenderTarget =
  new THREE.WebGLRenderTarget(
    Math.floor(window.innerWidth * 0.5),
    Math.floor(window.innerHeight * 0.5),
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      depthBuffer: true,
      stencilBuffer: false
    }
  );

// WATER MATERIAL

const waterMaterial =
  new THREE.ShaderMaterial({

    uniforms: {

      // Scene captured behind the water.
      tScene: {
        value: waterRenderTarget.texture
      },

      time: {
        value: 0
      },

      waterColor: {
        value: WATER_COLOR
      },

      opacity: {
        value: 0.20
      },

      refractionStrength: {
        value: 0.045
      },

      normalStrength: {
        value: 0.12
      },

      fresnelStrength: {
        value: 0.12
      },

      fresnelPower: {
        value: 4.5
      }

    },

    // VERTEX SHADER

    vertexShader: `

      uniform float time;


      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;


      void main() {

        vec3 p = position;

        // Low-frequency displacement

        float wave1 =
          sin(
            p.x * 5.0 +
            time * 0.8
          ) * 0.008;


        float wave2 =
          sin(
            p.y * 6.0 -
            time * 0.65
          ) * 0.008;


        float wave3 =
          sin(
            p.z * 7.0 +
            time * 0.55
          ) * 0.006;


        float displacement =
          wave1 +
          wave2 +
          wave3;


        p += normal * displacement;

        // World-space information

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


        gl_Position =
          projectionMatrix *
          viewMatrix *
          worldPosition;

      }

    `,

    // FRAGMENT SHADER

    fragmentShader: `

      uniform sampler2D tScene;

      uniform float time;

      uniform vec3 waterColor;

      uniform float opacity;

      uniform float refractionStrength;

      uniform float normalStrength;

      uniform float fresnelStrength;

      uniform float fresnelPower;


      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;


      // Cheap procedural noise

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

        // Surface normal

        vec3 N =
          normalize(vWorldNormal);

        // Animated micro-surface

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

        // Screen coordinates

        vec2 screenUV =
          gl_FragCoord.xy /
          vec2(
            float(${Math.max(1, Math.floor(window.innerWidth * 0.5))}),
            float(${Math.max(1, Math.floor(window.innerHeight * 0.5))})
          );

        // Refraction

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
            tScene,
            refractedUV
          ).rgb;

        // Fresnel

        vec3 viewDirection =
          normalize(
            cameraPosition -
            vWorldPosition
          );


        float facing =
          max(
            dot(N, viewDirection),
            0.0
          );


        float fresnel =
          pow(
            1.0 - facing,
            fresnelPower
          );


        // Water tint

        vec3 tintedScene =
          mix(
            sceneColor,
            sceneColor * waterColor,
            0.22
          );

        // Subtle edge reflection

        vec3 edgeLight =
          vec3(1.0) *
          fresnel *
          fresnelStrength;


        vec3 finalColor =
          tintedScene +
          edgeLight;


        // Transparency

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

// TEMPORARY TEST MESH

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


// Add the test water to the A-Frame scene.

document
  .querySelector('a-scene')
  .object3D
  .add(waterMesh);


// ==================================================
// SCENE REFRACTION CAPTURE
// ==================================================

const waterScene =
  document.querySelector('a-scene')
  .object3D;


const waterRenderer =
  document.querySelector('a-scene')
  .renderer;


const waterCamera =
  document.querySelector('#camera')
  .getObject3D('camera');


waterMesh.onBeforeRender =
  function (
    renderer,
    scene,
    camera
  ) {

    // Prevent recursive capture.
    waterMesh.visible = false;


    // Save current render target.
    const previousTarget =
      renderer.getRenderTarget();


    // Render the scene into the water refraction texture.
    renderer.setRenderTarget(
      waterRenderTarget
    );


    renderer.render(
      scene,
      camera
    );


    // Restore normal rendering.
    renderer.setRenderTarget(
      previousTarget
    );


    waterMesh.visible = true;

  };


// ==================================================
// ANIMATION
// ==================================================

function animateWater(time) {

  waterMaterial
    .uniforms
    .time
    .value =
      time * 0.001;


  requestAnimationFrame(
    animateWater
  );

}


requestAnimationFrame(
  animateWater
);