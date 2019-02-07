//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'varying mediump vec3 Norm;\n' +
  'varying mediump vec3 ToLight;\n' +
  'attribute highp vec4 a_Position;\n' +
  'attribute highp vec4 a_Normal;\n' +
  'attribute highp vec4 a_Color;\n' + 
  'uniform mediump mat4 u_ModelMatrix;\n' +
  'uniform mediump mat4 u_projMatrix;\n' +
  'uniform mediump mat4 u_ViewMatrix;\n' +
  'uniform mediump mat4 u_NormalMatrix;\n' +
  //'uniform mediump mat4 u_LightPos;\n' +
  'mediump vec3 u_LightPos = vec3(0.0,100.0,0.0);\n' +
  //'uniform mediump vec3 u_LightPos;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_projMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  //'  vec4 transVec = u_NormalMatrix * a_Normal;\n' + 
  '  Norm = normalize(vec3(u_NormalMatrix * a_Normal));\n'+
  //'  Norm = vec3(a_Normal);\n'+
  //'  Norm = normalize(transVec.xyz);\n' +
  //'  ToLight = vec3(u_LightPos) - vec3(a_Position);\n' +
  'ToLight = vec3(0.0,1.0,0.0);\n' +
  '  v_Color = a_Color;\n' +
  //'  v_Color = 0.3*a_Color + 0.7 * dot(Norm,ToLight);\n'+
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying mediump vec3 Norm;' +
  'varying mediump vec3 ToLight;' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
    'const vec3 DiffColr = vec3(0.2,0.6,0.8);\n'+
    'float diff = clamp(dot(normalize(Norm),normalize(ToLight)),0.2,1.0);\n'+
    //'gl_FragColor = vec4(DiffColr*diff,1.0);\n'+
    'gl_FragColor = vec4((vec3(v_Color)*diff),1.0);\n'+
    //'gl_FragColor = v_Color;\n' +
  '}\n';
  
var floatsPerVertex = 10;	// # of Float32Array elements used for each vertex
													// (x,y,z)position + (r,g,b)color

var canvas;
var PosX = -2;
var PosY = 0;
var PosZ = 0;
var GoalX = 0;
var GoalY = 0;
var GoalZ = 0;
var distPers = 100;
var angleX = 0;
var angleY = 0;
var angleZ = 0;
var height = 0
var width = 0
  // Create a JavaScript matrix to specify the view transformation
var modelMatrix = new Matrix4();
var normalMatrix = new Matrix4();
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var lightPos = new Matrix4();
var u_ModelMatrix;
var currentAngle = 0.0;
var turretAngle = 0.0;
var turboAngle = 0.0;
var wingAngle = 0.0;
var mAngleSpeed = 0.5;
var AirplaneMode = false;
var AirplaneSpeed = 0.1;
var VecX = 0
var VecY = 0
var VecZ = 0
var roll = 0;

// Global vars for mouse click-and-drag for rotation.
var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1); // 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();       // rotation matrix, made from latest qTot
var altView = Matrix4();

function main() {
//==============================================================================
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
 // winResize();   // (HTML file also calls it on browser-resize events)
  // Get the rendering context for WebGL
  window.addEventListener("keydown", myKeyDown, false);
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting:
	gl.enable(gl.DEPTH_TEST); 
  canvas.onmousedown  = function(ev){myMouseDown( ev, gl, canvas) }; 
            // when user's mouse button goes down, call mouseDown() function
  canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };
                      // when the mouse moves, call mouseMove() function          
  canvas.onmouseup =    function(ev){myMouseUp(   ev, gl, canvas)}
	
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to specify the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.25, 0.2, 0.25, 1.0);

 // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program,'u_NormalMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program,'u_ViewMatrix');
  u_projMatrix = gl.getUniformLocation(gl.program,'u_projMatrix');

  //u_LightPos = gl.getUniformLocation(gl.program,'u_LightPos');
  if (!u_ModelMatrix || !u_NormalMatrix ) { 
    console.log('Failed to get the storage location of uniform variable');
    return;
  }
 lightPos.setTranslate(1.0,1.0,1.0);
 //var lightPos = new Vector3(1.0,1.0,1.0);
// console.log((lightPos.elements))
  //gl.uniformMatrix4fv(u_LightPos, false, lightPos.elements );
    winResize(); 
    calculateLook();
    var isTurretTurn = true

  var tick = function() {
    var now = Date.now();
    turretAngle = animateSin(turretAngle, isTurretTurn,now)
    turboAngle = animateSin2(turretAngle,now)
    currentAngle = animate(currentAngle);  // Update the rotation angle
    // Send this matrix to our Vertex and Fragment shaders through the
    draw(gl);   // Draw the triangles
    requestAnimationFrame(tick, canvas); 
  };
  tick(); 
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = xColr[0];			// red
		gndVerts[j+4] = xColr[1];			// grn
		gndVerts[j+5] = xColr[2];			// blu
    gndVerts[j+6] = 0.0
    gndVerts[j+7] = 1.0
    gndVerts[j+8] = 0.0
    gndVerts[j+9] = 1.0
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = yColr[0];			// red
		gndVerts[j+4] = yColr[1];			// grn
		gndVerts[j+5] = yColr[2];			// blu
    gndVerts[j+6] = 0.0
    gndVerts[j+7] = 1.0
    gndVerts[j+8] = 0.0
    gndVerts[j+9] = 1.0
	}
}

function draw(gl) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //----------------------Create, LEFT viewport------------------------

  gl.viewport(0,                              // Viewport lower-left corner
              0,       // location(in pixels)
              width/2,          // viewport width,
              height);      // viewport height in pixels.

  var vpAspect = (width/2)/      // On-screen aspect ratio for
                (height);   // this camera: width/height.

  // For this viewport, set camera's eye point and the viewing volume:
  projMatrix.setPerspective(40,        // fovy: y-axis field-of-view in degrees  
                                      // (top <-> bottom in view frustum)
                            vpAspect, // aspect ratio: width/height
                            1, 100);  // near, far (always >0).
  // Set the matrix to be used for to set the camera view
  lightPos.setPerspective(40,vpAspect,1,100);
  if (AirplaneMode != true ) {
    viewMatrix.setLookAt(PosX,PosY,PosZ,GoalX,GoalY,GoalZ,VecX,VecY,VecZ)
  } else {
    calculateLook()
    move(AirplaneSpeed,0.0)
    viewMatrix.setLookAt(PosX,PosY,PosZ,GoalX,GoalY,GoalZ,VecX,VecY,VecZ)
  }

  lightPos.translate(10,10,10);
  // Pass the model view projection matrix to graphics hardware thru u_ModelMatrix
 // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //gl.uniformMatrix4fv(u_LightPos, false, lightPos.elements);
	// Draw the scene:
  altView = viewMatrix;
	drawMyScene(gl);
 
  //----------------------Create, RIGHT viewport------------------------
  gl.viewport(width/2,                              // Viewport lower-left corner
              0,                              // location(in pixels)
              width/2,          // viewport width,
              height);      // viewport height in pixels.

  // For this viewport, set camera's eye point and the viewing volume:
  projMatrix.setOrtho(-width/100, width/100, -height/50, height/50, 0.0, 1000);

	// but use a different 'view' matrix:
  var newPosX = PosX + 10
  //gl.uniformMatrix4fv(u_LightPos, false, lightPos.elements);
	// Draw the scene:
	drawMyScene(gl);
}

function drawMyScene(myGL) {		
  
  // Draw the 'forest' in the current 'world' coord system:
  // (where +y is 'up', as defined by our setLookAt() function call above...)
  //myGL.drawArrays(myGL.TRIANGLES, forestStart/floatsPerVertex, forestVerts.length/floatsPerVertex);
  
 // Rotate to make a new set of 'world' drawing axes: 
 // old one had "+y points upwards", but
  modelMatrix.setTranslate(0.0,0.0,0.0)
  modelMatrix.rotate(-90.0, 1,0,0);	// new one has "+z points upwards",
  																		// made by rotating -90 deg on +x-axis.
  																		// Move those new drawing axes to the 
  																		// bottom of the trees:
	modelMatrix.translate(0.0, 0.0, -0.6);	
	modelMatrix.scale(0.4, 0.4,0.4);		// shrink the drawing axes 
																			//for nicer-looking ground-plane, and
  // Pass the modified view matrix to our shaders:
  modelMatrix.scale(5.0,5.0,5.0)
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose()
  // Pass our current matrix to the vertex shaders:
  myGL.uniformMatrix4fv(u_projMatrix, false, projMatrix.elements);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  //myCube.translate(0,1,0);
  //myCube.draw(myGL,modelMatrix, normalMatrix, u_ModelMatrix);

  // Now, using these drawing axes, draw our ground plane: 
  myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							gndStart/floatsPerVertex,	// start at this vertex number, and
  							gndVerts.length/floatsPerVertex);		// draw this many vertices
  // Now, using these drawing axes, draw our ground plane: 
  drawTurret(myGL, -2.0,-2.0,0,currentAngle*2,turboAngle);
  modelMatrix.rotate(90,1,0,0)
  drawAxis(myGL);
  modelMatrix.rotate(-90,1,0,0)
  drawTurret(myGL,  2.0,-2.0,0,currentAngle*2,turboAngle)
  drawTurret(myGL,  2.0,  2.0,0,-currentAngle,turboAngle)
  drawTurret(myGL, -2.0, 2.0,0,-currentAngle*2,turboAngle)
  drawShuttle(myGL,4.0,12.0,0.0,0.0,0.0);
  drawProbe(myGL,5.0,0.0,0.5,currentAngle,turboAngle);
  modelMatrix.scale(8.0,8.0,8.0)
  drawBuilding(myGL,-0.2,0.0,0.4,currentAngle*2);
  drawBuilding(myGL,-0.2,0.4,0.4,currentAngle*2);
  drawBuilding(myGL,-0.2,-0.4,0.4,currentAngle*2);
  drawBuilding(myGL,0.2,0.7,0.4,currentAngle*2);
  drawBuilding(myGL,0.6,0.7,0.4,currentAngle*2);
  drawBuilding(myGL,1.0,0.7,0.4,currentAngle*2);
  drawBuilding(myGL,1.4,0.7,0.4,currentAngle*2);

  modelMatrix.scale(0.05,0.05,0.05)
  modelMatrix.translate(2.0,0.0,0.0)

  quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w); // Quaternion-->Matrix
  modelMatrix.concat(quatMatrix);                         // apply that matrix.

  
  //-------------------------------
  // Drawing:
  // Use the current ModelMatrix to transform & draw something new from our VBO:
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose()
  //-----DRAW TETRA:  Use this matrix to transform & draw 
  //            the first set of vertices stored in our VBO:
  // Pass our current matrix to the vertex shaders:
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  myGL.drawArrays(myGL.TRIANGLES, tetStart/floatsPerVertex,tetVerts.length/floatsPerVertex);
  drawAxis(myGL)
}


function winResize() {

  var nuCanvas = document.getElementById('webgl');  // get current canvas
  nuCanvas = canvas
  var nuGL = getWebGLContext(nuCanvas);             // and context:
  //Report our current browser-window contents:

  console.log('nuCanvas width,height=', nuCanvas.width, nuCanvas.height);   
 console.log('Browser window: innerWidth,innerHeight=', 
                                innerWidth, innerHeight); // http://www.w3schools.com/jsref/obj_window.asp

  
  //Make canvas fill the top 3/4 of our browser window:
  nuCanvas.width = innerWidth;
  nuCanvas.height = innerHeight*3/4;
  width = innerWidth
  height = innerHeight

 draw(nuGL);
}
//////////////////////////////Key Callbacks//////////////////////
function myKeyDown(ev) {
  switch(ev.keyCode) {      // keycodes !=ASCII, but are very consistent for 
  //  nearly all non-alphanumeric keys for nearly all keyboards in all countries.
    case 37:    // left-arrow key
      // print in console:
      console.log(' left-arrow.');
        angleX = angleX - 0.02;
      break;
    case 38:    // up-arrow key
      console.log('   up-arrow.');
          angleY = angleY + 0.02
          GoalY = GoalY + 1
      break;
    case 39:    // right-arrow key
      console.log('right-arrow.');
          angleX = angleX + 0.02;
      break;
    case 40:    // down-arrow key
      console.log(' down-arrow.');
          angleY = angleY - 0.02
          GoalY = GoalY - 1
      break;
     case 87:    // down-arrow key
      console.log(' w-key.');
      if (AirplaneMode == true) {
        AirplaneSpeed = Math.min(1.0,AirplaneSpeed + 0.01)
      } else {
        move(0.1,0.0)
      }
      break;
     case 83:    // down-arrow key
      console.log(' s-key.');
      if (AirplaneMode == true) {
        AirplaneSpeed = Math.max(0.05,AirplaneSpeed - 0.01)
      } else {
        move(-0.1,0.0)
      }
      break;
     case 65:
      console.log('a -key?');
      if (AirplaneMode == true) {
        roll = Math.max(-1,roll - 0.1)
      } else {
        move(0,0.1)
      }
      break;
    case 68:
      console.log('d- key?');
      if (AirplaneMode == true) {
        roll = Math.min(1,roll + 0.1)
      } else {
        move(0,-0.1)
      }
      break;
    case 70:
      console.log('f');
      PosY = PosY - 0.1
    break;
    case 82:
      console.log('r');
      PosY = PosY + 0.1
    break;
    case 32:
      AirplaneMode = !AirplaneMode
      console.log(AirplaneMode)
    default:
      // console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
    //  document.getElementById('Result').innerHTML =
    //    'myKeyDown()--keyCode='+ev.keyCode; Auccalyptica 
      break;
  }
  calculateLook()
}
function move(frontSpeed,sideSpeed) {
    PosX = PosX + (Math.cos(angleX) * frontSpeed) 
    PosX = PosX + (Math.cos(angleX - Math.PI/2) * sideSpeed )
    PosZ = PosZ + (Math.sin(angleX) * frontSpeed)
    PosZ = PosZ + (Math.sin(angleX - Math.PI/2) * sideSpeed )
    if (AirplaneMode == true) {
      PosY = PosY + (Math.sin(angleY) * frontSpeed)
    }
}
function calculateLook() {
  if (AirplaneMode == true) {
    VecX = -Math.sin(angleX) * Math.sin(roll)
    VecY = Math.cos(roll)
    VecZ = Math.cos(angleX) * Math.sin(roll)
    GoalX = PosX + (distPers * Math.cos(angleX))
    GoalZ = PosZ + (distPers * Math.sin(angleX))
    GoalY = PosY + (distPers * Math.sin(angleY))
  } else {
    GoalX = PosX + (distPers * Math.cos(angleX))
    GoalZ = PosZ + (distPers * Math.sin(angleX))
    VecY = 1
    VecX = 0
    VecZ = 0
    AngleZ = 0
  }
 // GoalY = GoalY + (distPers * Math.cos(angleZ) + Math.sin(GoalY))
}


function initVertexBuffers(gl) {
    makeCube();
    makeCockPit();
    makeTopWing();
    makeWing();
    makeBody();
    makeGun();
    makeOctagon();
  //==============================================================================

  // make our 'forest' of triangular-shaped trees:
  forestVerts = new Float32Array([
    // // 3 Vertex coordinates (x,y,z) and 3 colors (r,g,b)
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, 0.0,0.0,1.0,1.0,// The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4, 0.0,0.0,1.0,1.0,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4, 0.0,0.0,1.0,1.0,
   
     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, 0.0,0.0,1.0,1.0,// The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4, 0.0,0.0,1.0,1.0,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 0.0,0.0,1.0,1.0,

     0.0,  0.5,   0.0,  0.4,  0.4,  1.0, 0.0,0.0,1.0,1.0, // The front blue one 
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0, 0.0,0.0,1.0,1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4, 0.0,0.0,1.0,1.0,
  ]);
  var c30 = Math.sqrt(0.75);          // == cos(30deg) == sqrt(3) / 2
  var sq2 = Math.sqrt(2.0);            
  // for surface normals:
  var sq23 = Math.sqrt(2.0/3.0)
  var sq29 = Math.sqrt(2.0/9.0)
  var sq89 = Math.sqrt(8.0/9.0)
  var thrd = 1.0/3.0;
  tetVerts = new Float32Array([



// Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
     // Node 0 (apex, +z axis;      color--blue,        surf normal (all verts):
          0.0,   0.0, sq2,    0.0,  0.0,  1.0,     sq23,  sq29, thrd,0.0,  
     // Node 1 (base: lower rt; red)
          c30, -0.5, 0.0,     1.0,  0.0,  0.0,    sq23, sq29, thrd,0.0,  
     // Node 2 (base: +y axis;  grn)
          0.0,  1.0, 0.0,      0.0,  1.0,  0.0,    sq23, sq29, thrd, 0.0,  
// Face 1: (left side).   Unit Normal Vector: N1 = (-sq23, sq29, thrd)
     // Node 0 (apex, +z axis;  blue)
          0.0,   0.0, sq2,     0.0,  0.0,  1.0,   -sq23, sq29, thrd,0.0,  
     // Node 2 (base: +y axis;  grn)
          0.0,  1.0, 0.0,      0.0,  1.0,  0.0,   -sq23, sq29, thrd,0.0,  
     // Node 3 (base:lower lft; white)
          -c30, -0.5, 0.0,    1.0,  1.0,  1.0,   -sq23, sq29, thrd,0.0,  
// Face 2: (lower side)   Unit Normal Vector: N2 = (0.0, -sq89, thrd)
     // Node 0 (apex, +z axis;  blue) 
          0.0,   0.0, sq2,  0.0,  0.0,  1.0,    0.0, -sq89, thrd,0.0,  
    // Node 3 (base:lower lft; white)
          -c30, -0.5, 0.0,     1.0,  1.0,  1.0,    0.0, -sq89, thrd,    0.0,                                                     //0.0, 0.0, 0.0, // Normals debug
     // Node 1 (base: lower rt; red) 
          c30, -0.5, 0.0,      1.0,  0.0,  0.0,    0.0, -sq89, thrd,0.0,  
// Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
    // Node 3 (base:lower lft; white)
          -c30, -0.5, 0.0,      1.0,  1.0,  1.0,    0.0,  0.0, -1.0,0.0,  
    // Node 2 (base: +y axis;  grn)
          0.0,  1.0, 0.0,      0.0,  1.0,  0.0,    0.0,  0.0, -1.0,0.0,  
    // Node 1 (base: lower rt; red)
          c30, -0.5, 0.0,      1.0,  0.0,  0.0,    0.0,  0.0, -1.0,0.0,  
  ]);
  
  axisVerts = new Float32Array([
    // Drawing Axes: Draw them using gl.LINES drawing primitive;
    // +x axis RED; +y axis GREEN; +z axis BLUE; origin: GRAY
    0.0,  0.0,  0.0,   0.3,  0.3,  0.3,  0.0,1.0,0.0,1.0,// X axis line (origin: gray)
    3.0,  0.0,  0.0,   1.0,  0.3,  0.3,  0.0,1.0,0.0,1.0,//             (endpoint: red)

    0.0,  0.0,  0.0,   0.3,  0.3,  0.3,  0.0,1.0,0.0,1.0,// Y axis line (origin: white)
    0.0,  3.0,  0.0,   0.3,  1.0,  0.3,  0.0,1.0,0.0,1.0,//             (endpoint: green)

    0.0,  0.0,  0.0,   0.3,  0.3,  0.3,  0.0,1.0,0.0,1.0,// Z axis line (origin:white)
    0.0,  0.0,  3.0,   0.3,  0.3,  1.0,  0.0,1.0,0.0,1.0,//             (endpoint: blue)
  ]);
  // Make our 'ground plane'; can you make a'torus' shape too?
  // (recall the 'basic shapes' starter code...)
  makeGroundGrid();

  // How much space to store all the shapes in one array?
  // (no 'var' means this is a global variable)
  mySiz = forestVerts.length + gndVerts.length + axisVerts.length + myCube.vertArray.length + myCockPit.vertArray.length 
    + myTopWing.vertArray.length + myWing.vertArray.length + myOct.vertArray.length + tetVerts.length
    + myBody.vertArray.length + myGun.vertArray.length;

  // How many vertices total?
  var nn = mySiz / floatsPerVertex;
  console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

  // Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
  // Copy them:  remember where to start for each shape:
  cubStart = 0;
  myCube.setStartP(0);            // we stored the cylinder first.
    for(i=0,j=0; j< myCube.vertArray.length; i++,j++) {
    //  console.log(myCube.vertArray[j]);
      verticesColors[i] = myCube.vertArray[j];
  }
  myCockPit.setStartP(i); 
  for(j=0; j< myCockPit.vertArray.length; i++,j++) {
    //  console.log(myCube.vertArray[j]);
      verticesColors[i] = myCockPit.vertArray[j];
  }
  myTopWing.setStartP(i); 
  for(j=0; j< myTopWing.vertArray.length; i++,j++) {
    //  console.log(myCube.vertArray[j]);
      verticesColors[i] = myTopWing.vertArray[j];
  }
  myWing.setStartP(i);  
  for(j=0; j< myWing.vertArray.length; i++,j++) {
    //  console.log(myCube.vertArray[j]);
      verticesColors[i] = myWing.vertArray[j];
  }
  myBody.setStartP(i);  
  for(j=0; j< myBody.vertArray.length; i++,j++) {
    //  console.log(myCube.vertArray[j]);
      verticesColors[i] = myBody.vertArray[j];
  }
  myGun.setStartP(i); 
  for(j=0; j< myGun.vertArray.length; i++,j++) {
    //  console.log(myCube.vertArray[j]);
      verticesColors[i] = myGun.vertArray[j];
  }
  forestStart = i;              // we store the forest first.
  for(j=0; j< forestVerts.length; i++,j++) {
    verticesColors[i] = forestVerts[j];
    } 
  gndStart = i;           // next we'll store the ground-plane;
  for(j=0; j< gndVerts.length; i++, j++) {
    verticesColors[i] = gndVerts[j];
    }
  axisStart = i;           // next we'll store the ground-plane;
  for(j=0; j< axisVerts.length; i++, j++) {
    verticesColors[i] = axisVerts[j];
  }
  myOct.setStartP(i);
  for(j=0; j< myOct.vertArray.length; i++,j++) {
      verticesColors[i] = myOct.vertArray[j];
  }
  tetStart = i;
  for(j=0; j< tetVerts.length; i++,j++) {
      verticesColors[i] = tetVerts[j];
  }
  
  // Create a vertex buffer object (VBO)
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 10, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 10, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

                    // Enable assignment of vertex buffer object's position data
  var a_Normal = gl.getAttribLocation(gl.program,'a_Normal');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }
  gl.vertexAttribPointer(
    a_Normal,        // choose Vertex Shader attribute to fill with data
    4,              // how many values? 1,2,3 or 4. (we're using R,G,B)
    gl.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    FSIZE * 10,      // Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b) * bytes/value
    FSIZE * 6);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w

  gl.enableVertexAttribArray(a_Normal);  
  //--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return mySiz/floatsPerVertex; // return # of vertices
}


function ThreeDShape(name) {
  this.type = name;
  console.log("initializing Obj " + name)
  this.vertArray = new Array();
  this.endPoint = 0;
  this.colorArray = new Array ([0.0,0.0,0.0]);
  this.normalArray = new Array ([1.0,1.0,1.0]);
  this.xTrans = 0.0;
  this.yTrans = 0.0;
  this.zTrans = 0.0;

  this.xScale = 1.0;
  this.yScale = 1.0;
  this.zScale = 1.0;

  this.angle = 0.0;
  this.rotX = 1;
  this.rotY = 0.0;
  this.rotZ = 0.0;

  this.startP = 0;

  //Normal calculation
  this.normalPoint = 0
  this.initPoint = new Array ([0.0,0.0,0.0]);
  this.tempVec1 = new Array ([0.0,0.0,0.0]);
  this.tempVec2 = new Array ([0.0,0.0,0.0]);
  this.tempNorm = new Array ([0.0,0.0,0.0]);
  this.tempNorm2 = new Array ([0.0,0.0,0.0]);

  this.setColor = function (r,g,b) {
    this.colorArray[0] = r;
    this.colorArray[1] = g;
    this.colorArray[2] = b;
  };
  this.setNormal = function (x,y,z) {
    this.normalArray[0] = x;
    this.normalArray[1] = y;
    this.normalArray[2] = z;
  }
  this.addVertex = function(x,y,z) {
    var i = this.endPoint
    this.vertArray[i] = x;
    this.vertArray[i+1] = y;
    this.vertArray[i+2] = z;
    this.vertArray[i+3] = this.colorArray[0];
    this.vertArray[i+4] = this.colorArray[1];
    this.vertArray[i+5] = this.colorArray[2];
    this.vertArray[i+6] = this.normalArray[0];
    this.vertArray[i+7] = this.normalArray[1];
    this.vertArray[i+8] = this.normalArray[2];
    this.vertArray[i+9] = 0;
    this.endPoint = this.endPoint + floatsPerVertex
    this.normalPoint = this.normalPoint + 1
    //this.processNormals(x,y,z,this.normalPoint)
    return this.dat
  };
  this.processNormals = function(x,y,z,point) {
    if (point == 1) {

      this.initPoint[0] = x
      this.initPoint[1] = y
      this.initPoint[2] = z

    }else if (point == 2) {
      this.tempVec1[0] = x - this.initPoint[0]
      this.tempVec1[1] = y - this.initPoint[1]
      this.tempVec1[2] = z - this.initPoint[2]

    } else if (point == 3) {
      this.tempVec2[0] = x - this.initPoint[0]
      this.tempVec2[1] = y - this.initPoint[1]
      this.tempVec2[2] = z - this.initPoint[2]

      this.tempNorm[0] = (this.tempVec1[1] * this.tempVec2[2]) - (this.tempVec1[2] * this.tempVec2[1])
      this.tempNorm[1] = (this.tempVec1[2] * this.tempVec2[0]) - (this.tempVec1[1] * this.tempVec2[2])
      this.tempNorm[2] = (this.tempVec1[0] * this.tempVec2[1]) - (this.tempVec1[1] * this.tempVec2[0])
      this.tempNorm2[0] = this.tempNorm[0]/(Math.abs(this.tempNorm[0]) + Math.abs(this.tempNorm[1]) + Math.abs(this.tempNorm[2]))
      this.tempNorm2[1] = this.tempNorm[1]/(Math.abs(this.tempNorm[0]) + Math.abs(this.tempNorm[1]) + Math.abs(this.tempNorm[2]))
      this.tempNorm2[2] = this.tempNorm[2]/(Math.abs(this.tempNorm[0]) + Math.abs(this.tempNorm[1]) + Math.abs(this.tempNorm[2]))
      console.log(this.tempNorm2)
      var j = this.endPoint - 1
      for (i = 3; i > 0; i--) {
        this.vertArray[j-1] = this.tempNorm2[2]
        this.vertArray[j-2] = this.tempNorm2[1]
        this.vertArray[j-3] = this.tempNorm2[0]
        j = j - floatsPerVertex
      }
      this.normalPoint = 0
    }
  }
  this.translate = function(x,y,z) {
    this.xTrans = x;
    this.yTrans = y;
    this.zTrans = z;
  };

  this.setScale = function(x,y,z) {
    this.xScale = x;
    this.yScale = y;
    this.zScale = z;
  };

  this.setAngle = function(angle, rotX,rotY,rotZ) {
    this.angle = angle;
    this.rotX = rotX;
    this.rotY = rotY;
    this.rotZ = rotZ;
  };
  this.setStartP = function (start) {
    this.startP = start;
  };
  this.draw = function( gl,modelMatrix,normalMatrix, u_ModelMatrix) {
    modelMatrix.translate(this.xTrans,this.yTrans, this.zTrans); 
    modelMatrix.rotate(this.angle, this.rotX,this.rotY,this.rotZ);
    modelMatrix.scale(this.xScale, this.yScale, this.zScale);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose()

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,this.startP/floatsPerVertex, this.vertArray.length/floatsPerVertex);

    modelMatrix.scale(1/this.xScale, 1/this.yScale, 1/this.zScale);
    modelMatrix.rotate(-this.angle, this.rotX,this.rotY,this.rotZ);
    modelMatrix.translate(-this.xTrans,-this.yTrans, -this.zTrans); 
  };
};

function drawProbe(gl,posX, posY, posZ, bodyAngle,armAngle1,armAngle2)
{
  //body
  modelMatrix.translate(posX, posY, posZ); 
  modelMatrix.rotate(90,1,0,0)
  modelMatrix.rotate(180,0,1,0)
  myOct.setScale(0.5,0.5,0.5)
  myOct.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);

  myOct.translate(0.4,0.1,0.0)
  myOct.setAngle(90,0,0,1)
  myOct.setScale(0.25,0.25,0.25)
  myOct.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);

  myOct.translate(0.0,0.0,0.0)
  myOct.setAngle(0,1,0,0)

  modelMatrix.translate(0,-0.125,0)
  myOct.setScale(0.25,0.25,0.25)
  myOct.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0,-0.15,0)
  myOct.setScale(0.7,0.5,0.7)
  modelMatrix.rotate(bodyAngle,0,1,0)
  drawAxis(gl)
  myOct.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);

  //arm1
  modelMatrix.translate(0.2,0,0)
  modelMatrix.rotate(armAngle1,0,0,1)
  myCube.translate(0.0,-0.45,0.0)
  myCube.setScale(1.0,5.0,1.0)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.0,-0.45,0)
  modelMatrix.rotate(armAngle1*2,0,0,1)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.035,-0.45,0.035)
  modelMatrix.rotate(bodyAngle*10,0,1,0)
  myGun.setAngle(0,0,0,1)
  myGun.setScale(1.0,1.0,1.0)
  myGun.translate(-0.025,-0.1,-0.025)
  myGun.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);

  //undo
  modelMatrix.rotate(-bodyAngle*10,0,1,0)
  modelMatrix.translate(-0.035,0.45,-0.035)
  modelMatrix.rotate(-armAngle1*2,0,0,1)
  modelMatrix.translate(0.0,0.45,0)
  modelMatrix.rotate(-armAngle1,0,0,1)
  modelMatrix.translate(-0.2,0,0)

  //arm2:
  modelMatrix.translate(-0.3,0,0)
  modelMatrix.rotate(-armAngle1*0.7,0,0,1)
  myCube.translate(0.0,-0.45,0.0)
  myCube.setScale(1.0,5.0,1.0)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.0,-0.45,0)
  modelMatrix.rotate(-armAngle1*1.5,0,0,1)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.035,-0.45,0.035)
  modelMatrix.rotate(bodyAngle*10,0,1,0)
  myGun.translate(-0.025,-0.1,-0.025)
  myGun.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  //undo
  modelMatrix.rotate(-bodyAngle*10,0,1,0)
  modelMatrix.translate(-0.035,0.45,-0.035)
  modelMatrix.rotate(armAngle1*1.5,0,0,1)
  modelMatrix.translate(0.0,0.45,0)
  modelMatrix.rotate(armAngle1*0.7,0,0,1)
  modelMatrix.translate(0.3,0,0)

  //arm3:
  modelMatrix.translate(0.0,0.1,0.1)
  modelMatrix.rotate(-45 + armAngle1*0.2,1,0,0)
  myCube.translate(0.0,-0.45,0.0)
  myCube.setScale(1.0,5.0,1.0)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.0,-0.45,0)
  modelMatrix.rotate(-45 + armAngle1,1,0,0)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.035,-0.45,0.035)
  modelMatrix.rotate(bodyAngle*24,0,1,0)
  myGun.translate(-0.025,-0.1,-0.025)
  myGun.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);

  modelMatrix.rotate(-bodyAngle*24,0,1,0)
  modelMatrix.translate(-0.035,0.45,-0.035)
  modelMatrix.rotate(45 - armAngle1,1,0,0)
  modelMatrix.translate(0.0,0.45,0)
  modelMatrix.rotate(45- armAngle1*0.2,1,0,0)
  modelMatrix.translate(0.0,-0.1,-0.1)

  //arm4
  modelMatrix.translate(0.0,0.2,-0.1)
  modelMatrix.rotate(armAngle1,1,0,0)
  myCube.translate(0.0,-0.45,0.0)
  myCube.setScale(1.0,5.0,1.0)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.0,-0.45,0)
  modelMatrix.rotate(armAngle1,1,0,0)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);

  modelMatrix.rotate(-armAngle1,1,0,0)
  modelMatrix.translate(0.0,0.45,0)
  modelMatrix.rotate(-armAngle1,1,0,0)
  modelMatrix.translate(0.0,0.2,0.1)

  modelMatrix.rotate(-bodyAngle,0,1,0)
  modelMatrix.translate(0,0.15,0)
  modelMatrix.translate(0,0.125,0)
  modelMatrix.rotate(-90,1,0,0)
  modelMatrix.translate(-posX, -posY, -posZ); 

}

function drawBuilding(gl,posX, posY, posZ, bodyAngle)
{
  //body
  modelMatrix.translate(posX, posY, posZ); 
  modelMatrix.rotate(90,1,0,0)
  myCube.setScale(2.5,8.0,2.5)
  myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.125,0.55,0.125)
  modelMatrix.rotate(bodyAngle*2,0,1,0)
  myGun.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);

  modelMatrix.rotate(-bodyAngle*2,0,1,0)
  modelMatrix.translate(-0.125,-0.55,-0.125)
  modelMatrix.rotate(-90,1,0,0)
  modelMatrix.translate(-posX,-posY,-posZ);
}

function drawShuttle(gl,posX, posY, posZ, turretAngle,wingAngle) {
  modelMatrix.translate(posX, posY, posZ); 

  modelMatrix.rotate(90,1,0,0)
  modelMatrix.scale(10.0,10.0,10.0);

  modelMatrix.translate(-0.3,0,-0.15);
  myBody.setScale(1.0,1.0,1.5);
  myBody.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  myCockPit.setScale(0.5,0.5,-0.5)
  myCockPit.translate(0.175,0.0,0.75)
  myCockPit.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  myTopWing.translate(0.275,0.25,0.0)
  myTopWing.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  myTopWing.translate(0.275,0.25,0.0)

  modelMatrix.translate(0,0.1,0)
  modelMatrix.rotate(-wingAngle,0,0,1);
  myWing.setAngle(120,0,0,1)
  myWing.translate(-0.04,-0.25,0.0)
  myWing.setScale(0.7,0.8,1.5)
  myWing.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  myGun.setScale(0.2,0.25,0.25)
  myGun.translate(-0.05,-0.2,0.4)
  myGun.setAngle(90 + turretAngle,1,0,0)
  myGun.setAngle(90 - turretAngle,1,0,0)
  myGun.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.rotate(wingAngle,0,0,1);

  modelMatrix.translate(0.6,0.0,0)
  modelMatrix.rotate(wingAngle,0,0,1);
  myWing.setScale(-0.7,0.8,1.5)
  myWing.setAngle(240,0,0,1)
  myWing.translate(0.04,-0.25,0.0)
  myWing.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
  myGun.setScale(0.2,0.25,0.25)
  myGun.translate(0.05,-0.2,0.4)
  myGun.setAngle(90 + turretAngle,1,0,0)
  myGun.setAngle(90 - turretAngle,1,0,0)
  myGun.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);  
  
  modelMatrix.rotate(-wingAngle,0,0,1);
  modelMatrix.translate(-0.6,0.0,0)
  modelMatrix.translate(0,-0.1,0)
  modelMatrix.translate(0.3,0,0.15);
  modelMatrix.scale(0.1,0.1,0.1);
  modelMatrix.rotate(-90,1,0,0)
  myCube.setNormal(0.0,0.0,-1.0);
  modelMatrix.translate(-posX,-posY,-posZ); 
};

function drawTurret(myGL,posX,posY,posZ,turretAngle, turboAngle) {
  modelMatrix.translate(posX,posY,posZ); 
  modelMatrix.rotate(90,1,0,0)
  modelMatrix.scale(10.0,10.0,10.0);

  myBody.setScale(0.5,0.5,0.5);

  myBody.draw(myGL,modelMatrix, normalMatrix, u_ModelMatrix);
  modelMatrix.translate(0.15,0.125,0.075);
  modelMatrix.rotate(turretAngle,0,1,0);
  myCube.setScale(1,2,1);
  myCube.translate(-0.05,0.0,-0.05)
  myCube.draw(myGL,modelMatrix, normalMatrix, u_ModelMatrix);
  myGun.setAngle(90 + turboAngle,1,0,0)
  modelMatrix.translate(0.245,0.15,0.04);
  //modelMatrix.rotate(turboAngle,1,0,0);
  myGun.setScale(0.2,0.25,0.25)
  myGun.translate(-0.225,0.02,0.0)
  myGun.draw(myGL,modelMatrix, normalMatrix, u_ModelMatrix);
  myGun.translate(-0.275,0.02,0.0)
  myGun.draw(myGL,modelMatrix, normalMatrix, u_ModelMatrix);

  modelMatrix.translate(-0.245,-0.15,-0.04);
  modelMatrix.rotate(-turretAngle,0,1,0);
  modelMatrix.translate(-0.15,-0.125,-0.075);
  modelMatrix.scale(0.1,0.1,0.1);
  modelMatrix.rotate(-90,1,0,0)
  modelMatrix.translate(-posX,-posY,-posZ); 
};

function drawAxis(myGL) {
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose()
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.drawArrays(myGL.LINES,             // use this drawing primitive, and
               axisStart/floatsPerVertex, // start at this vertex number, and
               axisVerts.length/floatsPerVertex);   // draw this many vertices
}
function makeCube() {
  myCube = new ThreeDShape("cube");
  //back face
  myCube.setNormal(0.0,0.0,-1.0);
  myCube.setColor(0.4,0.9,0.4);
  myCube.addVertex(0.0,0.0,0.0);
  myCube.setColor(0.2,0.9,0.2);
  myCube.addVertex(0.1,0.0,0.0);
  myCube.addVertex(0.1,0.1,0.0);
  
  myCube.setColor(0.2,0.9,0.2);
  myCube.addVertex(0.0,0.0,0.0);
  myCube.setColor(0.4,0.9,0.4);
  myCube.addVertex(0.1,0.1,0.0);
  myCube.addVertex(0.0,0.1,0.0);

  //front face
  myCube.setNormal(0.0,0.0,1.0);
  myCube.setColor(0.9,0.4,0.4);
  myCube.addVertex(0.0,0.0,0.1);
  myCube.setColor(0.3,0.2,0.2);
  myCube.addVertex(0.1,0.1,0.1);
  myCube.addVertex(0.1,0.0,0.1);
  
  myCube.setColor(0.9,0.4,0.4);
  myCube.addVertex(0.0,0.0,0.1);
  myCube.setColor(0.3,0.2,0.2);
  myCube.addVertex(0.0,0.1,0.1);
  myCube.addVertex(0.1,0.1,0.1);
  
  //left face
  myCube.setNormal(-1.0,0.0,0.0);
  myCube.setColor(0.9,0.4,0.9);
  myCube.addVertex(0.0,0.0,0.0);
  myCube.setColor(0.9,0.2,0.9);
  myCube.addVertex(0.0,0.1,0.1);
  myCube.addVertex(0.0,0.0,0.1);
  
  myCube.setColor(0.9,0.4,0.9);
  myCube.addVertex(0.0,0.0,0.0);
  myCube.setColor(0.9,0.2,0.9);
  myCube.addVertex(0.0,0.1,0.1);
  myCube.addVertex(0.0,0.1,0.0);

  //right face
  myCube.setNormal(1.0,0.0,0.0);
  myCube.setColor(0.4,0.9,0.9);
  myCube.addVertex(0.1,0.0,0.0);
  myCube.setColor(0.2,0.9,0.9);
  myCube.addVertex(0.1,0.1,0.1);
  myCube.addVertex(0.1,0.0,0.1);
  
  myCube.setColor(0.4,0.9,0.9);
  myCube.addVertex(0.1,0.0,0.0);
  myCube.setColor(0.2,0.9,0.9);
  myCube.addVertex(0.1,0.1,0.1);
  myCube.addVertex(0.1,0.1,0.0);

  //bottom face
  myCube.setNormal(0.0,-1.0,0.0);
  myCube.setColor(0.4,0.4,0.4);
  myCube.addVertex(0.0,0.0,0.0);
  myCube.setColor(0.2,0.2,0.2);
  myCube.addVertex(0.0,0.0,0.1);
  myCube.addVertex(0.1,0.0,0.1);
  
  myCube.setColor(0.4,0.4,0.4);
  myCube.addVertex(0.0,0.0,0.0);
  myCube.setColor(0.2,0.2,0.2);
  myCube.addVertex(0.1,0.0,0.0);
  myCube.addVertex(0.1,0.0,0.1);

  //top face
 myCube.setNormal(0.0,1.0,0.0);
  myCube.setColor(1.0,0.4,0.4);
  myCube.addVertex(0.0,0.1,0.0);
  myCube.setColor(0.5,0.2,0.2);
  myCube.addVertex(0.0,0.1,0.1);
  myCube.addVertex(0.1,0.1,0.1);
  
  myCube.setColor(0.4,0.4,0.4);
  myCube.addVertex(0.0,0.1,0.0);
  myCube.setColor(1.0,0.2,0.2);
  myCube.addVertex(0.1,0.1,0.1);
  myCube.addVertex(0.1,0.1,0.0);
};

function makeCockPit() {
  myCockPit = new ThreeDShape("cockpit");
  //back face
  myCockPit.setNormal(0.0,0.0,-1.0);
  myCockPit.setColor(1,1,1);
  myCockPit.addVertex(0.4,0.5,0.6);
  myCockPit.setColor(0.2,0.2,0.2);
  myCockPit.addVertex(0.5,0.3,0.6);
  myCockPit.addVertex(2,1,1);

  
  myCockPit.setColor(0.2,0.2,0.2);
  myCockPit.addVertex(0.0,0.3,0.6);
  myCockPit.addVertex(0.1,0.5,0.6);
  myCockPit.setColor(0.4,0.5,0.4);
  myCockPit.addVertex(0.4,0.5,0.6);
  
  //left face
  myCockPit.setNormal(-0.4,0.4,-0.2);
  myCockPit.setColor(0.5,0.5,0.5);
  myCockPit.addVertex(0.0,0.3,0.6);
  myCockPit.addVertex(0.1,0.5,0.6);
  myCockPit.setColor(0.9,0.9,0.9);
  myCockPit.addVertex(0.15,0.0,0.0);
  
  //right face
  myCockPit.setNormal(0.4,0.4,-0.2);
  myCockPit.setColor(0.8,0.9,0.9);
  myCockPit.addVertex(0.35,0.0,0.0);
  myCockPit.setColor(0.5,0.5,0.5);
  myCockPit.addVertex(0.4,0.5,0.6);
  myCockPit.addVertex(0.5,0.3,0.6);

  //bottom face
  myCockPit.setNormal(0.0,0.0,-0.1);
  myCockPit.setColor(0.4,0.4,0.4);
  myCockPit.addVertex(0.0,0.3,0.6);
  myCockPit.setColor(0.2,0.2,0.2);
  myCockPit.addVertex(0.15,0.0,0.0);
  myCockPit.addVertex(0.5,0.3,0.6);
  
  myCockPit.setColor(0.4,0.4,0.4);
  myCockPit.addVertex(0.15,0.0,0.0);
  myCockPit.setColor(0.2,0.2,0.2);
  myCockPit.addVertex(0.35,0.0,0.0);
  myCockPit.addVertex(0.5,0.3,0.6);

  //top face
  myCockPit.setNormal(0,0.545454,0.454545);
  myCockPit.setColor(0.4,0.4,0.9);
  myCockPit.addVertex(0.1,0.5,0.6);
  myCockPit.setColor(0.2,0.2,0.5);
  myCockPit.addVertex(0.15,0.0,0.0);
  myCockPit.addVertex(0.4,0.5,0.6);
  
  myCockPit.setColor(0.4,0.4,0.4);
  myCockPit.addVertex(0.15,0.0,0.0);
  myCockPit.setColor(0.2,0.2,0.7);
  myCockPit.addVertex(0.35,0.0,0.0);
  myCockPit.addVertex(0.4,0.5,0.6);
};

function makeTopWing() {
  myTopWing = new ThreeDShape("topwing");
  
  //back face
  myTopWing.setNormal(0.0,0.0,-1.0)
  myTopWing.setColor(0.05,0.5,0.4);
  myTopWing.addVertex(0.0,0.0,0.0);
  myTopWing.setColor(0.2,0.3,0.2);
  myTopWing.addVertex(0.05,0.0,0.0);
  myTopWing.addVertex(0.05,0.6,0.0);
  
  myTopWing.setColor(0.2,0.3,0.2);
  myTopWing.addVertex(0.0,0.0,0.0);
  myTopWing.setColor(0.4,0.4,0.4);
  myTopWing.addVertex(0.05,0.6,0.0);
  myTopWing.addVertex(0.0,0.6,0.0);

  //side wing
  myTopWing.setNormal(0.0,-1.0,0.0)
  myTopWing.setColor(0.5,0.4,0.4);
  myTopWing.addVertex(0.05,0.0,0.0);
  myTopWing.setColor(0.3,0.2,0.2);
  myTopWing.addVertex(0.05,0.6,0.0);
  myTopWing.addVertex(0.05,0.0,0.4);
  
  myTopWing.setColor(0.5,0.4,0.4);
  myTopWing.addVertex(0.05,0.0,0.4);
  myTopWing.setColor(0.3,0.4,0.2);
  myTopWing.addVertex(0.05,0.2,0.45);
  myTopWing.addVertex(0.05,0.6,0.0);

  //side wing
  myTopWing.setNormal(0.0,1.0,0.0)
  myTopWing.setColor(0.4,0.4,0.4);
  myTopWing.addVertex(0.0,0.0,0.0);
  myTopWing.setColor(0.3,0.2,0.2);
  myTopWing.addVertex(0.0,0.6,0.0);
  myTopWing.addVertex(0.0,0.0,0.4);
  
  myTopWing.setColor(0.4,0.4,0.4);
  myTopWing.addVertex(0.0,0.0,0.4);
  myTopWing.setColor(0.0,0.2,0.2);
  myTopWing.addVertex(0.0,0.2,0.45);
  myTopWing.addVertex(0.0,0.6,0.0);

  //bottom wing
  myTopWing.setNormal(0.0,-1.0,0.0)
  myTopWing.setColor(0.6,0.6,0.4);
  myTopWing.addVertex(0.0,0.0,0.0);
  myTopWing.setColor(0.3,0.2,0.2);
  myTopWing.addVertex(0.05,0.0,0.0);
  myTopWing.addVertex(0.0,0.0,0.4);
  
  myTopWing.setColor(0.5,0.5,0.4);
  myTopWing.addVertex(0.0,0.0,0.4);
  myTopWing.setColor(0.0,0.2,0.2);
  myTopWing.addVertex(0.05,0.0,0.45);
  myTopWing.addVertex(0.05,0.0,0.0);

  //front panel
  myTopWing.setNormal(0.0,0.0,1.0)
  myTopWing.setColor(0.3,0.5,0.4);
  myTopWing.addVertex(0.0,0.0,0.4);
  myTopWing.setColor(0.3,0.3,0.2);
  myTopWing.addVertex(0.05,0.2,0.45);
  myTopWing.addVertex(0.05,0.0,0.4);
  
  myTopWing.setColor(0.3,0.5,0.4);
  myTopWing.addVertex(0.0,0.0,0.4);
  myTopWing.setColor(0.3,0.3,0.2);
  myTopWing.addVertex(0.05,0.2,0.45);
  myTopWing.addVertex(0.0,0.2,0.45);

  //front panel
  myTopWing.setNormal(0.0,-1.0,0.0)
  myTopWing.setColor(0.3,0.5,0.4);
  myTopWing.addVertex(0.0,0.0,0.4);
  myTopWing.setColor(0.3,0.3,0.2);
  myTopWing.addVertex(0.05,0.2,0.45);
  myTopWing.addVertex(0.05,0.0,0.4);
  
  myTopWing.setColor(0.3,0.4,0.4);
  myTopWing.addVertex(0.0,0.0,0.4);
  myTopWing.setColor(0.3,0.2,0.2);
  myTopWing.addVertex(0.05,0.2,0.45);
  myTopWing.addVertex(0.0,0.2,0.45);

  //top panel
  myTopWing.setNormal(0.0,0.9,-0.1)
  myTopWing.setColor(0.3,0.2,0.2);
  myTopWing.addVertex(0.05,0.2,0.45);
  myTopWing.setColor(0.3,0.3,0.4);
  myTopWing.addVertex(0.0,0.6,0.0);
  myTopWing.addVertex(0.05,0.6,0.0);
  
  myTopWing.setColor(0.3,0.3,0.4);
  myTopWing.addVertex(0.0,0.6,0.0);
  myTopWing.setColor(0.3,0.1,0.2);
  myTopWing.addVertex(0.05,0.2,0.45);
  myTopWing.addVertex(0.0,0.2,0.45);
};

function makeWing() {
  myWing = new ThreeDShape("wing");
  
  //back face
  myWing.setNormal(0.0,0.0,-1.0)
  myWing.setColor(0.5,0.5,0.5);
  myWing.addVertex(0.0,0.0,0.0);
  myWing.setColor(0.2,0.2,0.2);
  myWing.addVertex(0.05,0.0,0.0);
  myWing.addVertex(0.05,0.7,0.0);
  
  myWing.setColor(0.2,0.2,0.2);
  myWing.addVertex(0.0,0.0,0.0);
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.05,0.7,0.0);
  myWing.addVertex(0.0,0.7,0.0);

  //front face
  myWing.setNormal(0.0,0.0,1.0)
  myWing.setColor(0.3,0.3,0.3);
  myWing.addVertex(0.0,0.0,0.25);
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.05,0.0,0.25);
  myWing.addVertex(0.05,0.7,0.2);
  
  myWing.setColor(0.2,0.2,0.2);
  myWing.addVertex(0.0,0.0,0.25);
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.05,0.7,0.2);
  myWing.addVertex(0.0,0.7,0.2);

  //side wing
  myWing.setNormal(0.4444,0.55555,0.0)
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.05,0.0,0.0);
  myWing.setColor(0.3,0.2,0.25);
  myWing.addVertex(0.05,0.7,0.0);
  myWing.addVertex(0.05,0.0,0.25);
  
  myWing.setColor(0.4,0.6,0.4);
  myWing.addVertex(0.05,0.0,0.25);
  myWing.setColor(0.05,0.2,0.25);
  myWing.addVertex(0.05,0.7,0.2);
  myWing.addVertex(0.05,0.7,0.0);

  //wing Upfold
  myWing.setNormal(0.5,0.5,0.0)
  myWing.setColor(0.4,0.5,0.4);
  myWing.addVertex(0.05,0.0,0.0);
  myWing.setColor(0.3,0.2,0.25);
  myWing.addVertex(0.3,-0.2,0.0);
  myWing.addVertex(0.05,0.0,0.25);
  
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.05,0.0,0.25);
  myWing.setColor(0.05,0.2,0.25);
  myWing.addVertex(0.3,-0.2,0.25);
  myWing.addVertex(0.3,-0.2,0.0);

  //side wing
  myWing.setNormal(0.5,-0.55555,0.0)
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.0,0.0,0.0);
  myWing.setColor(0.3,0.2,0.25);
  myWing.addVertex(0.0,0.7,0.0);
  myWing.addVertex(0.0,0.0,0.25);
  
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.0,0.0,0.25);
  myWing.setColor(0.0,0.2,0.25);
  myWing.addVertex(0.0,0.7,0.2);
  myWing.addVertex(0.0,0.7,0.0);

  //wing Upfold
  myWing.setNormal(0.5,-0.5,0.0)
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.0,0.0,0.0);
  myWing.setColor(0.25,0.2,0.25);
  myWing.addVertex(0.25,-0.2,0.0);
  myWing.addVertex(0.0,0.0,0.25);
  
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.0,0.0,0.25);
  myWing.setColor(0.0,0.2,0.25);
  myWing.addVertex(0.25,-0.2,0.25);
  myWing.addVertex(0.25,-0.2,0.0);

  //top panel
  myWing.setNormal(0.0,1.0,0.0)
  myWing.setColor(0.3,0.4,0.4);
  myWing.addVertex(0.0,0.7,0.0);
  myWing.setColor(0.3,0.3,0.2);
  myWing.addVertex(0.05,0.7,0.2);
  myWing.addVertex(0.05,0.7,0.0);
  
  myWing.setColor(0.3,0.4,0.4);
  myWing.addVertex(0.0,0.7,0.0);
  myWing.setColor(0.3,0.3,0.2);
  myWing.addVertex(0.05,0.7,0.2);
  myWing.addVertex(0.0,0.7,0.2);

  //wing Upfold side
  myWing.setNormal(0.0,0.0,-1.0)
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.0,0.0,0.0);
  myWing.setColor(0.25,0.2,0.3);
  myWing.addVertex(0.3,-0.2,0.0);
  myWing.addVertex(0.05,0.0,0.0);
  
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.0,0.0,0.0);
  myWing.setColor(0.0,0.2,0.6);
  myWing.addVertex(0.25,-0.2,0.0);
  myWing.addVertex(0.3,-0.2,0.0);

  //wing Upfold side
 myWing.setNormal(0.0,0.0,1.0)
  myWing.setColor(0.4,0.4,0.4);
  myWing.addVertex(0.0,0.0,0.25);
  myWing.setColor(0.25,0.2,0.3);
  myWing.addVertex(0.3,-0.2,0.25);
  myWing.addVertex(0.05,0.0,0.25);
  
  myWing.setColor(0.5,0.4,0.5);
  myWing.addVertex(0.0,0.0,0.25);
  myWing.setColor(0.0,0.2,0.1);
  myWing.addVertex(0.25,-0.2,0.25);
  myWing.addVertex(0.3,-0.2,0.25);
};

function makeBody() {
myBody = new ThreeDShape("body");
  //back face
  myBody.setNormal(0.0,0.0,-1.0)
  myBody.setColor(0.4,0.4,0.4);
  myBody.addVertex(0.0,0.0,0.0);
  myBody.setColor(0.7,0.7,0.7);
  myBody.addVertex(0.6,0.0,0.0);
  myBody.addVertex(0.6,0.1,0.0);
  
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.0,0.0,0.0);
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.6,0.1,0.0);
  myBody.addVertex(0.0,0.1,0.0);
  //upper section
  myBody.setNormal(0.0,0.0,-1.0)
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.5,0.1,0.0);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.15,0.25,0.0);
  myBody.addVertex(0.45,0.25,0.0);
  
  myBody.addVertex(0.15,0.25,0.0);
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.5,0.1,0.0);
  myBody.addVertex(0.1,0.1,0.0);

  //front face
  myBody.setNormal(0.0,0.0,1.0)
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.0,0.0,0.3);
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.6,0.0,0.3);
  myBody.addVertex(0.6,0.1,0.3);

  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.0,0.0,0.3);
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.6,0.1,0.3);
  myBody.addVertex(0.0,0.1,0.3);
  //upper section
  myBody.setNormal(0.0,0.0,1.0)
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.5,0.1,0.3);
  myBody.addVertex(0.15,0.25,0.3);
  myBody.addVertex(0.45,0.25,0.3);
  
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.15,0.25,0.3);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.5,0.1,0.3);
  myBody.addVertex(0.1,0.1,0.3);

  //left face
  myBody.setNormal(-1.0,0.0,0.0)
  myBody.setColor(0.9,0.9,0.9);
  myBody.addVertex(0.0,0.0,0.0);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.0,0.1,0.3);
  myBody.addVertex(0.0,0.0,0.3);
  
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.0,0.0,0.0);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.0,0.1,0.3);
  myBody.addVertex(0.0,0.1,0.0);

  //right face
  myBody.setNormal(1.0,0.0,0.0)
  myBody.setColor(0.4,0.6,0.9);
  myBody.addVertex(0.6,0.0,0.0);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.6,0.1,0.3);
  myBody.addVertex(0.6,0.0,0.3);
  
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.6,0.0,0.0);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.6,0.1,0.3);
  myBody.addVertex(0.6,0.1,0.0);

  //bottom face
  myBody.setNormal(0.0,-1.0,0.0)
  myBody.setColor(0.4,0.4,0.4);
  myBody.addVertex(0.0,0.0,0.0);
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.6,0.0,0.3);
  myBody.addVertex(0.0,0.0,0.3);
  
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.0,0.0,0.0);
  myBody.setColor(0.4,0.4,0.4);
  myBody.addVertex(0.6,0.0,0.3);
  myBody.addVertex(0.6,0.0,0.0);

  //top face sides
  myBody.setNormal(0.0,1.0,0.0)
  myBody.setColor(0.4,0.4,0.4);
  myBody.addVertex(0.0,0.1,0.0);
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.1,0.1,0.3);
  myBody.addVertex(0.0,0.1,0.3);
  
  myBody.addVertex(0.0,0.1,0.0);
  myBody.addVertex(0.1,0.1,0.3);
  myBody.addVertex(0.1,0.1,0.0);

  myBody.setNormal(0.0,1.0,0.0)
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.6,0.1,0.0);
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.5,0.1,0.3);
  myBody.addVertex(0.6,0.1,0.3);
  
  myBody.addVertex(0.6,0.1,0.0);
  myBody.addVertex(0.5,0.1,0.3);
  myBody.addVertex(0.5,0.1,0.0);

  //top face slopes
  myBody.setNormal(0.8,0.2,0.0)
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.1,0.1,0.0);
  myBody.addVertex(0.15,0.25,0.3);
  myBody.addVertex(0.1,0.1,0.3);
  
  myBody.addVertex(0.1,0.1,0.0);
  myBody.addVertex(0.15,0.25,0.3);
  myBody.addVertex(0.15,0.25,0.0);

  myBody.setNormal(-0.8,0.2,0.0)
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.5,0.1,0.0);
  myBody.setColor(0.2,0.2,0.2);
  myBody.addVertex(0.45,0.25,0.3);
  myBody.addVertex(0.5,0.1,0.3);
  
  myBody.setColor(0.4,0.4,0.4);
  myBody.addVertex(0.5,0.1,0.0);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.45,0.25,0.3);
  myBody.addVertex(0.45,0.25,0.0);

  //top slope
  myBody.setNormal(0.0,1.0,0.0);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.45,0.25,0.0);
  myBody.addVertex(0.45,0.25,0.3);
  myBody.addVertex(0.15,0.25,0.3);

  myBody.addVertex(0.15,0.25,0.0);
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.45,0.25,0.0);
  myBody.addVertex(0.15,0.25,0.3);
};

function makeGun() {
  myGun = new ThreeDShape("gun");
  //back face + slopes
  myGun.setNormal(0.0,0.0,-1.0)
  myGun.setColor(0.8,0.8,0.5);
  myGun.addVertex(0.0,0.0,0.0);
  myGun.addVertex(0.05,0.0,0.0);
  myGun.addVertex(0.05,0.5,0.0);
  
  myGun.addVertex(0.0,0.0,0.0);
  myGun.addVertex(0.05,0.5,0.0);
  myGun.addVertex(0.0,0.5,0.0);

  myGun.setNormal(0.0,-0.4,-0.6)
  myGun.addVertex(0.0,0.0,0.0)
  myGun.addVertex(0.05,0.0,0.0)
  myGun.addVertex(-0.1,-0.1,-0.1)

  myGun.addVertex(0.05,0.0,0.0)
  myGun.addVertex(-0.1,-0.1,-0.1)
  myGun.addVertex(0.15,-0.1,-0.1)

  //front face + slopes
  myGun.setNormal(0.0,0.0,1.0)
  myGun.setColor(0.6,0.6,0.7);
  myGun.addVertex(0.0,0.0,0.05);
  myGun.addVertex(0.05,0.0,0.05);
  myGun.addVertex(0.05,0.5,0.05);
  
  myGun.setColor(0.9,0.4,0.4);
  myGun.addVertex(0.0,0.0,0.05);
  myGun.addVertex(0.05,0.5,0.05);
  myGun.addVertex(0.0,0.5,0.05);

  myGun.setNormal(0.0,-0.4,0.6)
  myGun.addVertex(0.0,0.0,0.05)
  myGun.addVertex(0.05,0.0,0.05)
  myGun.addVertex(-0.1,-0.1,0.15)

  myGun.addVertex(0.05,0.0,0.05)
  myGun.addVertex(-0.1,-0.1,0.15)
  myGun.addVertex(0.15,-0.1,0.15)
  
  // //left face
  myGun.setNormal(-1.0,0.0,0.0)
  myGun.setColor(0.6,0.6,0.6);
  myGun.addVertex(0.0,0.0,0.0);
  myGun.addVertex(0.0,0.5,0.0);
  myGun.addVertex(0.0,0.0,0.05);

  myGun.addVertex(0.0,0.0,0.05);
  myGun.addVertex(0.0,0.5,0.0);
  myGun.addVertex(0.0,0.5,0.05);

  // //right face
  myGun.setNormal(1.0,0.0,0.0)
  myGun.setColor(0.4,0.4,0.4);
  myGun.addVertex(0.05,0.0,0.0);
  myGun.addVertex(0.05,0.5,0.0);
  myGun.addVertex(0.05,0.0,0.05);

  myGun.addVertex(0.05,0.0,0.05);
  myGun.addVertex(0.05,0.5,0.0);
  myGun.addVertex(0.05,0.5,0.05);

  //side slope
  myGun.setNormal(-0.6,0.4,0.0)
  myGun.addVertex(0.0,0.0,0.0);
  myGun.addVertex(0.0,0.0,0.05);
  myGun.addVertex(-0.1,-0.1,0.15);

  myGun.addVertex(0.0,0.0,0.0);
  myGun.addVertex(-0.1,-0.1,0.15);
  myGun.addVertex(-0.1,-0.1,-0.1);

  // //side slope
  myGun.setNormal(0.6,0.4,0.0)
  myGun.setColor(0.5,0.4,0.4);
  myGun.addVertex(0.05,0.0,0.0);
  myGun.addVertex(0.05,0.0,0.05);
  myGun.addVertex(0.15,-0.1,0.15);

  myGun.setNormal(0.6,0.4,0.0)
  myGun.addVertex(0.05,0.0,0.0);
  myGun.addVertex(0.15,-0.1,0.15);
  myGun.addVertex(0.15,-0.1,-0.1);

  //top face
  myGun.setNormal(0.0,1.0,0.0)
  myGun.setColor(0.2,0.9,0.2);
  myGun.addVertex(0.0,0.5,0.0);
  myGun.setColor(0.2,0.3,0.2);
  myGun.addVertex(0.05,0.5,0.05);
  myGun.addVertex(0.0,0.5,0.05);
  
  myGun.setColor(0.3,0.2,0.1);
  myGun.addVertex(0.0,0.05,0.0);
  myGun.setColor(0.2,0.6,0.2);
  myGun.addVertex(0.05,0.5,0.05);
  myGun.addVertex(0.05,0.5,0.0);

  //very bottom square
  myGun.setNormal(0.0,-1.0,0.0)
  myGun.addVertex(0.15,-0.1,0.15);
  myGun.addVertex(-0.1,-0.1,-0.1);
  myGun.addVertex(0.15,-0.1,-0.1);

  myGun.addVertex(-0.1,-0.1,0.15);
  myGun.addVertex(-0.1,-0.1,-0.1);
  myGun.addVertex(0.15,-0.1,0.15);
};


function makeOctagon() {
  myOct = new ThreeDShape("octagon");
  myOct.setNormal(0.0,1.0,0.0)
  myOct.setColor(0.3,0.2,0.2)

  layer = 0.5
  //top layer
  myOct.addVertex(-0.6,layer,0.2)
  myOct.addVertex(-0.2,layer,0.6)
  myOct.addVertex(-0.2,layer,0.2)

  myOct.addVertex(-0.2,layer,0.6)
  myOct.addVertex(-0.2,layer,-0.6)
  myOct.addVertex(0.2,layer,-0.6)

  myOct.addVertex(0.2,layer,-0.6)
  myOct.addVertex(0.2,layer,0.6)
  myOct.addVertex(-0.2,layer,0.6)

  myOct.addVertex(0.6,layer,0.2)
  myOct.addVertex(0.2,layer,0.6)
  myOct.addVertex(0.2,layer,0.2)

  //middle Layer

  myOct.addVertex(-0.6,layer,0.2)
  myOct.addVertex(-0.6,layer,-0.2)
  myOct.addVertex(0.6,layer,0.2)

  myOct.addVertex(0.6,layer,0.2)
  myOct.addVertex(0.6,layer,-0.2)
  myOct.addVertex(-0.6,layer,-0.2)

  //bottum two triangle corners.
  myOct.addVertex(-0.6,layer,-0.2)
  myOct.addVertex(-0.2,layer,-0.2)
  myOct.addVertex(-0.2,layer,-0.6)

  myOct.addVertex(0.6,layer,-0.2)
  myOct.addVertex(0.2,layer,-0.2)
  myOct.addVertex(0.2,layer,-0.6)

  layer = 0
//bottom
  myOct.setNormal(0.0,-1.0,0.0)
  //top layer
  myOct.addVertex(-0.6,layer,0.2)
  myOct.addVertex(-0.2,layer,0.6)
  myOct.addVertex(-0.2,layer,0.2)

  myOct.addVertex(-0.2,layer,0.6)
  myOct.addVertex(-0.2,layer,-0.6)
  myOct.addVertex(0.2,layer,-0.6)

  myOct.addVertex(0.2,layer,-0.6)
  myOct.addVertex(0.2,layer,0.6)
  myOct.addVertex(-0.2,layer,0.6)

  myOct.addVertex(0.6,layer,0.2)
  myOct.addVertex(0.2,layer,0.6)
  myOct.addVertex(0.2,layer,0.2)

  //middle Layer

  myOct.addVertex(-0.6,layer,0.2)
  myOct.addVertex(-0.6,layer,-0.2)
  myOct.addVertex(0.6,layer,0.2)

  myOct.addVertex(0.6,layer,0.2)
  myOct.addVertex(0.6,layer,-0.2)
  myOct.addVertex(-0.6,layer,-0.2)

  //bottum two triangle corners.
  myOct.addVertex(-0.6,layer,-0.2)
  myOct.addVertex(-0.2,layer,-0.2)
  myOct.addVertex(-0.2,layer,-0.6)

  myOct.addVertex(0.6,layer,-0.2)
  myOct.addVertex(0.2,layer,-0.2)
  myOct.addVertex(0.2,layer,-0.6)

  //Sides
  //top
  myOct.setColor(0.3,0.5,0.5)
  myOct.setNormal(0.0,0.0,1.0)
  myOct.addVertex(-0.2,0.5,0.6)
  myOct.addVertex(0.2,0.5,0.6)
  myOct.addVertex(0.2,0.0,0.6)

  myOct.addVertex(0.2,0.0,0.6)
  myOct.addVertex(-0.2,0.0,0.6)
  myOct.addVertex(-0.2,0.5,0.6)

  //topleftCorner
  myOct.setColor(0.2,0.2,0.2)
  myOct.setNormal(-0.5,0.0,0.5)
  myOct.addVertex(-0.2,0.5,0.6)
  myOct.addVertex(-0.6,0.5,0.2)
  myOct.addVertex(-0.6,0.0,0.2)

  myOct.addVertex(-0.6,0.0,0.2)
  myOct.addVertex(-0.2,0.0,0.6)
  myOct.addVertex(-0.2,0.5,0.6)

  //left
  myOct.setColor(0.4,0.5,0.4)
  myOct.setNormal(-1.0,0.0,0.0)
  myOct.addVertex(-0.6,0.5,-0.2)
  myOct.addVertex(-0.6,0.5,0.2)
  myOct.addVertex(-0.6,0.0,0.2)

  myOct.addVertex(-0.6,0.0,0.2)
  myOct.addVertex(-0.6,0.0,-0.2)
  myOct.addVertex(-0.6,0.5,-0.2)

  //bottom leftCorner
  myOct.setColor(0.3,0.2,0.3)
  myOct.setNormal(-0.5,0.0,-0.5)
  myOct.addVertex(-0.2,0.5,-0.6)
  myOct.addVertex(-0.6,0.5,-0.2)
  myOct.addVertex(-0.6,0.0,-0.2)

  myOct.addVertex(-0.6,0.0,-0.2)
  myOct.addVertex(-0.2,0.0,-0.6)
  myOct.addVertex(-0.2,0.5,-0.6)

  //bottomrightCorner
  myOct.setColor(0.4,0.5,0.6)
  myOct.setNormal(0.5,0.0,-0.5)
  myOct.addVertex(0.2,0.5,-0.6)
  myOct.addVertex(0.6,0.5,-0.2)
  myOct.addVertex(0.6,0.0,-0.2)

  myOct.addVertex(0.6,0.0,-0.2)
  myOct.addVertex(0.2,0.0,-0.6)
  myOct.addVertex(0.2,0.5,-0.6)

  //right
  myOct.setColor(0.3,0.2,0.2)
  myOct.setNormal(1.0,0.0,0.0)
  myOct.addVertex(0.6,0.5,-0.2)
  myOct.addVertex(0.6,0.5,0.2)
  myOct.addVertex(0.6,0.0,0.2)

  myOct.addVertex(0.6,0.0,0.2)
  myOct.addVertex(0.6,0.0,-0.2)
  myOct.addVertex(0.6,0.5,-0.2)

  //topRightCorner
  myOct.setColor(0.5,0.4,0.5)
  myOct.setNormal(0.5,0.0,0.5)
  myOct.addVertex(0.2,0.5,0.6)
  myOct.addVertex(0.6,0.5,0.2)
  myOct.addVertex(0.6,0.0,0.2)

  myOct.addVertex(0.6,0.0,0.2)
  myOct.addVertex(0.2,0.0,0.6)
  myOct.addVertex(0.2,0.5,0.6)

  //bottom
    myOct.setColor(0.2,0.3,0.2)
  myOct.setNormal(0.0,0.0,-1.0)
  myOct.addVertex(-0.2,0.5,-0.6)
  myOct.addVertex(0.2,0.5,-0.6)
  myOct.addVertex(0.2,0.0,-0.6)

  myOct.addVertex(0.2,0.0,-0.6)
  myOct.addVertex(-0.2,0.0,-0.6)
  myOct.addVertex(-0.2,0.5,-0.6)
}

var g_last = Date.now();
var t_last = 0;
var offTime = 0;
var totalOfftime = 0;
function animate(angle,now) {
  var newAngle = angle + (mAngleSpeed);
  return newAngle %= 360;
}

function animateSin2(angle,now) {
  var newAngle = Math.sin((now)/360) * 30;
  return newAngle %= 360;
}

function animateSin(angle, isTurn,now) {
  if (isTurn == true) {
    if (offTime >= 0) {
      totalOfftime = totalOfftime + offTime;
      // console.log(offTime)
      // console.log(totalOfftime)
      offTime = -1
    }
    var newAngle = Math.sin((now - totalOfftime)/360) * 30;
    return newAngle %= 360;
  } else {
    if (offTime < 0){
      t_last = now;
    }
    offTime = (now - t_last);
    return angle
  }
}

function animateWings(angle) {
  var newAngle = angle
  if (mShuttlePos == "down") {
    newAngle = Math.max(0, angle - 1);
  } else {
    newAngle = Math.min(140, angle + 1);
  }
  return newAngle;
};


function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
//                  (Which button?    console.log('ev.button='+ev.button);   )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  // AND use any mouse-dragging we found to update quaternions qNew and qTot.
  //===================================================
  dragQuat(x - xMclik, y - yMclik);
  //===================================================
  xMclik = x;                         // Make NEXT drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
//============================================================================== 

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  //xMdragTot += (x - xMclik);
  //yMdragTot += (y - yMclik);

  //dragQuat(x - xMclik, y - yMclik);
};

function dragQuat(xdrag, ydrag) {
  var res = 5;
  var qTmp = new Quaternion(0,0,0,1);
  
  var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
  var dX = Math.cos(angleY) * xdrag * 0.00005
  var dY = -(Math.sin(angleX) * ( ydrag  * 0.00005))
  var dZ =  -(Math.cos(angleX) * ydrag * 0.00005);
  console.log(dY)
  if (dX != 0 || dY != 0 || dZ != 0) {
    qNew.setFromAxisAngle(dY, dZ, dX, dist*150.0);
  }
  qTmp.multiply(qNew,qTot);     // apply new rotation to current rotation. 
  qTot.copy(qTmp);
};