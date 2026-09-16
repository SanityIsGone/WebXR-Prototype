import { Refractor } from 'three/addons/objects/Refractor.js';

const THREE = window.THREE;

// ==================================================
// GENERIC WATER MATERIAL / REFRACTION TEST
// ==================================================

// ==================================================
// WATER MATERIAL
// ==================================================

const waterRefractionShader = {

    uniforms: {

      tDiffuse: {
        value: null
      },
    
      textureMatrix: {
        value: null
      },
    
      time: {
        value: 0
      },
    
      waterColor: {
        value: new THREE.Color(0x6fc9df)
      },
    
      refractionStrength: {
        value: 0.1
      },
    
      normalStrength: {
        value: 0.15
      },
    
      fresnelStrength: {
        value: 0.15
      },
    
      fresnelPower: {
        value: 4.5
      },
    
      highlightStrength: {
        value: 1.0
      },
    
      highlightPower: {
        value: 15.0
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
            p * 5.0 +
            vec3(time * 0.20)
          );


        float n2 =
          noise(
            p * 12.0 -
            vec3(time * 0.13)
          );


        float displacement =
          (
            n1 * 0.75 +
            n2 * 0.25 -
            0.5
          ) *
          0.035;


          vec3 displacementDirection =
          normalize(position);
        
        p +=
          displacementDirection *
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

  uniform float refractionStrength;

  uniform float normalStrength;

  uniform float fresnelStrength;

  uniform float fresnelPower;

  uniform float highlightStrength;

  uniform float highlightPower;


  varying vec4 vRefractionCoord;

  varying vec3 vWorldPosition;

  varying vec3 vWorldNormal;


  // ==================================================
  // NOISE
  // ==================================================

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
      (
        p.x +
        p.y +
        p.z
      )
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


  // ==================================================
  // MAIN
  // ==================================================

  void main() {

    // ------------------------------------------------
    // Project scene coordinates
    // ------------------------------------------------

    vec2 waterScreenUV =
      vRefractionCoord.xy /
      vRefractionCoord.w;


    // ------------------------------------------------
    // Surface distortion
    // ------------------------------------------------

    vec3 waterNoisePosition =
      vWorldPosition * 24.0;


    float waterNoiseX =
      noise(
        waterNoisePosition +
        vec3(
          time * 0.10,
          0.0,
          0.0
        )
      );


    float waterNoiseY =
      noise(
        waterNoisePosition -
        vec3(
          0.0,
          time * 0.17,
          0.0
        )
      );


    vec2 waterDistortion =
      vec2(
        waterNoiseX - 0.5,
        waterNoiseY - 0.5
      );


    waterDistortion *=
      normalStrength;


    // ------------------------------------------------
    // Refraction
    // ------------------------------------------------

    vec2 waterRefractedUV =
      waterScreenUV +
      waterDistortion *
      refractionStrength;


    waterRefractedUV =
      clamp(
        waterRefractedUV,
        vec2(0.001),
        vec2(0.999)
      );


      // ------------------------------------------------
      // SMOOTH REFRACTION BLUR
      // ------------------------------------------------
      
      float waterBlurRadius =
        0.02;
      
      
      // Center sample.
      
      vec3 waterBlurColor =
        texture2D(
          tDiffuse,
          waterRefractedUV
        ).rgb *
        0.20;
      
      
      // ------------------------------------------------
      // Inner ring
      // ------------------------------------------------
      
      vec2 b1 =
        vec2(
          waterBlurRadius,
          0.0
        );
      
      vec2 b2 =
        vec2(
          0.7071 * waterBlurRadius,
          0.7071 * waterBlurRadius
        );
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV + b1,
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.10;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV - b1,
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.10;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              0.0,
              waterBlurRadius
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.10;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV -
            vec2(
              0.0,
              waterBlurRadius
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.10;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV + b2,
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.08;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV - b2,
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.08;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              b2.x,
              -b2.y
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.08;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              -b2.x,
              b2.y
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.08;
      
      
      // ------------------------------------------------
      // Outer ring
      // ------------------------------------------------
      
      float outerRadius =
        waterBlurRadius * 2.0;
      
      
      float outerDiagonal =
        outerRadius * 0.7071;
      
      
      // Cardinal directions.
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              outerRadius,
              0.0
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.025;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV -
            vec2(
              outerRadius,
              0.0
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.025;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              0.0,
              outerRadius
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.025;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV -
            vec2(
              0.0,
              outerRadius
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.025;
      
      
      // Outer diagonals.
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              outerDiagonal,
              outerDiagonal
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.025;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              -outerDiagonal,
              outerDiagonal
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.025;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              outerDiagonal,
              -outerDiagonal
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.025;
      
      
      waterBlurColor +=
        texture2D(
          tDiffuse,
          clamp(
            waterRefractedUV +
            vec2(
              -outerDiagonal,
              -outerDiagonal
            ),
            vec2(0.001),
            vec2(0.999)
          )
        ).rgb * 0.025;
      
      
      // ------------------------------------------------
      // Blend sharp and blurred refraction
      // ------------------------------------------------
      
      vec3 waterSharpColor =
        texture2D(
          tDiffuse,
          waterRefractedUV
        ).rgb;
      
      
      float waterBlurAmount =
        0.65;
      
      
      vec3 waterSceneColor =
        mix(
          waterSharpColor,
          waterBlurColor,
          waterBlurAmount
        );


    // ------------------------------------------------
    // Surface / view vectors
    // ------------------------------------------------

    vec3 waterNormal =
      normalize(
        vWorldNormal
      );


    vec3 waterView =
      normalize(
        cameraPosition -
        vWorldPosition
      );


    // ------------------------------------------------
    // Fresnel
    // ------------------------------------------------

    float waterFacing =
      abs(
        dot(
          waterNormal,
          waterView
        )
      );


    float waterFresnel =
      pow(
        1.0 -
        waterFacing,
        fresnelPower
      );


    waterFresnel =
      smoothstep(
        0.0,
        0.75,
        waterFresnel
      );


    // ------------------------------------------------
    // Base water color
    // ------------------------------------------------

    vec3 waterFinalColor =
      mix(
        waterSceneColor,
        waterColor,
        0.16
      );


    waterFinalColor *=
      1.08;


    // ------------------------------------------------
    // INTERNAL WATER VARIATION
    // ------------------------------------------------

    float waterInternalNoise =
      noise(
        vWorldPosition * 5.0 +
        vec3(
          time * 0.08,
          -time * 0.05,
          time * 0.03
        )
      );


    float waterInternalLight =
      smoothstep(
        0.25,
        0.85,
        waterInternalNoise
      );


    waterFinalColor =
      mix(
        waterFinalColor,
        waterFinalColor +
        vec3(
          0.05,
          0.11,
          0.13
        ),
        waterInternalLight * 0.5
      );


    // ------------------------------------------------
    // SURFACE HIGHLIGHT
    // ------------------------------------------------

    float waterHighlightNoise =
      noise(
        vWorldPosition * 14.0 +
        vec3(
          time * 0.05
        )
      );


    vec3 waterLight =
      normalize(
        vec3(
          0.45,
          0.85,
          0.35
        )
      );


    vec3 waterHalfVector =
      normalize(
        waterLight +
        waterView
      );


    float waterSpecular =
      pow(
        max(
          dot(
            waterNormal,
            waterHalfVector
          ),
          0.0
        ),
        highlightPower
      );


    waterSpecular *=
      smoothstep(
        0.6,
        1.0,
        waterHighlightNoise
      );


    waterFinalColor +=
      vec3(
        0.75,
        0.93,
        1.0
      ) *
      waterSpecular *
      highlightStrength;


    // ------------------------------------------------
    // OUTER REFLECTION
    //
    // This is a fake/environment-independent
    // reflection. It uses the view angle plus the
    // existing highlight lighting to create a subtle
    // glossy reflection around the surface.
    // ------------------------------------------------

    float waterReflection =
      pow(
        1.0 -
        waterFacing,
        2.5
      );


    waterReflection =
      smoothstep(
        0.15,
        0.85,
        waterReflection
      );


    // Keep reflection strongest where the surface
    // highlight is also plausible.

    float waterReflectionMask =
      mix(
        0.35,
        1.0,
        waterSpecular
      );


    vec3 waterReflectionColor =
      mix(
        waterColor,
        vec3(
          0.82,
          0.95,
          1.0
        ),
        0.65
      );


    waterFinalColor +=
      waterReflectionColor *
      waterReflection *
      waterReflectionMask *
      0.18;


    // ------------------------------------------------
    // SUBTLE SILHOUETTE
    // ------------------------------------------------

    float waterSilhouette =
      1.0 -
      waterFacing;


    waterSilhouette =
      smoothstep(
        0.45,
        0.9,
        waterSilhouette
      );


    waterFinalColor +=
      vec3(
        0.12,
        0.22,
        0.25
      ) *
      waterSilhouette *
      0.35;


    // ------------------------------------------------
    // Minimum visibility
    // ------------------------------------------------

    waterFinalColor =
      max(
        waterFinalColor,
        waterColor * 0.12
      );


    // ------------------------------------------------
    // Output
    // ------------------------------------------------

    gl_FragColor =
      vec4(
        waterFinalColor,
        1.0
      );

  }

`,

};


// ==================================================
// WATER REFRACTOR
// ==================================================

const waterGeometry =
  new THREE.BoxGeometry(
    0.3,
    0.3,
    0.3,
    24,
    24,
    24
  );


const waterMesh =
  new Refractor(
    waterGeometry,
    {
      color: 0xffffff,
      textureWidth: 768,
      textureHeight: 768,
      shader: waterRefractionShader
    }
  );


const waterMaterial =
  waterMesh.material;

waterMaterial.transparent =
  true;

waterMaterial.depthWrite =
  true;

waterMaterial.side =
  THREE.FrontSide;


waterMesh.position.set(
  0,
  1,
  -1
);


document
  .querySelector('a-scene')
  .object3D
  .add(waterMesh);


// ==================================================
// ANIMATION
// ==================================================

AFRAME.registerComponent(
  'water-animation',
  {

    tick(
      time
    ) {

      waterMaterial
        .uniforms
        .time
        .value =
          time * 0.0075;

    }
  }
);


document
  .querySelector('a-scene')
  .setAttribute(
    'water-animation',
    ''
  );
