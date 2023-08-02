import {mat4} from 'gl-matrix';
import {ToRtWorkerMessage} from "./types";
import Raytracer from "./Raytracer";
import {glMatrix} from "gl-matrix";

const ctx: DedicatedWorkerGlobalScope = self as any;

ctx.onmessage = ({ data }) => {
    const {imageData, cameraTheta, modelCache, yOffset, origHeight, lights} = data as ToRtWorkerMessage;
    const rayTracer = new Raytracer(glMatrix.toRadian(cameraTheta), modelCache, lights);
    const t1 = performance.now()
    rayTracer.raytrace(imageData, yOffset, origHeight);
    const t2 = performance.now();
    console.log(`RayTrace Time: ${t2-t1}ms. yOffset: ${yOffset}`);
    ctx.postMessage({imageData, yOffset});

};


export default null as any;