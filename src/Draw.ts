import {mat4} from 'gl-matrix';
import {BaseInstance, DrawFnSig, DrawMode, DrawModeMap, DrawModeProperties, LeafNode, ShaderProperties} from "./types";
import {TextureObject} from "%COMMON/TextureObject";

/**
 * This function registers a function to a draw mode in the DrawModeMap registry
 * @param map The {@link DrawModeMap} to register the function and ShaderProperties to
 * @param mode The specific enum value in {@link DrawMode} to use
 * @param shaderProperties the {@link ShaderProperties} object to link
 * @param drawFn the function which will be used to draw for the particular draw mode
 */
const register = (map: DrawModeMap, mode: DrawMode, shaderProperties: ShaderProperties, drawFn: DrawFnSig): DrawModeMap => {
    const drawModeProperties: DrawModeProperties = {shaderProperties, drawFn};
    return map.set(mode, drawModeProperties);
}

// |                 _-====-__-======-__-========-_____-============-__
// |               _(                                                 _)
// |            OO(                     PLASTIC MODE                    )_
// |           0  (_                                                   _)
// |         o0     (_                                                _)
// |        o         '=-___-===-_____-========-___________-===-dwb-='
// |      .o                                _________
// |     . ______          ______________  |         |      _____
// |   _()_||__|| ________ |            |  |_________|   __||___||__
// |  (BNSF 1995| |      | |            | __Y______00_| |_         _|
// | /-OO----OO""="OO--OO"="OO--------OO"="OO-------OO"="OO-------OO"=P
// |#####################################################################

/**
 * This function sets up and registers the plastic draw mode
 * @param map The {@link DrawModeMap} to register the function and shader to
 * @param gl the {@link WebGLRenderingContext} to use within the function
 * @param shaderProperties the {@link ShaderProperties} object that this function will use
 */
export const setupPlastic = (map: DrawModeMap, gl: WebGLRenderingContext, shaderProperties: ShaderProperties) => {

    // when this is called it is assumed that the plastic shader is active
    const drawPlastic = (modelView: mat4, leafNode: LeafNode, getTexture: ((name: string, url: string) => WebGLTexture), notFoundTexture: TextureObject, textureMatrix, proj: mat4, idToInstance: BaseInstance[]): void => {
        const {locations: shaderLocations} = shaderProperties;
        const modelViewLoc = shaderLocations.getUniformLocation("modelview");
        const normalMatrixLoc = shaderLocations.getUniformLocation("normalmatrix");
        const textureMatrixLoc = shaderLocations.getUniformLocation("texturematrix");
        const textureEnableLoc = shaderLocations.getUniformLocation("textureenable")
        const projLoc = shaderLocations.getUniformLocation("projection");
        const posLoc = shaderLocations.getAttribLocation("vPosition");
        const normalLoc = shaderLocations.getAttribLocation("vNormal");
        const texCoordLoc = shaderLocations.getAttribLocation("vTexCoord");
        const ambientLocation = shaderLocations.getUniformLocation("material.ambient");
        const diffuseLocation = shaderLocations.getUniformLocation("material.diffuse");
        const specularLocation = shaderLocations.getUniformLocation("material.specular");
        const shininessLocation = shaderLocations.getUniformLocation("material.shininess");
        const instance = idToInstance[leafNode.instance]

        const normalMatrix = mat4.invert(mat4.create(), modelView);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.disable(gl.CULL_FACE);
        //deal with texture 0
        gl.activeTexture(gl.TEXTURE0);
        //that is what we pass to the shader
        gl.uniform1i(shaderLocations.getUniformLocation("image"), 0);
        gl.bindTexture(gl.TEXTURE_2D,
            leafNode.textureURL ? getTexture(leafNode.name, leafNode.textureURL) : notFoundTexture.getTextureID()
        );

        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR)

        gl.bindBuffer(gl.ARRAY_BUFFER, instance.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, instance.ibo);
        gl.uniform3fv(ambientLocation, leafNode.material.ambient);
        gl.uniform3fv(diffuseLocation, leafNode.material.diffuse);
        gl.uniform3fv(specularLocation, leafNode.material.specular);
        gl.uniform1f(shininessLocation, leafNode.material.shininess);
        gl.uniformMatrix4fv(modelViewLoc, false, modelView);
        gl.uniformMatrix4fv(normalMatrixLoc, false, normalMatrix);
        gl.uniformMatrix4fv(textureMatrixLoc, false, textureMatrix);
        gl.uniform1f(textureEnableLoc, (leafNode.textureURL || leafNode.textureEnable) ? 1 : 0);
        gl.uniformMatrix4fv(projLoc, false, proj);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(normalLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 32, 24);
        gl.enableVertexAttribArray(texCoordLoc);
        gl.drawElements(gl.TRIANGLES, instance.numIndices, gl.UNSIGNED_SHORT, 0);
    }

    register(map, DrawMode.PLASTIC, shaderProperties, drawPlastic);

}

// |                 _-====-__-======-__-========-_____-============-__
// |               _(                                                 _)
// |            OO(                       TOON MODE                    )_
// |           0  (_                                                   _)
// |         o0     (_                                                _)
// |        o         '=-___-===-_____-========-___________-===-dwb-='
// |      .o                                _________
// |     . ______          ______________  |         |      _____
// |   _()_||__|| ________ |            |  |_________|   __||___||__
// |  (BNSF 1995| |      | |            | __Y______00_| |_         _|
// | /-OO----OO""="OO--OO"="OO--------OO"="OO-------OO"="OO-------OO"=P
// |#####################################################################

/**
 * This function sets up and registers the toon draw mode
 * @param map The {@link DrawModeMap} to register the function and shader to
 * @param gl the {@link WebGLRenderingContext} to use within the function
 * @param shaderProperties the {@link ShaderProperties} object that this function will use
 */
export const setupToon = (map: DrawModeMap, gl: WebGLRenderingContext, shaderProperties: ShaderProperties) => {

    // when this is called, it is assumed the toon shader is active
    const drawToon = (modelView: mat4, leafNode: LeafNode,
                      getTexture: ((name: string, url: string) => WebGLTexture), notFoundTexture: TextureObject,
                      textureMatrix: mat4, proj: mat4, idToInstance: BaseInstance[]) => {
        const {locations: shaderLocations} = shaderProperties;

        const modelViewLoc = shaderLocations.getUniformLocation("modelview");
        const normalMatrixLoc = shaderLocations.getUniformLocation("normalmatrix");
        const projLoc = shaderLocations.getUniformLocation("projection");
        const posLoc = shaderLocations.getAttribLocation("vPosition");
        const normalLoc = shaderLocations.getAttribLocation("vNormal");
        const ambientLocation = shaderLocations.getUniformLocation("material.ambient");
        const diffuseLocation = shaderLocations.getUniformLocation("material.diffuse");
        const specularLocation = shaderLocations.getUniformLocation("material.specular");
        const shininessLocation = shaderLocations.getUniformLocation("material.shininess");
        const isRearLocation = shaderLocations.getUniformLocation("isRear");
        const normalTranslateFactor = shaderLocations.getUniformLocation("normalTranslateFactor");
        const instance = idToInstance[leafNode.instance]

        const normalMatrix = mat4.invert(mat4.create(), modelView);
        mat4.transpose(normalMatrix, normalMatrix);


        gl.bindBuffer(gl.ARRAY_BUFFER, instance.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, instance.ibo);
        gl.uniform3fv(ambientLocation, leafNode.material.ambient);
        gl.uniform3fv(diffuseLocation, leafNode.material.diffuse);
        gl.uniform3fv(specularLocation, leafNode.material.specular);
        gl.uniform1f(shininessLocation, leafNode.material.shininess);
        gl.uniformMatrix4fv(modelViewLoc, false, modelView);
        gl.uniformMatrix4fv(normalMatrixLoc, false, normalMatrix);
        gl.uniformMatrix4fv(projLoc, false, proj);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(normalLoc);


        // set the rear uniform when drawing back faces
        gl.uniform1f(normalTranslateFactor, 3);
        gl.uniform1i(isRearLocation, 1);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        gl.drawElements(gl.TRIANGLES, instance.numIndices, gl.UNSIGNED_SHORT, 0);

        gl.uniform1i(isRearLocation, 0);
        gl.cullFace(gl.BACK)
        gl.drawElements(gl.TRIANGLES, instance.numIndices, gl.UNSIGNED_SHORT, 0);
    }

    register(map, DrawMode.TOON, shaderProperties, drawToon);
};
