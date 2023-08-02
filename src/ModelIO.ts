import {Model} from './types';
import {mat4, vec3, vec4} from 'gl-matrix';


/**
 * Deserializes JSON into a {@link Model}
 * @param str the json string to parse
 * @returns the deserialized {@link Model}
 */
export const read = (str: string): Model => {
    return JSON.parse(str, reviver);
}

/**
 * Much like the reviver, this handles turning the untyped arrays back into typed ones.
 * Converts the transformations back to {@link mat4}'s and colors into {@link vec4}'s
 * @param k
 * @param v
 */
const reviver = (k, v) => {
    if (k === 'transformation') {
        return v ? mat4.fromValues.apply(null, v) : v;
    } else if (k === 'ambient' || k === 'diffuse' || k === 'specular') {
        return vec3.fromValues.apply(null, v);
    } else if (k === 'spotTarget' || k === 'position') {
        return vec4.fromValues.apply(null, v);
    } else {
        return v;
    }

}

/**
 * Serializes a model into JSON
 * @param model the {@link Model} to serialize
 * @returns the JSON string
 */
export const write = (model: Model): string => {
    return JSON.stringify(model, replacer);
}

/**
 * This handles replacing typed arrays with their untyped counterparts.
 * JSON gets weird with Float32Array's when serializing and deserializing
 * so converting to an array solves this issue.
 * @param k the key for the object
 * @param v the value for the object
 */
const replacer = (k, v) => {
    if (k === 'transformation') {
        return v ? Array.from(v) : v;
    } else if (k === 'ambient' || k === 'diffuse' || k === 'specular') {
        return Array.from(v);
    } else if (k === 'spotTarget' || k === 'position') {
        return Array.from(v);
    } else {
        return v;
    }

}

/**
 * Handles exporting a model to json and allowing a user to download it
 * Creates a blob and simulates a click to initiate the download
 * @param model the {@link Model} to export
 */
export const writeToFile = (model: Model): void => {
    const content = write(model);
    const a = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = 'model.json';
    a.click();
}
