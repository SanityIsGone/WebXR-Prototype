// Use for Three.JS material definitions; then reference individual materials in other file.

// ==================================================
// WATER MATERIAL TEST
// ==================================================

const waterMaterial = new THREE.ShaderMaterial({
    // uniforms + shaders here
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