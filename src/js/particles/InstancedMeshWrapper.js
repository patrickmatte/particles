import * as THREE from 'three';

export default class InstancedMeshWrapper {
  constructor(options) {
    this.simulation = options.simulation;

    const maxCount = this.simulation.width * this.simulation.height;

    const geometry = new THREE.IcosahedronBufferGeometry(0.5, 3);

    const instanceColors = [];
    for (let i = 0; i < maxCount; i++) {
      instanceColors.push(Math.random() * 0.5 + 0.5);
      instanceColors.push(Math.random() * 0.5 + 0.5);
      instanceColors.push(Math.random() * 0.5 + 0.5);
    }
    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(instanceColors), 3));

    const pos = [];
    for (let i = 0; i < maxCount; i++) {
      pos.push(Math.random() * 2 - 1);
      pos.push(Math.random() * 2 - 1);
      pos.push(Math.random() * 2 - 1);
    }
    geometry.setAttribute('pos', new THREE.InstancedBufferAttribute(new Float32Array(pos), 3));

    var positionsLength = maxCount * 3;
    var positions = new Float32Array(positionsLength);
    var randomSize = new Float32Array(maxCount);
    var p = 0;
    for (var j = 0; j < positionsLength; j += 3) {
      positions[j] = p;
      positions[j + 1] = p / 5;
      positions[j + 2] = p;
      randomSize[p] = 1;
      p++;
    }

    geometry.setAttribute('simPosition', new THREE.InstancedBufferAttribute(positions, 3));
    geometry.setAttribute('randomSize', new THREE.InstancedBufferAttribute(randomSize, 1));

    const material = new THREE.MeshStandardMaterial({
      roughness: 0,
      metalness: 0.1,
      color: 0xff0000,
      //   envMap: options.envMap,
      //   envMapIntensity: 0.1,
    });
    this.material = material;

    const vertex_common = `
    #include <common>
    attribute vec3 instanceColor;
    attribute vec3 pos;
    varying vec3 vInstanceColor;
    uniform float size;

    uniform float ratio;
    uniform sampler2D pointTexture;
    uniform sampler2D sim;
    attribute vec3 simPosition;
    uniform float width;
    uniform float height;
    attribute float randomSize;

    float parabola( float x, float k ) {
        return pow( 4.0 * x * ( 1.0 - x ), k );
    }
    `;

    const begin_vertex = `
    vec2 dimensions = vec2( width, height );
	float px = simPosition.y;
	float vi = simPosition.z;
	float x = mod( px, dimensions.x );
	float y = mod( floor( px / dimensions.x ), dimensions.y );
	vec2 uv = vec2( x, y ) / dimensions;

	vec4 cubePosition = texture2D( sim, uv );
	float alpha = cubePosition.a / 100.;
	float timeScale = parabola( 1.0 - alpha, 1.0 );

	vec3 modPos = cubePosition.xyz * 1.0;
    
    vec3 transformed = position * timeScale + modPos;
    vInstanceColor = instanceColor;
    `;

    const fragment_common = `
    varying vec3 vInstanceColor;
    #include <common>
    `;

    const instance_color = `
    vec4 diffuseColor = vec4(vInstanceColor, 1.0);
    `;

    material.onBeforeCompile = (shader) => {
      shader.uniforms.sim = { value: this.simulation.rtTexturePos.texture };
      shader.uniforms.width = { value: this.simulation.width };
      shader.uniforms.height = { value: this.simulation.height };

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', vertex_common)
        .replace('#include <begin_vertex>', begin_vertex);

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', fragment_common)
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', instance_color);
    };

    let depthVS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_vert;
    let depthFS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_frag;

    depthVS = depthVS.replace('#include <common>', vertex_common).replace('#include <begin_vertex>', begin_vertex);
    depthVS = depthVS.replace('varying vec3 vInstanceColor;', '').replace('vInstanceColor = instanceColor;', '');

    const depthMat = new THREE.ShaderMaterial({
      vertexShader: depthVS,
      fragmentShader: depthFS,
    });

    depthMat.uniforms.sim = { value: this.simulation.rtTexturePos.texture };
    depthMat.uniforms.width = { value: this.simulation.width };
    depthMat.uniforms.height = { value: this.simulation.height };
    this.depthMat = depthMat;

    this.dummy = new THREE.Object3D();

    const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    // mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.count = maxCount;
    mesh.frustumCulled = false;
    mesh.customDepthMaterial = depthMat;
    for (let i = 0; i < maxCount; i++) {
      this.dummy.position.x += 1;
      mesh.setMatrixAt(i, this.dummy.matrix);
    }
    // mesh.instanceMatrix.needsUpdate = true;

    this.mesh = mesh;
  }
}
