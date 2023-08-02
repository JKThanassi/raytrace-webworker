import {glMatrix, mat4, vec3, vec4} from 'gl-matrix';
import {GroupNode, InstanceType, Material, Model, NodeType} from './types';
import {makeMaterial} from './Utils';

const DNA_RADIUS = 200;
const LAYER_SEPARATION = 75;
const NUM_BASE_PAIR_LAYERS = 19;
const DEGREES_PER_LAYER = 30;
const C_COLOR = makeMaterial(vec4.fromValues(1, .5, 0, 1), 1, 50);
const A_COLOR = makeMaterial(vec4.fromValues(1, 1, .1, 1), 1, 50);
const G_COLOR = makeMaterial(vec4.fromValues(1, .10, .10, 1), 1, 50);
const T_COLOR = makeMaterial(vec4.fromValues(.10, 1, .10, 1), 1, 50);
const CAP_COLOR = makeMaterial(vec4.fromValues(.0, .10, 1, 1), 1, 50);
const CONNECTOR_COLOR = makeMaterial(vec4.fromValues(0.22, 0, 0.42, 1), 1, 50);
const BASE_COLOR = makeMaterial(vec4.fromValues(92 / 255, 64 / 255, 51 / 255, 1), 1, 50);

const WOOD_TEXTURE = "./textures/wood.png";


// const TEST: LeafNode = { name: "TEST", instance: InstanceType.SPHERE, color: makeMavec4.fromValues(1, 0, 1, 1) };

/**
 * Generates the {@link GroupNode} for an end-cap of the base pair for the DNA strand.
 * This also includes the connection to the next end-cap.
 *
 * @param name The name (to indicate which cap it is, right vs. left) to pass into the JSON
 * structure for the group node.
 */
const generateCap = (name: string): GroupNode => {
    const endCap = {name: "End Cap", instance: InstanceType.SPHERE, material: CAP_COLOR};
    const endCapTransform = mat4.create();
    mat4.rotateY(endCapTransform, endCapTransform, glMatrix.toRadian(90));
    mat4.scale(endCapTransform, endCapTransform, vec3.fromValues(75, 75, 75));
    const connector = {name: 'DNA Connector', instance: InstanceType.CYLINDER, material: CONNECTOR_COLOR};
    const connectorMat = mat4.create();
    // Circle geometry math to calculate exactly where the next end-cap is.
    const half_theta = Math.PI * DEGREES_PER_LAYER / 360;
    const d = 2 * DNA_RADIUS * Math.sin(half_theta);
    // Curr Vec indicates where the cylinder is currently pointing.
    const currVec = vec3.fromValues(0, 0, -100);
    // Next Vector indicates where the next end cap is w.r.t this coordinate space.
    const nextVec = vec3.fromValues(-d * Math.sin(half_theta), LAYER_SEPARATION, -d * Math.cos(half_theta));
    // Find the cross product to know around which axis to go
    const crossVec = vec3.cross(vec3.create(), vec3.normalize(vec3.create(), currVec), vec3.normalize(vec3.create(), nextVec));
    // Find the dot product to know the distance between the two vectors and thus how far to rotate.
    const dot: number = vec3.dot(vec3.normalize(vec3.create(), currVec), vec3.normalize(vec3.create(), nextVec));
    const theta = Math.acos(dot);
    mat4.rotate(connectorMat, connectorMat, theta, crossVec);
    mat4.translate(connectorMat, connectorMat, vec3.fromValues(0, 0, -50));
    mat4.scale(connectorMat, connectorMat, vec3.fromValues(25, 25, 100));
    const testMat = mat4.create();
    mat4.translate(testMat, testMat, vec3.fromValues(100 * crossVec[0], 100 * crossVec[1], 100 * crossVec[2]));
    mat4.scale(testMat, testMat, vec3.fromValues(25, 25, 25));

    return {
        name: `Cap ${name}`,
        edges: [{
            to: endCap, toType: NodeType.LEAF_NODE, transformation: endCapTransform
        }, {
            to: connector, toType: NodeType.LEAF_NODE, transformation: connectorMat,
        }],
    }
};

/**
 * Generates the {@link GroupNode} for a base pair of the DNA strand. Uses parameters to decide
 * the color pattern for the bases.
 */
const generateBasePair = (baseColorL: Material, baseColorR: Material): GroupNode => {
    const pairLLeaf = {name: "Pair L Leaf", instance: InstanceType.CYLINDER, material: baseColorL};
    const pairLBaseMat = mat4.create();
    mat4.translate(pairLBaseMat, pairLBaseMat, vec3.fromValues(100, -680, 0))
    mat4.rotateY(pairLBaseMat, pairLBaseMat, glMatrix.toRadian(90))
    mat4.scale(pairLBaseMat, pairLBaseMat, vec3.fromValues(50, 50, 200));

    const pairRLeaf = {name: "Pair R Leaf", instance: InstanceType.CYLINDER, material: baseColorR};
    const pairRBaseMat = mat4.create();
    mat4.translate(pairRBaseMat, pairRBaseMat, vec3.fromValues(-100, -680, 0))
    mat4.rotateY(pairRBaseMat, pairRBaseMat, glMatrix.toRadian(90))
    mat4.scale(pairRBaseMat, pairRBaseMat, vec3.fromValues(50, 50, 200));

    const endcapLBaseMat = mat4.create();
    mat4.rotateY(endcapLBaseMat, endcapLBaseMat, Math.PI);
    mat4.translate(endcapLBaseMat, endcapLBaseMat, vec3.fromValues(200, -680, 0))

    const endcapRBaseMat = mat4.create();
    mat4.translate(endcapRBaseMat, endcapRBaseMat, vec3.fromValues(200, -680, 0))

    const pairLEdge = {to: pairLLeaf, toType: NodeType.LEAF_NODE, transformation: pairLBaseMat}
    const pairREdge = {to: pairRLeaf, toType: NodeType.LEAF_NODE, transformation: pairRBaseMat}
    const capLEdge = {to: generateCap('L'), toType: NodeType.GROUP_NODE, transformation: endcapLBaseMat}
    const capREdge = {to: generateCap('R'), toType: NodeType.GROUP_NODE, transformation: endcapRBaseMat}

    return {name: "Pair", edges: [pairLEdge, pairREdge, capLEdge, capREdge]}
}

/**
 * Generates the {@link GroupNode} for the entire DNA strand with a randomized list of base pairs.
 */
export const generateStrand = (): GroupNode => {
    const strandGroup = {name: "Strand", edges: []};
    const basePairAT = generateBasePair(A_COLOR, T_COLOR);
    const basePairCG = generateBasePair(C_COLOR, G_COLOR);
    for (let i = 0; i < NUM_BASE_PAIR_LAYERS; i++) {
        const translate = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, LAYER_SEPARATION * i, 0));
        mat4.rotateY(translate, translate, glMatrix.toRadian(i * DEGREES_PER_LAYER));
        const edge = {
            to: Math.random() > .5 ? basePairAT : basePairCG,
            toType: NodeType.GROUP_NODE,
            transformation: translate
        }
        strandGroup.edges.push(edge);
    }
    return strandGroup
};

/**
 * Generates the {@link GroupNode} for the case containing the DNA strand.
 */
const generateBase = (): GroupNode => {
    const plateBaseMat = mat4.create();
    mat4.translate(plateBaseMat, plateBaseMat, vec3.fromValues(0, -750, 0))
    mat4.scale(plateBaseMat, plateBaseMat, vec3.fromValues(450, 10, 450));

    const plateTopMat = mat4.create();
    mat4.translate(plateTopMat, plateTopMat, vec3.fromValues(0, 750, 0))
    mat4.scale(plateTopMat, plateTopMat, vec3.fromValues(450, 10, 450));

    const columnFRMat = mat4.create();
    mat4.translate(columnFRMat, columnFRMat, vec3.fromValues(200, 0, 200))
    mat4.scale(columnFRMat, columnFRMat, vec3.fromValues(10, 1500, 10))

    const columnFLMat = mat4.create();
    mat4.translate(columnFLMat, columnFLMat, vec3.fromValues(-200, 0, 200))
    mat4.scale(columnFLMat, columnFLMat, vec3.fromValues(10, 1500, 10))

    const columnBRMat = mat4.create();
    mat4.translate(columnBRMat, columnBRMat, vec3.fromValues(200, 0, -200))
    mat4.scale(columnBRMat, columnBRMat, vec3.fromValues(10, 1500, 10))

    const columnBLMat = mat4.create();
    mat4.translate(columnBLMat, columnBLMat, vec3.fromValues(-200, 0, -200))
    mat4.scale(columnBLMat, columnBLMat, vec3.fromValues(10, 1500, 10))

    return {
        name: 'DNA Stand',
        edges: [{
            to: {name: 'Plate Base', instance: InstanceType.CUBE, material: BASE_COLOR, textureURL: WOOD_TEXTURE},
            toType: NodeType.LEAF_NODE,
            transformation: plateBaseMat,
        }, {
            to: {name: 'Plate Top', instance: InstanceType.CUBE, material: BASE_COLOR, textureURL: WOOD_TEXTURE},
            toType: NodeType.LEAF_NODE,
            transformation: plateTopMat,
        }, {
            to: {name: 'Column FR', instance: InstanceType.CUBE, material: BASE_COLOR, textureURL: WOOD_TEXTURE},
            toType: NodeType.LEAF_NODE,
            transformation: columnFRMat,
        }, {
            to: {name: 'Column FL', instance: InstanceType.CUBE, material: BASE_COLOR, textureURL: WOOD_TEXTURE},
            toType: NodeType.LEAF_NODE,
            transformation: columnFLMat,
        }, {
            to: {name: 'Column BL', instance: InstanceType.CUBE, material: BASE_COLOR, textureURL: WOOD_TEXTURE},
            toType: NodeType.LEAF_NODE,
            transformation: columnBLMat,
        }, {
            to: {name: 'Column BR', instance: InstanceType.CUBE, material: BASE_COLOR, textureURL: WOOD_TEXTURE},
            toType: NodeType.LEAF_NODE,
            transformation: columnBRMat,
        }]
    };
};

/**
 * Generates the {@link GroupNode} for the entire DNA model, case and strand.
 */
export const generateDNA = (): GroupNode => {
    return {
        name: "DNA",
        edges: [{
            to: generateStrand(),
            toType: NodeType.GROUP_NODE,
        }, {
            to: generateBase(),
            toType: NodeType.GROUP_NODE
        }]
    };
};

/**
 * Generates the structure containing a list of instances for our DNA model
 * @returns A {@link Model} representing our DNA model to be drawn
 */
export const generateDNAModel = (): Model => {
    return {name: 'DNA Model', scene: generateDNA(), sceneNodeType: NodeType.GROUP_NODE};
};

