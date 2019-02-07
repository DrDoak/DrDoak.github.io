var u_isTexture = 0;
var u_isTextureID = 0;			  // GPU location of this uniform var
var u_isTexture2ID = 0;        // GPU location of this uniform var
var gl
var numVerts
var currLookY 

var camPosX = 0;
var camPosY = 1;
var camPosZ = -1;

var GoalX=  1;
var GoalY = 0;
var GoalZ = 0;
var distPers = 100;



// Global vars for 3D scene variables (previously used as arguments to draw() function)
var canvas  = false;
var gl      = false;
var n_vcount= false;
                      
//  Global vars that hold GPU locations for 'uniform' variables.
//    -- For 3D camera and transforms:
var uLoc_eyePosWorld  = false;
var uLoc_Gmode = false;
var gMode = 0.0;
var sMode = 0;
var u_ModelMatrix   = false;
var uLoc_MvpMatrix    = false;
var u_NormalMatrix = false;
var floatsPerVertex = 10;
var cameraMade = false

// global vars that contain the values we send thru those uniforms,
//  ... for our camera:
var eyePosWorld = new Float32Array(3);  // x,y,z in world coords
//  ... for our transforms:
var modelMatrix = new Matrix4();  // Model matrix
var normalMatrix= new Matrix4();  // Transformation matrix for normals
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var isTurretTurn = false;

//  ... for our first light source:   (stays false if never initialized)
var lamp0 = new LightsT();
var lamp1 = new LightsT();
var light1X = 0.0;
var light1Y = 5.0;
var light1Z = 0.0;

var light2X = 0.0;
var light2Y = 15.0;
var light2Z = 0.0;


var height = 0
var width = 0
var scene = 1
var reflecNow = false

  // ... for our first material:
var matlSel= MATL_RED_PLASTIC;        // see keypress(): 'm' key changes matlSel
var matl0 = new Material(matlSel);  

var angleX = 0;
var angleY = 1.57;
var angleZ = 0;
var numTex
var numVert
var currentScene = 2

// For the VBOs & Shaders:-----------------
preView = new VBObox1();    // For WebGLpreview: holds one VBO and its shaders
rayView = new VBObox2();    // for displaying the ray-tracing results.
myScene = new CScene();
myScene2 = new CScene();
var myImg = new CImgBuf();

function main() {
  window.addEventListener("keypress", myKeyPress, false);
  var canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  browserResize();

  if (numTex < 0) {
    console.log('Failed to set up vertex buffer objects');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);	
  preView.init(gl);   // VBO + shaders + uniforms + attribs for WebGL preview
  rayView.init(gl);   //  "   "   " to display ray-traced on-screen result.
			
  gl.enable(gl.DEPTH_TEST); // CAREFUL! don't do depth tests for 2D!
  if (!rayView.initTextures(gl, numTex,false)) {
    console.log('Failed to intialize the texture object(s).');
    return;
  }

  lamp0.I_pos.elements.set( [6.0, 5.0, 5.0]);
  lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);
  lamp0.isLit = 1.0 

  lamp1.I_pos.elements.set( [0.0, 5.0, 5.0]);
  lamp1.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp1.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp1.I_spec.elements.set([1.0, 1.0, 1.0]);
  lamp1.isLit = 1.0
  calculateLook()

  myScene.item[1] = new CGeom(1);
  myScene.item[1].matl = new CMatl(6)
  myScene.item[1].matlFunc = MatlMarble
  myScene.item[1].rayScale(0.5,0.5,0.5)
  myScene.item[1].rayTranslate(0.5,1.5,-0.5)

  myScene.item[2] = new CGeom(1);
  myScene.item[2].matl = new CMatl(4)
  myScene.item[2].matlFunc = MatlSpot
  myScene.item[2].rayTranslate(0,4,0)
  myScene.item[2].rayScale(1,1,1)

  myScene.item[3] = new CGeom(1);
  myScene.item[3].matl = new CMatl(5)
  myScene.item[3].rayTranslate( -0.5,2,-0.5)
  myScene.item[3].rayScale(0.5,0.5,0.5)

  myScene.item[4] = new CGeom(1);
  myScene.item[4].matl = new CMatl(6)
  myScene.item[4].matlFunc = MatlCheckerBoard
  myScene.item[4].rayScale(1.0,1.0,1.0)
  myScene.item[4].rayTranslate(2.5,4,0.1)

  myScene.item[5] = new CGeom(1);
  myScene.item[5].matl = new CMatl(2)
  myScene.item[5].rayScale(0.5,0.5,0.5)
  myScene.item[5].rayTranslate(-2,4,3)
/////====================
  myScene.item[7] = new CGeom(2);
  myScene.item[7].matl = new CMatl(0)
  myScene.item[7].rayTranslate(-2.0,4.0,0.5)
  myScene.item[7].rayScale(1.0,1.0,1.0)

  myScene.item[10] = new CGeom(2);
  myScene.item[10].matlFunc = MatlMarble
  myScene.item[10].matl = new CMatl(1)
  myScene.item[10].rayTranslate(-1.5,2.5,0)
  myScene.item[10].rayScale(0.5,0.5,0.5)

  myScene.item[8] = new CGeom(2);
  myScene.item[8].matl = new CMatl(2)
  myScene.item[8].matlFunc = MatlGradient
  myScene.item[8].rayTranslate(1.5,2,0)
  myScene.item[8].rayScale(0.5,0.5,0.5)

  myScene.item[9] = new CGeom(2);
  myScene.item[9].matl = new CMatl(4)
  myScene.item[9].matlFunc = MatlSpot
  myScene.item[9].rayTranslate(3,3,0.5)

  myScene.item[6] = new CGeom(3);
  myScene.item[6].matlFunc = MatlCheckerBoard
  myScene.item[6].matl = new CMatl(5)
  myScene.item[6].rayTranslate(0.0,6.0,5.0)
  myScene.item[6].rayScale(3,3,3)

//=====================
  spotList = new Array()
  spotList.push(vec3.fromValues(0,-5,0))
  spotList.push(vec3.fromValues(0,5,0))
  spotList.push(vec3.fromValues(5,0,0))
  spotList.push(vec3.fromValues(-5,0,0))
  spotList.push(vec3.fromValues(0,0,-5))
  spotList.push(vec3.fromValues(0,0,5))

  myScene2.item[1] = new CGeom(1);
  myScene2.item[1].matl = new CMatl(5)
  myScene2.item[1].rayTranslate( 0,4,0.5)
  myScene2.item[1].rayScale(2.0,2.0,2.0)
  myScene2.item[1].transparent = true

  myScene2.item[2] = new CGeom(1);
  myScene2.item[2].matl = new CMatl(5)
  myScene2.item[2].rayTranslate( -1.5,2,-0.5)
  myScene2.item[2].rayScale(0.5,0.5,0.5)

  myScene2.item[3] = new CGeom(1);
  myScene2.item[3].matl = new CMatl(2)
  myScene2.item[3].rayTranslate( 3,4,0.0)
  myScene2.item[3].rayScale(1.0,1.0,1.0)

  myScene2.item[4] = new CGeom(1);
  myScene2.item[4].matl = new CMatl(6)
  myScene2.item[4].matlFunc = MatlMarble
  myScene2.item[4].rayTranslate( -3.0,8,0.5)
  myScene2.item[4].rayScale(2.0,2.0,2.0)

// //=====================
  myScene2.item[5] = new CGeom(2);
  myScene2.item[5].matl = new CMatl(6)
  myScene2.item[5].rayTranslate( 2,9,1.0)
  myScene2.item[5].rayScale(2.0,2.0,2.0)

  myScene2.item[6] = new CGeom(2);
  myScene2.item[6].matl = new CMatl(6)
  myScene2.item[6].matlFunc = MatlMarble
  myScene2.item[6].rayTranslate( -4.0,5.5,-0.5)
  myScene2.item[6].rayScale(0.5,0.5,0.5)

  myScene2.item[7] = new CGeom(2);
  myScene2.item[7].matl = new CMatl(5)
  myScene2.item[7].rayTranslate( -6,6.5,0.0)
  myScene2.item[7].rayScale(1.0,1.0,1.0)

  myScene2.item[8] = new CGeom(2);
  myScene2.item[8].matl = new CMatl(4)
  myScene2.item[8].rayTranslate( 6,8.5,0.5)
  myScene2.item[8].rayScale(1.5,1.5,1.5)

  myScene2.item[9] = new CGeom(3);
  myScene2.item[9].matl = new CMatl(6)
  myScene2.item[9].matlFunc = MatlMarble
  myScene2.item[9].rayTranslate( 2,1.5,-0.5)
  myScene2.item[9].rayScale(1.0,1.0,1.0)
/////====================


  var tick = function() {    
    // Send this matrix to our Vertex and Fragment shaders through the
    lamp1.I_pos.elements.set( [camPosX,camPosY,camPosZ]);
    lamp0.I_pos.elements.set( [light1X,light1Y,light1Z]);
    drawAll(gl,numVert);
    requestAnimationFrame(tick, canvas); 
  };
  tick(); 
  //redrawRayTrace(gl,numTex)
}
/*
function initTextureBuffer(gl) {
//==============================================================================
// 4 vertices for a texture-mapped 'quad' (square) to fill almost all of the CVV
  var verticesTexCoords = new Float32Array([
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    -0.95,  0.95,   	0.0, 1.0,				// upper left corner,
    -0.95, -0.95,   	0.0, 0.0,				// lower left corner,
     0.95,  0.95,   	1.0, 1.0,				// upper right corner,
     0.95, -0.95,   	1.0, 0.0,				// lower left corner.
  ]);
  var n = 4; // The number of vertices

  // Create the vertex buffer object in the GPU
  var vertexTexCoordBufferID = gl.createBuffer();
  if (!vertexTexCoordBufferID) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the this vertex buffer object to target (ARRAY_BUFFER).  
  // (Why 'ARRAY_BUFFER'? Because our array holds vertex attribute values.
  //	Our only other target choice: 'ELEMENT_ARRAY_BUFFER' for an array that 
  // holds indices into another array that holds vertex attribute values.)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBufferID);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;	// number of bytes/value
  //---------------------------
  //Get the GPU location of a_Position attribute; assign * enable buffer
  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_PositionID < 0) {
    console.log('Failed to get the GPU storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_PositionID, 		// select the vertex attrib in the GPU
  												2, 					// # of values per attrib (1,2,3, or 4)
  												gl.FLOAT, 	// data-type of each value in this attrib
  												false, 			// is this attrib already normalized?
  												FSIZE*n, 		// stride: # of bytes from start of 
  																		// this attribute to the start of the next
  												0);					// start location (number of bytes to skip
  																		// before you reach the first attrib value)
  gl.enableVertexAttribArray(a_PositionID);  
  																// Enable extraction of this attribute from
  																// the currently-bound buffer object=
  //---------------------------
  // Get the storage location of a_TexCoord attribute: assign & enable buffer
  var a_TexCoordID = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoordID < 0) {
    console.log('Failed to get the GPU storage location of a_TexCoord');
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable
  gl.vertexAttribPointer(a_TexCoordID, 	// select the vertex attrib in the GPU 
  												2, 					// # of values per attrib (1,2,3, or 4)
  												gl.FLOAT, 	// data-type of each value in this attrib
  												false, 			// is this attrib already normalized?
  												FSIZE*n, 		// stride: # of bytes from start of this
  																		// attribute to the start of the next
  												FSIZE*2);		// Start location (number of bytes to skip 
  																		// before you reach the first attrib value)
  gl.enableVertexAttribArray(a_TexCoordID);  
  																// Enable extraction of this attribute from
  																// the currently-bound buffer object
    //---------------------------
    // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return n;
}
*/

function drawAll(gl,nV) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawLeft(gl,nV)
  drawRight(gl,nV)
}

function drawLeft(gl,nV) {
  //var vWidth = gl.drawingBufferWidth/2
  gl.viewport(0,                              // Viewport lower-left corner
              0,                              // (x,y) location(in pixels)
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight);
  // select fixed-color drawing: 
  // Send the new matrix values to their locations in the GPU:
  // if (scene == 1) {
  //   drawMyScene(gl)
  // } else {
  //   drawMyScene2(gl)
  // }
  preView.draw(gl)
}
function drawRight(gl,nV) {
  gl.viewport(gl.drawingBufferWidth/2,        // Viewport lower-left corner
              0,                              // location(in pixels)
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight);
  rayView.draw(gl);
}

function redrawRayTrace(gl,n) {
  //initTextureBuffer(gl)
  if (currentScene == 1) {
    //console.log("updateding raytracer")
    updateRayTraceVars(myScene)
    myScene.draw(gl,numTex)
  } else {
    console.log("drawing Scene 2")
    updateRayTraceVars(myScene2)
    myScene2.draw(gl,numTex)
  }
  drawRight(gl,numTex)
  //initVertexBuffers(gl)
}

function updateRayTraceVars(scn) {
  var cam = scn.rayCam
  cam.eyePt = vec4.fromValues(camPosX,camPosZ,camPosY,1)
  //console.log(cam.eyePt)

  cam.setLookAt(camPosX,camPosZ,camPosY,GoalX,GoalZ,GoalY,VecX,VecY,VecZ)
  scn.lights[0].pos = vec4.fromValues(light1X,(light1Z-4),light1Y,1)
  scn.lights[1].pos = vec4.fromValues(camPosX,camPosZ,camPosY,1)
  //myScene.item[2].pos = vec4.fromValues(-light1X,-light1Z,light1Y,1)
  // console.log("updated Ray Tracer's camera and lights")
}
function browserResize() {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="browserResize()">

  /* SOLUTION to a pesky problem: 
  The main() function retrieves our WebGL drawing context as the variable 'gl', then shares it as an argument to other functions.  
  That's not enough!
  How can we access the 'gl' canvas within functions that main() will NEVER call, such as the mouse and keyboard-handling functions, or winResize()? Easy! make our own local references to the current canvas and WebGL drawing
  context, like this: */

	var myCanvas = document.getElementById('webgl');	// get current canvas
	var myGL = getWebGLContext(myCanvas);							// and its current context:
	//Report our current browser-window contents:

 console.log('myCanvas width,height=', myCanvas.width, myCanvas.height);		
 console.log('Browser window: innerWidth,innerHeight=', 
																innerWidth, innerHeight);	
										// See: http://www.w3schools.com/jsref/obj_window.asp
	
	//Make a square canvas/CVV fill the SMALLER of the width/2 or height:
	if(innerWidth > 2*innerHeight) {  // fit to brower-window height
		myCanvas.width = 2*innerHeight-20;
		myCanvas.height = innerHeight-20;
	  }
	else {	// fit canvas to browser-window width
		myCanvas.width = innerWidth-20;
		myCanvas.height = 0.5*innerWidth-20;
	  }	 
 console.log('NEW myCanvas width,height=', myCanvas.width, myCanvas.height);
  width = innerWidth
  height = innerHeight		
}


function initArrayBuffer(gl, attribute, data, type, num) {
//-------------------------------------------------------------------------------
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function pushLightUniforms(gl) {
  gl.uniform3fv(lamp0.u_pos,  lamp0.I_pos.elements.slice(0,3));
  gl.uniform3fv(lamp0.u_ambi, lamp0.I_ambi.elements);   // ambient
  gl.uniform3fv(lamp0.u_diff, lamp0.I_diff.elements);   // diffuse
  gl.uniform3fv(lamp0.u_spec, lamp0.I_spec.elements);   // Specular
  gl.uniform1f(lamp0.u_isLit,lamp0.isLit)
  
  gl.uniform3fv(lamp1.u_pos,  lamp1.I_pos.elements.slice(0,3));
  gl.uniform3fv(lamp1.u_ambi, lamp1.I_ambi.elements);   // ambient
  gl.uniform3fv(lamp1.u_diff, lamp1.I_diff.elements);   // diffuse
  gl.uniform3fv(lamp1.u_spec, lamp1.I_spec.elements);   // Specular
  gl.uniform1f(lamp1.u_isLit,lamp1.isLit)
}

function pushMatlUniforms(gl) {
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  gl.uniform1i(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 
}
































////////////////////////////////////////////////////////////////////////////////////
// allowable values for CGeom.shapeType variable.  Add some of your own!
const JT_GNDPLANE = 0;    // An endless 'ground plane' surface.
const JT_SPHERE   = 1;    // A sphere.
const JT_BOX      = 2;    // An axis-aligned cube.
const JT_CYLINDER = 3; 
const JT_TRIANGLE = 4;    // a triangle with 3 vertices.
const JT_BLOBBIES = 5;    // Implicit surface:Blinn-style Gaussian 'blobbies'.


function CRay() {
//==============================================================================
// Object for a ray in an unspecified coord. system (usually 'world' coords).
  this.orig = vec4.fromValues(0,0,0,1);     // Ray starting point (x,y,z,w)
                                            // (default: at origin
  this.dir =  vec4.fromValues(0,0,-1,0);      // The ray's direction vector 
                                            // (default: look down -z axis)
  this.at = function(t) {
    var newVec = this.orig + (t * this.dir)
    return newVec
  }
  this.normalizeVec = function() {
    var length = Math.sqrt((this.dir[0] * this.dir[0]) + (this.dir[g121] * this.dir[1]) + (this.dir[2] * this.dir[2]))
    this.dir[0] = this.dir[0] / length
    this.dir[1] = this.dir[1] / length
    this.dir[2] = this.dir[2] / length
  }
}

CRay.prototype.printMe = function(name) {
//==============================================================================
// print ray's values in the console window:
  if(name == undefined) name = ' ';
  console.log('CRay:', name, '   origin:\t', this.orig[0], ',\t',
                        this.orig[1], ',\t', this.orig[2], ',\t', this.orig[3]);
  console.log('     ', name, 'direction:\t',  this.dir[0], ',\t',
                         this.dir[1], ',\t',  this.dir[2], ',\t',  this.dir[3]);
}

function CCamera() {
//==============================================================================
// Object for a ray-tracing camera defined the 'world' coordinate system, with
// a) -- 'extrinsic' parameters that set the camera's position and aiming
//  from the camera-defining UVN coordinate system 
// (coord. system origin at the eye-point; coord axes U,V define camera image 
// horizontal and vertical; camera gazes along the -N axis): 
// Default settings: put camera eye-point at world-space origin, and
  this.eyePt = vec4.fromValues(0,0,9,1);
  this.uAxis = vec4.fromValues(1,0,0,0);  // camera U axis == world x axis  
  this.vAxis = vec4.fromValues(0,1,0,0);  // camera V axis == world y axis
  this.nAxis = vec4.fromValues(0,0,1,0);  // camera N axis == world z axis.
        // (and thus we're gazing down the -Z axis with default camera). 
  cameraMade = true
// b) --  Camera 'intrinsic' parameters that set the camera's optics and images.
// They define the camera's image frustum: its image plane is at N = -znear  (the
// plane that 'splits the universe', perpendicular to N axis), and no 'zfar' 
// plane at all (not needed: ray-tracer doesn't have or need the CVV).  
// The ray-tracing camera creates an rectangular image plane perpendicular to  
//  the cam-coord. system N axis at -iNear (defined by N vector in world coords),
//      horizontally  spanning 'iLeft' <= u <= 'iRight' along the U vector, and
//      vertically    spanning  'iBot' <= v <=  'iTop' along the V vector. 
// As the default camera creates an image plane at distance iNear = 1 from the 
// camera's center-of-projection (at the u,v,n origin), these +/-1 
// defaults define a square ray-traced image with a +/-45-degree field-of-view:
  this.iNear = 1.0;
  this.iLeft = -1.0;    
  this.iRight = 1.0;
  this.iBot =  -1.0;
  this.iTop =   1.0; 
// And the lower-left-most corner of the image is at (u,v,n) = (iLeft,iBot,-1).
  this.xmax = 256;      // horizontal,
  this.ymax = 256;      // vertical image resolution.
// To ray-trace an image of xmax,ymax pixels, divide this rectangular image plane
// into xmax,ymax rectangular tiles, and shoot eye-rays from the camera's
// center-of-projection through those tiles to find scene color values.  For the 
// simplest, fastest image (without antialiasing) trace each eye-ray through the 
// CENTER of each tile to find pixel colors.  For slower, better-looking, 
// anti-aliased image making, apply jittered super-sampling:
//  For each pixel:   --subdivide the 'tile' into equal-sized 'sub-tiles'  
//                    --trace one ray per sub-tile, but randomize (jitter)
//                       the ray's position within the sub-tile,
//                    --set pixel color to the average of all sub-tile colors. 
// Divide the image plane into rectangular tiles, one for each pixel:
  this.ufrac = (this.iRight - this.iLeft) / this.xmax;  // pixel tile's width
  this.vfrac = (this.iTop   - this.iBot ) / this.ymax;  // pixel tile's height.
  this.setAngle = function(xRot) {
    this.uAxis = vec4.fromValues(1,0,0,0);  // camera U axis == world x axis      
    this.vAxis = vec4.fromValues(0,Math.cos(xRot),Math.sin(xRot),0);  // camera V axis == world y axis
    this.nAxis = vec4.fromValues(0,Math.sin(xRot),Math.cos(xRot),0);  // camera N axis == world z axis.
  }
  CCamera.prototype.setLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
  var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

  fx = centerX - eyeX;
  fy = centerY - eyeY;
  fz = centerZ - eyeZ;
  // Normalize f.
  rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
  fx *= rlf;
  fy *= rlf;
  fz *= rlf;

  // Calculate cross product of f and up.
  sx = fy * upZ - 0 * upY;
  sy = 0 * upX - Math.abs(fx) * upZ;
  sz = Math.abs(fx)* upY - fy * upX;

  // Normalize s.
  rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
  sx *= rls;
  sy *= rls;
  sz *= rls;

  // Calculate cross product of s and f.
  ux = sy * fz - sz * fy;
  uy = sz * fx - sx * fz;
  uz = sx * fy - sy * fx;

  // vec4.transformMat4(this.nAxis,temp,mat)
  this.uAxis = vec4.fromValues(ux,uy,uz,0)
  vec4.normalize(this.uAxis,this.uAxis)
  console.log("Uaxis:")
  console.log(this.uAxis)
  this.nAxis = vec4.fromValues(-fx,-fy,-fz,0)
  vec4.normalize(this.nAxis,this.nAxis)
 // console.log(this.nAxis)
  this.vAxis = vec4.fromValues(sx,sy,sz,0)
  vec4.normalize(this.vAxis,this.vAxis)
 // console.log(this.vAxis)
  // Translate.

  //return this.translate(-eyeX, -eyeY, -eyeZ);
};

this.setEyeRay = function(myeRay, xpos, ypos,xJitter,yJitter,jitterDim) {

// Convert image-plane location (xpos,ypos) in the camera's U,V,N coords:
// var posU = this.iLeft + xpos*this.ufrac;  // U coord,
// var posV = this.iBot  + ypos*this.vfrac;  // V coord,
var frac = (1.0/jitterDim)
var posU
var posV
if (jitterSet) {
  var randomVal = Math.random() * (this.ufrac * frac * 0.5) - ((this.ufrac * frac) * 0.25)
  posU = this.iLeft + xpos*this.ufrac + (xJitter * this.ufrac * frac - (this.ufrac * frac) + randomVal);  // U coord,
  randomVal = Math.random() * (this.ufrac * frac * 0.5) - ((this.ufrac * frac) * 0.25)
  posV = this.iBot  + ypos*this.vfrac + (yJitter * this.ufrac * frac - (this.ufrac * frac) + randomVal);  // V coord,
} else {
  posU = this.iLeft + xpos*this.ufrac + (xJitter * this.ufrac * frac - (this.ufrac * frac));  // U coord,
  posV = this.iBot  + ypos*this.vfrac + (yJitter * this.ufrac * frac - (this.ufrac * frac));  // V coord,
}

//  and the N coord is always -1, at the image-plane (zNear) position.
// Then convert this point location to world-space X,Y,Z coords using our 
// camera's unit-length coordinate axes uAxis,vAxis,nAxis
  xyzPos = vec4.create();    // make vector 0,0,0,0. 
  vec4.scaleAndAdd(xyzPos,xyzPos, this.uAxis, posU); // xyzPos += Uaxis * posU;
  vec4.scaleAndAdd(xyzPos,xyzPos, this.vAxis, posV); // xyzPos += Vaxis * posU;
  vec4.scaleAndAdd(xyzPos, xyzPos, this.nAxis, -1.0); 

  vec4.copy(myeRay.orig, this.eyePt); 
  vec4.copy(myeRay.dir, xyzPos);
  vec4.normalize(myeRay,myeRay)
}
}

function CGeom(shapeSelect) {
  this.matl = new CMatl(1)
  if(shapeSelect == undefined) shapeSelect = JT_GNDPLANE;  // default
  this.shapeType = shapeSelect;
  this.transparency = 0.7
  this.reflectance = 0.4
  
  this.world2model = mat4.create();   // the matrix used to transform rays from
                                      // 'world' coord system to 'model' coords;
                                      // Use this to set shape size, position,
                                      // orientation, and squash/stretch amount.
  this.modelMatrix = mat4.create();
  this.inverseScale = mat4.create();
  this.inverseTranslate = mat4.create();
  this.inverseRotate = mat4.create();

  // Ground-plane 'Line-grid' parameters:
  this.zGrid = -15.0;  // create line-grid on the unbounded plane at z=zGrid
  this.xgap = 1.0;  // line-to-line spacing
  this.ygap = 1.0;
  this.lineWidth = 0.1; // fraction of xgap used for grid-line width
  this.lineColor = vec4.fromValues(0.1,0.5,0.1,1.0);  // RGBA green(A== opacity)
  this.gapColor = vec4.fromValues( 0.9,0.9,0.9,1.0);  // near-white
  this.skyColor = vec4.fromValues( 0.1,0.1,0.9,1.0);  // near-white
  this.ctr = vec4.fromValues(0,0,0,1);  // camera U axis == world x axis  
  this.temp = vec4.fromValues(0,0,5,1);  // camera U axis == world x axis 
  this.worldRay2Model = mat4.create(); 
  console.log("initialized new shape")
  //this.worldRay2Model = mat4.translate(this.worldRay2Model,this.worldRay2Model,this.temp)
  this.traceGeom = function(inRay) {




    if (this.shapeType == 0) {
      return this.traceGrid(inRay)
    }else if (this.shapeType == 1) {
      return this.traceSphere(inRay)
    }else if (this.shapeType == 2) {
      return this.traceCylinder(inRay)
    } else if (this.shapeType == 3) {
      return this.traceCube(inRay)
    }
  }
  this.traceGrid = function(inRay) {
  //==============================================================================
  // Find intersection of CRay object 'inRay' with the grid-plane at z== this.zGrid
  // return -1 if ray MISSES the plane
  // return  0 if ray hits BETWEEN lines
  // return  1 if ray hits ON the lines
  // HOW?!?
  // 1) we parameterize the ray by 't', so that we can find any point on the
  // ray by:
  //          Ray(t) = ray.orig + t*ray.dir
  // To find where the ray hit the plane, solve for t where R(t) = x,y,zGrid:
  //          Ray(t0) = zGrid = ray.orig[2] + t0*ray.dir[2];
  //  solve for t0:   t0 = (zGrid - ray.orig[2]) / ray.dir[2]
  //  then find x,y value along ray for value t0:
  //  hitPoint = ray.orig + t0*ray.dir
  //  BUT if t0 <0, we can only hit the plane at points BEHIND our camera;
  //  thus the ray going FORWARD through the camera MISSED the plane!.
  //
  // 2) Our grid-plane exists for all x,y, at the value z=zGrid.
  //      location x,y, zGrid is ONs the lines on the plane if
  //          (x/xgap) has fractional part < linewidth  *OR*
  //          (y/ygap) has fractional part < linewidth.
  //      otherwise ray hit BETWEEN the lines.

    var zGrid = -1
    var xgap = 0.5
    var ygap = 0.5
    var lineWidth = 0.1

    if (inRay.dir[2] >= 0) {
      //console.log("st")
      return -1
    } else {
      var t0 = (zGrid - inRay.orig[2]) / (inRay.dir[2] * 1.0)
      // console.log(inRay.dir)
      // console.log(inRay.orig)
      var hitPoint = vec4.fromValues(0,0,0,1)
      hitPoint[0] = inRay.orig[0] + (t0 * inRay.dir[0])
      hitPoint[1] = inRay.orig[1] + (t0 * inRay.dir[1])
      hitPoint[2] = inRay.orig[2] + (t0 * inRay.dir[2])

      //console.log(hitPoint)
      //console.log(hitPoint[1])
      //console.log(hitPoint[0]/xgap )
      //console.log(hitPoint[1]%ygap)
      if ((Math.abs(hitPoint[0]%xgap) < lineWidth) || (Math.abs(hitPoint[1]%ygap) < lineWidth )) {
        var newHit = new CHit(vec3.distance(hitPoint,inRay.orig),hitPoint,this,vec4.fromValues(0,0,1,0),this.matl,inRay) //
        //console.log(newHit.norm)
        return newHit
      } else {
        var newHit = new CHit(vec3.distance(hitPoint,inRay.orig),hitPoint,this,vec4.fromValues(0,0,1,0),new CMatl(4),inRay)//vec3.distance(hitPoint,inRay.orig)
        //console.log(newHit.norm)
        return newHit
      }
    }
  }
  this.traceSphere = function(inRay) {
    radius = 1
    var torg = vec4.fromValues(0,0,0,0)
    var Kd = vec3.fromValues(1.0,0.0,0.0)
    var newMat = mat4.create()
    var newMulti = mat4.create()
    mat4.multiply(newMulti,this.inverseScale,this.inverseRotate)
    mat4.multiply(newMulti,newMulti,this.inverseTranslate)

    vec4.transformMat4( torg,inRay.orig,newMulti)

    var tdir = vec4.fromValues(0,0,0,0)
    tdir = vec4.transformMat4( tdir,inRay.dir,newMulti)
    //tdir = [this.worldRay2Model] * [worldRay.dir]
    //torg = inRay.orig

    // tdir = inRay.dir
    //torg = this.temp
    // (o + td - c) * (o + td - c) = r^2
    var r2s = vec4.fromValues(0,0,0,0)
    r2s = vec4.subtract(r2s,this.ctr, torg) // 0 - torg
    L2 = vec4.dot(r2s, r2s) //radius squared
    tcaS = vec4.dot(tdir, r2s)
    
    if (L2 > radius * radius)  {//then we missed the sphere.
      if (inRay.dir[2] >= 0) {
        if (tcaS < 0) {
          return -1
        }
      }
    }
    DL2 = vec4.dot(tdir, tdir)
    tca2 = (tcaS * tcaS) / DL2
    LM2 = L2 - tca2
    if (LM2 > 1){
      return -1
    }
    if (false) {
      return -1
    }
    if (L2 > radius * radius) {
      L2hc = 1 - LM2
      t0  = tcaS/DL2 + Math.sqrt(L2hc/DL2)
      t1 = tcaS/DL2 - Math.sqrt(L2hc/DL2)
      var hitPoint = vec4.fromValues(0,0,0,1)
      hitPoint[0] = inRay.orig[0] + (t1 * inRay.dir[0])
      hitPoint[1] = inRay.orig[1] + (t1 * inRay.dir[1])
      hitPoint[2] = inRay.orig[2] + (t1 * inRay.dir[2])

      var minHitPoint = vec4.fromValues(0,0,0,1)
      minHitPoint[0] = torg[0] + (t1 * tdir[0])
      minHitPoint[1] = torg[1] + (t1 * tdir[1])
      minHitPoint[2] = torg[2] + (t1 * tdir[2])
      var norm = vec4.create()
      vec4.subtract(norm,minHitPoint,this.ctr)
      var transposeMat = mat4.create()
      mat4.transpose(transposeMat,newMulti)
      mat4.invert(transposeMat,transposeMat)
      vec4.transformMat4( norm,norm,transposeMat)
      var matl
      if (this.matlFunc) {
        matl = this.matlFunc(hitPoint,norm,inRay,newMulti)
      } else {
        matl = this.matl
      }
      var newVec = vec4.fromValues(inRay.orig[0],inRay.orig[1],inRay.orig[2],1)

      if (t0 < 0 ){
        console.log()
        //rhqioh()
        return -1
      }
      var newHit = new CHit(vec4.distance(hitPoint,newVec),hitPoint,this,norm,matl,inRay)

      return newHit
    }
    return -1

    
    //Newton Raphson  
  }
  this.traceCylinder = function(inRay) {
    radius = 1
    var torg = vec4.fromValues(0,0,0,0)
    var Kd = vec3.fromValues(1.0,0.0,0.0)
    var newMat = mat4.create()
    var newMulti = mat4.create()
    mat4.multiply(newMulti,this.inverseScale,this.inverseRotate)
    mat4.multiply(newMulti,newMulti,this.inverseTranslate)

    vec4.transformMat4( torg,inRay.orig,newMulti)

    var tdir = vec4.fromValues(0,0,0,0)
    tdir = vec4.transformMat4( tdir,inRay.dir,newMulti)

    // a=xD2+yD2, b=2xExD+2yEyD, and c=xE2+yE2-1. 
    var a = tdir[0] * tdir[0] + tdir[1] * tdir[1];
    var b = 2 * torg[0] * tdir[0] + 2 * torg[1] * tdir[1];
    var c = torg[0] * torg[0] + torg[1] * torg[1] - 1;
    var b24ac = (b*b) - (4*a*c);
    if (b24ac<0)
      return -1;
  
    var sqb24ac = Math.sqrt(b24ac);
    t0 = (-b + sqb24ac) / (2 * a);
    t1 = (-b - sqb24ac) / (2 * a);
    if (t0>t1) {
      var tmp = t0;t0=t1;t1=tmp;
    }
    // console.log(t0)
    // console.log(t1)

    var z0 = torg[2] + t0 * tdir[2];
    var z1 = torg[2] + t1 * tdir[2];

    // console.log(z0)
    // console.log(z1)

    //cerw()
    //Top and bottom caps
    if (z0>1)
    {
      if (z1>1){
        return -1;
      }else{
        //return -1;
        // hit the cap
        //console.log("top Cap")
        zGrid = 1
        var t0 = (zGrid - torg[2]) / (tdir[2] * 1.0)
      // console.log(inRay.dir)
      // console.log(inRay.orig)
        var minHitPoint = vec4.fromValues(0,0,0,1)
        minHitPoint[0] = torg[0] + (t0 * tdir[0])
        minHitPoint[1] = torg[1] + (t0 * tdir[1])
        minHitPoint[2] = torg[2] + (t0 * tdir[2])
        var hitx = inRay.orig[0] + (inRay.dir[0]*t0);
        var hity = inRay.orig[1] + (inRay.dir[1]*t0);
        var hitz = inRay.orig[2] + (inRay.dir[2]*t0);
        var hitPoint = vec3.fromValues(hitx,hity,hitz)
        // console.log(minHitPoint)
        // console.log(t0)
        // console.log(vec3.distance(minHitPoint,vec3.fromValues(0,0,1)))
        if (vec3.distance(minHitPoint,vec3.fromValues(0,0,1)) < 1) {
          var newNorms =  vec4.fromValues(0, 0, 1.0,0.0);
          var matl
          if (this.matlFunc) {
            matl = this.matlFunc(hitPoint,norm,inRay,newMulti)
          } else {
            matl = this.matl
          }
          // hrio()
          var newHit = new CHit(vec3.distance(hitPoint,inRay.orig),hitPoint,this,newNorms,matl,inRay)
          return newHit;
        } else {
          return -1
        }
      }
    } else if (z0>=-1 && z0<=1) {
      // hit the cylinder bit
      // var th = (t0 + (t1-t0) * (z0+1) )/ (z0-z1);
      if (t0<=0) return -1;
      // console.log("Hit side")
      var hitx = inRay.orig[0] + (inRay.dir[0]*t0);
      var hity = inRay.orig[1] + (inRay.dir[1]*t0);
      var hitz = inRay.orig[2] + (inRay.dir[2]*t0);
      var hitPoint = vec4.fromValues(hitx,hity,hitz,1)
      var minHitPoint = vec4.fromValues(0,0,0,1)
      minHitPoint[0] = torg[0] + (t0 * tdir[0])
      minHitPoint[1] = torg[1] + (t0 * tdir[1])
      minHitPoint[2] = torg[2] + (t0 * tdir[2])
      var norm = vec4.fromValues(minHitPoint[0],minHitPoint[1],0,1)

      var transposeMat = mat4.create()
      mat4.transpose(transposeMat,newMulti)
      mat4.invert(transposeMat,transposeMat)
      vec4.transformMat4( norm,norm,transposeMat)
      //var newNorms =  vec4.fromValues(0, 0, -1.0,1.0);
      var matl
      if (this.matlFunc) {
        matl = this.matlFunc(hitPoint,norm,inRay,newMulti)
      } else {
        matl = this.matl
      }
      var newHit = new CHit(vec3.distance(hitPoint,inRay.orig),hitPoint,this,norm,matl,inRay)
      return newHit;
    } else if (z0<-1) {
      if (false) {
        return -1;
      }else{
        // hit the cap
        return -1
      //   zGrid = -1
      //   var t0 = (zGrid - torg[2]) / (tdir[2] * 1.0)
      // // console.log(inRay.dir)
      // // console.log(inRay.orig)
      //   var minHitPoint = vec4.fromValues(0,0,0,1)
      //   minHitPoint[0] = torg[0] + (t0 * tdir[0])
      //   minHitPoint[1] = torg[1] + (t0 * tdir[1])
      //   minHitPoint[2] = torg[2] + (t0 * tdir[2])

      //   var hitx = inRay.orig[0] + (inRay.dir[0]*t0);
      //   var hity = inRay.orig[1] + (inRay.dir[1]*t0);
      //   var hitz = inRay.orig[2] + (inRay.dir[2]*t0);
      //   var hitPoint = vec3.fromValues(hitx,hity,hitz)
      //   // console.log(minHitPoint)
      //   // console.log(t0)
      //   // hrio()

      //   if (vec3.distance(minHitPoint,vec3.fromValues(0,0,-1)) < 1) {
      //     var newNorms =  vec4.fromValues(0, 0, 1.0,0.0);
      //     var matl
      //     if (this.matlFunc) {
      //       matl = this.matlFunc(hitPoint,norm,inRay)
      //     } else {
      //       matl = this.matl
      //     }
      //     var newHit = new CHit(vec3.distance(hitPoint,inRay.orig),hitPoint,this,newNorms,matl,inRay)
      //     return newHit;
      //   } else {
      //     return -1
      //   }
      }
    }
    return -1;
  }
  this.traceCube = function(inRay) {
    var torg = vec4.fromValues(0,0,0,0)
    var Kd = vec3.fromValues(1.0,0.0,0.0)
    var newMat = mat4.create()
    var newMulti = mat4.create()
    mat4.multiply(newMulti,this.inverseScale,this.inverseRotate)
    mat4.multiply(newMulti,newMulti,this.inverseTranslate)
    vec4.transformMat4( torg,inRay.orig,newMulti)
    var tdir = vec4.fromValues(0,0,0,0)
    tdir = vec4.transformMat4( tdir,inRay.dir,newMulti)

    var bound = 0.5
    var xgap = 0.5
    var ygap = 0.5
    var lineWidth = 0.1
    var hits = new Array()
    var normals = new Array()

    if (tdir[2] >= 0 && torg[2] > bound) {
      return -1
    }
    if (tdir[2] <= 0 && torg[2] < -bound) {
      return -1
    } 
    if (tdir[1] >= 0 && torg[1] > bound) {
      return -1
    } 
    if (tdir[1] <= 0 && torg[1] < -bound) {
      return -1
    } 
    if (tdir[0] >= 0 && torg[0] > bound) {
      return -1
    } 
    if (tdir[0] <= 0 && torg[0] < -bound) {
      return -1
    } 
    //bottom
    if (true) {
      var t0 = (-bound - torg[2]) / (tdir[2] * 1.0)
      var hitPoint = vec4.fromValues(0,0,0,1)
      hitPoint[0] = torg[0] + (t0 * tdir[0])
      hitPoint[1] = torg[1] + (t0 * tdir[1])
      hitPoint[2] = torg[2] + (t0 * tdir[2])
      if (hitPoint[0] > -bound && hitPoint[0] < bound && hitPoint[1] > -bound && hitPoint[1] < bound) {
        hitPoint[0] = inRay.orig[0] + (t0 * inRay.dir[0])
        hitPoint[1] = inRay.orig[1] + (t0 * inRay.dir[1])
        hitPoint[2] = inRay.orig[2] + (t0 * inRay.dir[2])
        hits.push(hitPoint)
        normals.push(vec4.fromValues(0,0,-1,1))
      }
    }
    if (true) {
      var t0 = (bound - torg[2]) / (tdir[2] * 1.0)

      var hitPoint = vec4.fromValues(0,0,0,1) 
      hitPoint[0] = torg[0] + (t0 * tdir[0])
      hitPoint[1] = torg[1] + (t0 * tdir[1])
      hitPoint[2] = torg[2] + (t0 * tdir[2])
      if (hitPoint[0] > -bound && hitPoint[0] < bound && hitPoint[1] > -bound && hitPoint[1] < bound) {

        hitPoint[0] = inRay.orig[0] + (t0 * inRay.dir[0])
        hitPoint[1] = inRay.orig[1] + (t0 * inRay.dir[1])
        hitPoint[2] = inRay.orig[2] + (t0 * inRay.dir[2])
        hits.push(hitPoint)
        normals.push(vec4.fromValues(0,0,1,1))
      }
    }
    if (true) {
      var t0 = (-bound - torg[1]) / (tdir[1] * 1.0)
      var hitPoint = vec4.fromValues(0,0,0,1)
      hitPoint[0] = torg[0] + (t0 * tdir[0])
      hitPoint[1] = torg[1] + (t0 * tdir[1])
      hitPoint[2] = torg[2] + (t0 * tdir[2])
      if (hitPoint[0] > -bound && hitPoint[0] < bound && hitPoint[2] > -bound && hitPoint[2] < bound) {
        hitPoint[0] = inRay.orig[0] + (t0 * inRay.dir[0])
        hitPoint[1] = inRay.orig[1] + (t0 * inRay.dir[1])
        hitPoint[2] = inRay.orig[2] + (t0 * inRay.dir[2])
      
        hits.push(hitPoint)
        normals.push(vec4.fromValues(0,-1,0,1))
      }
    }
    if (true) {
      var t0 = (bound - torg[1]) / (tdir[1] * 1.0)
      var hitPoint = vec4.fromValues(0,0,0,1)
      hitPoint[0] = torg[0] + (t0 * tdir[0])
      hitPoint[1] = torg[1] + (t0 * tdir[1])
      hitPoint[2] = torg[2] + (t0 * tdir[2])
      if (hitPoint[0] > -bound && hitPoint[0] < bound && hitPoint[2] > -bound && hitPoint[2] < bound) { 
        hitPoint[0] = inRay.orig[0] + (t0 * inRay.dir[0])
        hitPoint[1] = inRay.orig[1] + (t0 * inRay.dir[1])
        hitPoint[2] = inRay.orig[2] + (t0 * inRay.dir[2])
        hits.push(hitPoint)
        normals.push(vec4.fromValues(0,1,0,1))
      }
    }
    if (true) {
      var t0 = (-bound - torg[0]) / (tdir[0] * 1.0)
      var hitPoint = vec4.fromValues(0,0,0,1)
      hitPoint[0] = torg[0] + (t0 * tdir[0])
      hitPoint[1] = torg[1] + (t0 * tdir[1])
      hitPoint[2] = torg[2] + (t0 * tdir[2])

      if (hitPoint[2] > -bound && hitPoint[2] < bound && hitPoint[1] > -bound && hitPoint[1] < bound) {
        hitPoint[0] = inRay.orig[0] + (t0 * inRay.dir[0])
        hitPoint[1] = inRay.orig[1] + (t0 * inRay.dir[1])
        hitPoint[2] = inRay.orig[2] + (t0 * inRay.dir[2])
        hits.push(hitPoint)
        normals.push(vec4.fromValues(-1,0,0,1))
      }
    }
    if (true) {
      var t0 = (bound - torg[0]) / (tdir[0] * 1.0)

      var hitPoint = vec4.fromValues(0,0,0,1)
      hitPoint[0] = torg[0] + (t0 * tdir[0])
      hitPoint[1] = torg[1] + (t0 * tdir[1])
      hitPoint[2] = torg[2] + (t0 * tdir[2])
      if (hitPoint[2] > -bound && hitPoint[2] < bound && hitPoint[1] > -bound && hitPoint[1] < bound) {
        hitPoint[0] = inRay.orig[0] + (t0 * inRay.dir[0])
        hitPoint[1] = inRay.orig[1] + (t0 * inRay.dir[1])
        hitPoint[2] = inRay.orig[2] + (t0 * inRay.dir[2])
        hits.push(hitPoint)
        normals.push(vec4.fromValues(1,0,0,1))
      }
    }
    if (hits.length > 0) {
      var minDist = 9999
      var minHit = vec4.create()
      var minNormal = vec4.create()
      for (var i = hits.length - 1; i >= 0; i--) {
        var dist = vec4.distance(inRay.orig,hits[i])
        if (dist < minDist) {
          minDist = dist
          minHit = hits[i]
          minNormal = normals[i]
        }
      }
      var minHitPoint = vec4.fromValues(0,0,0,1)
      minHitPoint[0] = torg[0] + (t0 * tdir[0])
      minHitPoint[1] = torg[1] + (t0 * tdir[1])
      minHitPoint[2] = torg[2] + (t0 * tdir[2])
      var norm = vec4.create()
      var transposeMat = mat4.create()
      mat4.transpose(transposeMat,newMulti)
      vec4.transformMat4( norm,minNormal,transposeMat)
      var matl
      if (this.matlFunc) {
        matl = this.matlFunc(hitPoint,norm,inRay,newMulti)
      } else {
        matl = this.matl
      }
      var newHit = new CHit(vec3.distance(minHit,inRay.orig),minHit,this,norm,matl,inRay)
      return newHit
    }
    return -1
  }

  this.rayLoadIdentity = function() {

  }
  this.rayTranslate = function(x,y,z) {
    var transRay = vec4.fromValues(x,y,z,0)
    var newMat = mat4.create()
    mat4.translate(newMat,newMat,transRay)
    mat4.invert(this.inverseTranslate,newMat)
    this.realCtr = vec4.fromValues(x,y,z,1)
  }
  this.rayRotate = function(rad,axis) {
    var newMat = mat4.create()
    this.worldRay2Model = mat4.rotate(newMat,this.modelMatrix,rad,axis)
    mat4.invert(this.inverseRotate,newMat)
  }
  this.rayScale = function(x,y,z) {
    var newMat = mat4.create()
    var transRay = vec4.fromValues(x,y,z,1)
    mat4.scale(newMat,newMat,transRay)
    mat4.invert(this.inverseScale,newMat)
    this.realRadius = x
    //mat4.invert(this.worldRay2Model,this.modelMatrix)
  }
}


function CImgBuf(wide, tall) {
//==============================================================================
// Construct an 'image-buffer' object to hold a floating-point ray-traced image.
//  Contains BOTH
//  iBuf -- 2D array of 8-bit RGB pixel values we can display on-screen, AND
//  fBuf -- 2D array of floating-point RGB pixel values we usually CAN'T display,
//          but contains full-precision results of ray-tracing.
//      --Both buffers hold the same numbers of pixel values (xSiz,ySiz,pixSiz)
//      --imgBuf.int2float() copies/converts current iBuf contents to fBuf
//      --imgBuf.float2int() copies/converts current fBuf contents to iBuf
//  WHY?  
//  --Our ray-tracer computes floating-point light amounts(e.g. radiance L) //    but neither our display nor our WebGL texture-map buffers can accept 
//    images with floating-point pixel values.
//  --You will NEED all those floating-point values for applications such as
//    environment maps (re-lighting from sky image) and lighting simulations.
// Stay simple in early versions of your ray-tracer: keep 0.0 <= RGB < 1.0, 
// but later you can modify your ray-tracer 
// to use radiometric units of Radiance (watts/(steradians*meter^2), or convert 
// to use photometric units of luminance (lumens/(steradians*meter^2 aka cd/m^2) // to compute in physically verifiable units of visible light.

  this.xSiz = wide;             // image width in pixels
  this.ySiz = tall;             // image height in pixels
  this.pixSiz = 3;              // pixel size (3 for RGB, 4 for RGBA, etc)
  this.iBuf = new Uint8Array(  this.xSiz * this.ySiz * this.pixSiz);  
  this.fBuf = new Float32Array(this.xSiz * this.ySiz * this.pixSiz);
  this.setTestPattern = function(pattNum) {
//==============================================================================
// Replace current 8-bit RGB contents of 'imgBuf' with a colorful pattern
  // 2D color image:  8-bit unsigned integers in a 256*256*3 array
  // to store r,g,b,r,g,b integers (8-bit)
  // In WebGL texture map sizes MUST be a power-of-two (2,4,8,16,32,64,...4096)
  // with origin at lower-left corner
  // (NOTE: this 'power-of-two' limit will probably vanish in a few years of
  // WebGL advances, just as it did for OpenGL)
  
  // use local vars to set the array's contents.
  for(var j=0; j< this.ySiz; j++) {           // for the j-th row of pixels
    for(var i=0; i< this.xSiz; i++) {         // and the i-th pixel on that row,
      var idx = (j*this.xSiz + i)*this.pixSiz;// Array index at pixel (i,j) 
      switch(pattNum) {
        case 0: //================(Colorful L-shape)============================
          if(i < this.xSiz/4 || j < this.ySiz/4) {
            this.iBuf[idx   ] = i;                // 0 <= red <= 255
            this.iBuf[idx +1] = j;                // 0 <= grn <= 255
          }
          else {
            this.iBuf[idx   ] = 0;
            this.iBuf[idx +1] = 0;
            }
          this.iBuf[idx +2] = 255 -i -j;                // 0 <= blu <= 255
          break;
        case 1: //================(bright orange)===============================
          this.iBuf[idx   ] = 255;  // bright orange
          this.iBuf[idx +1] = 128;
          this.iBuf[idx +2] =   0;
          break;
        default:
          console.log("imgBuf.setTestPattern() says: WHUT!?");
        break;
      }
    }
  }
  this.int2float();   // fill the floating-point buffer with same test pattern.
}

this.int2float = function() {
//==============================================================================
// Convert current integerRGB image in iBuf into floating-point RGB image in fBuf
for(var j=0; j< this.ySiz; j++) {   // for each scanline
    for(var i=0; i< this.xSiz; i++) {   // for each pixel on that scanline
      var idx = (j*this.xSiz + i)*this.pixSiz;// Find array index at pixel (i,j)
      // convert integer 0 <= RGB <= 255 to floating point 0.0 <= R,G,B <= 1.0
      this.fBuf[idx   ] = this.iBuf[idx   ] / 255.0;  // red
      this.fBuf[idx +1] = this.iBuf[idx +1] / 255.0;  // grn
      this.fBuf[idx +2] = this.iBuf[idx +2] / 255.0;  // blu
    }
  }
}

this.float2int = function() {
//==============================================================================
// Convert current floating-point RGB image in fBuf into integerRGB image in iBuf
for(var j=0; j< this.ySiz; j++) {   // for each scanline
    for(var i=0; i< this.xSiz; i++) { // for each pixel on that scanline
      var idx = (j*this.xSiz + i)*this.pixSiz;// Find array index at pixel (i,j)
      // find 'clamped' color values that stay >=0.0 and <=1.0:
      var rval = Math.min(1.0, Math.max(0.0, this.fBuf[idx   ]));
      var gval = Math.min(1.0, Math.max(0.0, this.fBuf[idx +1]));
      var bval = Math.min(1.0, Math.max(0.0, this.fBuf[idx +2]));
      // Divide [0,1] span into 256 equal-sized parts: e.g.  Math.floor(rval*256)
      // In the rare case when rval==1.0 you get unwanted '256' result that won't
      // fit into the 8-bit RGB values.  Fix it with Math.min():
      this.iBuf[idx   ] = Math.min(255,Math.floor(rval*256.0)); // red
      this.iBuf[idx +1] = Math.min(255,Math.floor(gval*256.0)); // grn
      this.iBuf[idx +2] = Math.min(255,Math.floor(bval*256.0)); // blu
      
    }
  }
}
}



function CMatl(type) {
  if (type == 6) {
    this.Kd = vec3.fromValues(0.396,0.742,0.691)
    this.Ka = vec3.fromValues(0.1,0.187,0.175)
    this.Ks = vec3.fromValues(0.297,0.308,0.306)
    this.Kex = 12.8
  }
  if (type == 5) {
    this.Kd = vec3.fromValues(0.614,0.041,0.042)
    this.Ka = vec3.fromValues(0.175,0.012,0.012)
    this.Ks = vec3.fromValues(0.728,0.627,0.627)
    this.Kex = 76.8
  }
  if (type == 4) {
    this.Kd = vec3.fromValues(1.0,0.829,0.829)
    this.Ka = vec3.fromValues(0.25,0.207,0.207)
    this.Ks = vec3.fromValues(0.297,0.297,0.297)
    this.Kex = 11.264
  }
  if (type == 1) {
    this.Kd = vec3.fromValues(0.507,0.507,0.507)
    this.Ka = vec3.fromValues(0.192,0.192,0.192)
    this.Ks = vec3.fromValues(0.5,0.5,0.5)
    this.Kex = 51.2
  }else if (type == 0) {
    this.Kd = vec3.fromValues(0,277,0.277,0.277)
    this.Ka = vec3.fromValues(0.231,0.231,0.231)
    this.Ks = vec3.fromValues(0.774,0.774,0.774)
    this.Kex = 89.6
  }else if (type == 2) {
    this.Kd = vec3.fromValues(0.076,0.614,0.076)
    this.Ka = vec3.fromValues(0.022,0.175,0.55)
    this.Ks = vec3.fromValues(0.633,0.728,0.55)
    this.Kex = 76.8
  }

}
var MatlCheckerBoard = function(hitPoint,norm,inRay,transform) {
  result = (Math.floor(hitPoint[0]) + Math.floor(hitPoint[1]) + Math.floor(hitPoint[2]))
  if (result%2 == 0) {
    matl = new CMatl(5)
    return matl
  } else {
    matl = new CMatl(6)
    return matl
  }
}

var MatlGradient = function(hitPoint,norm,inRay,transform) {
  matl = new CMatl(2)
  var gradEdge = vec4.fromValues(0,0,0.05,1)
  vec4.transformMat4( gradEdge,gradEdge,transform)
  var z = hitPoint[2] % 1
  z = Math.abs(z + 0.5)
  matl.Kd = vec3.fromValues(Math.max(0,1-z),Math.min(1,z),gradEdge[2])
  matl.Ka = vec3.fromValues(Math.max(0,0.5-(z/2)),Math.min(0.5,z/2),gradEdge[2]/2.0)
  matl.Ks = vec3.fromValues(0.633,0.728,0.55)
  return matl
}

var MatlMarble = function(hitPoint,norm,inRay,transform) {
  matl = new CMatl(2)
  var edgePoint = vec4.fromValues(1,0,0,0)
  vec4.transformMat4( edgePoint,edgePoint,transform)
  var dist = vec3.distance(hitPoint,edgePoint) % 1
  dist = Math.abs(dist - 0.5)
  matl.Kd = vec3.fromValues(0,Math.min(1,dist),Math.max(0,1-dist))
  matl.Ka = vec3.fromValues(0,Math.min(0.5,dist/2),Math.max(0,0.5-(dist/2)))
  matl.Ks = vec3.fromValues(0.633,0.728,0.55)
  return matl
}

var MatlSpot = function(hitPoint,norm,inRay,transform) {
  distSum = 0
  for (var i = spotList.length - 1; i >= 0; i--) {
    var spotPoint = vec4.fromValues(1,0,0,0)
    vec4.transformMat4( spotPoint,spotList[i],transform)
    vec4.copy(spotPoint,spotList[i])
    distSum += 1/(vec3.distance(hitPoint,spotPoint) % 1)
  }
  if (distSum > 20) {
    matl = new CMatl(2)
    return matl
  } else {
    matl = new CMatl(4)
    return matl
  }
}
function CLight(x,y,z) {
  this.pos = vec4.fromValues(x,y,z,1);
  this.on = 1
}
function CScene() {

  this.imgBuf = new CImgBuf(256,256)
  this.rayCam = new CCamera()
  this.eyeRay = new CRay()
  this.shadeRay = new CRay()
  this.item = new Array()
  this.lights = new Array()
  this.lights[0] = new CLight(0,0,0)
  this.lights[1] = new CLight(0,0,0)
  this.item[0] = new CGeom(0);
  
  this.xRot = 0
  jitterDim = 1
  totalNumReflect = 1
  // var defaultCamRay = CRay(orig,dest)
  // this.rayCam.setEyeRay(ray,0,0)
  this.draw = function(gl,n) {
    //console.log("drawing image")
    this.makeRayTracedImage()
    var arr = this.imgBuf.iBuf
    //console.log("initializing textures")
    rayView.initTextures(gl, n, arr)
  }

  this.makeRayTracedImage = function() {
    var myGrid = this.item[0];
    var colr = vec4.create(); // floating-point RGBA color value
    var hit = 0;
    var buf = this.imgBuf
    var rSum = 0;
    var gSum = 0;
    var bSum = 0;
   
    var div = 1.0/(jitterDim * jitterDim)
    
    for(var j=0; j< buf.ySiz; j++) {           // for the j-th row of pixels
      for(var i=0; i< buf.xSiz; i++) {         // and the i-th pixel on that row,
        var sum = 0
        var idx = (j*buf.xSiz + i)*buf.pixSiz;  // Array index at pixel (i,j) 
        for (var sx= 0; sx < jitterDim ; sx++) {
          for (var sy = 0; sy < jitterDim ; sy ++) {
            this.rayCam.setEyeRay(this.eyeRay,i,j,sx,sy,jitterDim);              // create ray for pixel (i,j)
            reflecNow = false
            hitList = this.traceRay(this.eyeRay)
            minDist = 9999
            hit = -1
            for (k = 0;k<hitList.length;k++) {
              if (hitList[k] != -1 && hitList[k].dist < minDist) {
                minDist = hitList[k].dist
                hit = hitList[k]
              }
            }
            // console.log(minDist)
            if (hit != -1) {
               result = this.findShade(hit,totalNumReflect,false)
               // console.log(result)
               rSum += result[0]
               gSum += result[1]
               bSum += result[2]
            }  
          }
        }
        // console.log(i)
        buf.fBuf[idx   ] = (rSum * div);  // bright blue
        buf.fBuf[idx +1] = (gSum * div);
        buf.fBuf[idx +2] = (bSum * div);
        rSum = 0
        gSum = 0
        bSum = 0
      }
    }
      // ahio()

    buf.float2int();   // create integer image from floating-point buffer.
  }

    this.traceRay = function(ray,numReflect) {
      var newHit = new CHit(0,0,0)
      //var newCol = vec3.fromValues(0,0,0)
      var hitList = new Array()
      var hitSomething = false 
      for (var k=0; k <this.item.length; k ++) {
        hit = this.item[k].traceGeom(ray); 
        if (hit != -1) {
          hitList.push(hit)
        }
      }
      return hitList
    }
    randomCount = 1
    this.findShade = function(cHit,numReflect,fromTrans) {
      var mReflectance = cHit.shapeRef.reflectance
      var transparency = cHit.shapeRef.transparency
      var color = vec3.fromValues(0,0,0)
      var matl = cHit.matl
      var pos = cHit.hitPoint
      var newRay = vec4.create()
      var Kd = matl.Kd
      var Ka = matl.Ka
      color[0] = matl.Ka[0]
      color[1] = matl.Ka[1]
      color[2] = matl.Ka[2]
      var blocked = false
      var atLeastOneValid = false
      var nm = vec3.create()
      var lightList = new Array()
      for (var k=0; k < this.lights.length;k++) {
        lightList.push( this.lights[k])
      }
      if (fromTrans) {
        var newLight = new CLight(cHit.ray.orig[0],cHit.ray.orig[1],cHit.ray.orig[2])
        // console.log(newLight)
        lightList.push(newLight)
      }
      for (var k=0;k<lightList.length; k ++) {
        var lit = lightList[k]
        //vec4.copy(this.shadeRay.orig,lit.pos)
        var shRay = new CRay()
        shRay.orig = vec4.fromValues(cHit.hitPoint[0],cHit.hitPoint[1],cHit.hitPoint[2],1)
        vec4.subtract(shRay.dir,lit.pos,cHit.hitPoint)
        vec3.normalize(shRay.dir,shRay.dir)
        lightHits = this.traceRay(shRay,1,false)
        var distLight = vec3.distance(cHit.hitPoint,lit.pos)
        valid = true
        for (q = 0;q<lightHits.length;q++) {
          if (lightHits[q] != -1 && lightHits[q].shapeRef != cHit.shapeRef && lightHits[q].dist < distLight) {
            valid = false
          }
        }
        // if (!valid && cHit.shapeRef.shapeType) {
        //   console.log(shRay.orig)
        //   console.log(lit.pos)
        //   console.log(shRay.dir)
        //   console.log(lightHits)
        //   console.log(cHit.shapeRef.shapeType)
        //   hioh()
        // }
        if (valid) {
          atLeastOneValid = true

                    // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
          var placeholder = vec4.create()
          var lightDirection = vec3.create()
          vec4.subtract(placeholder, lit.pos,cHit.hitPoint)
          lightDirection = vec3.fromValues(placeholder[0],placeholder[1],placeholder[2])
          vec3.normalize(lightDirection, lightDirection)
          //lightDirection = vec3.fromValues(1.0,0.0,0.0)
          //vec4.subtract(placeholder,this.rayCam.eyePt,cHit.hitPoint)
          eyeDirection = vec3.fromValues(cHit.ray.dir[0],cHit.ray.dir[1],cHit.ray.dir[2])
          vec3.normalize(eyeDirection,placeholder)
          //var nm = vec3.fromValues(-0.5,-0.5,-0.5)
          nm = vec3.fromValues(cHit.norm[0],cHit.norm[1],cHit.norm[2])
          var nDotL = Math.max(vec3.dot(lightDirection, nm), 0.0)
          var C = vec3.create()
          vec3.scale(C,nm,nDotL)
          var reflection = vec3.create()
          vec3.scale(reflection,C,2)
          vec3.subtract(reflection,reflection,lightDirection)
          var H = vec3.create()
          vec3.add(H, lightDirection,eyeDirection)
          vec3.normalize(H,H)
          var nDotH = Math.max(vec3.dot(H, nm), 0.0)
          // console.log(vec4.dot(H, vec4.normalize(cHit.norm,cHit.norm)))
          // console.log(cHit.norm)
          var e64 = Math.pow(nDotH, matl.Kex)

          var beforeCol = vec3.clone(color)

          color[0] += matl.Kd[0] * nDotL * lit.on
          color[1] += matl.Kd[1] * nDotL * lit.on
          color[2] += matl.Kd[2] * nDotL * lit.on
          //console.log(color)
        
          color[0] += matl.Ks[0] * e64 * lit.on
          color[1] += matl.Ks[1] * e64 * lit.on
          color[2] += matl.Ks[2] * e64 * lit.on
          // console.log(color)
          // console.log(cHit.shapeRef.shapeType)
          if (cHit.shapeRef.shapeType == JT_SPHERE && nDotL > 0) {
          
          }
          //hiop()
        }  else {
          console.log()
        }   
        //vec3 mSpeculr = u_LampSet[i].spec * matl.Ks * e64 * lit.on
        // diffuse += mDiffus

        // speculr += mSpeculr
        // gl_FragColor = vec4(emissiv + ambient + diffuse + speculr , 1.0)
      }
      numReflect -= 1
      if (numReflect > 0 && atLeastOneValid) {
        var m = vec4.create()
        var nm = vec4.fromValues(cHit.norm[0],cHit.norm[1],cHit.norm[2],0)
        var a = vec4.fromValues(cHit.ray.dir[0],cHit.ray.dir[1],cHit.ray.dir[2],0)
        var ada = vec3.create()
       // a = vec4.fromValues(0.5,0.5,0,1)
        vec3.normalize(a,a)
        //nm = vec4.fromValues(0,0,1,0)
        vec3.normalize(nm,nm)
        //vec3.scale(nm,nm,-1)
        var adn = vec4.dot(a,nm)
        // var ndn = vec4.dot(nm,nm)
        // var number = (-1.0 * adn)/(ndn * 1.0)
        var r = vec4.create()
        vec4.scale(m,nm,adn)
        vec4.scale(m,m,2)
        //vec4.normalize(m,m)
        vec4.subtract(r,a,m)

      

        // vec4.subtract(r,a,m)
        //  // console.log(r)
        // vec4.subtract(r,r,m)
        // vec3.normalize(r,r)

        //workspace
        if (cHit.shapeRef.shapeType == 3) {
          // console.log(cHit.hitPoint)
          // console.log(a)
          // console.log(nm)
          // console.log(adn)
          // console.log(m)
          // console.log(r)
          // console.log(a)
          // console.log(cHit.shapeRef.shapeType)
          // fhiao()
        }
        reflecNow = true
        //qhio()
        //vec3.scale(r,nm,1)
        var newRay = new CRay()
        var offset = vec3.create()
        vec4.scale(offset,a,-0.01)
        vec4.add(newRay.orig,cHit.hitPoint,vec4.fromValues(offset[0],offset[1],offset[2],0))

        newRay.dir = vec4.fromValues(r[0],r[1],r[2],0)
        hitList = this.traceRay(newRay,numReflect)
        minDist = 9000
        hit = -1
        for (k = 0;k<hitList.length;k++) {
          if (hitList[k] != -1 && hitList[k].shapeRef != cHit.shapeRef && Math.abs(hitList[k].dist) < minDist) {
            minDist = hitList[k].dist
            hit = hitList[k]
          }
        }
        var newResult = new Array()
        if (hit != -1) {
           newResult = this.findShade(hit,numReflect,false)
        } else {
          newResult = [0.0,0.0,0.0]
        }
        // console.log(newResult)
        color[0] = (mReflectance * newResult[0]) + ((1.0-mReflectance)* color[0])
        color[1] = (mReflectance * newResult[1]) + ((1.0-mReflectance)* color[1])
        color[2] = (mReflectance * newResult[2]) + ((1.0-mReflectance)* color[2])
      }
      if (cHit.shapeRef.transparent == true) {
        //console.log("transparent")
        var eta, c1, cs2 ;
        I = vec3.fromValues(cHit.ray.dir[0],cHit.ray.dir[1],cHit.ray.dir[2])
        vec3.normalize(I,I)
        N = vec3.fromValues(cHit.norm[0],cHit.norm[1],cHit.norm[2])
        vec3.normalize(N,N)
        //console.log(N)

        eta = 0.9;      
        c1 = -vec3.dot(I, N) ;
        cs2 = 1 - (eta * eta * (1 - (c1 * c1) ));

        if (cs2 < 0)
          return color;    /* total internal reflection */
      
         /* 
          * VecComb(a, v1, b, v2, v3)
          * computes v3 = a * v1 + b * v2, 
          * where a & b are scalars, and v1, v2, v3 are vectors */

        T = vec3.create()
        vec3.scale(I,I,eta)
        vec3.scale(N,N,(eta * c1 - Math.sqrt(cs2)))
        vec3.add(T,I,N)
        vec3.normalize(T,T)
        var refractRay = new CRay()
        refractRay.orig = cHit.hitPoint
        refractRay.dir = vec4.fromValues(T[0],T[1],T[2],0)
        //refractRay.dir = cHit.ray.dir
        //refractRay.dir = vec4.fromValues(I[0],I[1],I[2],0)

        //vec3.normalize(refractRay.dir,refractRay.dir)
        newHitList = this.traceRay(refractRay,numReflect)
        //console.log(hitList)
        minDist = 9000
        var transHit = -1
        for (k = 0;k<newHitList.length;k++) {
          // console.log("in Loop")
          // console.log(newHitList[k] != -1)
          if (newHitList[k].shapeRef == cHit.shapeRef ){
            //fhwioh()
          }
          // console.log(newHitList[k].t < minDist)
          // console.log(newHitList[k].t)
          // console.log(minDist)
          if (newHitList[k] != -1 && newHitList[k].shapeRef != cHit.shapeRef && newHitList[k].dist < minDist) {
            minDist = newHitList[k].dist
            transHit = newHitList[k]
            //console.log(newHitList[k].shapeRef != cHit.shapeRef)
            //console.log("updating hitlist")
          }
        }
        if (transHit != -1 ){
          if (cHit.shapeRef == transHit.shapeRef) {
            //console.log(hitList)
            hioh()
            newResult = [0.0,0.0,0.0]
          } else {
            // console.log(refractRay.dir)
            // console.log(I)
            // console.log(N)
            // qwer()
            newResult = this.findShade(transHit,numReflect,true)
          }
          //console.log("finding new shade")
          // color[0] = newResult[0]
          // color[1] = newResult[1]
          // color[2] = newResult[2]

        } else {
          newResult = [0.0,0.0,0.0]
        }
        //hioh()

        // color[0] = newResult[0]
        // color[1] = newResult[1]
        // color[2] = newResult[2]
        //console.log(newResult)
        color[0] = (transparency * newResult[0]) + ((1.0-transparency)* color[0])
        color[1] = (transparency * newResult[1]) + ((1.0-transparency)* color[1])
        color[2] = (transparency * newResult[2]) + ((1.0-transparency)* color[2])
      }
      //qrhqi()
      //find and complete the nearest CHit object.
      //takes a hitlist and turns it into the color of the ray, may be doing a lot of recursion
      // it may in turn call trace ray, which could be followed by find shade, includes recursion depth argument.
      // include flag for whether ray is entering object or leaving it.
      // Hit point in WORLD space = orig + t0 * dir
      // Hit point in Model space = torgi + t0 * dir.

      //Surface normal in WORLD space is found like this: N_world = [worldRay2Model]Transpose N_model
    //console.log(this.fBuf)
    //console.log(this.iBuf)
    return color
  }
}

function CHit(distance,point,item,normal,material,ray) {
//==============================================================================
// Describes one ray/object intersection point that was found by 'tracing' one
// ray through one shape (through a single CGeom object, held in the
// CScene.item[] array).
// CAREFUL! We don't use isolated CHit objects, but instead gather all the CHit
// objects for one ray in one list held inside a CHitList object.
// (CHit, CHitList classes are consistent with the 'HitInfo' and 'Intersection'
// classes described in FS Hill, pg 746).
  this.dist = distance//ray traced length
  this.hitPoint = point
  this.shapeRef = item
  if (item != 0) {
    //console.log(normal)
    this.norm = vec3.fromValues(normal[0],normal[1],normal[2])
    vec3.normalize(this.norm,normal)
  }
  this.matl = material
  this.ray = ray
}

function CHitList() {  
}


function myKeyPress(ev) {
  myChar = String.fromCharCode(ev.keyCode); //  convert code to character-string
  switch(myChar) {
    case 'p':     // toggle pause/run:
      light1X = light1X + 2.0
      break;
    case ';':     // toggle pause/run:
      light1X = light1X - 2.0
      break;
    case 'l':     // toggle pause/run:
      light1Z = light1Z + 2.0
      break;
    case '\'':      // toggle pause/run:
      light1Z = light1Z - 2.0
      break;
    case 'k':    // left-arrow key
      // print in console:
      console.log(' right-arrow.');
        angleY = angleY + 0.1;
      break;
    case 'j':    // up-arrow key
      ev.preventDefault();
      console.log(' down-arrow.');
      angleZ = angleZ - 0.1
      break;
    case 'u':    // right-arrow key
      console.log('up-arrow.');
          angleZ = angleZ + 0.1;
      break;
    case 'h':    // down-arrow key
      console.log(' left-arrow.');
      ev.preventDefault();
          angleY = angleY - 0.1
      break;
    case 'w':    // down-arrow key
      console.log(' w-key.');
        move(0.2,0.0)
      
      break;
     case 's':    // down-arrow key
      console.log(' s-key.');
        move(-0.2,0.0)
      
      break;
     case 'a':
      console.log('a -key?');
        move(0,0.2)
      
      break;
    case 'd':
      console.log('d- key?');
        move(0,-0.2)
      break;
    case 'r':
      //console.log('redraw');
      redrawRayTrace(gl,numTex)
    default:
     // console.log('myKeyPress(): Ignored key: '+myChar);
      break;
  }
  calculateLook()
  
}


function calculateLook() {
    GoalX = camPosX + (distPers * Math.cos(angleY))
    GoalZ = camPosZ + (distPers * Math.sin(angleY))
    GoalY = camPosY + (distPers * Math.sin(angleZ))
    VecY = 1
    VecX = 0
    VecZ = 0
    AngleZ = 0
 // GoalY = GoalY + (distPers * Math.cos(angleZ) + Math.sin(GoalY))
    //myScene.rayCam.setLookAt(camPosX,camPosY,camPosZ,GoalX,GoalY,GoalZ,0,1,0)
}
function move(frontSpeed,sideSpeed) {
    camPosX = camPosX + (Math.cos(angleY) * frontSpeed) 
    camPosX = camPosX + (Math.cos(angleY - (Math.PI/2)) * sideSpeed )
    camPosZ = camPosZ + (Math.sin(angleY) * frontSpeed)
    camPosZ = camPosZ + (Math.sin(angleY - (Math.PI/2)) * sideSpeed )
}

function switchLight2() {
  if (myScene.lights[0].on == 0.0) {
    lamp0.isLit = 1.0 
    myScene.lights[0].on = 1.0
    myScene2.lights[0].on = 1.0
  } else  {
    lamp0.isLit = 0.0 
    myScene.lights[0].on = 0.0
    myScene2.lights[0].on = 0.0
  }
}


function switchLight1() {
  if (myScene.lights[1].on == 0.0) {
    lamp1.isLit = 1.0 
    myScene.lights[1].on = 1.0
    myScene2.lights[1].on = 1.0
  } else {
    lamp1.isLit = 0.0 
    myScene.lights[1].on = 0.0
    myScene2.lights[1].on = 0.0
  }
}

function switchScene() {
  if (currentScene == 1) {
    currentScene = 2
  } else {
    currentScene = 1
  }
}

function toggleAntiAlias() {
  jitterDim += 1
  console.log(jitterDim)
  if  (jitterDim > 4) {
    jitterDim = 1
  }
  if (jitterDim == 1) {
    text = "1 x 1"
  } else if (jitterDim == 2) {
    text = "2 x 2"
  } else if (jitterDim == 3) {
    text = "3 x 3"
  } else if (jitterDim == 4) {
    text = "4 x 4"
  } 
  document.getElementById('jitterdim').innerHTML=
      '\t'+text+', \t'+"Aliasing Dimensions"; 
}

jitterSet = false
function toggleJitter() {
  jitterSet = !jitterSet
  if (jitterSet) {
    text = "True"
  } else {
    text = "False"
  } 
  document.getElementById('jittering').innerHTML=
      '\t'+text; 
}

function toggleReflect() {
  totalNumReflect += 1
  if  (totalNumReflect > 4) {
    totalNumReflect = 1
  }
  var type = totalNumReflect
  if (type == 1) {
    text = "0"
  } else if (type == 2) {
    text = "1"
  } else if (type == 3) {
    text = "2"
  } else if (type == 4) {
    text = "3"
  } 
  document.getElementById('reflection').innerHTML=
      '\t'+text+' \t'+"reflections"; 
}
