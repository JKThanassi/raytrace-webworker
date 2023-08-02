import { mat4, vec2, vec3, vec4 } from 'gl-matrix';
import { HitRecord, InstanceType, ModelCacheObject, ObjectHitRecord, Ray } from './types';

const MISS: ObjectHitRecord = { enterHitRecord: null, exitHitRecord: null };

const getPoint = (t: number, position: vec4, direction: vec4, hComp: number = 1): vec4 => (
  // TODO: Faster way to do this?
  vec4.fromValues(position[0] + t * direction[0], position[1] + t * direction[1], position[2] + t * direction[2], hComp)
);

const cylinderIntersects = (ray: Ray, object: ModelCacheObject): ObjectHitRecord => {
  const {modelView: transform, inverseModelView: invTransform, normalMatrix} = object;
  const { direction, position } = transformRay(ray, invTransform);
  const [Vx, Vy, Vz] = direction;
  const [Sx, Sy, Sz] = position;

  const A = (Vx * Vx) + (Vy * Vy);
  const B = 2 * (Vx * Sx + Vy * Sy);
  const C = (Sx * Sx) + (Sy * Sy) - 0.25;

  const descrim = (B * B) - (4 * A * C)
  if (descrim < 0) {
    return MISS;
  }

  const sqrtDescrim = Math.sqrt(descrim);
  let t1 = (-B + sqrtDescrim) / (2 * A);
  let t2 = (-B - sqrtDescrim) / (2 * A);
  const tEnter = Math.min(t1, t2);
  const tExit = Math.max(t1, t2);
  const zEnter = Sz + tEnter * Vz;
  const zExit = Sz + tExit * Vz;

  const cylinderRecord = (t, z) => {
    if (-0.5 <= z && 0.5 >= z) {
      const point = getPoint(t, position, direction);
      const normal = vec4.fromValues(Sx + t * Vx, Sy + t * Vy, 0, 0);
      const texCoord = vec2.fromValues(Math.atan2(point[1], point[0]) / (2 * Math.PI), ((z / 2) + 0.5));
      vec4.normalize(normal, normal);
      return {
        t,
        hitPoint: vec4.transformMat4(point, point, transform),
        hitNormal: vec4.transformMat4(normal, normal, transform),
        hitTextureCoordinate: texCoord,
      };
    }
    return null;
  };

  let enterHitRecord = cylinderRecord(tEnter, zEnter);
  let exitHitRecord = cylinderRecord(tExit, zExit);

  if (!enterHitRecord && !exitHitRecord && Math.sign(zEnter) === Math.sign(zExit)) {
    return MISS;
  }

  const capRecord = (z) => {
    const zClamp = z < 0 ? -0.5 : 0.5;
    // What's the t, x, and y for this z value?
    // z = Sz + t * Vz;
    const t = (zClamp - Sz) / Vz;
    const point = getPoint(t, position, direction);
    const normal = vec4.fromValues(0, 0, Math.sign(zClamp), 0);
    const theta = Math.atan2(point[1], point[0]);
    const dist = Math.sqrt(point[1] * point[1] + point[0] * point[0]);
    const tTexCoord = (z < 0 ? (dist / 2) : ((0.5 - dist) / 2) + 0.75);
    return {
      t,
      hitPoint: vec4.transformMat4(point, point, transform),
      hitNormal: vec4.transformMat4(normal, normal, transform),
      hitTextureCoordinate: vec2.fromValues(theta / (2 * Math.PI), tTexCoord),
    }
  };

  enterHitRecord = enterHitRecord || capRecord(zEnter);
  exitHitRecord = exitHitRecord || capRecord(zExit);

  return {
    enterHitRecord,
    exitHitRecord,
  };
};

const cubeTextureCoordinates = (t: number, point: vec4, limitCoordinates: vec3) => {
  const [x, y, z, _] = point;
  const [tx, ty, tz] = limitCoordinates;
  let texCoords: vec2;

  if (t === tx) {
    if (x > 0) {
      // Unique (x === 0.5)
      texCoords = vec2.fromValues(-point[2], point[1]);
      // Not Unique
      vec2.add(texCoords, texCoords, [0.5, 0.5]);
      vec2.scale(texCoords, texCoords, 0.25);
      // Unique
      vec2.rotate(texCoords, texCoords, [0, 0], Math.PI);
      vec2.add(texCoords, texCoords, [0.5, 1]);
    } else {
      // Unique (x === -0.5)
      texCoords = vec2.fromValues(point[2], point[1]);
      // Not Unique
      vec2.add(texCoords, texCoords, [0.5, 0.5]);
      vec2.scale(texCoords, texCoords, 0.25);
      // Unique
      // vec2.rotate(texCoords, texCoords, [0, 0], Math.PI);
      vec2.add(texCoords, texCoords, [0.25, 0.25]);
    }
  }
  if (t === ty) {
    if (y > 0) {
      // Unique (y === 0.5)
      texCoords = vec2.fromValues(point[0], -point[2]);
      // Not Unique
      vec2.add(texCoords, texCoords, [0.5, 0.5]);
      vec2.scale(texCoords, texCoords, 0.25);
      // Unique
      vec2.rotate(texCoords, texCoords, [0, 0], Math.PI / 2);
      vec2.add(texCoords, texCoords, [0.5, 0.5]);
    } else {
      // Unique (y === -0.5)
      texCoords = vec2.fromValues(point[0], point[2]);
      // Not Unique
      vec2.add(texCoords, texCoords, [0.5, 0.5]);
      vec2.scale(texCoords, texCoords, 0.25);
      // Unique
      vec2.rotate(texCoords, texCoords, [0, 0], Math.PI / 2);
      vec2.add(texCoords, texCoords, [1, 0.5]);
    }
  }
  if (t === tz) {
    if (z > 0) {
      // Unique (z === 0.5)
      texCoords = vec2.fromValues(point[0], point[1]);
      // Not Unique
      vec2.add(texCoords, texCoords, [0.5, 0.5]);
      vec2.scale(texCoords, texCoords, 0.25);
      // Unique
      vec2.rotate(texCoords, texCoords, [0, 0], Math.PI / 2);
      vec2.add(texCoords, texCoords, [0.75, 0.5]);
    } else {
      // Unique (z === -0.5)
      texCoords = vec2.fromValues(-point[0], point[1]);
      // Not Unique
      vec2.add(texCoords, texCoords, [0.5, 0.5]);
      vec2.scale(texCoords, texCoords, 0.25);
      // Unique
      vec2.rotate(texCoords, texCoords, [0, 0], -Math.PI / 2);
      vec2.add(texCoords, texCoords, [0, 0.75]);
    }
  }
  return texCoords;
};

const boxIntersects = (ray: Ray, object: ModelCacheObject): ObjectHitRecord => {
  const {modelView: transform, inverseModelView: invTransform, normalMatrix} = object;
  const {direction, position} = transformRay(ray, invTransform);
  const [Vx, Vy, Vz] = direction;
  const [Sx, Sy, Sz] = position;

  const [ax, bx] = boxPlaneRange(Sx, Vx);
  const [ay, by] = boxPlaneRange(Sy, Vy);
  const [az, bz] = boxPlaneRange(Sz, Vz);

  const tEnter = Math.max(ax, ay, az);
  const tExit = Math.min(bx, by, bz);

  if (tEnter > tExit) {
      return MISS;
  }
  const hitRecord = (t, ifEnter = true) => {
    const x = Sx + t * Vx;
    const y = Sy + t * Vy;
    const z = Sz + t * Vz;
    const point = vec4.fromValues(x, y, z, 1);
    // const dist =
    const normal = vec4.fromValues(
      boxCompNormal(point[0]),
      boxCompNormal(point[1]),
      boxCompNormal(point[2]),
      0
    );
    const hitNormal = vec4.transformMat4(vec4.create(), normal, normalMatrix);
    const textureCoordinates = cubeTextureCoordinates(t, point, ifEnter ? [ax, ay, az] : [bx, by, bz]);
    //   let texCoords: vec2;
    return {
      t,
      hitPoint: vec4.transformMat4(point, point, transform),
      hitNormal: hitNormal,
      hitTextureCoordinate: textureCoordinates,
    };
  };

  return {
    enterHitRecord: hitRecord(tEnter),
    exitHitRecord: hitRecord(tExit, false),
  };
}

const roomIntersects = (ray: Ray, object: ModelCacheObject) => {
  const roomHitRecords = boxIntersects(ray, object);
  vec4.negate(roomHitRecords.enterHitRecord.hitNormal, roomHitRecords.enterHitRecord.hitNormal);
  vec4.negate(roomHitRecords.exitHitRecord.hitNormal, roomHitRecords.exitHitRecord.hitNormal);
  return roomHitRecords;
};

const boxCompNormal = (v: number) => Math.sign(v) * Math.round(Math.abs(v));

/**
 * This was Joe Kt's shit attemtp
 * @param Pi This is pi
 */
// const boxComponentNormal = (pi: number): number => {
  // if (Pi >= -.5 && Pi <= .5) {
  //   return Pi >= 0 ? 1 : -1;
  // } else {
  //   return 0;
  // }
  // return Math.sign(pi) * Math.round(Math.abs(pi))
// }

const cloneRay = (ray: Ray): Ray => {
  return {
    position: vec4.clone(ray.position),
    direction: vec4.clone(ray.direction),
  }
};

const transformRay = (ray: Ray, m: mat4): Ray => {
  const tray = cloneRay(ray);
  tray.position = vec4.transformMat4(tray.position, tray.position, m);
  tray.direction = vec4.transformMat4(tray.direction, tray.direction, m);
  return tray;
}

/**
 * This function takes in a part of a point and direction and returns the a_i and b_i for the box intersection calculations 
 * @param Si the component of the point (x,y,or z) to calculate
 * @param Vi the component of the direction
 * @returns the a_i and b_i for this component
 */
 const boxPlaneRange = (Si: number, Vi: number): number[] => {
    const t1 = (-.5 - Si)/Vi;
    const t2 =  (.5 - Si)/Vi;
    return [Math.min(t1,t2), Math.max(t1,t2)];
 }

const sphereIntersects = (ray: Ray, object: ModelCacheObject): ObjectHitRecord => {
  const {modelView: transform, inverseModelView: invTransform, normalMatrix} = object;
   // console.time('transformRay');
   const {direction, position} = transformRay(ray, invTransform);
   // console.timeEnd('transformRay');
   const [Vx, Vy, Vz] = direction;
   const [Sx, Sy, Sz] = position;
   const A = (Vx * Vx) + (Vy * Vy) + (Vz * Vz);
   const B = (2 * Vx * Sx) + (2 * Vy * Sy) + (2 * Vz * Sz);
   const C = (Sx * Sx) + (Sy * Sy) + (Sz * Sz) - 0.25;

   const descrim = (B * B) - (4 * A * C)
   if (descrim < 0) {
     return MISS;
   }

   const sqrtDescrim = Math.sqrt(descrim);
   const t1 = (-B + sqrtDescrim) / (2 * A);
   const t2 = (-B - sqrtDescrim) / (2 * A);
   const tEnter = Math.min(t1, t2);
  const tExit = Math.max(t1, t2);

  const hitRecord = (t) => {
    const point = vec4.fromValues(Sx + t * Vx, Sy + t * Vy, Sz + t * Vz, 1);
    const normal = vec4.clone(point);
    const theta = Math.atan2(point[1], point[0]);
    // const theta = enterPoint[1] < 0 ? Math.acos(enterPoint[0] / 0.5) + Math.PI : Math.acos(enterPoint[0] / 0.5);
    const fi = Math.acos(point[2] / 0.5);
    const texCoord = vec2.fromValues(0.5 * theta / Math.PI, (1 - (fi / Math.PI)));
    vec4.normalize(normal, normal);
    return {
      t,
      hitPoint: vec4.transformMat4(point, point, transform),
      hitNormal: vec4.transformMat4(normal, normal, normalMatrix),
      hitTextureCoordinate: texCoord,
    };
  };

   return {
     enterHitRecord: hitRecord(tEnter),
     exitHitRecord: hitRecord(tExit),
   }
}

const coneIntersects = (ray: Ray, object: ModelCacheObject): ObjectHitRecord => {
  const {modelView: transform, inverseModelView: invTransform, normalMatrix} = object;
  const {direction, position} = transformRay(ray, invTransform);
  const [Vx, Vy, Vz] = direction;
  const [Sx, Sy, Sz] = position;

  // x^2 + y^2 - z^2 = 0
  const A = (Vx * Vx) + (Vy * Vy) - (Vz * Vz);
  const B = 2 * ((Vx * Sx) + (Vy * Sy) - (Vz * Sz));
  const C = (Sx * Sx) + (Sy * Sy) - (Sz * Sz);

  const descrim = (B * B) - (4 * A * C)
  if (descrim < 0) {
    return MISS;
  }

  const sqrtDescrim = Math.sqrt(descrim);
  const t1 = (-B + sqrtDescrim) / (2 * A);
  const t2 = (-B - sqrtDescrim) / (2 * A);
  // const tEnter = Math.min(t1, t2);
  // const tExit = Math.max(t1, t2);
  const tEnter = Math.min(t1, t2);
  const tExit = Math.max(t1, t2);
  const zEnter = Sz + tEnter * Vz;
  const zExit = Sz + tExit * Vz;
  let enterHitRecord: HitRecord | null = null;
  let exitHitRecord: HitRecord | null = null;

  const coneRecord = (t, z) => {
    if (0 <= z && 1 >= z) {
      const point = getPoint(t, position, direction);
      const z = Sz + t * Vz;
      const normal = vec4.fromValues(0.5 * (Sx + t * Vx) / z, 0.5 * (Sy + t * Vy) / z, -Math.sqrt(2) / 2, 0);
      const theta = Math.atan2(point[1], point[0]);
      const tTexCoord = 1 - (z / 2);
      vec4.normalize(normal, normal);
      return {
        t,
        hitPoint: vec4.transformMat4(point, point, transform),
        hitNormal: vec4.transformMat4(normal, normal, normalMatrix),
        hitTextureCoordinate: vec2.fromValues(theta / (2 * Math.PI), tTexCoord),
      };
    }
    return null;
  };

  enterHitRecord = coneRecord(tEnter, zEnter);
  exitHitRecord = coneRecord(tExit, zExit);

  const capRecord = () => {
    // What's the t, x, and y for this z value?
    // z = Sz + t * Vz;
    const z = 1;
    const t = (z - Sz) / Vz;
    const point = getPoint(t, position, direction);
    const normal = vec4.fromValues(0, 0, 1, 0);
    const theta = Math.atan2(point[1], point[0]);
    const dist = Math.sqrt(point[1] * point[1] + point[0] * point[0]);
    const tTexCoord = (dist / 2);
    return {
      t,
      hitPoint: vec4.transformMat4(point, point, transform),
      hitNormal: vec4.transformMat4(normal, normal, transform),
      hitTextureCoordinate: vec2.fromValues(theta / (2 * Math.PI), tTexCoord),
    }
  };

  if (enterHitRecord) {
    if (!exitHitRecord) {
      if (zExit <= 0) {
        exitHitRecord = enterHitRecord;
        enterHitRecord = capRecord();
      } else {
        exitHitRecord = capRecord();
      }
    }
  } else if (exitHitRecord) {
    if (zEnter <= 0) {
      enterHitRecord = exitHitRecord;
      exitHitRecord = capRecord();
    } else {
      enterHitRecord = capRecord();
    }
  }

  return {
    enterHitRecord,
    exitHitRecord,
  }
};

const semisphereIntersects = (ray: Ray, object: ModelCacheObject): ObjectHitRecord => {
  const {modelView: transform, inverseModelView: invTransform, normalMatrix} = object;
  const {direction, position} = transformRay(ray, invTransform);
  const [Vx, Vy, Vz] = direction;
  const [Sx, Sy, Sz] = position;
  const A = (Vx * Vx) + (Vy * Vy) + (Vz * Vz);
  const B = (2 * Vx * Sx) + (2 * Vy * Sy) + (2 * Vz * Sz);
  const C = (Sx * Sx) + (Sy * Sy) + (Sz * Sz) - 0.25;

  const descrim = (B * B) - (4 * A * C)
  if (descrim < 0) {
    return MISS;
  }

  const sqrtDescrim = Math.sqrt(descrim);
  const t1 = (-B + sqrtDescrim) / (2 * A);
  const t2 = (-B - sqrtDescrim) / (2 * A);
  const tEnter = Math.min(t1, t2);
  const tExit = Math.max(t1, t2);
  const zEnter = Sz + tEnter * Vz;
  const zExit = Sz + tExit * Vz;

  const semisphereRecord = (t, z) => {
    if (0 <= z && 0.5 >= z) {
      const point = getPoint(t, position, direction);
      const normal = vec4.fromValues(Sx + t * Vx, Sy + t * Vy, Sz + t * Vz, 0);
      const theta = Math.atan2(point[1], point[0]);
      const fi = Math.acos(point[2] / 0.5);
      vec4.normalize(normal, normal);
      return {
        t,
        hitPoint: vec4.transformMat4(point, point, transform),
        hitNormal: vec4.transformMat4(normal, normal, normalMatrix),
        hitTextureCoordinate: vec2.fromValues(theta / (2 * Math.PI), (1 - (fi / Math.PI))),
      };
    }
    return null;
  };
  let enterHitRecord: HitRecord | null = semisphereRecord(tEnter, zEnter);
  let exitHitRecord: HitRecord | null = semisphereRecord(tExit, zExit);
  const capRecord = () => {
    // What's the t, x, and y for this z value?
    // z = Sz + t * Vz;
    const z = 0;
    const t = (z - Sz) / Vz;
    const point = getPoint(t, position, direction);
    const normal = vec4.fromValues(0, 0, 1, 0);
    const theta = Math.atan2(point[1], point[0]);
    const dist = Math.sqrt(point[1] * point[1] + point[0] * point[0]);
    const tTexCoord = dist;
    return {
      t,
      hitPoint: vec4.transformMat4(point, point, transform),
      hitNormal: vec4.transformMat4(normal, normal, transform),
      hitTextureCoordinate: vec2.fromValues(theta / (2 * Math.PI), tTexCoord),
    }
  };
  if (!enterHitRecord && !exitHitRecord) return MISS;
  enterHitRecord = enterHitRecord || capRecord();
  exitHitRecord = exitHitRecord || capRecord();

  return {
    enterHitRecord,
    exitHitRecord,
  }
};

export const intersects = (ray: Ray, object: ModelCacheObject): ObjectHitRecord => {
    const { instance } = object;
    switch (instance) {
      case InstanceType.CUBE:
        return boxIntersects(ray, object);
      case InstanceType.SPHERE:
        return sphereIntersects(ray, object);
      case InstanceType.CYLINDER:
        return cylinderIntersects(ray, object);
      case InstanceType.CONE:
        return coneIntersects(ray, object);
      case InstanceType.SEMI_SPHERE:
        return semisphereIntersects(ray, object);
      case InstanceType.ROOM:
        return roomIntersects(ray, object);
      default:
        // console.error("this shape type is not supported");
        return MISS;
    }
};
