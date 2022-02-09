import * as THREE from 'three';
import CloudMeshDepthMaterial from './CloudMeshDepthMaterial';
import { InstancedMeshExtended } from './InstancedMeshExtended';
import { glsl } from '../../tsunami/three/threeUtils';
import { searchData } from '../model/Data';

export default class CloudMesh {
  constructor(textureSource) {
    this.textureSource = { value: textureSource };

    this.settings = {
      material: 'basic',
      pointScale: { value: 1 },
    };

    const geometry = new THREE.IcosahedronBufferGeometry(0.25, 2);

    this.colorRandomMultiplier = { value: new THREE.Vector3(0.25, 0.25, 0.25) };

    const hexColors = [
      0xfcff5d, 0x7dfc00, 0x0ec434, 0x228c68, 0x8ad8e8, 0x235b54, 0x29bdab, 0x3998f5, 0x37294f, 0x277da7, 0x3750db,
      0xf22020, 0x991919, 0xffcba5, 0xe68f66, 0xc56133, 0x96341c, 0x632819, 0xffc413, 0xf47a22, 0x2f2aa0, 0xb732cc,
      0x772b9d, 0xf07cab, 0xd30b94, 0xedeff3, 0xc3a5b4, 0x946aa2, 0x5d4c86,
    ];

    const colors = [];
    hexColors.forEach((hex) => {
      colors.push(new THREE.Color(hex).offsetHSL(0, -0.33, 0));
    });

    const width = this.textureSource.value.image.width;
    const height = this.textureSource.value.image.height;

    const instanceColor = [];
    const randomColor = [];
    const visibility = [];
    const textureUV = [];
    const maxCount = width * height;
    let count = 0;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const factor = count / (maxCount - 1);
        textureUV.push(i / (width - 1));
        textureUV.push(j / (height - 1));

        // const colorIndex = Math.random();
        const color = colors[Math.floor(factor * (colors.length - 1))];

        // instanceColor.push(color.r);
        // instanceColor.push(color.g);
        // instanceColor.push(color.b);

        randomColor.push(Math.random());
        randomColor.push(Math.random());
        randomColor.push(Math.random());

        count += 1;
      }
    }

    searchData.Categories.forEach((cat, k) => {
      cat.AllEntries.forEach((entry) => {
        const factor = k / (searchData.Categories.length - 1);
        const color = colors[Math.floor(factor * (colors.length - 1))];

        instanceColor.push(color.r);
        instanceColor.push(color.g);
        instanceColor.push(color.b);

        visibility.push(1);
      });
    });

    while (instanceColor.length < maxCount * 3) {
      instanceColor.push(1);
      instanceColor.push(0);
      instanceColor.push(0);
      visibility.push(0);
    }

    geometry.setAttribute('textureUV', new THREE.InstancedBufferAttribute(new Float32Array(textureUV), 2));
    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(instanceColor), 3));
    geometry.setAttribute('randomColor', new THREE.InstancedBufferAttribute(new Float32Array(randomColor), 3));
    geometry.setAttribute('visibility', new THREE.InstancedBufferAttribute(new Float32Array(visibility), 1));

    this.materials = {};
    this.materials.standard = new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0,
      color: 0xff0000,
      transparent: true,
    });
    this.materials.basic = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });
    for (let i in this.materials) {
      const material = this.materials[i];
      material.onBeforeCompile = (shader) => {
        material.shader = shader;
        shader.uniforms.textureSource = this.textureSource;
        shader.uniforms.colorRandomMultiplier = this.colorRandomMultiplier;
        shader.uniforms.pointScale = this.settings.pointScale;

        const vertex_common = glsl`
        #include <common>
        uniform sampler2D textureSource;
        uniform vec3 colorRandomMultiplier;
        uniform float pointScale;

        attribute vec2 textureUV;
        attribute vec3 instanceColor;
        varying vec3 vInstanceColor;
        attribute vec3 randomColor;
        varying vec3 vrandomColor;
        attribute float visibility;
        varying float vvisibility;
        `;

        const begin_vertex = glsl`
        vec4 texturePos = texture2D( textureSource, textureUV );
        vec3 transformed = texturePos.xyz + position * pointScale;
        vInstanceColor = instanceColor;
        vrandomColor = randomColor;
        vvisibility = visibility;
        `;

        const fragment_common = glsl`
        uniform vec3 colorRandomMultiplier;
        varying vec3 vInstanceColor;
        varying vec3 vrandomColor;
        varying float vvisibility;
        #include <common>
        `;

        const instance_color = glsl`
        if(vvisibility == 0.0) discard;
        vec3 col = vrandomColor * colorRandomMultiplier + (vInstanceColor - colorRandomMultiplier);
        vec4 diffuseColor = vec4(col, vvisibility);
        `;

        shader.vertexShader = shader.vertexShader.replace('#include <common>', vertex_common);
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', begin_vertex);

        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', fragment_common);
        shader.fragmentShader = shader.fragmentShader.replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          instance_color
        );
      };
    }

    this.depthMat = new CloudMeshDepthMaterial(this.textureSource, this.settings.pointScale);

    const mesh = new InstancedMeshExtended(geometry, this.materials[this.settings.material], maxCount);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.count = maxCount;
    mesh.frustumCulled = false;
    mesh.customDepthMaterial = this.depthMat;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < maxCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    this.mesh = mesh;
  }

  GUI(gui) {
    gui.add(this.settings, 'material', { standard: 'standard', basic: 'basic' }).onChange((value) => {
      const material = this.materials[value];
      this.mesh.material = material;
      if (this.materialFolder) {
        this.materialFolder.destroy();
        this.materialFolder = null;
      }
      if (value == 'standard') {
        this.materialFolder = gui.addFolder('Material');
        this.materialFolder.add(material, 'roughness', 0, 1, 0.001);
        this.materialFolder.add(material, 'metalness', 0, 1, 0.001);
        // this.materialFolder.add(material, 'envMapIntensity', 0, 1, 0.001);
      }
    });
    gui.add(this.settings.pointScale, 'value', 0, 5, 0.001).name('pointScale');
    gui.add(this.mesh, 'castShadow');
    gui.add(this.mesh, 'receiveShadow');
  }
}
