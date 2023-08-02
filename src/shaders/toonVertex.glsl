attribute vec4 vPosition;
attribute vec4 vNormal;
attribute vec2 vTexCoord;

uniform mat4 projection;
uniform mat4 modelview;
uniform mat4 normalmatrix;
uniform mat4 texturematrix;
uniform float normalTranslateFactor;
varying vec3 fNormal;
varying vec4 fPosition;
uniform bool isRear;
//varying vec4 fTexCoord;



void main()
{
    vec3 lightVec, viewVec, reflectVec;
    vec3 normalView;
    vec3 ambient, diffuse, specular;
    vec4 tNormal = normalmatrix * vNormal;

    if (isRear) {
        vec4 viewSpaceVertPos = modelview * vPosition;
        fPosition = viewSpaceVertPos + vec4((normalize(tNormal.xyz) * normalTranslateFactor), 0);
    } else {
        fPosition = modelview * vPosition;
    }

    gl_Position = projection * fPosition;
    fNormal = normalize(tNormal.xyz);

}
