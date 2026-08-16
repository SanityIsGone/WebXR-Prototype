// Use for Three.JS material definitions; then reference individual materials in other files.

// ==================================================
// WATER MATERIAL TEST
// ==================================================

const waterMaterial = new THREE.ShaderMaterial({

    uniforms: {
      time: {
        value: 0
      },
  
      waterColor: {
        value: new THREE.Color(0x9ddfea)
      },
  
      distortion: {
        value: 0.08
      },
  
      opacity: {
        value: 0.78
      }
    },
  
  
    vertexShader: `
  
      uniform float time;
      uniform float distortion;
  
      varying vec3 vNormal;
      varying vec3 vViewDirection;
  
  
      // Cheap procedural noise.
      float hash(vec3 p) {
  
        p = fract(
          p * 0.3183099 +
          vec3(0.1, 0.2, 0.3)
        );
  
        p *= 17.0;
  
        return fract(
          p.x * p.y * p.z *
          (p.x + p.y + p.z)
        );
      }
  
  
      float noise(vec3 p) {
  
        vec3 i = floor(p);
        vec3 f = fract(p);
  
        f = f * f * (3.0 - 2.0 * f);
  
        return mix(
  
          mix(
            mix(
              hash(i),
              hash(i + vec3(1.0, 0.0, 0.0)),
              f.x
            ),
  
            mix(
              hash(i + vec3(0.0, 1.0, 0.0)),
              hash(i + vec3(1.0, 1.0, 0.0)),
              f.x
            ),
  
            f.y
          ),
  
          mix(
            mix(
              hash(i + vec3(0.0, 0.0, 1.0)),
              hash(i + vec3(1.0, 0.0, 1.0)),
              f.x
            ),
  
            mix(
              hash(i + vec3(0.0, 1.0, 1.0)),
              hash(i + vec3(1.0, 1.0, 1.0)),
              f.x
            ),
  
            f.y
          ),
  
          f.z
        );
      }
  
  
      void main() {
  
        vec3 p = position;
  
        float n1 = noise(
          p * 3.0 +
          vec3(time * 0.25)
        );
  
        float n2 = noise(
          p * 7.0 -
          vec3(time * 0.18)
        );
  
        float displacement =
          (n1 * 0.7 + n2 * 0.3 - 0.5) *
          distortion;
  
        p += normal * displacement;
  
  
        vec4 worldPosition =
          modelMatrix *
          vec4(p, 1.0);
  
  
        vNormal =
          normalize(
            normalMatrix *
            normal
          );
  
  
        vViewDirection =
          normalize(
            cameraPosition -
            worldPosition.xyz
          );
  
  
        gl_Position =
          projectionMatrix *
          viewMatrix *
          worldPosition;
  
      }
    `,
  
  
    fragmentShader: `
  
      uniform vec3 waterColor;
      uniform float opacity;
  
      varying vec3 vNormal;
      varying vec3 vViewDirection;
  
  
      void main() {
  
        vec3 N =
          normalize(vNormal);
  
        vec3 V =
          normalize(vViewDirection);
  
  
        // Fresnel effect.
        float fresnel =
          pow(
            1.0 -
            max(dot(N, V), 0.0),
            3.0
          );
  
  
        // Simple water-like lighting.
        vec3 base =
          waterColor * 0.55;
  
        vec3 edge =
          vec3(1.0) * fresnel * 0.8;
  
  
        vec3 finalColor =
          base + edge;
  
  
        float finalOpacity =
          opacity +
          fresnel * 0.15;
  
  
        gl_FragColor =
          vec4(
            finalColor,
            finalOpacity
          );
  
      }
    `,
  
  
    transparent: true,
  
    depthWrite: false,
  
    side: THREE.DoubleSide
  });
  
  
  // ==================================================
  // TEMPORARY WATER MESH
  // ==================================================
  
  const waterGeometry =
    new THREE.IcosahedronGeometry(0.3, 2);
  
  
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
  
  
  // Don't call this "scene" because main.js
  // already has a global variable with that name.
  
  document
    .querySelector('a-scene')
    .object3D
    .add(waterMesh);
  
  
  // ==================================================
  // ANIMATION
  // ==================================================
  
  function animateWater(time) {
  
    waterMaterial.uniforms.time.value =
      time * 0.001;
  
    requestAnimationFrame(
      animateWater
    );
  }
  
  
  requestAnimationFrame(
    animateWater
  );