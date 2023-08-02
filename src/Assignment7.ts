import {View} from "./View"
import * as WebGLUtils from "%COMMON/WebGLUtils"
import { RTView } from './RTView';
import { generateCreativeModel, generateSceneModel, generateSuperSimpleTestSceneModel, generateTestSceneModel } from "./Scene";
import {LightRendererInitialPass, RayTraceRenderer} from "./Renderer";
import {generateDNA} from "./DNA";


var numFrames: number = 0;
var lastTime: number = -1;

/**
 * This is the main function of our web application. This function is called at the end of this file. In the HTML file, this script is loaded in the head so that this function is run.
 */
function main() {
    let gl: WebGLRenderingContext;
    let view: View;

    window.onload = async ev => {
        let shaderF = await fetch('./src/shaders/plasticFragment.glsl').then(response => response.text());
        const shaderV = await fetch('./src/shaders/plasticVertex.glsl').then(response => response.text());

        let toonShaderF = await fetch('./src/shaders/toonFragment.glsl').then(response => response.text());
        const toonShaderV = await fetch('./src/shaders/toonVertex.glsl').then(response => response.text());


        //retrieve <canvas> element
        var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("#glCanvas");
        if (!canvas) {
            console.log("Failed to retrieve the <canvas> element");
            return;
        }


        //get the rendering context for webgl
        gl = WebGLUtils.setupWebGL(canvas, {'antialias': true, 'alpha': false, 'depth': true, 'stencil': false});

        // Only continue if WebGL is available and working
        if (gl == null) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }

        const fileSelector = document.getElementById('fileInput');
        const modelExport = document.getElementById('modelExport');

        //generate the model
        // const model = generateSceneModel();
        // const model = generateSuperSimpleTestSceneModel();
        // const model = generateTestSceneModel();
        const model = generateCreativeModel();
        const countLightsRenderer = new LightRendererInitialPass();

        //create the view
        view = new View(gl, model);
        const lights = countLightsRenderer.render(view.getCameraMat(), model);
        view.initShaders(shaderV, shaderF, toonShaderV, toonShaderF, lights.length);
        modelExport.addEventListener('click', view.downloadModel);
        fileSelector.addEventListener("change", view.setModelFromFile, false);
        view.draw();

        //create the Ray Tracing View

        const rtRenderer = new RayTraceRenderer();
        const raytracerView = new RTView(navigator.hardwareConcurrency, 45);
        const modelCache = await rtRenderer.render(view.getCameraMat(), model);
        raytracerView.rayTrace(modelCache, lights);

        // rtRenderer.render(view.getCameraMat(), model).then((modelCache) => {
        //     raytracerView.rayTrace(modelCache, lights);
        // });
        /**
         * The program is set to animate by rotating the model about its vertical axis
         */
        var tick = function () {
            if (lastTime == -1) {
                lastTime = new Date().getTime();
            }
            numFrames = numFrames + 1;
            if (numFrames >= 100) {
                let currentTime: number = new Date().getTime();
                let frameRate: number = 1000 * numFrames / (currentTime - lastTime);
                lastTime = currentTime;
                document.getElementById('frameratedisplay').innerHTML = "Frame rate: " + frameRate.toFixed(1);
                numFrames = 0;
            }
            view.animate();

            //this line sets up the animation
            requestAnimationFrame(tick);
        };

        //call tick the first time
        tick();

        document.addEventListener('keydown', ({code}) => view.handleKeyDown(code));
        document.addEventListener('keyup', () => view.handleKeyUp());
    }
}

main();
