precision mediump float;

struct MaterialProperties {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
};

struct LightProperties {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    vec4 position;
    vec4 direction;
    float cutoff;
};

// All interpolated fragment values from vertex values
varying vec3 fNormal;
varying vec4 fPosition;

uniform MaterialProperties material;
uniform LightProperties light[numLights];
uniform bool isRear;


vec3 binColor(float nDotL) {
    if (nDotL > 0.8) {
        return material.diffuse;
    } else if (nDotL > 0.6) {
        return material.diffuse * 0.6;
    } else if (nDotL > 0.4) {
        return material.diffuse * 0.4;
    } else if (nDotL > 0.2) {
        return material.diffuse * 0.1;
    } else {
        return vec3(0, 0, 0);
    }
}


vec4 drawRear() {
    return vec4(0, 0, 0, 1);
}

vec4 drawFrontAndLights() {
    vec3 lightVec, viewVec, reflectVec;
    vec3 normalView;
    vec3 ambient, diffuse, specular;
    float nDotL, rDotV;
    vec4 result;

    result = vec4(0, 0, 0, 1);

    for (int i=0; i < numLights; i++) {
        if (light[i].position.w != 0.0)
        lightVec = normalize(light[i].position.xyz - fPosition.xyz);
        else
        lightVec = normalize(-light[i].position.xyz);

        vec3 normalizedLd = normalize(light[i].direction.xyz);
        float negLiDotLd = dot(-lightVec, normalizedLd);

        ambient = material.ambient * light[i].ambient;
        diffuse = vec3(0, 0, 0);
        specular = vec3(0, 0, 0);
        if (negLiDotLd >= light[i].cutoff) {
            vec3 tNormal = fNormal;
            normalView = normalize(tNormal.xyz);
            nDotL = dot(normalView, lightVec);

            result = result + vec4(binColor(nDotL), 1.0);
        }
        result = result + vec4(ambient, 1.0);
    }

    return result;

}

void main() {
    if (isRear) {
        gl_FragColor = drawRear();
    } else {
        gl_FragColor = drawFrontAndLights();
    }
}

