import * as THREE from 'three';
import TreeMeshDepthMaterial from './TreeMeshDepthMaterial';
import { InstancedMeshExtended } from './InstancedMeshExtended';
import { glsl } from '../tsunami/three/threeUtils';
import { searchData } from './Data';
import Vector3D from '../tsunami/geom/Vector3D';
import noise from '../tsunami/three/shaders/noise.glsl';
import curlNoise from '../tsunami/three/shaders/curlNoise.glsl';

export default class TreeMesh {
  constructor() {
    this.settings = {
      material: 'basic',
      pointScale: { value: 1 },
      noise0: { value: new THREE.Vector3(1.372, 0.429, 0.071) },
      noise1: { value: new THREE.Vector3(0.042, 1.712, 0.031) },
    };

    const geometry = new THREE.IcosahedronBufferGeometry(0.1, 2);

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

    const instanceColor = [];
    const randomColor = [];
    const treePos = [];

    let maxCount = 0;
    this.balls = [];
    searchData.Categories.forEach((mainCategory, k) => {
      const mainCategoryFactor = k / (searchData.Categories.length - 1);
      const mainCategoryRotationFactor = k / searchData.Categories.length;
      const color = colors[Math.floor(mainCategoryFactor * (colors.length - 1))];
      const rotation = new THREE.Vector2(
        Math.random() * Math.PI - Math.PI / 2,
        Math.PI * 2 * mainCategoryRotationFactor
      );
      const recurseCategory = (cat, color, rotation, radius, isMainCategory) => {
        const catRotation = new THREE.Vector2(
          rotation.x + (Math.random() - 0.5) * 0.25,
          rotation.y + (Math.random() - 0.5) * 0.25
        );
        let position = Vector3D.spherePoint(radius, catRotation.x, catRotation.y);
        treePos.push(position.x, position.y, position.z);

        // instanceColor.push(color.r);
        // instanceColor.push(color.g);
        // instanceColor.push(color.b);
        instanceColor.push(0);
        instanceColor.push(0);
        instanceColor.push(0);

        randomColor.push(Math.random());
        randomColor.push(Math.random());
        randomColor.push(Math.random());

        this.balls.push(cat);
        maxCount++;

        if (cat.Entries) {
          cat.Entries.forEach((entry) => {
            const entryRotation = new THREE.Vector2(
              catRotation.x + (Math.random() - 0.5) * 0.25,
              catRotation.y + (Math.random() - 0.5) * 0.25
            );

            position = Vector3D.spherePoint(radius + 1, entryRotation.x, entryRotation.y);
            treePos.push(position.x, position.y, position.z);

            instanceColor.push(color.r);
            instanceColor.push(color.g);
            instanceColor.push(color.b);

            randomColor.push(Math.random());
            randomColor.push(Math.random());
            randomColor.push(Math.random());

            this.balls.push(entry);
            maxCount++;
          });
        }
        cat.Categories.forEach((subCat) => {
          const subCatColor = color.clone().offsetHSL(0.1, 0, 0);
          if ((subCat.Entries && subCat.Entries.length > 0) || (subCat.Categories && subCat.Categories.length > 0))
            recurseCategory(subCat, color, catRotation, radius + 2);
        });
      };
      recurseCategory(mainCategory, color, rotation, 1, true);
    });

    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(instanceColor), 3));
    geometry.setAttribute('randomColor', new THREE.InstancedBufferAttribute(new Float32Array(randomColor), 3));
    geometry.setAttribute('treePos', new THREE.InstancedBufferAttribute(new Float32Array(treePos), 3));

    this.materials = {};
    this.materials.standard = new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0,
      color: 0xff0000,
      // envMap,
      // envMapIntensity: 0.01,
      transparent: true,
    });
    this.materials.basic = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });
    for (let i in this.materials) {
      const material = this.materials[i];
      material.onBeforeCompile = (shader) => {
        material.shader = shader;
        shader.uniforms.colorRandomMultiplier = this.colorRandomMultiplier;
        shader.uniforms.pointScale = this.settings.pointScale;
        shader.uniforms.noise0 = this.settings.noise0;
        shader.uniforms.noise1 = this.settings.noise1;

        const vertex_common = glsl`
        #include <common>
        uniform vec3 colorRandomMultiplier;
        uniform float pointScale;
        uniform vec4 noise0;
        uniform vec4 noise1;

        attribute vec3 treePos;
        attribute vec3 instanceColor;
        varying vec3 vInstanceColor;
        attribute vec3 randomColor;
        varying vec3 vrandomColor;

        ${noise}
        ${curlNoise}

        `;

        const begin_vertex = glsl`
        vec3 transformed = treePos;
        float frequency = noise0.x;
        float amplitude = noise0.y;
        float speed = noise0.z;
        float time = 0.0;
        transformed += snoiseVec3(treePos * frequency + time * speed) * amplitude;

        // frequency = noise1.x;
        // amplitude = noise1.y;
        // speed = noise1.z;
        // transformed += snoiseVec3(treePos * frequency + time * speed) * amplitude;

        transformed += position * pointScale;

        vInstanceColor = instanceColor;
        vrandomColor = randomColor;
        `;

        const fragment_common = glsl`
        uniform vec3 colorRandomMultiplier;
        varying vec3 vInstanceColor;
        varying vec3 vrandomColor;
        #include <common>
        `;

        const instance_color = glsl`
        vec3 col = vrandomColor * colorRandomMultiplier + (vInstanceColor - colorRandomMultiplier);
        vec4 diffuseColor = vec4(col, opacity);
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

    this.depthMat = new TreeMeshDepthMaterial(this.settings);

    const mesh = new InstancedMeshExtended(geometry, this.materials[this.settings.material], maxCount);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.count = maxCount;
    // mesh.frustumCulled = false;
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
    for (let i = 0; i < 1; i++) {
      const noiseFolder = gui.addFolder('noise' + i);
      noiseFolder.add(this.settings['noise' + i].value, 'x', 0, 2, 0.001).name('frequency');
      noiseFolder.add(this.settings['noise' + i].value, 'y', 0, 2, 0.001).name('amplitude');
      noiseFolder.add(this.settings['noise' + i].value, 'z', 0, 1, 0.001).name('speed');
    }
  }
}
