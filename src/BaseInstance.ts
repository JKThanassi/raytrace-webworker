import {BaseInstance, InstanceType} from './types';

const VERTEX_ARRAY_WIDTH = 8; // How many floats are sent per vertex

const CYLINDER_TOP_POINTS = 60;
const SPHERE_CIRCLE_POINTS = 60;
const SPHERE_NUM_SLICES = 60;
const FAN_RADIUS_RATIO = 3; // Bigger Circle radius : Smaller Circle Radius
const FAN_BASE_LENGTH = 4;

const generateBaseInstance = (
    gl: WebGLRenderingContext,
    instance: InstanceType,
    vertices: number[],
    indices: number[]): BaseInstance => {
    // Instantiate the buffers
    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        id: instance,
        vbo,
        ibo,
        numVertices: vertices.length / VERTEX_ARRAY_WIDTH,
        numIndices: indices.length
    };
}

const getCubeVerticesAndIndices = (): { vertices: number[], indices: number[] } => {
    const vertices: number[] = [];
    const indices: number[] = [];

    /*
    Looking as if x,y is 2d and z coming out.

    (-0.5, -0.5, 0.5) Front (z) BL
    (0.5, -0.5, 0.5) Front (z) BR
    (0.5, 0.5, 0.5) Front (z) TR
    (-0.5, 0.5, 0.5) Front (z) TL
    (-0.5, -0.5, -0.5) Back (z) BL
    (0.5, -0.5, -0.5) Back (z) BR
    (0.5, 0.5, -0.5) Back (z) TR
    (-0.5, 0.5, -0.5) Back (z) TL
    */

    // radius length
    const r = 0.5;
    // let normal; // [x, y, z]
    // let textureCoords; // [(bl_x, bl_y, br_x, br_y, tr_x, tr_y, tl_x, tr_y)]
    const addFace = (faceCoords, normal, textureCoords) => {
        const first = vertices.length / VERTEX_ARRAY_WIDTH; // get the index to start
        vertices.push(faceCoords[0], faceCoords[1], faceCoords[2]); // BL
        vertices.push(...normal);
        vertices.push(textureCoords[0], textureCoords[1]);
        vertices.push(faceCoords[3], faceCoords[4], faceCoords[5]); // BR
        vertices.push(...normal);
        vertices.push(textureCoords[2], textureCoords[3]);
        vertices.push(faceCoords[6], faceCoords[7], faceCoords[8]); // TR
        vertices.push(...normal);
        vertices.push(textureCoords[4], textureCoords[5]);
        vertices.push(faceCoords[9], faceCoords[10], faceCoords[11]); // TL
        vertices.push(...normal);
        vertices.push(textureCoords[6], textureCoords[7]);
        indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
    };

    // Top
    addFace([
            -r, r, r,
            r, r, r,
            r, r, -r,
            -r, r, -r
        ],
        [0, 1, 0],
        [0.5, 0.5, 0.5, 0.75, 0.25, 0.75, 0.25, 0.5],
    );
    // Front
    addFace([
            -r, -r, r,
            r, -r, r,
            r, r, r,
            -r, r, r
        ],
        [0, 0, 1],
        [0.75, 0.5, 0.75, 0.75, 0.5, 0.75, 0.5, 0.5],
    );
    // Right
    addFace([
            r, -r, r,
            r, -r, -r,
            r, r, -r,
            r, r, r
        ],
        [1, 0, 0],
        [0.5, 1, 0.25, 1, 0.25, 0.75, 0.5, 0.75],
    );
    // Back
    const backNormal = [0, 0, -1];
    addFace([
            r, -r, -r,
            -r, -r, -r,
            -r, r, -r,
            r, r, -r
        ],
        [0, 0, -1],
        [0, 0.75, 0, 0.5, 0.25, 0.5, 0.25, 0.75],
    );
    // Left
    addFace([
            -r, -r, -r,
            -r, -r, r,
            -r, r, r,
            -r, r, -r
        ],
        [-1, 0, 0],
        [0.25, 0.25, 0.5, 0.25, 0.5, 0.5, 0.25, 0.5],
    );
    // Bottom
    addFace([
            r, -r, -r,
            -r, -r, -r,
            -r, -r, r,
            r, -r, r
        ],
        [0, -1, 0],
        [1, 0.5, 1, 0.75, 0.75, 0.75, 0.75, 0.5],
    );

    return {vertices, indices};
};

/**
 * This function generates a unit cube centered at the origin. Tis means the the largest value for a particular axis
 * will be |.5|
 *
 * @param gl the {@link WebGLRenderingContext} to create the instance within
 * @returns a {@link BaseInstance} containing the newly generated cube instance
 */
export const generateCubeInstance = (gl: WebGLRenderingContext): BaseInstance => {
    const {vertices, indices} = getCubeVerticesAndIndices();

    return generateBaseInstance(gl, InstanceType.CUBE, vertices, indices);
}

/**
 * This function generates a unit room centered at the origin. Tis means the the largest value for a particular axis
 * will be |.5|. A room is basically an inverted box, so that we want to see the inside of the base instance.
 *
 * @param gl the {@link WebGLRenderingContext} to create the instance within
 * @returns a {@link BaseInstance} containing the newly generated room instance
 */
export const generateRoomInstance = (gl: WebGLRenderingContext): BaseInstance => {
    let {vertices, indices} = getCubeVerticesAndIndices();

    vertices = vertices.map<number>((v, i) => {
        const vertex_attr_i = i % VERTEX_ARRAY_WIDTH;
        return (vertex_attr_i >= 3 && vertex_attr_i <= 5) ? -v : v;
    });

    for (let i = 0; i < indices.length; i += 3) {
        const v = indices[i + 1];
        indices[i + 1] = indices[i];
        indices[i] = v;
    }

    return generateBaseInstance(gl, InstanceType.ROOM, vertices, indices);
}

/**
 * This function generates a cylinder centered at the origin. It is completely encompassed
 * within a unit cube, so it has a radius of 0.5 an a height of 1.
 *
 * @param gl the {@link WebGLRenderingContext} to create the instance within
 * @returns a {@link BaseInstance} containing the newly generated cube instance
 */
export const generateCylinderInstance = (gl: WebGLRenderingContext): BaseInstance => {
    // Top circle indices will be even, bottom odd
    const vertices = [];
    const indices = [];

    for (let i = 0; i <= CYLINDER_TOP_POINTS; i++) {
        const theta = 2 * Math.PI * i / CYLINDER_TOP_POINTS;
        const x = 0.5 * Math.cos(theta);
        const y = 0.5 * Math.sin(theta);
        // 6 vertices per circle point
        // top middle, top edge, side top edge, side bottom edge, bottom edge, bottom middle
        vertices.push(0, 0, 0.5); vertices.push(0, 0, 1); vertices.push(i / CYLINDER_TOP_POINTS, 1);
        vertices.push(x, y, 0.5); vertices.push(0, 0, 1); vertices.push(i / CYLINDER_TOP_POINTS, 0.75);
        vertices.push(x, y, 0.5); vertices.push(x, y, 0); vertices.push(i / CYLINDER_TOP_POINTS, 0.75);
        vertices.push(x, y, -0.5); vertices.push(x, y, 0); vertices.push(i / CYLINDER_TOP_POINTS, 0.25);
        vertices.push(x, y, -0.5); vertices.push(0, 0, -1); vertices.push(i / CYLINDER_TOP_POINTS, 0.25);
        vertices.push(0, 0, -0.5); vertices.push(0, 0, -1); vertices.push(i / CYLINDER_TOP_POINTS, 0);
        if (i < CYLINDER_TOP_POINTS) {
            // 3 parallelograms: top, side, bottom
            const topIndex = i * 6;
            const topSideIndex = topIndex + 1;
            const nextTopIndex = topIndex + 6;
            const nextTopSideIndex = topSideIndex + 6;
            indices.push(topSideIndex, nextTopIndex, topIndex);
            indices.push(topSideIndex, nextTopSideIndex, nextTopIndex);
            const sideTopIndex = topIndex + 2;
            const sideBottomIndex = topIndex + 3;
            const nextSideTopIndex = sideTopIndex + 6;
            const nextSideBottomIndex = sideBottomIndex + 6;
            indices.push(sideBottomIndex, nextSideTopIndex, sideTopIndex);
            indices.push(sideBottomIndex, nextSideBottomIndex, nextSideTopIndex);
            const bottomSideIndex = topIndex + 4;
            const bottomIndex = topIndex + 5;
            const nextBottomSideIndex = bottomSideIndex + 6;
            const nextBottomIndex = bottomIndex + 6;
            indices.push(nextBottomSideIndex, bottomIndex, nextBottomIndex);
            indices.push(nextBottomSideIndex, bottomSideIndex, bottomIndex);
        }
    }

    return generateBaseInstance(gl, InstanceType.CYLINDER, vertices, indices);
}

/**
 * This function generates a unit sphere centered at the origin. This means that the points
 * intersecting the x, y, and z axes are at most |.5|.
 *
 * @returns a {@link BaseInstance} containing the instance with the unit circle
 * @param gl the {@link WebGLRenderingContext} we want to create the sphere within
 */
export const generateSphereInstance = (gl: WebGLRenderingContext): BaseInstance => {
    const r = 0.5;
    const vertices = [];
    const indices = [];
    for (let s = 0; s <= SPHERE_NUM_SLICES; s++) {
        const fi = Math.PI * s / SPHERE_NUM_SLICES;
        const z = 0.5 * Math.cos(fi);
        // const z = 0.5 - (s / SPHERE_NUM_SLICES);
        const sliceR = Math.sqrt(r * r - z * z); // radius of the slice
        const circleFirstPoint = (SPHERE_CIRCLE_POINTS + 1) * s;
        const nextCircleFirstPoint = circleFirstPoint + SPHERE_CIRCLE_POINTS + 1;
        for (let i = 0; i <= SPHERE_CIRCLE_POINTS; i++) {
            const theta = 2 * Math.PI * i / SPHERE_CIRCLE_POINTS;
            const x = sliceR * Math.cos(theta);
            const y = sliceR * Math.sin(theta);
            vertices.push(x, y, z); // position
            vertices.push(2 * x, 2 * y, 2 * z); // normal
            vertices.push(i / SPHERE_CIRCLE_POINTS, 1 - (s / SPHERE_NUM_SLICES));

            if (i !== SPHERE_CIRCLE_POINTS && s !== SPHERE_NUM_SLICES) {
                const point = i;
                const nextPoint = i + 1;
                const circlePoint = circleFirstPoint + point;
                const circleNextPoint = circleFirstPoint + nextPoint;
                const nextCirclePoint = nextCircleFirstPoint + point;
                const nextCircleNextPoint = nextCircleFirstPoint + nextPoint;

                indices.push(circlePoint, nextCirclePoint, circleNextPoint);
                indices.push(nextCirclePoint, nextCircleNextPoint, circleNextPoint);
            }
        }
    }

    return generateBaseInstance(gl, InstanceType.SPHERE, vertices, indices);
};

/**
 * This function generates a unit semi-sphere centered at the origin. This is like the
 * sphere instance, except it doesn't go past z = 0 (stays at z >= 0).
 *
 * @returns a {@link BaseInstance} containing the instance with the unit circle
 * @param gl the {@link WebGLRenderingContext} we want to create the sphere within
 */
export const generateSemisphereInstance = (gl: WebGLRenderingContext): BaseInstance => {
    const r = 0.5;
    const vertices = [];
    const indices = [];
    for (let s = 0; s <= (SPHERE_NUM_SLICES / 2); s++) {
        const fi = Math.PI * s / SPHERE_NUM_SLICES;
        const z = 0.5 * Math.cos(fi);
        // const z = 0.5 - (s / SPHERE_NUM_SLICES);
        const isLastLoop = ((s + 1) > (SPHERE_NUM_SLICES / 2));
        const sliceR = isLastLoop ? 0 : Math.sqrt(r * r - z * z); // radius of the slice
        const circleFirstPoint = (SPHERE_CIRCLE_POINTS + 1) * s;
        const nextCircleFirstPoint = circleFirstPoint + SPHERE_CIRCLE_POINTS + 1;
        for (let i = 0; i <= SPHERE_CIRCLE_POINTS; i++) {
            const theta = 2 * Math.PI * i / SPHERE_CIRCLE_POINTS;
            const x = sliceR * Math.cos(theta);
            const y = sliceR * Math.sin(theta);
            vertices.push(x, y, z); // position
            if (isLastLoop) {
                vertices.push(0, 0, -1); // normal
                vertices.push(i / SPHERE_CIRCLE_POINTS, 0);
            } else {
                vertices.push(2 * x, 2 * y, 2 * z); // normal
                vertices.push(i / SPHERE_CIRCLE_POINTS, 1 - (s / SPHERE_NUM_SLICES));
            }
            // vertices.push(theta / (2 * Math.PI), fi / Math.PI);

            if (i !== SPHERE_CIRCLE_POINTS && (s + 1) <= (SPHERE_NUM_SLICES / 2)) {
                const point = i;
                const nextPoint = i + 1;
                const circlePoint = circleFirstPoint + point;
                const circleNextPoint = circleFirstPoint + nextPoint;
                const nextCirclePoint = nextCircleFirstPoint + point;
                const nextCircleNextPoint = nextCircleFirstPoint + nextPoint;

                indices.push(circlePoint, nextCirclePoint, circleNextPoint);
                indices.push(nextCirclePoint, nextCircleNextPoint, circleNextPoint);
            }
        }
    }

    return generateBaseInstance(gl, InstanceType.SEMI_SPHERE, vertices, indices);
};

/**
 * This function creates a complex fan shape that looks like a smaller and a larger
 * circle connected at their furthest points. It is completely bounded within a
 *
 * @returns a {@link BaseInstance} containing the instance with the fan shape.
 * @param gl the {@link WebGLRenderingContext} we want to create the fan within
 */
export const generateFanInstance = (gl: WebGLRenderingContext): BaseInstance => {

    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();

    const vertices = [];
    const indices = [];

    // These are the indices that are not part of the outside (so center of circles)
    let v;
    const outsideTopVertices = [];
    const outsideBottomVertices = [];

    const r_large: number = 0.5;
    const r_small: number = r_large / FAN_RADIUS_RATIO;
    // top fan face ==>


    const large_circle_x = FAN_BASE_LENGTH - r_large;
    const large_circle_theta = Math.acos(r_large / ((large_circle_x - r_small) * FAN_RADIUS_RATIO));
    const small_circle_theta = Math.PI - large_circle_theta;
    const small_circle_start_point = Math.round(SPHERE_CIRCLE_POINTS * small_circle_theta / (Math.PI * 2));
    const small_circle_end_point = Math.round(SPHERE_CIRCLE_POINTS * (Math.PI * 2 - small_circle_theta) / (Math.PI * 2));
    const large_circle_start_point = Math.round(SPHERE_CIRCLE_POINTS * ((large_circle_theta - Math.PI) / (Math.PI * 2)));
    const large_circle_end_point = Math.round(SPHERE_CIRCLE_POINTS * ((Math.PI - large_circle_theta) / (Math.PI * 2)));

    // Small semi circle
    const small_circle_index = (vertices.length / VERTEX_ARRAY_WIDTH);
    const small_circle_top = small_circle_index + 1;
    let small_circle_bottom: number = -1;
    vertices.push(r_small, 0, 0.5);
    vertices.push(0, 0, 1);
    vertices.push(r_small / FAN_BASE_LENGTH, 0.25);
    for (let i = small_circle_start_point; i <= small_circle_end_point; i++) {
        const theta = 2 * Math.PI * i / SPHERE_CIRCLE_POINTS;
        const x = r_small * Math.cos(theta);
        const y = r_small * Math.sin(theta);
        const pos = [x + r_small, y, 0.5];
        const normal = [0, 0, 1];
        const tc = [(x + r_small) / FAN_BASE_LENGTH, (y + 0.5) / 2];
        vertices.push(...pos, ...normal, ...tc);
        outsideTopVertices.push(...pos, ...[x, y, 0], ...tc);

        if ((i + 1) <= small_circle_end_point) {
            indices.push(small_circle_index, (vertices.length / VERTEX_ARRAY_WIDTH) - 1, (vertices.length / VERTEX_ARRAY_WIDTH));
        } else {
            small_circle_bottom = (vertices.length / VERTEX_ARRAY_WIDTH) - 1;
        }
    }

    // Large semi circle
    const large_circle_index = (vertices.length / VERTEX_ARRAY_WIDTH);
    const large_circle_bottom = large_circle_index + 1;
    let large_circle_top: number = -1;
    vertices.push(large_circle_x, 0, 0.5);
    vertices.push(0, 0, 1);
    vertices.push((large_circle_x) / FAN_BASE_LENGTH, 0.25);
    for (let i = large_circle_start_point; i <= large_circle_end_point; i++) {
        const theta = 2 * Math.PI * i / SPHERE_CIRCLE_POINTS;
        const x = r_large * Math.cos(theta);
        const y = r_large * Math.sin(theta);
        const pos = [x + large_circle_x, y, 0.5];
        const normal = [0, 0, 1];
        const tc = [(x + large_circle_x) / FAN_BASE_LENGTH, (y + 0.5) / 2];
        vertices.push(...pos, ...normal, ...tc);
        outsideTopVertices.push(...pos, ...[x, y, 0], ...tc);

        if ((i + 1) <= large_circle_end_point) {
            indices.push(large_circle_index, (vertices.length / VERTEX_ARRAY_WIDTH) - 1, (vertices.length / VERTEX_ARRAY_WIDTH));
        } else {
            large_circle_top = (vertices.length / VERTEX_ARRAY_WIDTH) - 1;
        }
    }

    // Triangles connecting the semicircles
    indices.push(small_circle_top, small_circle_bottom, large_circle_bottom);
    indices.push(large_circle_bottom, large_circle_top, small_circle_top);

    // Fill in last bits
    indices.push(large_circle_bottom, large_circle_index, large_circle_top);

    const offset = (vertices.length / VERTEX_ARRAY_WIDTH);

    // bottom fan face ==>
    // Small semi circle
    const bottom_small_circle_index = (vertices.length / VERTEX_ARRAY_WIDTH);
    const bottom_small_circle_top = bottom_small_circle_index + 1;
    let bottom_small_circle_bottom: number = -1;
    vertices.push(r_small, 0, -0.5);
    vertices.push(0, 0, -1);
    vertices.push(r_small / FAN_BASE_LENGTH, 0.75);
    for (let i = small_circle_start_point; i <= small_circle_end_point; i++) {
        const theta = 2 * Math.PI * i / SPHERE_CIRCLE_POINTS;
        const x = r_small * Math.cos(theta);
        const y = r_small * Math.sin(theta);
        const pos = [x + r_small, y, -0.5];
        const normal = [0, 0, -1];
        const tc = [(x + r_small) / FAN_BASE_LENGTH, (y + 1.5) / 2];
        vertices.push(...pos, ...normal, ...tc);
        outsideBottomVertices.push(...pos, ...[x, y, 0], ...tc);

        if ((i + 1) <= small_circle_end_point) {
            indices.push(bottom_small_circle_index, (vertices.length / VERTEX_ARRAY_WIDTH), (vertices.length / VERTEX_ARRAY_WIDTH) - 1);
        } else {
            bottom_small_circle_bottom = (vertices.length / VERTEX_ARRAY_WIDTH) - 1;
        }
    }

    // Large semi circle
    const bottom_large_circle_index = (vertices.length / VERTEX_ARRAY_WIDTH);
    const bottom_large_circle_bottom = bottom_large_circle_index + 1;
    let bottom_large_circle_top: number = -1;
    vertices.push(large_circle_x, 0, -0.5);
    vertices.push(0, 0, -1);
    vertices.push(large_circle_x / FAN_BASE_LENGTH, 0.75);
    for (let i = large_circle_start_point; i <= large_circle_end_point; i++) {
        const theta = 2 * Math.PI * i / SPHERE_CIRCLE_POINTS;
        const x = r_large * Math.cos(theta);
        const y = r_large * Math.sin(theta);
        const pos = [x + large_circle_x, y, -0.5];
        const normal = [0, 0, -1];
        const tc = [(x + large_circle_x) / FAN_BASE_LENGTH, (y + 1.5) / 2];
        vertices.push(...pos, ...normal, ...tc);
        outsideBottomVertices.push(...pos, ...[x, y, 0], ...tc);

        if ((i + 1) <= large_circle_end_point) {
            indices.push(bottom_large_circle_index, (vertices.length / VERTEX_ARRAY_WIDTH), (vertices.length / VERTEX_ARRAY_WIDTH) - 1);
        } else {
            bottom_large_circle_top = (vertices.length / VERTEX_ARRAY_WIDTH) - 1;
        }
    }

    // Triangles connecting the semicircles
    indices.push(bottom_small_circle_top, bottom_large_circle_bottom, bottom_small_circle_bottom);
    indices.push(bottom_large_circle_bottom, bottom_small_circle_top, bottom_large_circle_top);

    // Fill in last bits
    indices.push(bottom_large_circle_bottom, bottom_large_circle_top, bottom_large_circle_index);

    // Fill in middle using corresponding indices
    const pushAll = (a: number[], s: number, c: number) => {
        for (let i = s; i < s + c; i++) {
            vertices.push(a[i]);
        }
    }
    // Do the outside
    for (let i = 0; i <= outsideTopVertices.length; i += VERTEX_ARRAY_WIDTH) {
        if ((i + VERTEX_ARRAY_WIDTH) <= outsideTopVertices.length) {
            const topFirst = vertices.length / VERTEX_ARRAY_WIDTH;
            pushAll(outsideTopVertices, i, 8);
            const bottomFirst = vertices.length / VERTEX_ARRAY_WIDTH;
            pushAll(outsideBottomVertices, i, 8);
            const topNext = bottomFirst + 1;
            const bottomNext = topNext + 1;
            indices.push(topFirst, bottomFirst, bottomNext);
            indices.push(bottomNext, topNext, topFirst);
        } else {
            pushAll(outsideTopVertices, 0, 8);
            pushAll(outsideBottomVertices, 0, 8);
        }
    }

    return generateBaseInstance(gl, InstanceType.FAN, vertices, indices);
};

export const generateConeInstance = (gl: WebGLRenderingContext) => {
    const vertices = [];
    const indices = [];
    for (let s = 0; s <= SPHERE_NUM_SLICES; s++) {
        const z = (s / SPHERE_NUM_SLICES);
        const r = (s / (SPHERE_NUM_SLICES));
        // const z = 0.5 - (s / SPHERE_NUM_SLICES);
        // const isLastLoop = ((s + 1) > SPHERE_NUM_SLICES);
        // const sliceR = isLastLoop ? 0 : r; // radius of the slice
        const circleFirstPoint = (SPHERE_CIRCLE_POINTS + 1) * s;
        const nextCircleFirstPoint = circleFirstPoint + SPHERE_CIRCLE_POINTS + 1;
        for (let i = 0; i <= SPHERE_CIRCLE_POINTS; i++) {
            const theta = 2 * Math.PI * i / SPHERE_CIRCLE_POINTS;
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            vertices.push(x, y, z); // position
            if (r === 0) {
                vertices.push(0, 0, -1);
            } else {
                vertices.push(0.5 * x / r, 0.5 * y / r, -Math.sqrt(2) / 2); // normal
            }
            vertices.push(i / SPHERE_CIRCLE_POINTS, 1 - (0.5 * s / SPHERE_NUM_SLICES));

            if (i !== SPHERE_CIRCLE_POINTS && (s + 1) <= SPHERE_NUM_SLICES) {
                const point = i;
                const nextPoint = i + 1;
                const circlePoint = circleFirstPoint + point;
                const circleNextPoint = circleFirstPoint + nextPoint;
                const nextCirclePoint = nextCircleFirstPoint + point;
                const nextCircleNextPoint = nextCircleFirstPoint + nextPoint;

                indices.push(circlePoint, circleNextPoint, nextCirclePoint);
                indices.push(nextCirclePoint, circleNextPoint, nextCircleNextPoint);
            }
        }
    }

    const capFirstIndex = vertices.length / VERTEX_ARRAY_WIDTH;
    for (let i = 0; i <= SPHERE_CIRCLE_POINTS; i++) {
        const theta = 2 * Math.PI * i / SPHERE_CIRCLE_POINTS;
        const x = Math.cos(theta);
        const y = Math.sin(theta);
        vertices.push(x, y, 1); // position
        vertices.push(0, 0, 1); // normal
        vertices.push(i / SPHERE_CIRCLE_POINTS, 0.5);
        vertices.push(0, 0, 1); // position
        vertices.push(0, 0, 1); // normal
        vertices.push(i / SPHERE_CIRCLE_POINTS, 1);
         if (i !== SPHERE_CIRCLE_POINTS) {
             const outerPoint = capFirstIndex + i * 2;
             const innerPoint = outerPoint + 1;
             const nextOuterpoint = innerPoint + 1;
             const nextInnerPoint = nextOuterpoint + 1;

             indices.push(outerPoint, nextInnerPoint, innerPoint);
             indices.push(outerPoint, nextOuterpoint, nextInnerPoint);
         }
    }

    return generateBaseInstance(gl, InstanceType.CONE, vertices, indices);
};
