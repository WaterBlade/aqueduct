// tslint:disable:no-object-literal-type-assertion
import * as path from "path";
import { Configuration } from "webpack";

module.exports = {
    entry: "./src/index.ts",

    mode: 'development',

    output: {
        path: path.resolve("build"),
        filename: "index.js",
        libraryTarget: "umd",
        library: "aqueduct",
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        modules: [path.resolve("./src"), "node_modules"],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: ["ts-loader"],
            },
        ],
    },

    // Because docx is now targetting web
    // target: 'node',
} as Configuration;