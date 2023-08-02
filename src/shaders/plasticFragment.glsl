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
varying vec4 fTexCoord;

uniform bool textureenable;
uniform MaterialProperties material;
uniform LightProperties light[numLights];

// The WebGL texture to use
uniform sampler2D image;

void main() {
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


            viewVec = -fPosition.xyz;
            viewVec = normalize(viewVec);

            reflectVec = reflect(-lightVec, normalView);
            reflectVec = normalize(reflectVec);

            rDotV = max(dot(reflectVec, viewVec), 0.0);

            // Move this outside (of cutoff if statement) to still do ambient computation
            //            ambient = material.ambient * light[i].ambient;
            diffuse = material.diffuse * light[i].diffuse * max(nDotL, 0.0);
            if (nDotL > 0.0)
            specular = material.specular * light[i].specular * pow(rDotV, material.shininess);
            else {
                // Comment this out if you move the ambient up
                //                ambient = vec3(0, 0, 0);
                specular = vec3(0, 0, 0);
            }
        }
        result = result + vec4(ambient + diffuse + specular, 1.0);
        //result = result * texture2D(image, fTexCoord.st);
    }

    if (textureenable)
    result = .5 * result + texture2D(image, fTexCoord.st);
    gl_FragColor = result;
}

