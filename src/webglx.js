import {WEBGL2_ENUMS, WEBGL2_METHODS, WEBGL2_IMPLICIT_EXTENSIONS, WEBGL_EXTENSION_METHODS} from "./webgl2-api.js";

export function getWebGLXContext(canvas, {requireExtensions = [], contextOptions = {}, forceWebGL2 = false, forceWebGL1 = false} = {}) {
    let gl, version, implicitExtensions;

    if (!forceWebGL1) {
        gl = canvas.getContext("webgl2", contextOptions);
        version = 2;
        implicitExtensions = WEBGL2_IMPLICIT_EXTENSIONS;
    }

    if (!gl) {
        if (forceWebGL2) {
            return null;
        }
        gl = canvas.getContext("webgl", contextOptions) || canvas.getContext("experimental-webgl", contextOptions);
        version = 1;
        implicitExtensions = {};
    }

    if (gl && requireExtensions.every(ext => implicitExtensions[ext] || gl.getExtension(ext))) {
        return new WebGLXRenderingContext(gl, version, implicitExtensions);
    } else {
        return null;
    }
}

class WebGLXRenderingContext {
    constructor(gl, contextVersion, implicitExtensions) {
        this.webglx = {
            gl,
            contextVersion,
            implicitExtensions,
            extensionMethods: {}
        };

        for (const extName in WEBGL2_IMPLICIT_EXTENSIONS) {
            if (gl.getExtension(extName)) {
                implicitExtensions[extName] = true;
            }
        }

        for (const method in WEBGL_EXTENSION_METHODS) {
            if (!gl[method]) {
                const [extName, extMethod] = WEBGL_EXTENSION_METHODS[method];
                const ext = gl.getExtension(extName);
                if (ext) {
                    this.webglx.extensionMethods[method] = (...args) => ext[extMethod](...args);
                }
            }
        }
    }

    get canvas() {
        return this.webglx.gl.canvas;
    }

    get drawingBufferWidth() {
        return this.webglx.gl.drawingBufferWidth;
    }

    get drawingBufferHeight() {
        return this.webglx.gl.drawingBufferHeight;
    }

    getExtension(name) {
        if (this.webglx.implicitExtensions[name]) {
            return null;
        }

        return this.webglx.gl.getExtension(name);
    }

    getSupportedExtensions() {
        return this.webglx.gl.getSupportedExtensions().filter(name => !this.webglx.implicitExtensions[name]);
    }
};

Object.assign(WebGLXRenderingContext.prototype, WEBGL2_ENUMS);

WEBGL2_METHODS.forEach(method => {
    const ERROR_MESSAGE = `Method "${method}" not available.`
    if (!WebGLXRenderingContext.prototype[method]) {
        WebGLXRenderingContext.prototype[method] = function(...args) {
            if (this.webglx.gl[method]) {
                return this.webglx.gl[method](...args);
            } else if (this.webglx.extensionMethods[method]) {
                return this.webglx.extensionMethods[method](...args);  
            } else {
                throw new Error(ERROR_MESSAGE);
            }
        }; 
    }   
});
