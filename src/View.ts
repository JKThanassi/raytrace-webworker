import {glMatrix, mat4} from "gl-matrix";
import {DrawRenderer, LightRenderer, LightRendererInitialPass} from './Renderer';
import {
    Camera,
    CameraAnimationState,
    CameraMap,
    CameraProperties,
    DrawMode,
    DrawModeMap,
    DrawModeProperties,
    Model
} from "./types";
import {read, writeToFile} from './ModelIO';
import {generateCameraMap} from './Camera';
import {TextureObject} from '%COMMON/TextureObject';
import {makeShader, updateShaderProperties} from "./Utils";
import {setupPlastic, setupToon} from "./Draw";


/**
 * This class encapsulates the "view", where all of our WebGL code resides.
 */
export class View {
    // Models
    private sceneModel: Model;
    //the webgl rendering context. All WebGL functions will be called on this object
    private readonly gl: WebGLRenderingContext;
    //an object that represents a WebGL shader
    private shaderProgram: WebGLProgram;
    private readonly proj: mat4;
    private readonly textureMatrix: mat4;
    private modelview: mat4;
    private readonly cameraMap: CameraMap;
    private selectedCamera: Camera;
    private drawRenderer: DrawRenderer;
    private lightRenderer: LightRenderer;
    private countLightsRenderer: LightRendererInitialPass
    private readonly cameraState: CameraAnimationState;
    private time: number;
    private drawMode: DrawMode;
    private drawMap: DrawModeMap;

    constructor(gl: WebGLRenderingContext, model: Model) {
        this.gl = gl;
        this.cameraState = {orbit: 0, orbit_v: 0, orbit_a: 0}

        //set the clear color
        this.gl.clearColor(1, 1, 1, 1);
        this.proj = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, .1, 10000)
        //this.proj = mat4.ortho(mat4.create(), -800, 800, -800, 800, 0.1, 10000);
        this.textureMatrix = mat4.create();
        mat4.scale(this.textureMatrix, this.textureMatrix, [1, -1, 1]);
        mat4.translate(this.textureMatrix, this.textureMatrix, [0, 1, 0]);
        // get the width and height of the canvas element
        const {width, height} = document.getElementById('glCanvas').getBoundingClientRect()
        this.gl.viewport(0, 0, width, height);
        this.sceneModel = model;
        this.cameraMap = generateCameraMap(this.cameraState);
        this.selectedCamera = Camera.ORBIT;
        this.time = 0;
        this.drawMode = DrawMode.PLASTIC;
        this.drawMap = new Map<DrawMode, DrawModeProperties>();
        this.drawRenderer = new DrawRenderer(this.gl, this.proj, this.textureMatrix, new TextureObject(this.gl, "not found", "./textures/checkerboard.png"), this.drawMap, this.drawMode);
        this.lightRenderer = new LightRenderer(this.gl, this.drawMap, this.drawMode);
        this.countLightsRenderer = new LightRendererInitialPass();
    }

    /**
     * Initialize the shaders and build the shader program
     * @param vShaderSource
     * @param fShaderSource
     */
    public initShaders(vShaderSource: string, fShaderSource: string, vToonShader: string, fToonShader: string, numLights: number) {
        //create and set up the shader
        // init lights and get the number of them
        let plasticShader = makeShader(this.gl, fShaderSource, vShaderSource, numLights);
        let toonShader = makeShader(this.gl, fToonShader, vToonShader, numLights);
        setupPlastic(this.drawMap, this.gl, plasticShader);
        setupToon(this.drawMap, this.gl, toonShader);
        this.setDrawMode(DrawMode.PLASTIC);
    }

    private setDrawMode(mode: DrawMode) {
        this.drawMode = mode;
        this.gl.useProgram(this.drawMap.get(mode).shaderProperties.shader);
        this.drawRenderer.setDrawMode(mode);
        this.lightRenderer.setDrawMode(mode);
    }

    public setModelFromFile = (e: Event): void => {
        const tgt = e.target as HTMLInputElement
        const file = tgt.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            // for each shader we have, update the number of lights on model load
            this.sceneModel = read(reader.result as string)
            this.drawMap.forEach(value => {
                const lights = this.countLightsRenderer.render(this.getCameraMat(), this.sceneModel);
                updateShaderProperties(this.gl, value.shaderProperties, lights.length);
            });
            this.gl.useProgram(this.drawMap.get(this.drawMode).shaderProperties.shader);
        };
        reader.readAsText(file);
    }

    public downloadModel = (e: Event): void => {
        writeToFile(this.sceneModel);
    }


    public animate(): void {
        this.time += 1;

        const cam: CameraProperties = this.cameraMap.get(this.selectedCamera);
        cam.animFunc(cam.mat, this.time);

        this.draw();
    }

    public draw(): void {
        //clear the window
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);

        const cam: mat4 = this.cameraMap.get(this.selectedCamera).mat;
        this.modelview = mat4.clone(cam);

        //draw the model
        this.lightRenderer.render(this.modelview, this.sceneModel, this.time);
        this.drawRenderer.render(this.modelview, this.sceneModel, this.time);
    }

    /**
     * Event listener which handles changing the acceleration values for the camera.
     */
    public handleKeyDown(code: string) {
        switch (code) {
            case 'ArrowRight':
                this.cameraState.orbit_a = 0.001;
                break;
            case 'ArrowLeft':
                this.cameraState.orbit_a = -0.001;
                break;
            case 'Digit1':
                this.selectedCamera = Camera.ORBIT;
                break;
            case 'Digit2':
                this.selectedCamera = Camera.SURVEY;
                break;
            case 'Digit3':
                this.selectedCamera = Camera.QUADCOPTER;
                break;
            case 'KeyS':
                this.drawMode == DrawMode.PLASTIC ? this.setDrawMode(DrawMode.TOON) : this.setDrawMode(DrawMode.PLASTIC);
                break;
            default:
                return;
        }
    }


    /**
     * Event listener which will set the acceleration to zero when the key is lifted
     */
    public handleKeyUp() {
        this.cameraState.orbit_a = 0;
    };

    public getCameraMat() {
        return this.cameraMap.get(this.selectedCamera).mat;
    }


}
