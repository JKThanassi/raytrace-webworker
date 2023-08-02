const path = require('path');

module.exports = {
    entry: './src/Assignment7.ts', //entry point of application
    //  watch: true, //enable to debug (step through)
    mode: 'development',
    module: { //details about grabbing modules to export
        rules: [
            {
                test: /\.worker\.ts$/,
                loader: "worker-loader"
            },
            {
                test: /\.tsx?$/, //use all files with this extension
                use: 'ts-loader', //pass to this program (Typescript transpiling + loading)
                exclude: /node_modules/ //exclude the folder with installed packages
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"], //apply this rule to all files with these extensions
        alias: { //alias to manage relative paths
            "%COMMON": path.resolve(__dirname, '../common') //resolve alias to this relative path
        }
    },
    output: {
        filename: 'Assignment7.js', //name of the final bundled JS file
        path: path.resolve(__dirname, 'out') //put bundled file in this folder
    },
    devtool: 'source-map', //enable source-map for debugging (stepping through). generates Assignment6.js.map
};
