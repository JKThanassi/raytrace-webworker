# Assignment 8
## Leo Belyi and Joseph Kaming-Thanassi

### Installation
- In the root directory run `npm install` or `yarn install` if you're using yarn to install the dependencies for this project.

### Building
- To build the code run `npm run build` or `yarn run build`
- To rebuild code on save run `npm run watch` or `yarn run watch`
- To rebuild code on save and serve the code run `npm run serve` or `yarn run serve`

## NOTE
- This assignment must be run with http-server as we source the shaders from the host directory.
- The colors for the DNA are randomized so that is why the colors are slightly different on the raytraced version vs the gl version


### Interacting with Camera
- There are three camera modes: Orbit, Survey, and FirstPerson
- Orbit mode is active by default but can be manually switched by hitting the `1` key
    - To rotate the model press the left and right keys
- Survey mode is activated by hitting the `2` key
- FirstPerson mode is activated by hitting the `3` key

### Interacting with Shaders
- There are two shading models: Plastic and Toon
- `S` toggles between them.

### Textures

We found open source images from the internet and used them for our textures

#### The textures that were not taken from the `demos` class repo:
- `dark-steel.jpg`: https://www.psdgraphics.com/file/dark-metal-texture.jpg
- `steel.png`: https://jooinn.com/images/metal-texture-1.jpg
- `wood.png`: https://publicdomainvectors.org/en/free-clipart/Wood-texture-vector-drawing/77789.html
- all of the additional textures used were generated using an adobe illustrator plugin
