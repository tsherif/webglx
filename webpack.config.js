const webpack = require("webpack");
const path = require('path');
const fs = require('fs');

const license = fs.readFileSync('LICENSE', { encoding: "utf8" });

module.exports = {
    mode: "production",
    entry: "./src/webglx.js",
    plugins: [
        new webpack.BannerPlugin({
          banner: license
        })
    ],
    output: {
        library: "WebGLX",
        path: path.resolve(__dirname, "dist"),
        filename: "webglx.min.js",
        libraryTarget: "umd"
    }
};
