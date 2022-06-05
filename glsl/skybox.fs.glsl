// #version 300 es

// in vec3 pos;
// out vec4 out_FragColor;

// uniform samplerCube skybox;

// void main() {
//     out_FragColor = texture(skybox, pos);
// }


#version 300 es

in vec3 pos;

out vec4 out_FragColor;

// The cubmap texture is of type SamplerCube
uniform samplerCube skybox;

void main() {
	// HINT : Sample the texture from the samplerCube object, remember that cubeMaps are sampled 
	// using a direction vector that you calculated in the vertex shader 
	
	// out_FragColor = vec4(0.0, 0.0, 0.1, 0.6); // Q3 : REPLACE THIS LINE
	out_FragColor = texture(skybox, pos);
}
