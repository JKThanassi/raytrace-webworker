import {InstanceType, Model, NodeType} from './types';
import {generateDNA} from './DNA';
import {generateSnowGlobe} from './SnowGlobe';
import {makeMaterial} from "./Utils";
import {glMatrix, mat4, vec3, vec4} from 'gl-matrix';
import {generateQuadcopter} from './Quadcopter';

export const calculateQuadcopterTransformation = (): { transformation: mat4, animation: (t: number) => mat4 } => {
    return {
        transformation: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(-500, 0, 0)),
        animation: (t) => {
            const m = mat4.create();
            mat4.rotateY(m, m, glMatrix.toRadian(-3 * t));
            mat4.translate(m, m, [200, 0, 0]);
            return mat4.rotateY(m, m, glMatrix.toRadian(t))
        },
    };
}

export const generateCreativeModel = (): Model => ({
    name: "Assignment 8 Creative Model",
    viewSpaceLights: [{
        ambient: vec3.fromValues(.7, .7, .7),
        diffuse: vec3.fromValues(.7, .7, .7),
        specular: vec3.fromValues(.7, .7, .7),
        position: vec4.fromValues(10, 0, 100, 1),
        spotTarget: vec4.fromValues(0, -100, -300, 1),
        spotCutoff: Math.cos(glMatrix.toRadian(180))
    }],
    scene: {
        name: "Scene",
        edges: [{
            to: generateSnowGlobe(),
            toType: NodeType.GROUP_NODE,
            transformation: mat4.rotateY(mat4.create(), mat4.create(), glMatrix.toRadian(-40)),
        }, {
            to: {
                name: "Scene Room",
                instance: InstanceType.ROOM,
                material: makeMaterial(vec4.fromValues(0.8, 0.8, 0.8, 1), 1, 1000, 1, 0, 0, 0),
                textureEnable: false,
                textureURL: './textures/low-poly-grid.png'
            },
            toType: NodeType.LEAF_NODE,
            transformation: mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(4000, 4000, 4000)),
        }]
    },
    sceneNodeType: NodeType.GROUP_NODE,
});

/**
 * Generates the main scene for our assignment, with the DNA model and the Quadcopter model
 * side by side.
 */
export const generateSceneModel = (): Model => ({
    name: "Assignment 4 Model",
    viewSpaceLights: [{
        ambient: vec3.fromValues(.7, .7, .7),
        diffuse: vec3.fromValues(.7, .7, .7),
        specular: vec3.fromValues(.7, .7, .7),
        position: vec4.fromValues(10, 0, 100, 1),
        spotTarget: vec4.fromValues(0, -100, -300, 1),
        spotCutoff: Math.cos(glMatrix.toRadian(40))
    }],
    scene: {
        name: "Scene",
        edges: [{
            to: generateDNA(),
            toType: NodeType.GROUP_NODE,
            transformation: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(500, 0, 0)),
        }, {
            to: generateQuadcopter(),
            toType: NodeType.GROUP_NODE,
            ...calculateQuadcopterTransformation(),
        }, {
            to: {
                name: "Scene Room",
                instance: InstanceType.ROOM,
                material: makeMaterial(vec4.fromValues(0.6, 0.6, 0.6, 1), 1, 1000),
                // textureURL: "./textures/checkerboard-busy-box.png"
            },
            toType: NodeType.LEAF_NODE,
            transformation: mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(4000, 4000, 4000)),
        }]
    },
    sceneNodeType: NodeType.GROUP_NODE,
});

/**
 * Generates a test model. (Primarily used for testing out new {@link BaseInstance} objects.
 */
export const generateTestSceneModel = (): Model => ({
    name: "TEST Model",
    // viewSpaceLights: [{
    //     ambient: vec3.fromValues(.7, .7, .7),
    //     diffuse: vec3.fromValues(.7, .7, .7),
    //     specular: vec3.fromValues(.7, .7, .7),
    //     position: vec4.fromValues(10, 0, 0, 1),
    //     spotDirection: vec4.fromValues(10, 0, 100, 1),
    //     spotCutoff: Math.cos(glMatrix.toRadian(90))
    // }],
    scene: {
        name: "Test Scene",
        edges: [{
            to: {
                name: "circle",
                instance: InstanceType.CUBE,
                material: makeMaterial(vec4.fromValues(1, .5, 0, 1), .8, 50)
            },
            toType: NodeType.LEAF_NODE,
            transformation: mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(400, 400, 400)),
        }, {
            to: {
                name: "light", light: {
                    ambient: vec3.fromValues(.5, .5, .5),
                    diffuse: vec3.fromValues(.5, .5, .5),
                    specular: vec3.fromValues(.5, .5, .5),
                    position: vec4.fromValues(0, 0, 450, 1),
                    spotTarget: vec4.fromValues(0, 0, 0, 1),
                    spotCutoff: Math.cos(glMatrix.toRadian(10))
                }

            },
            toType: NodeType.LIGHT_LEAF_NODE,
            transformation: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 0, 0))
        },
            {
                to: {
                    name: "light", light: {
                        ambient: vec3.fromValues(.5, .5, .5),
                        diffuse: vec3.fromValues(.5, .5, .5),
                        specular: vec3.fromValues(.5, .5, .5),
                        position: vec4.fromValues(-200, 0, 450, 1),
                        spotTarget: vec4.fromValues(0, 0, 0, 1),
                        spotCutoff: Math.cos(glMatrix.toRadian(18))
                    }

         }, toType: NodeType.LIGHT_LEAF_NODE, transformation: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0,0,0))},
        ]
    },
    sceneNodeType: NodeType.GROUP_NODE,
});

export const generateSuperSimpleTestSceneModel = (): Model => ({
    name: "TEST Model",
    viewSpaceLights: [{
        ambient: vec3.fromValues(.7, .7, .7),
        diffuse: vec3.fromValues(.7, .7, .7),
        specular: vec3.fromValues(.7, .7, .7),
        position: vec4.fromValues(10, 0, 0, 1),
        spotTarget: vec4.fromValues(0, 0, 0, 1),
        spotCutoff: Math.cos(glMatrix.toRadian(180))
    }],
    scene: {
        name: "Test Scene",
        edges: [
            {
                to: {
                    name: "test shape",
                    instance: InstanceType.SPHERE,
                    // material: makeMaterial(vec4.fromValues(0.5, 1, .25, 1), .8, 50, 0.2, 0, 0.8, 1.1),
                    material: makeMaterial(vec4.fromValues(1, 0, 0, 1), .8, 50, 0.2, 0, 0.8, 20),
                    // textureURL: "./textures/earthmap.png",
                    // textureEnable: true
                },
                toType: NodeType.LEAF_NODE,
                transformation: mat4.rotateX(mat4.create(), mat4.translate(mat4.create(), mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(1000, 1000, 1000)), vec3.fromValues(0, 0, -0.55)), glMatrix.toRadian(0)),
            },
            {
                to: {
                    name: "test shape",
                    instance: InstanceType.CUBE,
                    material: makeMaterial(vec4.fromValues(0, 0, 1, 1), .8, 50, 1, 0, 0, 2),
                    // textureURL: "./textures/earthmap.png",
                    // textureEnable: true,
                },
                toType: NodeType.LEAF_NODE,
                transformation: mat4.rotateY(mat4.create(), mat4.translate(mat4.create(), mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(200, 200, 200)), vec3.fromValues(0, -0, -1)), glMatrix.toRadian(220)),
            },
            // {
            //     to: {
            //         name: "test shape",
            //         instance: InstanceType.CUBE,
            //         material: makeMaterial(vec4.fromValues(0, 1, 0, 1), .8, 50, 1, 0, 0, 10),
            //         // textureURL: "./textures/earthmap.png",
            //         // textureEnable: true,
            //     },
            //     toType: NodeType.LEAF_NODE,
            //     transformation: mat4.rotateY(mat4.create(), mat4.translate(mat4.create(), mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(200, 200, 200)), vec3.fromValues(0, -0, -1)), glMatrix.toRadian(220)),
            // },
            // {
            //     to: {
            //         name: "Scene Room",
            //           instance: InstanceType.ROOM,
            //           material: makeMaterial(vec4.fromValues(0.6, 0.6, 0.6, 1), 1, 1000, 0.5, 0.5),
            //         // textureURL: "./textures/checkerboard-busy-box.png"
            //     },
            //     toType: NodeType.LEAF_NODE,
            //       transformation: mat4.rotateY(mat4.create(), mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(2000, 2000, 2000)), glMatrix.toRadian(15)),
            // },
        ],
    },
sceneNodeType: NodeType.GROUP_NODE
});