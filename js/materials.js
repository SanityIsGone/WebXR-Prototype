// Use for Three.JS material definitions; then reference individual materials in other file.

// ==================================================
// WATER MATERIAL TEST
// ==================================================

const waterMaterial = new THREE.ShaderMaterial({

    uniforms: {
  
      time: {
        value: 0
      },
  
      envMap: {
        value: waterCubeTexture
      },
  
      waterColor: {
        value: new THREE.Color(0x9ddfea)
      },
  
      refractionRatio: {
        value: 0.985
      },
  
      reflectivity: {
        value: 0.65
      },
  
      fresnelPower: {
        value: 3.0
      },
  
      opacity: {
        value: 0.72
      },
  
      distortion: {
        value: 0.08
      }
  
    },
  
  
    vertexShader: `
  
      uniform float time;
      uniform float distortion;
  
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;
  
  
      // Cheap procedural noise
      float hash(vec3 p) {
  
        p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  
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
  
  
        float n1 =
          noise(
            p * 3.0 +
            vec3(time * 0.25)
          );
  
  
        float n2 =
          noise(
            p * 7.0 -
            vec3(time * 0.18)
          );
  
  
        float displacement =
          (n1 * 0.7 + n2 * 0.3 - 0.5)
          * distortion;
  
  
        p += normal * displacement;
  
  
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
  
      uniform samplerCube envMap;
  
      uniform vec3 waterColor;
  
      uniform float refractionRatio;
      uniform float reflectivity;
      uniform float fresnelPower;
      uniform float opacity;
  
  
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;
  
  
      void main() {
  
        vec3 N =
          normalize(vWorldNormal);
  
        vec3 V =
          normalize(vViewDirection);
  
  
        // Fresnel effect.
        float fresnel =
          pow(
            1.0 -
            max(dot(N, V), 0.0),
            fresnelPower
          );
  
  
        // Reflection.
        vec3 reflectionDirection =
          reflect(-V, N);
  
  
        vec3 reflection =
          textureCube(
            envMap,
            reflectionDirection
          ).rgb;
  
  
        // Refraction.
        vec3 refractionDirection =
          refract(
            -V,
            N,
            refractionRatio
          );
  
  
        vec3 refraction =
          textureCube(
            envMap,
            refractionDirection
          ).rgb;
  
  
        // Fresnel blends refraction into
        // reflection around the edges.
        vec3 environment =
          mix(
            refraction,
            reflection,
            fresnel * reflectivity
          );
  
  
        // Subtle water coloration.
        environment =
          mix(
            environment,
            environment * waterColor,
            0.35
          );
  
  
        // Slight brightening at the silhouette.
        environment +=
          fresnel * 0.12;
  
  
        float finalOpacity =
          opacity +
          fresnel * 0.15;
  
  
        gl_FragColor =
          vec4(
            environment,
            finalOpacity
          );
  
      }
  
    `,
  
    transparent: true,
  
    depthWrite: false,
  
    side: THREE.DoubleSide
  
  });
  
  const waterGeometry =
    new THREE.IcosahedronGeometry(0.3, 3);
  
  const waterMesh =
    new THREE.Mesh(
      waterGeometry,
      waterMaterial
    );
  
  waterMesh.position.set(0, 1.5, -1);
  
  const scene =
    document.querySelector('a-scene').object3D;
  
  scene.add(waterMesh);
  
  // ==================================================
  // ANIMATION
  // ==================================================
  
  function animateWater(time) {
  
    waterMaterial.uniforms.time.value =
      time * 0.001;
  
    requestAnimationFrame(animateWater);
  }
  
  requestAnimationFrame(animateWater);