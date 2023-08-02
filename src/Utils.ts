import {Material, ShaderProperties} from './types';
import {vec3, vec4} from 'gl-matrix';
import * as WebGLUtils from "%COMMON/WebGLUtils";
import {ShaderLocationsVault} from "%COMMON/ShaderLocationsVault";


export const makeMaterial = (
  color: vec4,
  brightness: number,
  shininess: number,
  absorptive: number = 0.75,
  reflective: number = 0.25,
  transparency: number = 0,
  refractiveIndex: number = 1): Material => {
    const scaled = color.map((n: number) => n * brightness);
    const scaledV3 = vec3.fromValues(scaled[0], scaled[1], scaled[2]);
    absorptive + reflective + transparency !== 1 && console.error("absorptive and reflective must equal to one");
    return {
        ambient: vec3.fromValues(brightness / 4, brightness / 4, brightness / 4),
        diffuse: scaledV3,
        specular: vec3.fromValues(1, 1, 1),
        shininess: shininess,
        absorptive,
        reflective,
        transparency,
        refractiveIndex,
    }
}

export const makeShader = (gl: WebGLRenderingContext, fShaderSrc: string, vShaderSrc: string, numLights: Number): ShaderProperties => {
    const shaderF = fShaderSrc.split('numLights').join(`${numLights}`);
    const shader = WebGLUtils.createShaderProgram(gl, vShaderSrc, shaderF);
    const locations = new ShaderLocationsVault(gl, shader);
    return {vShaderSrc, fShaderSrc, shader, locations};
}

/**
 * updates shader and shaderLocationsVault within a {@link ShaderProperties} obj
 * @param gl the {@link WebGLRenderingContext} to use
 * @param sProps the {@link ShaderProperties} object to modify
 * @param numLights the number of lights to set
 */
export const updateShaderProperties = (gl: WebGLRenderingContext, sProps: ShaderProperties, numLights: Number): ShaderProperties => {
    const {fShaderSrc, vShaderSrc, locations} = sProps;
    const shaderF = fShaderSrc.split('numLights').join(`${numLights}`);
    sProps.shader = WebGLUtils.createShaderProgram(gl, vShaderSrc, shaderF);
    sProps.locations = new ShaderLocationsVault(gl, sProps.shader);
    return sProps;
}

export const reflectVec3 = (out: vec3, iVec: vec3, nVec: vec3):vec3 => {
    const i = vec3.normalize(vec3.create(), iVec);
    const n = vec3.normalize(vec3.create(), nVec);
    const nDotI = vec3.dot(n, i);
    vec3.scale(out, n, 2*nDotI);
    return vec3.subtract(out, i, out);
}

export const reflectVec4 = (out: vec4, iVec: vec4, nVec: vec4): vec4 => {
    // const n = vec4.normalize(vec4.create(), nVec);
    const n3 = vec3Swizzle(vec3.create(), nVec);
    const i3 = vec3Swizzle(vec3.create(), iVec);
    const ref = reflectVec3(vec3.create(), i3, n3);
    return vec4.set(out, ref[0], ref[1], ref[2], 0);
}

/**
 * This funciton takes a {@link vec4} and returns a {@link vec3} contining the x,y, and z component of the input
 * Yes, this is a dumb name but it is how GLSL refers to getting the x,y,z components of a vec4
 * @param out the vec3 to write the x,y,z values into
 * @param toSwizzle the {@link vec4} to swizzle
 */
export const vec3Swizzle = (out: vec3, toSwizzle: vec4): vec3 => vec3.set(out, toSwizzle[0], toSwizzle[1], toSwizzle[2]);
