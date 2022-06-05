#version 300 es

uniform vec3 cameraPosition;
out vec3 pos;

void main() {
    pos = position + cameraPosition;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
}
