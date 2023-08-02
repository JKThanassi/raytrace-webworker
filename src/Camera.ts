import {glMatrix, mat4, vec3} from 'gl-matrix';
import {Camera, CameraAnimationState, CameraMap} from './types'
import {calculateQuadcopterTransformation} from './Scene';

const SURVEY_MAX_DIST = 600;

/**
 * Generates a map of {@link Camera}'s to their corresponding matrices and animation functions
 * @param cameraState the {@link CameraAnimationState} which the animation functions will update
 */
export const generateCameraMap = (cameraState: CameraAnimationState): CameraMap => {
    const map: CameraMap = new Map();
    map.set(
        Camera.ORBIT,
        {
            mat: mat4.lookAt(mat4.create(), [0, 200, 800], [0, 0, 0], [0, 1, 0]),
            animFunc: animateOrbitalGen(cameraState)
        });

    map.set(
        Camera.SURVEY,
        {
            mat: mat4.create(),
            animFunc: animateSurveyGen(cameraState)
        });

    map.set(
        Camera.QUADCOPTER,
        {
            mat: mat4.create(),
            animFunc: animateQuadcopterFirstPerson(cameraState),
        }
    )
    return map;
}


/**
 * Generates a closure animation function for the orbital camera with the camera state.
 * @param cameraState the {@link CameraAnimationState} to enclose
 */
const animateOrbitalGen = (cameraState: CameraAnimationState): ((camera: mat4, time: number) => mat4) => {
    const origPos = mat4.lookAt(mat4.create(), [0, 200, 800], [0, 0, 0], [0, 1, 0]);
    return (camera: mat4, time: number) => {
        cameraState.orbit_v += cameraState.orbit_a;
        if (Math.abs(cameraState.orbit_v) > 0.00001) {
            cameraState.orbit_v /= 1.055;
        }

        cameraState.orbit += cameraState.orbit_v;

        mat4.rotate(camera, origPos, cameraState.orbit, [0, 1, 0]);
        return camera;
    }

}

/**
 * Generates a closure animation function for the survey camera with the given camera state.
 * @param cameraState the {@link CameraAnimationState} to enclose
 */
const animateSurveyGen = (cameraState: CameraAnimationState): ((camera: mat4, time: number) => mat4) => {
    const center = vec3.fromValues(0, 0, 0);
    return (camera: mat4, time: number) => {
        const radianTime = glMatrix.toRadian(time) * .5;
        const eye = vec3.fromValues(
            SURVEY_MAX_DIST * 2 * Math.cos(radianTime),
            400,
            SURVEY_MAX_DIST * Math.sin(radianTime) * Math.cos(radianTime) + 750,
        );
        return mat4.lookAt(camera, eye, center, [0, 1, 0]);
    }
}

const animateQuadcopterFirstPerson = (cameraState: CameraAnimationState): ((camera: mat4, time: number) => mat4) => {
    const {transformation, animation} = calculateQuadcopterTransformation();
    return (camera: mat4, time: number) => {
        const firstPerson = mat4.clone(transformation);
        mat4.multiply(firstPerson, firstPerson, animation(time));
        mat4.invert(firstPerson, firstPerson);
        mat4.multiply(camera, mat4.lookAt(mat4.create(), [-200, 300, 0], [50, 280, 0], [0, 1, 0]), firstPerson);
        return camera;
    };
}
