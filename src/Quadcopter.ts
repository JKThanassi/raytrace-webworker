import {glMatrix, mat4, vec3, vec4} from 'gl-matrix';
import {Edge, GroupNode, InstanceType, LeafNode, Light, LightLeafNode, Model, NodeType} from './types';
import {makeMaterial} from './Utils';

const NUM_CAPS = 48;
const WHITE = makeMaterial(vec4.fromValues(1, 1, 1, 1), 1, 50);
const BLACK = makeMaterial(vec4.fromValues(0, 0, 0, 1), 1, 50);
const MAGENTA = makeMaterial(vec4.fromValues(1, 0, 1, 1), 1, 50);
const STEEL = makeMaterial(vec4.fromValues(80 / 255, 80 / 255, 80 / 255, 1), 1, 50);
const DARK_STEEL = makeMaterial(vec4.fromValues(30 / 255, 30 / 255, 30 / 255, 1), 1, 50);
const RED = makeMaterial(vec4.fromValues(1, 0, 0, 1), 1, 50);

const STEEL_TEXTURE = "./textures/steel.png";
const DARK_STEEL_TEXTURE = "./textures/dark-steel.jpg";

// Code to help test out where the origin of a coordinate space is
const origin: LeafNode = {name: "TESTORIGIN", instance: InstanceType.SPHERE, material: MAGENTA};

/**
 * Generates the {@link GroupNode} for a rotor cap and fan blades.
 */
const generateRotorTop = (): GroupNode => {
    const fanFL: LeafNode = {
        name: "Fan Front-Left",
        instance: InstanceType.FAN,
        material: STEEL,
        textureURL: STEEL_TEXTURE
    }; // FAN
    const fanTransformFL: mat4 = mat4.create();
    mat4.rotateY(fanTransformFL, fanTransformFL, glMatrix.toRadian(45));
    mat4.translate(fanTransformFL, fanTransformFL, vec3.fromValues(25, 25, 0));
    mat4.rotateX(fanTransformFL, fanTransformFL, glMatrix.toRadian(90));
    mat4.scale(fanTransformFL, fanTransformFL, vec3.fromValues(35, 75, 5));
    const fanFR: LeafNode = {
        name: "Fan Front-Right",
        instance: InstanceType.FAN,
        material: STEEL,
        textureURL: STEEL_TEXTURE
    }; // FAN
    const fanTransformFR: mat4 = mat4.create();
    mat4.rotateY(fanTransformFR, fanTransformFR, glMatrix.toRadian(135));
    mat4.translate(fanTransformFR, fanTransformFR, vec3.fromValues(25, 25, 0));
    mat4.rotateX(fanTransformFR, fanTransformFR, glMatrix.toRadian(90));
    mat4.scale(fanTransformFR, fanTransformFR, vec3.fromValues(35, 75, 5));
    const fanBR: LeafNode = {
        name: "Fan Back-Right",
        instance: InstanceType.FAN,
        material: STEEL,
        textureURL: STEEL_TEXTURE
    }; // FAN
    const fanTransformBR: mat4 = mat4.create();
    mat4.rotateY(fanTransformBR, fanTransformBR, glMatrix.toRadian(225));
    mat4.translate(fanTransformBR, fanTransformBR, vec3.fromValues(25, 25, 0));
    mat4.rotateX(fanTransformBR, fanTransformBR, glMatrix.toRadian(90));
    mat4.scale(fanTransformBR, fanTransformBR, vec3.fromValues(35, 75, 5));
    const fanBL: LeafNode = {
        name: "Fan Back-Left",
        instance: InstanceType.FAN,
        material: STEEL,
        textureURL: STEEL_TEXTURE
    }; // FAN
    const fanTransformBL: mat4 = mat4.create();
    mat4.rotateY(fanTransformBL, fanTransformBL, glMatrix.toRadian(315));
    mat4.translate(fanTransformBL, fanTransformBL, vec3.fromValues(25, 25, 0));
    mat4.rotateX(fanTransformBL, fanTransformBL, glMatrix.toRadian(90));
    mat4.scale(fanTransformBL, fanTransformBL, vec3.fromValues(35, 75, 5));
    const center: LeafNode = {
        name: "Center",
        instance: InstanceType.SEMI_SPHERE,
        material: BLACK,
        textureURL: DARK_STEEL_TEXTURE
    }; // SEMI
    const centerTransform = mat4.create();
    mat4.translate(centerTransform, centerTransform, vec3.fromValues(0, 25, 0));
    mat4.rotateX(centerTransform, centerTransform, glMatrix.toRadian(270));
    mat4.scale(centerTransform, centerTransform, vec3.fromValues(50, 50, 50));
    const centerLight: LeafNode = {name: "Center Light", instance: InstanceType.SEMI_SPHERE, material: RED}; // SEMI
    const centerLightTransform = mat4.create();
    const centerLightLightTransform = mat4.create();
    const centerSpotLight: Light = {
        ambient: vec3.fromValues(0, 0, 0),
        diffuse: vec3.fromValues(.7, 0.1, 0.1),
        specular: vec3.fromValues(.7, 0.1, 0.1),
        position: vec4.fromValues(0, 30, 0, 1),
        spotTarget: vec4.fromValues(0, 0, 0, 1),
        spotCutoff: Math.cos(glMatrix.toRadian(40))
    };
    const centerLightLeaf: LightLeafNode = {name: "center fan light", light: centerSpotLight};
    mat4.translate(centerLightLightTransform, centerLightLightTransform, vec3.fromValues(0, 48, 0));

    mat4.translate(centerLightTransform, centerLightTransform, vec3.fromValues(0, 48, 0));
    mat4.rotateX(centerLightTransform, centerLightTransform, glMatrix.toRadian(270));
    mat4.scale(centerLightTransform, centerLightTransform, vec3.fromValues(15, 15, 15));
    const fanAnimation = (time: number): mat4 => mat4.rotateY(mat4.create(), mat4.create(), glMatrix.toRadian(1 * time))
    //   const m = mat4.create();
    //   mat4.translate(centerLightTransform, centerLightTransform, vec3.fromValues(0, 48, 0));
    //   mat4.rotateX(centerLightTransform, centerLightTransform, glMatrix.toRadian(270));
    //   mat4.scale(centerLightTransform, centerLightTransform, vec3.fromValues(15, 15, 15));
    //   return m;
    // };
    return {
        name: "Rotor Top", edges: [{
            to: center, toType: NodeType.LEAF_NODE, transformation: centerTransform,
        }, {
            to: centerLight, toType: NodeType.LEAF_NODE, transformation: centerLightTransform,
        }, {
            to: centerLightLeaf, toType: NodeType.LIGHT_LEAF_NODE, transformation: centerLightLightTransform
        }, {
            to: fanFR, toType: NodeType.LEAF_NODE, transformation: fanTransformFR
        }, {
            to: fanFL, toType: NodeType.LEAF_NODE, transformation: fanTransformFL
        }, {
            to: fanBL, toType: NodeType.LEAF_NODE, transformation: fanTransformBL
        }, {
            to: fanBR, toType: NodeType.LEAF_NODE, transformation: fanTransformBR
        }]
    };
};

/**
 * Generates the {@link GroupNode} for an entire rotor base and top.
 */
const generateRotor = (): GroupNode => {
    const base = {name: "Rotor Base", instance: InstanceType.CYLINDER, material: BLACK, textureURL: DARK_STEEL_TEXTURE}; // CYL
    const baseTransform = mat4.create();
    mat4.scale(baseTransform, baseTransform, vec3.fromValues(50, 50, 50));
    mat4.rotateX(baseTransform, baseTransform, glMatrix.toRadian(90))
    const rotorTop = generateRotorTop();
    return {
        name: "Rotor", edges: [{
            to: base, toType: NodeType.LEAF_NODE, transformation: baseTransform,
        }, {
            to: rotorTop, toType: NodeType.GROUP_NODE,
            animation: (t) => mat4.rotateY(mat4.create(), mat4.create(), glMatrix.toRadian(20 * t))
        }]
    };
};

/**
 * Generates the {@link GroupNode} for an arm structure of the quadcopter.
 */
const generateArm = (): GroupNode => {
    const armConnection = {
        name: "Arm Connector",
        instance: InstanceType.CYLINDER,
        material: DARK_STEEL,
        textureURL: DARK_STEEL_TEXTURE
    }; // CYL
    const armConnectionTransform: mat4 = mat4.create();
    mat4.rotateY(armConnectionTransform, armConnectionTransform, glMatrix.toRadian(90));
    mat4.translate(armConnectionTransform, armConnectionTransform, vec3.fromValues(0, 0, -100));
    mat4.scale(armConnectionTransform, armConnectionTransform, vec3.fromValues(25, 25, 200));
    const rotor = generateRotor();
    return {
        name: "Arm", edges: [{
            to: armConnection, toType: NodeType.LEAF_NODE, transformation: armConnectionTransform,
        }, {
            to: rotor, toType: NodeType.GROUP_NODE
        }]
    };
};

/**
 * Generates the {@link GroupNode} for the top structure of the quadcopter.
 */
const generateCap = (): GroupNode => {
    const edges: Edge[] = [];
    for (let i = 0; i < 6; i++) {
        const cap: LeafNode = {
            name: "Cap",
            instance: InstanceType.SEMI_SPHERE,
            material: (i % 2 === 0) ? STEEL : BLACK,
            textureURL: (i % 2 === 0) ? STEEL_TEXTURE : DARK_STEEL_TEXTURE
        }; // SEMI
        const capTransform = mat4.create();
        let size = 200;
        const capSize = size * (1 - (i / NUM_CAPS));
        mat4.translate(capTransform, capTransform, vec3.fromValues(0, size - capSize, 0));
        mat4.rotateX(capTransform, capTransform, glMatrix.toRadian(-90));
        mat4.scale(capTransform, capTransform, vec3.fromValues(capSize, capSize, capSize));
        edges.push({
            to: cap,
            toType: NodeType.LEAF_NODE,
            transformation: capTransform,
        });
    }

    return {
        name: "Cap",
        edges,
    };
};

/**
 * Generates the {@link GroupNode} for the body base and the cap of the quadcopter.
 */
const generateBody = (): GroupNode => {
    const base = {name: "Body Base", instance: InstanceType.CYLINDER, material: BLACK, textureURL: DARK_STEEL_TEXTURE}; // CYL
    const seeinLight: Light = {
        ambient: vec3.fromValues(.5, .5, .5),
        diffuse: vec3.fromValues(.5, .5, .5),
        position: vec4.fromValues(0, 0, 0, 1),
        specular: vec3.fromValues(.5, .5, .5),
        spotCutoff: Math.cos(glMatrix.toRadian(20)),
        spotTarget: vec4.fromValues(0, 0, -1, 1)
    }
    const baseTransform = mat4.create();
    mat4.scale(baseTransform, baseTransform, vec3.fromValues(200, 100, 200));
    mat4.rotateX(baseTransform, baseTransform, glMatrix.toRadian(90))

    const lightTransform = mat4.create();
    mat4.rotateY(lightTransform, lightTransform, glMatrix.toRadian(270))

    return {
        name: "Body",
        edges: [
            {to: base, toType: NodeType.LEAF_NODE, transformation: baseTransform},
            {to: generateCap(), toType: NodeType.GROUP_NODE},
            {
                to: {name: "front facing spotlight", light: seeinLight},
                toType: NodeType.LIGHT_LEAF_NODE,
                transformation: lightTransform
            },

        ]
    };
};

/**
 * Generates the {@link GroupNode} for the entire Quadcopter model.
 */
export const generateQuadcopter = (): GroupNode => {
    const armTransformBR: mat4 = mat4.create();
    mat4.rotateY(armTransformBR, armTransformBR, glMatrix.toRadian(45));
    mat4.translate(armTransformBR, armTransformBR, vec3.fromValues(300, 0, 0));
    const armTransformBL: mat4 = mat4.create();
    mat4.rotateY(armTransformBL, armTransformBL, glMatrix.toRadian(135));
    mat4.translate(armTransformBL, armTransformBL, vec3.fromValues(300, 0, 0));
    const armTransformFL: mat4 = mat4.create();
    mat4.rotateY(armTransformFL, armTransformFL, glMatrix.toRadian(225));
    mat4.translate(armTransformFL, armTransformFL, vec3.fromValues(300, 0, 0));
    const armTransformFR: mat4 = mat4.create();
    mat4.rotateY(armTransformFR, armTransformFR, glMatrix.toRadian(315));
    mat4.translate(armTransformFR, armTransformFR, vec3.fromValues(300, 0, 0));
    return {
        name: "Quadcopter", edges: [{
            to: generateBody(), toType: NodeType.GROUP_NODE
        }, {
            to: generateArm(), toType: NodeType.GROUP_NODE, transformation: armTransformFL
        }, {
            to: generateArm(), toType: NodeType.GROUP_NODE, transformation: armTransformFR
        }, {
            to: generateArm(), toType: NodeType.GROUP_NODE, transformation: armTransformBR
        }, {
            to: generateArm(), toType: NodeType.GROUP_NODE, transformation: armTransformBL
        }]
    };
};

export const generateQuadcopterModel = (): Model => {
    return {name: 'Quadcopter', scene: generateQuadcopter(), sceneNodeType: NodeType.GROUP_NODE};
}
