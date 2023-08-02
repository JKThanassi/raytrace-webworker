import {mat4, vec2, vec3, vec4} from 'gl-matrix';
import {TextureObject} from '%COMMON/TextureObject';
import {ShaderLocationsVault} from "%COMMON/ShaderLocationsVault";

/**
 * Ray tracer ray
 */
export type Ray = {
    position: vec4;
    direction: vec4;
}

export type ObjectHitRecord = {
    enterHitRecord: HitRecord | null;
    exitHitRecord: HitRecord | null;
};


export type FromRtWorkerMessage = {
    imageData: ImageData,
    yOffset: number,
}


export type ToRtWorkerMessage = {
    yOffset: number,
    origHeight: number,
    imageData: ImageData,
    cameraTheta: number,
    modelCache: ModelCacheObject[],
    lights: Light[]
}

/**
 * Exactly
 */
export type HitRecord = {
    t: number;
    hitPoint: vec4; // view coordinates
    hitNormal: vec4;
    hitTextureCoordinate: vec2;
}

export type ModelCacheObject = {
    name: string;
    instance: InstanceType;
    material: Material;
    modelView: mat4;
    inverseModelView: mat4;
    normalMatrix: mat4;
    texture?: Texture;
    textureEnable?: boolean;
}

export type Texture = {
    texture: Uint8ClampedArray,
    name: string,
    url: string,
    width: number,
    height: number,
};

/**
 * How the entire model is represented in a scenegraph.
 */
export type Model = {
    name: string;
    scene: GroupNode | LeafNode;
    sceneNodeType: NodeType;
    viewSpaceLights?: Light[];
}

export enum DrawMode {
    PLASTIC,
    TOON
}

export type CameraAnimationState = {
    orbit: number;
    orbit_v: number;
    orbit_a: number;
}

/**
 * A spot/directional light in the world that illuminates objects
 * to be a spotlight, set the spot cutoff to cos(glMatrix.toRadian(180))
 *
 * the spot target is the point to which the light will point.
 * the spot cutoff is the cosine of the angle to the center of the cone of the light
 */
export type Light = {
    ambient: vec3;
    diffuse: vec3;
    specular: vec3;
    position: vec4;
    spotTarget: vec4;
    spotCutoff: number;
}


/**
 * Represents the connection between a group node and
 * either another group node or a leaf node. This
 * connection can involve a transformation or it could
 * not. Also involves an animation transform, which is
 * represented as a function that takes in the current
 * time of the animation and returns the matrix to
 * animate with.
 */
export type Edge = {
    to: GroupNode | LeafNode | LightLeafNode;
    toType: NodeType;
    transformation?: mat4;
    animation?: ((time: number) => mat4);
}

/**
 * Enumeration for the types of Camera configutations
 * we support in viewing the model.
 */
export enum Camera {
    ORBIT,
    SURVEY,
    QUADCOPTER,
}

/**
 *
 */
export type CameraMap = Map<Camera, CameraProperties>


export type DrawModeMap = Map<DrawMode, DrawModeProperties>;

export type ShaderProperties = {
    vShaderSrc: string,
    fShaderSrc: string,
    shader: WebGLProgram,
    locations: ShaderLocationsVault
};

export type DrawModeProperties = {
    shaderProperties: ShaderProperties,
    drawFn: DrawFnSig
}

export type DrawFnSig = (modelView: mat4, leafNode: LeafNode,
                         getTexture: ((name: string, url: string) => WebGLTexture), notFoundTexture: TextureObject,
                         textureMatrix: mat4, proj: mat4, idToInstance: BaseInstance[]) => void;

/**
 *
 */
export type CameraProperties = {
    mat: mat4,
    animFunc: (camera: mat4, time: number) => mat4
}

/**
 * The Material that describes an object's interaction
 * with light. Describes how it changes under different
 * lighting configuations.
 *
 * **Absorptive + Reflective + Transparency must be equal to 1**
 * RefractiveIndex >= 1
 */
export type Material = {
    ambient: vec3,
    diffuse: vec3,
    specular: vec3,
    shininess: number,
    absorptive: number,
    reflective: number,
    transparency: number,
    refractiveIndex: number,
}


/**
 * Enumeration to aid in the identification of
 * a node being of a particular quality; that
 * quality being whether it is of the leaf family
 * or of the group family respectively.
 */
export enum NodeType {
    GROUP_NODE,
    LEAF_NODE,
    LIGHT_LEAF_NODE
}

/**
 * The graph nodes of a scene graph, which a larger group
 * of nodes being rendered together onto the scene.
 */
export type GroupNode = {
    name: string;
    edges: Edge[];
}

/**
 * The leaf nodes of a scene graph, which represent
 * an actual base instance being rendered onto the scene.
 */
export type LeafNode = {
    name: string;
    instance: InstanceType; // vbo id
    material: Material;
    textureURL?: string;
    textureEnable?: boolean;
}

/**
 * A Leaf node which represents a light. This allows a light to be places WRT a group node
 */
export type LightLeafNode = {
    name: string;
    light: Light;
}

/**
 * Enumeration to describe which base instance the
 * leaf node is rendering in a SceneGraph renderer.
 */
export enum InstanceType {
    CUBE = 0,
    CYLINDER = 1,
    SPHERE = 2,
    SEMI_SPHERE = 3,
    FAN = 4,
    ROOM = 5,
    CONE = 6,
}

/**
 * How to find the components for the model after they
 * are loaded into the GPU.
 */
export type BaseInstance = {
    id: InstanceType;
    vbo: WebGLBuffer;
    ibo: WebGLBuffer;
    numVertices: number;
    numIndices: number;
}
