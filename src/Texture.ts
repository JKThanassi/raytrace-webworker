import { vec2, vec4 } from "gl-matrix";
import { Texture } from './types';

export const createTexture = async (name: string, textureURL: string): Promise<Texture> => {
  return new Promise<Texture>((resolve) => {
    const image = new Image();
    image.src = textureURL;
    image.addEventListener("load", () => {
      let canvas: HTMLCanvasElement = document.createElement("canvas");
      let context: CanvasRenderingContext2D = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, image.width, image.height).data;
      const width = canvas.width;
      const height = canvas.height;
      resolve({
        texture: data,
        width,
        height,
        name,
        url: textureURL
      });
    });
  });
};

export const getTextureColor = (texture: Texture, point: vec2): vec4 => {
  let x1: number, y1: number, x2: number, y2: number;
  let [x, y] = point;

  x = x - Math.trunc(x); //REPEAT
  y = y - Math.trunc(y); //REPEAT

  x1 = Math.trunc(x * texture.width);
  y1 = Math.trunc(y * texture.height);

  x1 = (x1 + texture.width) % texture.width;
  y1 = (y1 + texture.height) % texture.height;

  x2 = x1 + 1;
  y2 = y1 + 1;

  if (x2 >= texture.width)
    x2 = texture.width - 1;

  if (y2 >= texture.height)
    y2 = texture.height - 1;

  let one: vec4 = lookup(texture, x1, y1);
  let two: vec4 = lookup(texture, x2, y1);
  let three: vec4 = lookup(texture, x1, y2);
  let four: vec4 = lookup(texture, x2, y2);

  let inter1: vec4, inter2: vec4, inter3: vec4;

  inter1 = vec4.lerp(vec4.create(), one, three, y - Math.trunc(y));
  inter2 = vec4.lerp(vec4.create(), two, four, y - Math.trunc(y));
  inter3 = vec4.lerp(vec4.create(), inter1, inter2, x - Math.trunc(x));

  return vec4.fromValues(inter3[0] / 255, inter3[1] / 255, inter3[2] / 255, inter3[3]);
}

const lookup = (texture: Texture, x: number, y: number): vec4 => {
  const { texture: data, width } = texture;
  return vec4.fromValues(
    data[4 * (y * width + x)],
    data[4 * (y * width + x) + 1],
    data[4 * (y * width + x) + 2],
    data[4 * (y * width + x) + 3]);
}
