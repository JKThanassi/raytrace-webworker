attribute vec4 vPosition;
attribute vec4 vNormal;
attribute vec2 vTexCoord;

uniform mat4 projection;
uniform mat4 modelview;
uniform mat4 normalmatrix;
uniform mat4 texturematrix;
varying vec3 fNormal;
varying vec4 fPosition;
varying vec4 fTexCoord;

void main()
{
    vec3 lightVec, viewVec, reflectVec;
    vec3 normalView;
    vec3 ambient, diffuse, specular;

    fPosition = modelview * vPosition;
    gl_Position = projection * fPosition;

    vec4 tNormal = normalmatrix * vNormal;
    fNormal = normalize(tNormal.xyz);

    fTexCoord = texturematrix * vec4(vTexCoord.s, vTexCoord.t, 0, 1);
    //    fTexCoord = vec4(vTexCoord.s, vTexCoord.t, 0, 0);
}
