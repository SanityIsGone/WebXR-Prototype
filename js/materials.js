import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import * as THREE from 'three';
// ============================================================
// PROCEDURAL MATERIALS
// ============================================================

// Water

export const waterMaterial = new MeshPhysicalNodeMaterial();
waterMaterial.color.set(0x94e2fe);
waterMaterial.roughness = 0;
waterMaterial.metalness = 0;
waterMaterial.dispersion = 1;
waterMaterial.transmission = 1;
waterMaterial.thickness = 0.5;
waterMaterial.reflectivity = 0.3568;
waterMaterial.iridescence = 0.5;
waterMaterial.iridescenceIOR = 1.3;