import { MeshPhysicalNodeMaterial } from 'three/webgpu';

// ============================================================
// PROCEDURAL MATERIALS
// ============================================================

// Water
export let waterMaterial; 
const loader = new THREE.MaterialLoader();
fetch('material.json')
  .then(res => res.json())
  .then(json => {
  waterMaterial = loader.parse(json);
  });
// Next