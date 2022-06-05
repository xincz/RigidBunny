function getCrossMatrix(vec) {
    var matrix = new THREE.Matrix4();
    matrix.set(
        0, -vec.z, vec.y, 0,
        vec.z, 0, -vec.x, 0,
        -vec.y, vec.x, 0, 0,
        0, 0, 0, 1);  // but result in column major
    return matrix.transpose();
}

function matrixSubtraction(mat1, mat2) {
    // console.log(mat2);
    var result = new THREE.Matrix4();
    var elements = new Array(16);
    for (var i=0; i<16; i++) {
        elements[i] = mat1.elements[i] - mat2.elements[i];
    }
    result.set(
        elements[0], elements[1], elements[2], 0,
        elements[4], elements[5], elements[6], 0,
        elements[8], elements[9], elements[10], 0,
        0, 0, 0, 1,
    );
    return result.transpose();
    // return result;  // TODO: check transpose
}

// function matrixVectorMultiply(mat4, vec3) {
//     mat4 = mat4.transpose();
//     let x = new THREE.Vector3(mat4.elements[0], mat4.elements[1], mat4.elements[2]).dot(vec3);
//     console.log(mat4.elements[0], mat4.elements[1], mat4.elements[2], vec3);
//     let y = new THREE.Vector3(mat4.elements[4], mat4.elements[5], mat4.elements[6]).dot(vec3);
//     console.log(y);
//     let z = new THREE.Vector3(mat4.elements[8], mat4.elements[9], mat4.elements[10]).dot(vec3);
//     console.log(z);
//     return new THREE.Vector3(x, y, z);
// }

class RigidBody {
    constructor(mesh) {  // pass by reference
        this.v = new THREE.Vector3(0, 0, 0);
        this.w = new THREE.Vector3(0, 0, 0);  // angular velocity
        this.dt = 0.030;
        this.launched = false;

        this.mass = 0;
        this.Iref = new THREE.Matrix4();

        this.linearDecay = 0.988;
        this.angularDecay = 0.95;
        this.restitution = 0.2;
        this.muT = 0.2;

        // this.mesh = mesh.clone();
        this.mesh = mesh;  // 这才是真正的同一个对象！

        this.start();
    }

    start() {
        let m = 1;  // unit mass

        // Position of faces in the mesh
        let position = this.mesh.children[0].geometry.attributes.position;
        console.log(position.array[0])
        let vertices = new Array(position.count);  // There are duplicates!
        for (let i=0; i<position.count; i++) {
            this.mass += m;
            vertices[i] = new THREE.Vector3(
                position.array[i*3], position.array[i*3+1], position.array[i*3+2]);
        }
        this.vertices = vertices;

        // Compute Inertia matrix
        for (let i=0; i<vertices.length; i++) {  // TODO: change to XYZ?
            let diag = m*vertices[i].length()*vertices[i].length();
            this.Iref.elements[0*4+0] += diag;  // beware of transpose
            this.Iref.elements[1*4+1] += diag;
            this.Iref.elements[2*4+2] += diag;
            this.Iref.elements[0*4+0] -= m*vertices[i].x*vertices[i].x;
            this.Iref.elements[0*4+1] -= m*vertices[i].x*vertices[i].y;
            this.Iref.elements[0*4+2] -= m*vertices[i].x*vertices[i].z;
            this.Iref.elements[1*4+0] -= m*vertices[i].y*vertices[i].x;
            this.Iref.elements[1*4+1] -= m*vertices[i].y*vertices[i].y;
            this.Iref.elements[1*4+2] -= m*vertices[i].y*vertices[i].z;
            this.Iref.elements[2*4+0] -= m*vertices[i].z*vertices[i].x;
            this.Iref.elements[2*4+1] -= m*vertices[i].z*vertices[i].y;
            this.Iref.elements[2*4+2] -= m*vertices[i].z*vertices[i].z;
        }
        this.Iref.elements[3*4+3] = 1;
        this.Iref = this.Iref.transpose();  // TODO: check transpose
    }

    CollisionImpulse(P, N) {
        let x = this.mesh.position.clone();  // 0 3 0
        let rot = this.mesh.rotation.clone();
        let q = new THREE.Quaternion().setFromEuler(rot);
        let R = new THREE.Matrix4().makeRotationFromQuaternion(q);
        let I = R.clone().multiply(this.Iref.clone().multiply(R.clone().transpose()));
        this.R = R;

        let sum = 0;
        let averagePosition = new THREE.Vector3(0, 0, 0);

        for (let i=0; i<this.vertices.length; i++) {
            // Calculate position and velocity of each mesh vertex
            let ri = this.vertices[i].clone();  // correct values
            let Rri = ri.clone().applyMatrix4(R);
            let xi = x.clone().add(Rri);
            let vi = this.v.clone().add(this.w.clone().cross(Rri));

            // Determine collision with the plane <P, N>
            let dist = xi.clone().sub(P).dot(N);
            if (dist >= 0 || vi.clone().dot(N) >= 0) continue;

            // Sum and average
            sum += 1;
            averagePosition = averagePosition.clone().multiplyScalar(1 - 1/sum).add(xi.clone().multiplyScalar(1/sum));
        }

        if (sum == 0) {
            // console.log("no collision");
            return;  // no collision
        }
        // console.log("sum", sum);
        // console.log("There is collision!");

        /* Otherwise, collision happens! */
        // Impulse method (for the average colliding position)
        let RriAvg = averagePosition.clone().sub(x);
        let RriStar = getCrossMatrix(RriAvg);  // TODO: check this!
        let viAvg = this.v.clone().add(this.w.clone().cross(RriAvg));

		// Calculate new vi
        let vi_n = N.clone().multiplyScalar(viAvg.clone().dot(N));
        let vi_t = viAvg.clone().sub(vi_n);
        let a = Math.max(0, 1-this.muT*(1+this.restitution)*vi_n.length()/(vi_t.length()+0.000001));
        
        vi_n = vi_n.multiplyScalar(-this.restitution);  // vi_n_new
        vi_t = vi_t.multiplyScalar(a);             // vi_t_new
        let vi_new = vi_n.clone().add(vi_t);

        // Calculate impulse j
        let K = new THREE.Matrix4();
        K = K.makeScale(1/this.mass, 1/this.mass, 1/this.mass);

        let arg2 = RriStar.clone().multiply(this.Iref.getInverse(this.Iref).clone().multiply(RriStar));
        K = matrixSubtraction(K, arg2);
        let viDiff = new THREE.Vector4(vi_new.x-viAvg.x, vi_new.y-viAvg.y, vi_new.z-viAvg.z, 0);
        viDiff = viDiff.applyMatrix4(K.getInverse(K));
        let j = new THREE.Vector3(viDiff.x, viDiff.y, viDiff.z);

        // console.log("j", j.length());
        if (j.length() < 400000) this.restitution *= 0.9;

        // Update v and w
        this.v = this.v.add(j.clone().multiplyScalar(1/this.mass));
        viDiff = viDiff.applyMatrix4(RriStar).applyMatrix4(I.getInverse(I));
        this.w = this.w.sub(new THREE.Vector3(viDiff.x, viDiff.y, viDiff.z));  //? why sub?
    }

    update() {
        if (keyboard.pressed("R")) {
            console.log("reset position");
            this.mesh.position.set(0,2,1);
            this.restitution = 0.2;
            this.muT = 0.2;
            this.v.set(0,0,0);
            this.launched = false;
        }
        if (keyboard.pressed("L")) {
            console.log("launched!");
            // this.v.set(0,0,0);
            this.v.set(0,2,-5);
            this.launched = true;
        }


        // Update velocity
        let g = new THREE.Vector3(0, -1, 0).multiplyScalar(10);  // gravity

        this.v = this.v.add(g.multiplyScalar(this.dt));
        this.v = this.v.multiplyScalar(this.linearDecay);
        this.w = this.w.multiplyScalar(this.angularDecay);

        // Collision Impulse
        this.CollisionImpulse(new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0, 1, 0));
        this.CollisionImpulse(new THREE.Vector3(0, 0, -2), new THREE.Vector3(0, 1/2, Math.sqrt(3)/2));


        // Update position & orientation
        let pos = this.mesh.position.clone();  // 复制了副本！
        pos = pos.add(this.v.clone().multiplyScalar(this.dt));
        let rot = this.mesh.rotation.clone();  // Euler
        let q = new THREE.Quaternion().setFromEuler(rot);
        let qt = new THREE.Quaternion(
            this.w.x * this.dt/2, this.w.y * this.dt/2, this.w.z * this.dt/2, 0);
        qt = qt.multiply(q);
        q = q.set(q.x + qt.x, q.y + qt.y, q.z + qt.z, q.w + qt.w);

        if (!this.launched) {
            this.v.set(0, 0, 0);
            pos = this.mesh.position.clone();
        }

        this.mesh.position.set(pos.x, pos.y, pos.z);
        this.mesh.rotation.setFromQuaternion(q);
    }
}
