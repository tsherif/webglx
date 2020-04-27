import {ENUMS, FUNCTIONS, WEBGL2_IMPLICIT_EXTENSIONS, WEBGL_EXTENSION_FUNCTIONS} from "./webgl-api.js";

export function getWebGLXContext(canvas, {requireExtensions = [], contextOptions = {}, forceWebGL2 = false, forceWebGL1 = false} = {}) {
    let gl, version, implicitExtensions;

    if (!forceWebGL1) {
        gl = canvas.getContext("webgl2", contextOptions);
        version = 2;
        implicitExtensions = WEBGL2_IMPLICIT_EXTENSIONS;
    }

    if (!gl) {
        if (forceWebGL2) {
            console.error("[WebGLX] WebGL 2 unavailable and forceWebGL2 flag is set.")
            return null;
        }
        gl = canvas.getContext("webgl", contextOptions) || canvas.getContext("experimental-webgl", contextOptions);
        version = 1;
        implicitExtensions = {};
    }

    if (!gl) {
        console.error("[WebGLX] WebGL unavailable.")
        return null;
    }

    for (let i = 0; i < requireExtensions.length; ++i) {
        const extName = requireExtensions[i];
        if (!implicitExtensions[extName] && !gl.getExtension(extName)) {
            console.error(`[WebGLX] Extension ${extName} unavailable.`);
            return null;
        }
    }

    if (gl) {
        return new createWebGLXContext(gl, version, implicitExtensions);
    } else {
        return null;
    }
}

function createWebGLXContext(gl, contextVersion, implicitExtensions) {
    const webglx = {
        gl,
        contextVersion,
        extensions: {},
        extensionFunctions: {},
        implicitExtensions,
        supportedExtensions: []
    };

    const glx = {
        webglx,

        get canvas() {
            return this.webglx.gl.canvas;
        },

        get drawingBufferWidth() {
            return this.webglx.gl.drawingBufferWidth;
        },

        get drawingBufferHeight() {
            return this.webglx.gl.drawingBufferHeight;
        },

        getExtension(extName) {
            if (this.webglx.implicitExtensions[extName]) {
                return this;
            } else {
                return this.webglx.extensions[extName];
            }
        },

        getSupportedExtensions() {
            return this.webglx.supportedExtensions;
        }
    };

    Object.assign(glx, ENUMS);

    gl.getSupportedExtensions().forEach(extName => webglx.extensions[extName] = gl.getExtension(extName));
    webglx.supportedExtensions = Object.keys(webglx.implicitExtensions).concat(gl.getSupportedExtensions());

    FUNCTIONS.forEach(fn => {
        if (glx[fn]) {
            return;
        }

        if (gl[fn]) {
            glx[fn] = (...args) => gl[fn](...args);
        } else if (WEBGL_EXTENSION_FUNCTIONS[fn]) {
            const [extName, extFunction] = WEBGL_EXTENSION_FUNCTIONS[fn];
            if (webglx.extensions[extName]) {
                const ext = webglx.extensions[extName];
                glx[fn] = (...args) => ext[extFunction](...args);
            }
        }

        if (!glx[fn]) {
            glx[fn] = () => { 
                throw new Error(`[WebGLX] Function "${fn}" not available.`);
            };
        }
    });

    return glx;
}
