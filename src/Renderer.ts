import {
    BaseInstance,
    DrawMode,
    DrawModeMap,
    Edge,
    GroupNode,
    LeafNode,
    Light,
    LightLeafNode,
    Model,
    NodeType,
    ModelCacheObject, Texture
} from './types';
import {mat4, vec4} from 'gl-matrix';
import {
    generateConeInstance,
    generateCubeInstance,
    generateCylinderInstance,
    generateFanInstance,
    generateRoomInstance,
    generateSemisphereInstance,
    generateSphereInstance
} from './BaseInstance';
import {TextureObject} from '%COMMON/TextureObject';
import { createTexture } from './Texture';

/**
 * Class in charge of rendering the SceneGraph model.
 */
class Renderer {
    private readonly leafHandler: ((modelView: mat4, leafNode: LeafNode) => void);
    private readonly lightLeafHandler: ((modelView: mat4, leafNode: LightLeafNode) => void);
    private readonly asyncLeafHandler: ((modelView: mat4, leafNode: LeafNode) => Promise<void>);

    /**
     * Sets up the Renderer object
     * You MUST set the shader locations via the setShaderLocations method to use anything except the lightpass
     * with the initial flag set to true
     */
    constructor(leafHandler: (modelView: mat4, leafNode: LeafNode) => void,
            lightLeafHandler: (modelView: mat4, lightLeafNode: LightLeafNode) => void,
                asyncLeafHandler: (modelView: mat4, leafNode: LeafNode) => Promise<void> = null) {
        this.leafHandler = leafHandler;
        this.lightLeafHandler = lightLeafHandler;
        this.asyncLeafHandler = asyncLeafHandler;
    }

    /**
     * Renders a group node, which applies a transformation onto multiple child group or leaf
     * nodes.
     */
    private renderGroupNode(modelView: mat4, groupNode: GroupNode, time: number) {
        // if (!groupNode || !groupNode.edges) return;
        groupNode.edges.forEach((edge: Edge) => {
            const childMatrix: mat4 = mat4.clone(modelView);
            edge.transformation && mat4.multiply(childMatrix, childMatrix, edge.transformation);
            edge.animation && mat4.multiply(childMatrix, childMatrix, edge.animation(time));
            this.traverse(childMatrix, edge.to, edge.toType, time);
        });
    };

    private traverse(modelView: mat4, node: GroupNode | LeafNode | LightLeafNode, nodeType: NodeType, time: number) {
        if (nodeType === NodeType.GROUP_NODE) {
            this.renderGroupNode(modelView, node as GroupNode, time);
        } else if (nodeType === NodeType.LEAF_NODE) {
            this.leafHandler && this.leafHandler(modelView, node as LeafNode);
            this.asyncLeafHandler && this.asyncLeafHandler(modelView, node as LeafNode);
        } else if (nodeType === NodeType.LIGHT_LEAF_NODE) {
            this.lightLeafHandler && this.lightLeafHandler(modelView, node as LightLeafNode);
        }
    }

    /**
     * Render a model with a initial modelView (which will most likely represent the camera
     * view of the scene.
     */
    public render(modelView: mat4, model: Model, time: number = 0): void {
        this.traverse(modelView, model.scene, model.sceneNodeType, time);
    };
}

export class DrawRenderer {
    private renderer: Renderer;
    private gl: WebGLRenderingContext;
    private readonly proj: mat4;
    private readonly idToInstance: BaseInstance[];
    private readonly textureMatrix: mat4;
    private readonly notFoundTexture: TextureObject;
    private readonly textureMap: { [url: string]: TextureObject };
    private drawMode: DrawMode;
    private drawMap: DrawModeMap;

    constructor(gl: WebGLRenderingContext, proj: mat4, textureMatrix: mat4,
            notFoundTexture: TextureObject, drawMap: DrawModeMap, drawMode: DrawMode) {
        this.idToInstance = [
            generateCubeInstance(gl),
            generateCylinderInstance(gl),
            generateSphereInstance(gl),
            generateSemisphereInstance(gl),
            generateFanInstance(gl),
            generateRoomInstance(gl),
            generateConeInstance(gl),
        ];
        this.proj = proj;
        this.renderer = new Renderer(this.renderLeafNode, null);
        this.textureMatrix = textureMatrix;
        this.notFoundTexture = notFoundTexture;
        this.textureMap = {};
        this.drawMap = drawMap;
        this.drawMode = drawMode;
        this.gl = gl;
    }

    private getTexture = (name: string, url: string): WebGLTexture => {
        if (!this.textureMap.hasOwnProperty(url)) {
            this.textureMap[url] = new TextureObject(this.gl, name, url);
        }
        return this.textureMap[url].getTextureID();
    }


    public setDrawMode(mode: DrawMode) {
        this.drawMode = mode;
    }

    /**
     * Renders the leaf node of a Scenegraph representation. Uses the accumulated
     * modelView object in order to transform the base instance to how it should be
     * shown in the world.
     */
    private renderLeafNode = (modelView: mat4, leafNode: LeafNode) => {
        const { drawFn } = this.drawMap.get(this.drawMode);
        drawFn(modelView, leafNode, this.getTexture, this.notFoundTexture, this.textureMatrix, this.proj, this.idToInstance);
    };

    /**
     * Render a model with a initial modelView (which will most likely represent the camera
     * view of the scene.
     */
    render(modelView: mat4, model: Model, time: number) {
        if (!this.drawMap.get(this.drawMode)) throw new Error(`Draw Mode ${this.drawMode} must be defined if not initial pass`);
        return this.renderer.render(modelView, model, time);
    }
}



export class LightRenderer {
    protected renderer: Renderer;
    private drawMap: DrawModeMap;
    private drawMode: DrawMode;
    private gl: WebGLRenderingContext;
    protected lights: Light[];

    constructor(gl: WebGLRenderingContext, drawModeMap: DrawModeMap, drawMode: DrawMode) {
        this.renderer = new Renderer(null, this.setupLight);
        this.drawMap = drawModeMap;
        this.drawMode = drawMode;
        this.gl = gl;
    }

    /**
     *
     * @param modelView the current modelview matrix
     * @param lightNode the {@link LightLeafNode} to transform and push to the renderer lights
     */
    private setupLight = (modelView: mat4, lightNode: LightLeafNode) => {
        let lightCopy: Light = {...lightNode.light};
        lightCopy.position = vec4.transformMat4(vec4.create(), lightCopy.position, modelView);
        lightCopy.spotTarget = vec4.transformMat4(vec4.create(), lightCopy.spotTarget, modelView);
        this.lights.push(lightCopy);
    }

    /**
     * Makes a pass of the scenegraph to set up lights into the view coordinate system so that we can do lighting effects
     * This method, when called, replaces the lights currently active with new ones.
     * @param modelView The {@link mat4} containing the base modelview matrix to transform the lightPositions
     * @param model The {@link Model} representing the scenegraph to traverse
     * @param time The current time value of the program
     * @returns the lights in the scene
     */
    public render(modelView: mat4, model: Model, time: number = 0): Light[] {
        // clear the lights
        this.lights = [];
        //add the view space lights to the list
        model.viewSpaceLights && this.lights.push(...model.viewSpaceLights);
        // traverse the tree for the world/object space lights
        this.renderer.render(modelView, model, time);
        const {locations} = this.drawMap.get(this.drawMode).shaderProperties
        this.lights.forEach((light: Light, i: number) => {
            const ambientLocation: string = "light[" + i + "].ambient";
            const diffuseLocation: string = "light[" + i + "].diffuse";
            const specularLocation: string = "light[" + i + "].specular";
            const lightPosLocation: string = "light[" + i + "].position";
            const lightDirLocation: string = "light[" + i + "].direction";
            const lightCutoffLocation: string = "light[" + i + "].cutoff";

            this.gl.uniform3fv(locations.getUniformLocation(ambientLocation), light.ambient);
            this.gl.uniform3fv(locations.getUniformLocation(diffuseLocation), light.diffuse);
            this.gl.uniform3fv(locations.getUniformLocation(specularLocation), light.specular);
            this.gl.uniform4fv(locations.getUniformLocation(lightPosLocation), light.position);
            this.gl.uniform4fv(locations.getUniformLocation(lightDirLocation), vec4.subtract(vec4.create(), light.spotTarget, light.position));
            this.gl.uniform1f(locations.getUniformLocation(lightCutoffLocation), light.spotCutoff);
        });
        return this.lights;
    }

    public setDrawMode(mode: DrawMode) {
        this.drawMode = mode;
    }

}

export class LightRendererInitialPass extends LightRenderer {
    constructor() {
        // since we dont care about sending data over we can just set this all to null
        super(null, null, null);
    }
    
    public render(modelView: mat4, model: Model, time: number = 0): Light[] {
        // clear the lights
        this.lights = [];
        //add the view space lights to the list
        model.viewSpaceLights && this.lights.push(...model.viewSpaceLights);
        // traverse the tree for the world/object space lights
        this.renderer.render(modelView, model, time);

        return this.lights;

    }
    
}


export class RayTraceRenderer {
    private renderer: Renderer;
    private modelCacheObjects: ModelCacheObject[];
    private numModelCacheObjects: number;
    // private readonly textureMatrix: mat4;
    // private readonly notFoundTexture: TextureObject;
    private readonly textureMap: { [url: string]: Texture };

    constructor() {
        this.renderer = new Renderer(this.countCache, null, this.fillCache);
        this.numModelCacheObjects = 0;
        this.modelCacheObjects = [];
        this.textureMap = {};
    }

    private getTexture = async (name: string, url: string): Promise<Texture> => {
        if (!this.textureMap.hasOwnProperty(url)) {
            this.textureMap[url] = await createTexture(name, url);
        }
        return this.textureMap[url];
    }

    private countCache = () => this.numModelCacheObjects++;

    private fillCache = async (modelView: mat4, node: LeafNode) => {
        const inverseModelView = mat4.invert(mat4.create(), modelView);
        const textureEnable = Boolean(node.textureEnable || node.textureURL);
        this.modelCacheObjects.push({
            instance: node.instance,
            inverseModelView,
            normalMatrix: mat4.transpose(mat4.create(), mat4.invert(mat4.create(), modelView)),
            material: node.material,
            name: node.name,
            texture: textureEnable ? await this.getTexture(node.name, node.textureURL) : null,
            textureEnable,
            modelView: mat4.clone(modelView),
        });
    }

    public async render(modelView: mat4, model: Model, time: number = 0): Promise<ModelCacheObject[] | null> {
        return new Promise((resolve, reject) => {
            this.renderer.render(modelView, model, time);
            setTimeout(() => {
                reject('timeout');
            }, 10000);
            const loop = () => {
                if (this.modelCacheObjects.length === this.numModelCacheObjects) {
                    resolve(this.modelCacheObjects);
                }
                setTimeout(loop, 0);
            };
            setTimeout(loop, 0);
        });
    }
}
