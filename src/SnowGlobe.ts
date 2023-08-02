import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix';
import { makeMaterial } from './Utils';
import { GroupNode, InstanceType, NodeType } from './types';

const NUM_SNOWFLAKES = 100;

const SNOWFLAKE_MATERIAL = makeMaterial([1, 1, 1, 1], 1, 100, 0.5, 0.5, 0, 0);


const generateSnowFlakes = (): GroupNode => {
  const snowflakesGroupNode: GroupNode = {
    name: "Snowflakes",
    edges: [],
  };
  for (let i = 0; i < NUM_SNOWFLAKES; i++) {
    const position: vec3 = vec3.fromValues(0, 0, 0); // TODO SODOMIZE BASED ON SPHERE
    snowflakesGroupNode.edges.push({
      to: {
        name: `Snowflake ${i}`,
        instance: InstanceType.SPHERE,
        material: SNOWFLAKE_MATERIAL,
      },
      toType: NodeType.LEAF_NODE,
      transformation: mat4.translate(mat4.create(), mat4.create(), position),
    });
  }
  return snowflakesGroupNode;
};

const generateArt3 = (): GroupNode => {
   const tubeTransform: mat4 = mat4.create();
  mat4.translate(tubeTransform,tubeTransform, vec3.fromValues(-405,50,0));
  mat4.scale(tubeTransform, tubeTransform, vec3.fromValues(50, 350, 50));
  mat4.rotateX(tubeTransform, tubeTransform, glMatrix.toRadian(90));

  const coneTransform: mat4 = mat4.create();
  mat4.translate(coneTransform,coneTransform, vec3.fromValues(-405,300,0));
  mat4.scale(coneTransform, coneTransform, vec3.fromValues(50, 100, 50));
  mat4.rotateX(coneTransform, coneTransform, glMatrix.toRadian(90));

  const intersectingTransform: mat4 = mat4.create();
  mat4.translate(intersectingTransform,intersectingTransform, vec3.fromValues(-300,100,0));
  mat4.rotateZ(intersectingTransform, intersectingTransform, glMatrix.toRadian(45));
  mat4.scale(intersectingTransform, intersectingTransform, vec3.fromValues(50, 300, 50));
  mat4.rotateX(intersectingTransform, intersectingTransform, glMatrix.toRadian(90));

  const iTransform2: mat4 = mat4.create();
  mat4.translate(iTransform2,iTransform2, vec3.fromValues(-200,100,0));
  mat4.rotateZ(iTransform2, iTransform2, glMatrix.toRadian(-45));
  mat4.scale(iTransform2, iTransform2, vec3.fromValues(50, 300, 50));
  mat4.rotateX(iTransform2, iTransform2, glMatrix.toRadian(90));
  return {
    name: "Calder 1",
    edges: [{
      to: {
        name: "tube",
        instance: InstanceType.CYLINDER,
        material: makeMaterial(vec4.fromValues(1, 0, 0, 1), 1, 10, .8, .2, 0, 1),
      },
      toType: NodeType.LEAF_NODE,
      transformation: tubeTransform,
    },
    {
      to: {
        name: "intersectingTube",
        instance: InstanceType.CYLINDER,
        material: makeMaterial(vec4.fromValues(0, 1, 1, 1), 1, 10, 1, 0, 0, 1),
      },
      toType: NodeType.LEAF_NODE,
      transformation: intersectingTransform
    },
    {
      to: {
        name: "intersectingTube2",
        instance: InstanceType.CYLINDER,
        material: makeMaterial(vec4.fromValues(1, 1, 1, 1), 1, 10, 1, 0, 0, 1),
      },
      toType: NodeType.LEAF_NODE,
      transformation: iTransform2
    },
    {
      to: {
        name: "cone",
        instance: InstanceType.CONE,
        material: makeMaterial(vec4.fromValues(1, 1, 1, 1), 1, 10, 1, 0, 0, 1),
        textureURL: './textures/circle_scatter.png'
      },
      toType: NodeType.LEAF_NODE,
      transformation: coneTransform
    }
    ]
  } 
};

const generateArt2 = (): GroupNode => {
  const tubeTransform: mat4 = mat4.create();
  mat4.translate(tubeTransform,tubeTransform, vec3.fromValues(-450,100,0));
  mat4.scale(tubeTransform, tubeTransform, vec3.fromValues(100, 100, 300));
  //mat4.rotateX(tubeTransform, tubeTransform, glMatrix.toRadian(90));

  const tube2Transform: mat4 = mat4.create();
  mat4.translate(tube2Transform,tube2Transform, vec3.fromValues(-300,100,0));
 // mat4.rotateZ(tube2Transform, tube2Transform, glMatrix.toRadian(45));
  mat4.scale(tube2Transform, tube2Transform, vec3.fromValues(100, 100, 300));
  //mat4.rotateX(tube2Transform, tube2Transform, glMatrix.toRadian(90));

  const tube3Transform: mat4 = mat4.create();
  mat4.translate(tube3Transform,tube3Transform, vec3.fromValues(-250,150,0));
 // mat4.rotateZ(tube3Transform, tube3Transform, glMatrix.toRadian(45));
  mat4.rotateZ(tube3Transform, tube3Transform, glMatrix.toRadian(30));
  mat4.rotateX(tube3Transform, tube3Transform, glMatrix.toRadian(90));
  mat4.scale(tube3Transform, tube3Transform, vec3.fromValues(30, 100, 300));

  const semiTransform: mat4 = mat4.create();
  mat4.translate(semiTransform,semiTransform, vec3.fromValues(-325,275,0));
 // mat4.rotateZ(semiTransform, semiTransform, glMatrix.toRadian(45));
  mat4.rotateZ(semiTransform, semiTransform, glMatrix.toRadian(30));
  mat4.rotateX(semiTransform, semiTransform, glMatrix.toRadian(-90));
  mat4.scale(semiTransform, semiTransform, vec3.fromValues(150, 150, 150));

  return {
    name: "Calder 1",
    edges: [{
      to: {
        name: "tube",
        instance: InstanceType.CYLINDER,
        material: makeMaterial(vec4.fromValues(1, 0, 0, 1), .5, 10, 1, 0, 0, 1),
        textureEnable: true,
        textureURL: './textures/stacked-waves-1.png'
      },
      toType: NodeType.LEAF_NODE,
      transformation: tubeTransform,
    },
    {
      to: {
        name: "tube2",
        instance: InstanceType.CYLINDER,
        material: makeMaterial(vec4.fromValues(0, 1, 1, 1), .5, 10, 1, 0, 0, 1),
        textureURL: './textures/blob-scene.png',
        textureEnable: true
      },
      toType: NodeType.LEAF_NODE,
      transformation: tube2Transform
    },
    {
      to: {
        name: "tube3",
        instance: InstanceType.CUBE,
        material: makeMaterial(vec4.fromValues(0, 1, 1, 1), .5, 10, 1, 0, 0, 1),
        textureEnable: true,
        textureURL: './textures/circle_scatter.png'
      },
      toType: NodeType.LEAF_NODE,
      transformation: tube3Transform
    },
    {
      to: {
        name: "tube4",
        instance: InstanceType.SEMI_SPHERE,
        material: makeMaterial(vec4.fromValues(0, 1, 1, 1), .5, 10, 1, 0, 0, 1),
        textureEnable: true,
        textureURL: './textures/organic_patern.jpg'
      },
      toType: NodeType.LEAF_NODE,
      transformation: semiTransform
    }
    ]
  }
};

const generateArt1 = (): GroupNode => {
  return null;
};

const generateArt = (): GroupNode => {
  // Art 1
  // Art 2
  // Art 3
  const art3Transform = mat4.create();
  mat4.translate(art3Transform, art3Transform, vec3.fromValues(-600,550,0))
  mat4.rotateY(art3Transform, art3Transform, glMatrix.toRadian(90));
  mat4.rotateZ(art3Transform, art3Transform, glMatrix.toRadian(90));

  const movinAndGroovin = mat4.create();
  mat4.translate(movinAndGroovin, movinAndGroovin, vec3.fromValues(-850, 230, -700))
  mat4.rotateY(movinAndGroovin, movinAndGroovin, glMatrix.toRadian(115));
  mat4.scale(movinAndGroovin, movinAndGroovin, vec3.fromValues(1.5,1.5,1.5));
  
  return {
    name: "Calder 1",
    edges: [
      {
        to: generateArt2(),
        toType: NodeType.GROUP_NODE
      },
      {
        to: generateArt3(),
        toType: NodeType.GROUP_NODE,
        transformation: movinAndGroovin
      },
      {
        to: generateArt2(),
        toType: NodeType.GROUP_NODE,
        transformation: art3Transform
      }
    ]
  };
};

const generateHangingBulb = (): GroupNode => {
  // String
  // Actual Bulb
  // Light source
  return null;
}

const generateGround = (): GroupNode => {
  const semisphereTransform: mat4 = mat4.create();
  mat4.scale(semisphereTransform, semisphereTransform, vec3.fromValues(800, 300, 800));
  mat4.rotateX(semisphereTransform, semisphereTransform, glMatrix.toRadian(90));
  return {
    name: "ground semisphere",
    edges: [{
      to: {
        name: "ground instance",
        instance: InstanceType.SEMI_SPHERE,
        material: makeMaterial(vec4.fromValues(0, 0, 1, 1), .8, 50, .5, .1, .4, 2),
        //textureURL: './textures/blob-scene.png'
      },
      toType: NodeType.LEAF_NODE,
      transformation: semisphereTransform
    }]
  }
};

const generateGlobeCover = (): GroupNode => {
  const semisphereTransform: mat4 = mat4.create();
  mat4.scale(semisphereTransform, semisphereTransform, vec3.fromValues(600, 600, 600));
  return {
    name: "Globe Cover",
    edges: [{
      to: {
        name: "Translucent Globe Sphere",
        instance: InstanceType.SPHERE,
        material: makeMaterial(vec4.fromValues(1, 1, 1, 1), 1, 10, 0.1, 0, 0.9, 1),
      },
      toType: NodeType.LEAF_NODE,
      transformation: semisphereTransform,
    }]
  }
};


const generateTransparentPlane = (): GroupNode => {
  const transform = mat4.create();
  mat4.translate(transform, transform, vec3.fromValues(0,150, 250));
  //mat4.rotateX(transform, transform, glMatrix.toRadian(-45));
  mat4.rotateY(transform, transform, glMatrix.toRadian(45));
  mat4.scale(transform, transform, vec3.fromValues(300, 300, 30));
  return {
    name: "transparent sphere",
    edges: [
      {
        to: {
          name: 'sphere',
          instance: InstanceType.SPHERE,
          material: makeMaterial(vec4.fromValues(0,0,1,1), 1, 40, .1, 0, .9, 2),
        },
        toType: NodeType.LEAF_NODE,
        transformation: transform
      }
    ]
  }
}

export const generateSnowGlobe = (): GroupNode => {
  return {
    name: "Cool Snow Globe",
    edges: [
      /*{
      to: generateGlobeCover(),
      toType: NodeType.GROUP_NODE,
    },*/ {
      to: generateGround(),
      toType: NodeType.GROUP_NODE
      // }, {
      // to: generateHangingBulb(),
      // toType: NodeType.GROUP_NODE,
      // transformation: mat4.create(), // Move to the top of the sphere
      // }, {
      // to: generateSnowFlakes(),
      // toType: NodeType.GROUP_NODE
      }, {
      to: generateArt(),
      toType: NodeType.GROUP_NODE,
      transformation: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(300,0,0))
    },
    {
      to: generateTransparentPlane(),
      toType: NodeType.GROUP_NODE
    }
  ],
  };
};

