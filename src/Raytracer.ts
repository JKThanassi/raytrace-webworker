import { mat4, vec2, vec3, vec4 } from 'gl-matrix';
import { HitRecord, Light, ModelCacheObject, ObjectHitRecord, Ray, Texture } from './types';
import { intersects } from './Intersection';
import {vec3Swizzle, reflectVec3, reflectVec4} from './Utils';
import { getTextureColor } from './Texture';

const RAYTRACING_RECURSIVE_DEPTH_LIMIT = 5;

const WHITE = vec4.fromValues(1, 1, 1, 1);
const GREEN = vec4.fromValues(0, 1, 0, 1);
const RED = vec4.fromValues(1, 0, 0, 1);
const BLUE = vec4.fromValues(0, 0, 1, 1);
const BLACK = vec4.fromValues(0, 0, 0, 1);

const AIR_REFRACTIVE_INDEX = 1;

export default class Raytracer {
  gl: WebGLRenderingContext;
  // FOV / 2
  cameraTheta: number;
  textureMatrix: mat4;
  objectList: ModelCacheObject[];
  lightList: Light[];

  constructor(cameraTheta: number, objectList: ModelCacheObject[], lightList: Light[]) {
    this.cameraTheta = cameraTheta
    this.objectList = objectList;
    this.lightList = lightList;
    this.textureMatrix = mat4.create();
    mat4.scale(this.textureMatrix, this.textureMatrix, [1, -1, 1]);
    mat4.translate(this.textureMatrix, this.textureMatrix, [0, 1, 0]);
  }

  /**
   * Gets the color from the given hit record.
   *
   * @param hitRecord
   */
  shade(hitObject: ModelCacheObject, hitRecord: HitRecord): vec4 {
    //const {material} = hitObject;
    //return vec4.fromValues(material.specular[0], material.specular[1], material.specular[2], 1);
    return this.phongShader(hitObject, hitRecord)//vec4.fromValues(0, 0, 0, 1);
  }

  private phongShader(hitObject: ModelCacheObject, hitRecord: HitRecord): vec4 {
    const {hitPoint, hitNormal, hitTextureCoordinate} = hitRecord;
    const hitMaterial = hitObject.material;
    const resultColor = vec4.fromValues(0, 0, 0, 1);
    const ambient = vec3.create();
    const diffuse = vec3.create();
    const specular = vec3.create();
    const lightVec = vec3.create();
    const lightDirection = vec3.create();
    let nDotL: number;
    let rDotV: number;
    let negLiDotLd: number;

    this.lightList.forEach((light: Light) => {


      if (light.position[3] !== 0) {
        vec3.sub(lightVec, vec3Swizzle(vec3.create(), light.position), vec3Swizzle(vec3.create(), hitPoint));
      } else {
        vec3.negate(lightVec, vec3Swizzle(vec3.create(), light.position))
      }

      vec3.copy(ambient, hitMaterial.ambient);
      vec3.multiply(ambient, ambient, light.ambient);

      // BEGIN SHADOW RAY CAST

      const position: vec4 = vec4.clone(hitPoint);
      const lightDirV4: vec4 = vec4.fromValues(lightVec[0],lightVec[1],lightVec[2], 0);
      vec4.scaleAndAdd(position, position, lightDirV4, .01);
      const lightRay: Ray = {position, direction: lightDirV4}; 
      const {closestHitRecord} = this.raycastClosestHit(lightRay); // TODO remove moddelview requirement as we dont use it;
      if (closestHitRecord && closestHitRecord.t <= 1) {
        // console.log("light rejected");
        // vec4.add(resultColor, resultColor, vec4.fromValues(0,0,0,1));
        return;
      }

      // END SHADOW RAY CAST

      vec3.normalize(lightVec, lightVec);

      vec3Swizzle(lightDirection, vec4.sub(vec4.create(), light.spotTarget, light.position));
      vec3.normalize(lightDirection, lightDirection);

      vec3.set(diffuse, 0, 0, 0);
      vec3.set(specular, 0, 0, 0);

      negLiDotLd = vec3.dot(vec3.negate(vec3.create(), lightVec), lightDirection);

      if (negLiDotLd >= light.spotCutoff) {
        const normalizedNormal = vec3Swizzle(vec3.create(), hitNormal);
        vec3.normalize(normalizedNormal, normalizedNormal);

        nDotL = vec3.dot(normalizedNormal, lightVec);

        const viewVec = vec3.create();
        vec3Swizzle(viewVec, hitPoint);
        vec3.negate(viewVec, viewVec);
        vec3.normalize(viewVec, viewVec);

        const reflectVec = vec3.create()
        reflectVec3(reflectVec, vec3.negate(vec3.create(), lightVec), normalizedNormal);
        vec3.normalize(reflectVec, reflectVec);


        rDotV = Math.max(vec3.dot(reflectVec, viewVec), 0);

        vec3.multiply(diffuse, hitMaterial.diffuse, light.diffuse);
        vec3.scale(diffuse, diffuse, Math.max(nDotL, 0));

        if (nDotL > 0) {
          vec3.multiply(specular, hitMaterial.specular, light.specular);
          vec3.scale(specular, specular, Math.pow(rDotV, hitMaterial.shininess));
        } else {
          vec3.set(specular, 0, 0, 0);
        }
      }
      const adsSum = vec3.add(vec3.create(), ambient, diffuse);
      vec3.add(adsSum, adsSum, specular);
      vec4.add(resultColor, resultColor, vec4.fromValues(adsSum[0], adsSum[1], adsSum[2], 0));
    });
    //resultColor[2] /= 2;
    if (hitObject.textureEnable) {
      const textureColor = getTextureColor(
        hitObject.texture,
        vec2.transformMat4(vec2.create(), hitTextureCoordinate, this.textureMatrix),
      );
      vec4.scale(resultColor, resultColor, 0.5);
      vec4.add(resultColor, resultColor, textureColor);
    }
    return resultColor;
  }

  /**
   * Returns the color of the
   * @param ray
   * @param modelView
   */
  raycast(ray: Ray, currentMu: number = AIR_REFRACTIVE_INDEX, recCallRemaining: number = RAYTRACING_RECURSIVE_DEPTH_LIMIT): vec4 {
    const { closestHitRecord, closestHitObject, isEnter } = this.raycastClosestHit(ray);
    // Calculate the color using the HitRecord
    if (closestHitRecord) {
      const { absorptive, reflective, transparency, refractiveIndex } = closestHitObject.material;
      //return color;
      const shadeColor = this.shade(closestHitObject, closestHitRecord);
      if (recCallRemaining <= 0 || (reflective === 0 && transparency === 0)) {
        return shadeColor;
      }
      const resultColor = vec4.create();
      vec4.scale(resultColor, shadeColor, absorptive);
      let reflection = reflective;
      const refractColor = (transparency !== 0) ? this.getRefractColor(ray, closestHitRecord, refractiveIndex, isEnter, currentMu, recCallRemaining - 1) : null;
      // const refractColor = null;
      if (!refractColor) {
        // Total Body Reflection
        reflection += transparency;
      } else {
       // vec4.scale(refractColor, refractColor, 1 / refractColor[3])
        vec4.scaleAndAdd(resultColor, resultColor, refractColor, transparency);
      }

      const reflectColor = this.getReflectColor(ray, closestHitRecord, currentMu, recCallRemaining - 1);
      vec4.scaleAndAdd(resultColor, resultColor, reflectColor, reflection);
      // vec4.scale(reflectColor, reflectColor, reflective);
      // return vec4.scaleAndAdd(vec4.create(), reflectColor, shadeColor, absorptive);
      resultColor[3] = 1;
      return resultColor;
    }
    return WHITE;
    // return vec4.fromValues(Math.random() / 2, 1 - Math.random() / 2, 0, 1);
  }

  private getReflectColor(ray: Ray, hit: HitRecord, currentMu: number, recCallRemaining: number): vec4 {
    const reflectRay: Ray = {direction: reflectVec4(vec4.create(), ray.direction, hit.hitNormal), position: hit.hitPoint};
    vec4.scaleAndAdd(reflectRay.position, reflectRay.position, reflectRay.direction, 0.001);
    return this.raycast(reflectRay, currentMu, recCallRemaining);
  }

  /**
   * return fucking null if totall inward reflection occurs.
   *
   * @param ray
   * @param hit
   * @param recCallRemaining
   * @private
   */
  private getRefractColor(ray: Ray, hit: HitRecord, hitMu: number, isEnter: boolean, currentMu: number, recCallRemaining: number): vec4 | null {
    let fromMu: number;
    let toMu: number;
    let normal: vec4 = hit.hitNormal;
    if (isEnter) {
      fromMu = currentMu;
      toMu = hitMu;
    } else {
      fromMu = hitMu;
      toMu = this.getClosestExitMu({
        position: vec4.scaleAndAdd(vec4.create(), hit.hitPoint, ray.direction, 0.0001),
        direction: vec4.clone(ray.direction),
      });
      normal = vec4.negate(vec4.create(), normal);
    }
    const transmissionRay: Ray | null = this.getTransmissionRay(ray, hit.hitPoint, normal, fromMu, toMu);
    if (!transmissionRay) {
      return null;
    }
    const newMu: number = toMu;
    return this.raycast(transmissionRay, newMu, recCallRemaining);
  }

  /**
   * RETURNS NULL WHEN TOTAL BODY REFLECTION OCCURS
   * @param ray
   * @param hit
   * @param fromMu
   * @param toMu
   * @private
   */
  private getTransmissionRay(ray: Ray, hitPoint: vec4, hitNormal: vec4, fromMu: number, toMu: number): Ray | null {
    // Ratio
    const muRatio = fromMu / toMu;
    // if (muRatio > 1) {
    //   // total object reflection
    //   return null;
    // }
    // TODO SHOULDN'T THIS BE NORMAlIZED AT THIS POINT ALREADY?
    const i: vec3 = vec3Swizzle(vec3.create(), ray.direction);
    vec3.normalize(i, i);
    const n: vec3 = vec3Swizzle(vec3.create(), hitNormal);
    vec3.normalize(n, n);
    const cosi = -vec3.dot(n, i);
    const sini = Math.sqrt(1 - (cosi * cosi));
    const sint = muRatio * sini;
    if (sint > 1) {
      // total object reflection
      return null;
    }
    const cost = Math.sqrt(1 - (sint * sint));
    vec3.scale(i, i, muRatio);
    vec3.scale(n, n, (muRatio * cosi) - cost);
    const dir = vec3.add(vec3.create(), i, n);
    const posFudge: vec3 = vec3Swizzle(vec3.create(), hitPoint);
    vec3.scaleAndAdd(posFudge, posFudge, dir, .1);
    const transmissionRay: Ray = {
      position: vec4.fromValues(posFudge[0], posFudge[1], posFudge[2], 1),
      direction: vec4.fromValues(dir[0], dir[1], dir[2], 0) 
    };
    return transmissionRay;
  }

  private getClosestExitMu(ray: Ray): number {
    // Same direction,
    let closestExitT: number | null = null;
    let closestExitMu: number | null = AIR_REFRACTIVE_INDEX;
    this.objectList.forEach(object => {
      // check if ray intersects with the object
      const objectHitRecord: ObjectHitRecord = intersects(ray, object);
      // Want the smallest positive exit t
      const exit = objectHitRecord.exitHitRecord;
      if (exit && exit.t >= 0 && (!closestExitT || (exit.t < closestExitT))) {
        closestExitT = exit.t;
        closestExitMu = object.material.refractiveIndex;
      }
    });
    return closestExitMu;
  }

  private raycastClosestHit(ray: Ray): { closestHitRecord: HitRecord, closestHitObject: ModelCacheObject, isEnter: boolean } {
    let closestHitRecord: HitRecord | null = null;
    let closestHitObject: ModelCacheObject | null = null;
    let isEnter: boolean = true;
    this.objectList.forEach(object => {
      // check if ray intersects with the object
      const objectHitRecord: ObjectHitRecord = intersects(ray, object);
      // Want the smallest positive t
      const enter = objectHitRecord.enterHitRecord;
      const exit = objectHitRecord.exitHitRecord;
      if (!enter && !exit) {
        return;
      }
      let hitRecord = (enter && enter.t >= 0) ? enter : null;
      if (!hitRecord && exit && exit.t >= 0) {
        hitRecord = exit;
      }
      // hitRecord =  ? exit : hitRecord;
      if (hitRecord && (!closestHitRecord || (hitRecord.t < closestHitRecord.t))) {
        closestHitRecord = hitRecord;
        closestHitObject = object;
        isEnter = (hitRecord === enter);
      }
    });
    return { closestHitRecord, closestHitObject, isEnter };
  }

  /**
   * 
   */
  raytrace(imageData: ImageData, yOffset: number, origHeight: number): ImageData {
    const {width, height} = imageData;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const position = vec4.fromValues(0, 0, 0, 1);
        const direction = vec4.fromValues(
          x - width / 2,
            (y + yOffset) - origHeight / 2,
          -origHeight / (2 * Math.tan(this.cameraTheta)),
          0,
        );
        const ray: Ray = {
          position,
          direction,
        };
        const color: vec4 = this.raycast(ray);
        // if (direction[1] === 0) {
        //   console.log(color);
        // }
        for (let i = 0; i < 4; i++) {
          // TODO Decide if we want it normalized to begin with and then post multiply by 255
          imageData.data[4 * (x + width * (height - y - 1)) + i] = 255 * color[i];
        }
      }
    }
    return imageData;
  };
}

