
  //* =-=-=-=-=-=| PROJECT IMPORTS |=-=-=-=-=-=
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
  //* =-=-=-=-=-=| MATERIAL IMPORTS |=-=-=-=-=-=
import { waterMaterial } from './materials.js';

if ( WebGL.isWebGL2Available() ) {

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width  = Math.floor( canvas.clientWidth  * pixelRatio );
    const height = Math.floor( canvas.clientHeight * pixelRatio );
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
  
  const stats = new Stats();
  document.body.appendChild( stats.dom );
  
  //* =-=-=-=-=-=| SCENE SETUP |=-=-=-=-=-=
  const canvas = document.querySelector('#c');

  let renderer;
  if (navigator.gpu) {
    renderer = new WebGPURenderer({ canvas, antialias: true });
  } else {
    console.error('WEBGPU is required for this runtime')
  }
  
  const camera = new THREE.PerspectiveCamera( 75, 2, 0.1, 999 );
  camera.position.z = 5;
  const controls = new OrbitControls( camera, renderer.domElement );
  controls.update();
  
  const scene = new THREE.Scene();
  
  const light = new THREE.DirectionalLight( 0xFFFFFF, 3 );
  light.position.set( 0, 1, 4 );
  scene.add( light );
  
  const AmbientLight = new THREE.AmbientLight( 0xefefef ); // soft white light
  scene.add( AmbientLight );
  //* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  
  const radius = 0.5;
  const widthSegments = 20;
  const heightSegments = 20;
  const geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments );
  
  function makeInstance( geometry, color, x, y, z, material = null ) {
    if ( material === null ) {
      material = new THREE.MeshPhongMaterial( { color } );
    }
    const cube = new THREE.Mesh( geometry, material );
    scene.add( cube );
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;
    return cube;
  
  }
  
  const cubes = [
    makeInstance( geometry, 0x44aa88, -1, 0, 0, ),
    makeInstance( geometry, 0xa73380, 1, 0, 0 ),
  ];
  
  let prevTime = 0;
  
  //* =-=-=-=-=-=| RENDER LOOP |=-=-=-=-=-=
  function render(time) {
    time *= 0.001;
    const deltaTime = time - prevTime;
    prevTime = time;
  
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  
    navigator.gpu ? renderer.renderAsync(scene, camera) : renderer.render(scene, camera);
    
    stats.update();
  
    requestAnimationFrame(render);
  }
  
  
  requestAnimationFrame( render );
  
} else {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.body.appendChild( warning );
}