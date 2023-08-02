import Raytracer from './Raytracer';
import { mat4, glMatrix } from 'gl-matrix';
import {FromRtWorkerMessage, Light, ModelCacheObject, ToRtWorkerMessage} from './types';
import WebpackWorker from "./RayTrace.worker";

export class RTView {
    private canvas: HTMLCanvasElement;
    private worker: Worker[];
    private cameraTheta: number;

    constructor(numWorkers: number, cameraTheta: number) {
        this.canvas = <HTMLCanvasElement>document.querySelector("#raytraceCanvas");
        if (!this.canvas) {
            console.log("Failed to retrieve the <canvas> element");
            return;
        }
        //button clicks
        let button: HTMLButtonElement = <HTMLButtonElement>document.querySelector("#savebutton");
        button.addEventListener("click", ev => this.saveCanvas());
        this.cameraTheta = cameraTheta;
        const t1 = performance.now()
        this.worker = this.setupWorkers(numWorkers);
        const t2= performance.now()
        console.log(`Worker Startup Time: ${t2-t1} ms`)
    }

    private setupWorkers = (numWorkers): Worker[] => {
        const workers = [];
        for (let i = 0; i < numWorkers; i++) {
            const worker = new WebpackWorker();
            worker.onmessage = ({data}) => this.fillCanvas(data);
            workers.push(worker);
        }
        return workers;

    }

    private saveCanvas(): void {
        let link = document.createElement('a');
        link.href = this.canvas.toDataURL('image/png');
        link.download = "result.png";
        link.click();
    }

    public rayTrace(modelCache: ModelCacheObject[], lights: Light[]): void {
        const width: number = Number(this.canvas.getAttribute("width"));
        const height: number = Number(this.canvas.getAttribute("height"));
        //const imageData: ImageData = this.canvas.getContext('2d').createImageData(width, height);
        const numWorkers = this.worker.length;
        const offset = Math.floor(height/numWorkers);
        for (let i = 0; i < numWorkers; i++) {
            if (numWorkers > 1 && i == numWorkers - 1) {

            }
            const imageData = new ImageData(
                width,
                (numWorkers > 1 && i == numWorkers - 1) ? offset + height % numWorkers : offset
            );
            const workerMsg: ToRtWorkerMessage = {
                cameraTheta: this.cameraTheta,
                imageData: imageData,
                yOffset: i * offset,
                origHeight: height,
                modelCache,
                lights
            }
            this.worker[i].postMessage(workerMsg);
        }
    }
    private fillCanvas(data: FromRtWorkerMessage): void {

        // Traverse Model and populate the cache list
        const {imageData, yOffset} = data;
        const height: number = Number(this.canvas.getAttribute("height"));
        this.canvas.getContext('2d').putImageData(imageData, 0, height - yOffset - imageData.height);

        // let context: CanvasRenderingContext2D = this.canvas.getContext('2d')
        // context.fillStyle = 'red';
        // context.fillRect(100, 100, 200, 100);
    }
}