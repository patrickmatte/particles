import * as THREE from 'three';

export default class PointsWrapper {
  constructor(options) {
    this.simulation = options.simulation;
    this.pointTexture = options.particuleTexture;
    this.position = options.position;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        size: { type: 'f', value: 75 },
        ratio: { type: 'f', value: 1 },
        pointTexture: { type: 't', value: this.pointTexture },
        sim: { type: 't', value: this.simulation.rtTexturePos },
        width: { type: 'f', value: this.simulation.width },
        height: { type: 'f', value: this.simulation.height },
      },
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    var vertices = Math.round(this.simulation.width * this.simulation.height);
    var positionsLength = vertices * 3;
    var positions = new Float32Array(positionsLength);
    var randomSize = new Float32Array(vertices);
    var p = 0;
    for (var j = 0; j < positionsLength; j += 3) {
      positions[j] = p;
      positions[j + 1] = p / 5;
      positions[j + 2] = p;
      randomSize[p] = 1; //tsunami.easing.Exponential.easeIn(Math.random() * 0.85 + 0.15, 0, 1, 1);
      p++;
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('randomSize', new THREE.BufferAttribute(randomSize, 1));

    this.mesh = new THREE.Points(geometry, this.material);
  }
}

export const pointsVertex = `
uniform float size;
uniform float ratio;
uniform sampler2D pointTexture;
uniform sampler2D sim;
uniform float width;
uniform float height;

attribute float randomSize;

varying float alpha;

float parabola( float x, float k ) {
	return pow( 4. * x * ( 1. - x ), k );
}

void main() {
	vec2 dimensions = vec2( width, height );

	float px = position.y;
	float vi = position.z;
	float x = mod( px, dimensions.x );
	float y = mod( floor( px / dimensions.x ), dimensions.y );
	vec2 uv = vec2( x, y ) / dimensions;

	vec4 cubePosition = texture2D( sim, uv );
	alpha = cubePosition.a / 100.;
	float timeScale = .025 * parabola( 1. - alpha, 1. );

	vec3 modPos = cubePosition.xyz * 1.0;

	vec4 mvPosition = modelViewMatrix * vec4(modPos, 1.);
	gl_PointSize = size * timeScale * ( ratio / length( mvPosition.xyz ) );
	gl_Position = projectionMatrix * mvPosition;
}
`;

export const pointsFragment = `
uniform sampler2D pointTexture;
varying float alpha;

void main() {
	vec4 color = texture2D( pointTexture, gl_PointCoord );
	gl_FragColor = vec4(color.rgb, color.a * alpha);
}
`;
