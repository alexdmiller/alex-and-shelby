document.addEventListener("DOMContentLoaded", function () {
  var video = document.getElementById("video");
  if (video.readyState >= 1) {
    setup();
  } else {
    video.onloadedmetadata = setup;
  }
});

let attributes, uniforms, program;

let gl, canvas;

function setup() {
  canvas = document.getElementById("myCanvas");
  gl = canvas.getContext("webgl");

  const video = document.getElementById("video");
  video.play();

  canvas.width = video.videoWidth * 6;
  canvas.height = video.videoHeight * 6;

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  attachShader({
    fragmentShaderName: "shader-fs",
    vertexShaderName: "shader-vs",
    attributes: ["aVertexPosition"],
    uniforms: ["renderSize", "originalSize", "uSampler"],
  });

  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clearDepth(1.0);
  gl.disable(gl.DEPTH_TEST);
  positionsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
  var positions = [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  var vertexColors = [0xff00ff88, 0xffffffff];
  var cBuffer = gl.createBuffer();
  verticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
  var vertexIndices = [0, 1, 2, 0, 2, 3];
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(vertexIndices),
    gl.STATIC_DRAW
  );
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  //# must be LINEAR to avoid subtle pixelation (double-check this... test other options like NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  // update the texture from the video
  updateTexture = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    //# next line fails in Safari if input video is NOT from same domain/server as this html code
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  draw();
}

function draw() {
  var video = document.getElementById("video");

  if (video.readyState >= 3) {
    updateTexture();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
    gl.vertexAttribPointer(
      attributes["aVertexPosition"],
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    //# Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniforms["uSampler"], 0);
    gl.uniform2f(uniforms["originalSize"], video.videoWidth, video.videoHeight);
    gl.uniform2f(uniforms["renderSize"], canvas.width, canvas.height);
    //# Draw GPU
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  requestAnimationFrame(draw);
}

function attachShader(params) {
  fragmentShader = getShaderByName(params.fragmentShaderName);
  vertexShader = getShaderByName(params.vertexShaderName);
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(program)
    );
  }
  gl.useProgram(program);
  // get the location of attributes and uniforms
  attributes = {};
  for (var i = 0; i < params.attributes.length; i++) {
    var attributeName = params.attributes[i];
    attributes[attributeName] = gl.getAttribLocation(program, attributeName);
    gl.enableVertexAttribArray(attributes[attributeName]);
  }
  uniforms = {};
  for (i = 0; i < params.uniforms.length; i++) {
    var uniformName = params.uniforms[i];
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    gl.enableVertexAttribArray(attributes[uniformName]);
  }
}

function getShaderByName(id) {
  var shaderScript = document.getElementById(id);
  var theSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType === 3) {
      theSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
  var result;
  if (shaderScript.type === "x-shader/x-fragment") {
    result = gl.createShader(gl.FRAGMENT_SHADER);
  } else {
    result = gl.createShader(gl.VERTEX_SHADER);
  }
  gl.shaderSource(result, theSource);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    console.log(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(result)
    );
    return null;
  }
  return result;
}
