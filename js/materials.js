import { MeshPhysicalNodeMaterial } from 'three/webgpu';

// ============================================================
// PROCEDURAL MATERIALS
// ============================================================

// Water
export const waterMaterial = new MeshPhysicalNodeMaterial();
waterMaterial.color.set('#93e2fd');
waterMaterial.roughness = 0.0;
waterMaterial.ior = 1.333;
waterMaterial.transmission = 1.0;
waterMaterial.thickness = 0.5;
waterMaterial.dispersion = 1.0;

// Next Material