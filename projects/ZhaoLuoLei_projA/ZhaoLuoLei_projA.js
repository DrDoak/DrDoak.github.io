/*
LuoLei Zhao	lzg431
Project Started 1/20/16
Imperial Shuttle.js

Displays an Imperial Shuttle with the following features

Rotating gun turret
Folding wings
Missile sprite in the distance, with rotating 
*/

// Vertex shader program----------------------------------

var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
	//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
	//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


// Global Variables
var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
													// (x,y,z,w)position + (r,g,b)color
													// Later, see if you can add:
													// (x,y,z) surface normal + (tx,ty) texture addr.
// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  
var xMinit = 0.0;
var yMinit = 0.0;
var isTurretTurn = true;

function main() {
	var canvas = document.getElementById('webgl');
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}
	var n = initVertexBuffer(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}
	canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
	canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };					
	canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("keypress", myKeyPress, false);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST); 	  
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	if (!u_ModelMatrix) { 
		console.log('Failed to get the storage location of u_ModelMatrix');
		return;
	} 
	var modelMatrix = new Matrix4();
	var currentAngle = 0.0;
	var turretAngle = 0.0;
	var turboAngle = 0.0;
	var wingAngle = 0.0;
	mAngleSpeed = 0.5;
	mShuttlePos = "down"
	mShuttleX = -0.3;
	mShuttleY = 0;
	mShuttleGoalX = 0;
	mShuttleGoalY = 0;
	var tick = function() {
		var now = Date.now();
		turretAngle = animateSin(turretAngle, isTurretTurn,now)
		turboAngle = animateSin2(turretAngle,now)
		currentAngle = animate(currentAngle);  // Update the rotation angle
		wingAngle = animateWings(wingAngle);
		moveToGoal();
		draw(gl, n, currentAngle, turretAngle,turboAngle, wingAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
		// report current angle on console
		//console.log('currentAngle=',currentAngle);
		requestAnimationFrame(tick, canvas);   
											// Request that the browser re-draw the webpage
	};
  tick();							// start (and continue) animation: draw current image
}

function initVertexBuffer(gl) {
	makeCube();
	makeCockPit();
	makeTopWing();
	makeWing();
	makeBody();
	makeGun();

  	// how many floats total needed to store all shapes?
	var mySiz = (myCube.vertArray.length + myCockPit.vertArray.length 
		+ myTopWing.vertArray.length + myWing.vertArray.length 
		+ myBody.vertArray.length + myGun.vertArray.length);
  	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  	var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cubStart = 0;
	myCube.setStartP(0);						// we stored the cylinder first.
  	for(i=0,j=0; j< myCube.vertArray.length; i++,j++) {
  	//	console.log(myCube.vertArray[j]);
  		colorShapes[i] = myCube.vertArray[j];
	}
	myCockPit.setStartP(i);	
	for(j=0; j< myCockPit.vertArray.length; i++,j++) {
  	//	console.log(myCube.vertArray[j]);
  		colorShapes[i] = myCockPit.vertArray[j];
	}
	myTopWing.setStartP(i);	
	for(j=0; j< myTopWing.vertArray.length; i++,j++) {
  	//	console.log(myCube.vertArray[j]);
  		colorShapes[i] = myTopWing.vertArray[j];
	}
	myWing.setStartP(i);	
	for(j=0; j< myWing.vertArray.length; i++,j++) {
  	//	console.log(myCube.vertArray[j]);
  		colorShapes[i] = myWing.vertArray[j];
	}
	myBody.setStartP(i);	
	for(j=0; j< myBody.vertArray.length; i++,j++) {
  	//	console.log(myCube.vertArray[j]);
  		colorShapes[i] = myBody.vertArray[j];
	}
	myGun.setStartP(i);	
	for(j=0; j< myGun.vertArray.length; i++,j++) {
  	//	console.log(myCube.vertArray[j]);
  		colorShapes[i] = myGun.vertArray[j];
	}

	// Create a buffer object on the graphics hardware:
	var shapeBufferHandle = gl.createBuffer();  
	if (!shapeBufferHandle) {
		console.log('Failed to create the shape buffer object');
		return false;
	}

	// Bind the the buffer object to target:
	gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
	gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

	//Get graphics system's handle for our Vertex Shader's position-input variable: 
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}

	var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

	// Use handle to specify how to retrieve **POSITION** data from our VBO:
	gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
	gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if(a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return -1;
	}
	// Use handle to specify how to retrieve **COLOR** data from our VBO:
	gl.vertexAttribPointer(
	  	a_Color, 				// choose Vertex Shader attribute to fill with data
	  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
	  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
	  	false, 					// did we supply fixed-point data AND it needs normalizing?
	  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
	  									// (x,y,z,w, r,g,b) * bytes/value
	  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
	  									// value we will actually use?  Need to skip over x,y,z,w
	  									
	gl.enableVertexAttribArray(a_Color);  
	// Unbind the buffer object 
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return nn;
}


function draw(gl, n, currentAngle, turretAngle,turboAngle, wingAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	//myCockPit.setTranslate(0.1,0.0, 0.0);

	//Imperial Shuttle
	modelMatrix.setTranslate(mShuttleX, mShuttleY, 0.0); 
	var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
	modelMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);

	modelMatrix.translate(-0.3,0,-0.15);
	myBody.setScale(1.0,1.0,1.5);
	myBody.draw(gl,modelMatrix, u_ModelMatrix);
	myCockPit.setScale(0.5,0.5,-0.5)
	myCockPit.setTranslate(0.175,0.0,0.75)
	myCockPit.draw(gl,modelMatrix, u_ModelMatrix);
	myTopWing.setTranslate(0.275,0.25,0.0)
	myTopWing.draw(gl,modelMatrix, u_ModelMatrix);
	myTopWing.setTranslate(0.275,0.25,0.0)

	modelMatrix.translate(0,0.1,0)
	modelMatrix.rotate(-wingAngle,0,0,1);
	myWing.setAngle(120,0,0,1)
	myWing.setTranslate(-0.04,-0.25,0.0)
	myWing.setScale(0.7,0.8,1.5)
	myWing.draw(gl,modelMatrix, u_ModelMatrix);
	myGun.setScale(0.2,0.25,0.25)
	myGun.setTranslate(-0.05,-0.2,0.4)
	myGun.setAngle(90 + turretAngle,1,0,0)
	myGun.setAngle(90 - turretAngle,1,0,0)
	myGun.draw(gl,modelMatrix, u_ModelMatrix);
	modelMatrix.rotate(wingAngle,0,0,1);

	modelMatrix.translate(0.6,0.0,0)
	modelMatrix.rotate(wingAngle,0,0,1);
	myWing.setScale(-0.7,0.8,1.5)
	myWing.setAngle(240,0,0,1)
	myWing.setTranslate(0.04,-0.25,0.0)
	myWing.draw(gl,modelMatrix, u_ModelMatrix);
	myGun.setScale(0.2,0.25,0.25)
	myGun.setTranslate(0.05,-0.2,0.4)
	myGun.setAngle(90 + turretAngle,1,0,0)
	myGun.setAngle(90 - turretAngle,1,0,0)
	myGun.draw(gl,modelMatrix, u_ModelMatrix);

	//Turbolaser turret
	modelMatrix.setTranslate(0.5,-0.75,-0.5); 
	modelMatrix.rotate(45,0,1,0);

	myBody.setScale(0.5,0.5,0.5);
	myBody.draw(gl,modelMatrix, u_ModelMatrix);
	modelMatrix.translate(0.15,0.125,0.075);
	modelMatrix.rotate(currentAngle,0,1,0);
	myCube.setScale(1.0,2.0,1.0);
	myCube.setTranslate(-0.05,0.0,-0.05)
	myCube.draw(gl,modelMatrix, u_ModelMatrix);
	myGun.setAngle(90 + turboAngle,1,0,0)
	modelMatrix.translate(0.245,0.15,0.04);
	//modelMatrix.rotate(turboAngle,1,0,0);
	myGun.setScale(0.2,0.25,0.25)
	myGun.setTranslate(-0.225,0.02,0.0)
	myGun.draw(gl,modelMatrix, u_ModelMatrix);
	myGun.setTranslate(-0.275,0.02,0.0)
	myGun.draw(gl,modelMatrix, u_ModelMatrix);
	//myCockPit.draw(gl,modelMatrix, u_ModelMatrix);
	//myWing.draw(gl,modelMatrix, u_ModelMatrix);
	//myWing.draw(gl,modelMatrix, u_ModelMatrix);
}

function makeCube() {
	myCube = new ThreeDShape("testString");
	//back face
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
	myCube.setColor(0.9,0.4,0.4);
	myCube.addVertex(0.0,0.0,0.1);
	myCube.setColor(0.3,0.2,0.2);
	myCube.addVertex(0.1,0.0,0.1);
	myCube.addVertex(0.1,0.1,0.1);
	
	myCube.setColor(0.9,0.4,0.4);
	myCube.addVertex(0.0,0.0,0.1);
	myCube.setColor(0.3,0.2,0.2);
	myCube.addVertex(0.1,0.1,0.1);
	myCube.addVertex(0.0,0.1,0.1);
	
	//left face
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

	//top face
	myCube.setColor(0.4,0.4,0.4);
	myCube.addVertex(0.0,0.0,0.0);
	myCube.setColor(0.2,0.2,0.2);
	myCube.addVertex(0.1,0.0,0.1);
	myCube.addVertex(0.0,0.0,0.1);
	
	myCube.setColor(0.4,0.4,0.4);
	myCube.addVertex(0.0,0.0,0.0);
	myCube.setColor(0.2,0.2,0.2);
	myCube.addVertex(0.1,0.0,0.1);
	myCube.addVertex(0.1,0.0,0.0);

	//top face
	myCube.setColor(0.4,0.4,0.4);
	myCube.addVertex(0.0,0.1,0.0);
	myCube.setColor(0.2,0.2,0.2);
	myCube.addVertex(0.1,0.1,0.1);
	myCube.addVertex(0.0,0.1,0.1);
	
	myCube.setColor(0.4,0.4,0.4);
	myCube.addVertex(0.0,0.1,0.0);
	myCube.setColor(0.2,0.2,0.2);
	myCube.addVertex(0.1,0.1,0.1);
	myCube.addVertex(0.1,0.1,0.0);
};

function makeCockPit() {
	myCockPit = new ThreeDShape("testString");
	//back face
	myCockPit.setColor(0.4,0.4,0.4);
	myCockPit.addVertex(0.0,0.3,0.6);
	myCockPit.setColor(0.2,0.2,0.2);
	myCockPit.addVertex(0.5,0.3,0.6);
	myCockPit.addVertex(0.4,0.5,0.6);
	
	myCockPit.setColor(0.2,0.2,0.2);
	myCockPit.addVertex(0.0,0.3,0.6);
	myCockPit.setColor(0.4,0.5,0.4);
	myCockPit.addVertex(0.4,0.5,0.6);
	myCockPit.addVertex(0.1,0.5,0.6);
	
	//left face
	myCockPit.setColor(0.9,0.9,0.9);
	myCockPit.addVertex(0.15,0.0,0.0);
	myCockPit.setColor(0.5,0.5,0.5);
	myCockPit.addVertex(0.1,0.5,0.6);
	myCockPit.addVertex(0.0,0.3,0.6);
	
	//right face
	myCockPit.setColor(0.8,0.9,0.9);
	myCockPit.addVertex(0.35,0.0,0.0);
	myCockPit.setColor(0.5,0.5,0.5);
	myCockPit.addVertex(0.4,0.5,0.6);
	myCockPit.addVertex(0.5,0.3,0.6);

	//bottom face
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
	myTopWing = new ThreeDShape("testString");
	
	//back face
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
	myTopWing.setColor(0.3,0.3,0.4);
	myTopWing.addVertex(0.0,0.6,0.0);
	myTopWing.setColor(0.3,0.2,0.2);
	myTopWing.addVertex(0.05,0.2,0.45);
	myTopWing.addVertex(0.05,0.6,0.0);
	
	myTopWing.setColor(0.3,0.3,0.4);
	myTopWing.addVertex(0.0,0.6,0.0);
	myTopWing.setColor(0.3,0.1,0.2);
	myTopWing.addVertex(0.05,0.2,0.45);
	myTopWing.addVertex(0.0,0.2,0.45);
};

function makeWing() {
	myWing = new ThreeDShape("testString");
	
	//back face
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
myBody = new ThreeDShape("testString");
	//back face
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
	myBody.setColor(0.4,0.4,0.4);
	myBody.addVertex(0.0,0.1,0.0);
	myBody.setColor(0.2,0.2,0.2);
	myBody.addVertex(0.1,0.1,0.3);
	myBody.addVertex(0.0,0.1,0.3);
	
	myBody.addVertex(0.0,0.1,0.0);
	myBody.addVertex(0.1,0.1,0.3);
	myBody.addVertex(0.1,0.1,0.0);

	myBody.setColor(0.5,0.5,0.5);
	myBody.addVertex(0.6,0.1,0.0);
	myBody.setColor(0.2,0.2,0.2);
	myBody.addVertex(0.5,0.1,0.3);
	myBody.addVertex(0.6,0.1,0.3);
	
	myBody.addVertex(0.6,0.1,0.0);
	myBody.addVertex(0.5,0.1,0.3);
	myBody.addVertex(0.5,0.1,0.0);

	//top face slopes
	myBody.setColor(0.5,0.5,0.5);
	myBody.addVertex(0.1,0.1,0.0);
	myBody.addVertex(0.15,0.25,0.3);
	myBody.addVertex(0.1,0.1,0.3);
	
	myBody.addVertex(0.1,0.1,0.0);
	myBody.addVertex(0.15,0.25,0.3);
	myBody.addVertex(0.15,0.25,0.0);

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
	myGun = new ThreeDShape("testString");
	//back face
	myGun.setColor(0.8,0.8,0.5);
	myGun.addVertex(0.0,0.0,0.0);
	myGun.addVertex(0.05,0.0,0.0);
	myGun.addVertex(0.05,0.5,0.0);
	
	myGun.addVertex(0.0,0.0,0.0);
	myGun.addVertex(0.05,0.5,0.0);
	myGun.addVertex(0.0,0.5,0.0);

	myGun.addVertex(0.0,0.0,0.0)
	myGun.addVertex(0.05,0.0,0.0)
	myGun.addVertex(-0.1,-0.1,-0.1)

	myGun.addVertex(0.05,0.0,0.0)
	myGun.addVertex(-0.1,-0.1,-0.1)
	myGun.addVertex(0.15,-0.1,-0.1)

	//front face
	myGun.setColor(0.6,0.6,0.7);
	myGun.addVertex(0.0,0.0,0.05);
	myGun.addVertex(0.05,0.0,0.05);
	myGun.addVertex(0.05,0.5,0.05);
	
	myGun.addVertex(0.0,0.0,0.05);
	myGun.addVertex(0.05,0.5,0.05);
	myGun.addVertex(0.0,0.5,0.05);

	myGun.addVertex(0.0,0.0,0.05)
	myGun.addVertex(0.05,0.0,0.05)
	myGun.addVertex(-0.1,-0.1,0.15)

	myGun.addVertex(0.05,0.0,0.05)
	myGun.addVertex(-0.1,-0.1,0.15)
	myGun.addVertex(0.15,-0.1,0.15)
	
	// //left face
	myGun.setColor(0.6,0.6,0.6);
	myGun.addVertex(0.0,0.0,0.0);
	myGun.addVertex(0.0,0.5,0.0);
	myGun.addVertex(0.0,0.0,0.05);

	myGun.addVertex(0.0,0.0,0.05);
	myGun.addVertex(0.0,0.5,0.0);
	myGun.addVertex(0.0,0.5,0.05);

	// //left face
	myGun.setColor(0.4,0.4,0.4);
	myGun.addVertex(0.05,0.0,0.0);
	myGun.addVertex(0.05,0.5,0.0);
	myGun.addVertex(0.05,0.0,0.05);

	myGun.addVertex(0.05,0.0,0.05);
	myGun.addVertex(0.05,0.5,0.0);
	myGun.addVertex(0.05,0.5,0.05);

	//side slope
	myGun.addVertex(0.0,0.0,0.0);
	myGun.addVertex(0.0,0.0,0.05);
	myGun.addVertex(-0.1,-0.1,0.15);

	myGun.addVertex(0.0,0.0,0.0);
	myGun.addVertex(-0.1,-0.1,0.15);
	myGun.addVertex(-0.1,-0.1,-0.1);

	// //side slope
	myGun.setColor(0.5,0.4,0.4);
	myGun.addVertex(0.05,0.0,0.0);
	myGun.addVertex(0.05,0.0,0.05);
	myGun.addVertex(0.15,-0.1,0.15);

	myGun.addVertex(0.05,0.0,0.0);
	myGun.addVertex(0.15,-0.1,0.15);
	myGun.addVertex(0.15,-0.1,-0.1);

	//top face
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
};

// Last time that this function was called:  (used for animation timing)
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

function moveToGoal() {
	if (mShuttleGoalX > mShuttleX) {
		mShuttleX = Math.min(mShuttleGoalX, mShuttleX + 0.005);
	} else if (mShuttleGoalX < mShuttleX){
		mShuttleX = Math.max(mShuttleGoalX, mShuttleX - 0.005);
	}

	if (mShuttleGoalY > mShuttleY) {
		mShuttleY = Math.min(mShuttleGoalY, mShuttleY + 0.005);
	} else if (mShuttleGoalY < mShuttleY){
		mShuttleY = Math.max(mShuttleGoalY, mShuttleY - 0.005);
	}
};

function ThreeDShape(name) {
	this.type = name;
	console.log("initialized Obj")
	this.vertArray = new Array();
	this.endPoint = 0;
	this.colorArray = new Array ([0.0,0.0,0.0]);
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

	this.setColor = function (r,g,b) {
		this.colorArray[0] = r;
		this.colorArray[1] = g;
		this.colorArray[2] = b;
	}
	this.addVertex = function(x,y,z) {
		var i = this.endPoint
		this.vertArray[i] = x;
		this.vertArray[i+1] = y;
		this.vertArray[i+2] = z;
		this.vertArray[i+3] = 1.0;
		this.vertArray[i+4] = this.colorArray[0];
		this.vertArray[i+5] = this.colorArray[1];
		this.vertArray[i+6] = this.colorArray[2];
		this.endPoint = this.endPoint + 7
		return this.dat
	};

	this.setTranslate = function(x,y,z) {
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
	this.draw = function( gl,modelMatrix, u_ModelMatrix) {
		modelMatrix.translate(this.xTrans,this.yTrans, this.zTrans); 
		modelMatrix.rotate(this.angle, this.rotX,this.rotY,this.rotZ);
		modelMatrix.scale(this.xScale, this.yScale, this.zScale);
		  // spin around y axis.
		gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,this.startP/floatsPerVertex, this.vertArray.length/floatsPerVertex);

		modelMatrix.scale(1/this.xScale, 1/this.yScale, 1/this.zScale);
		modelMatrix.rotate(-this.angle, this.rotX,this.rotY,this.rotZ);
		modelMatrix.translate(-this.xTrans,-this.yTrans, -this.zTrans); 
		
		
	};
};

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev, gl, canvas) {
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	// Convert to Canonical View Volume (CVV) coordinates too:
  	var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
	xMinit = x;
	yMinit = y;
};


function myMouseMove(ev, gl, canvas) {
	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);

	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	if ((Math.abs(x - xMinit) < 0.01) && (Math.abs(y - yMinit) < 0.01)) {
		mShuttleGoalX = x;
		mShuttleGoalY = y;
	};
	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};


function myKeyDown(ev) {
	switch(ev.keyCode) {			// keycodes !=ASCII, but are very consistent for 
	//	nearly all non-alphanumeric keys for nearly all keyboards in all countries.
		case 37:		// left-arrow key
			// print in console:
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  			mAngleSpeed = Math.max(-5,mAngleSpeed - 0.5)
  			//mAngleSpeed = max(-5,mAngleSpeed - 0.5)
			break;
		case 38:		// up-arrow key
			console.log('   up-arrow.');
  			mShuttlePos = "up"
			break;
		case 39:		// right-arrow key
			console.log('right-arrow.');
	  		mAngleSpeed = Math.min(5,mAngleSpeed + 0.5)
  		break;
		case 40:		// down-arrow key
			console.log(' down-arrow.');
			mShuttlePos = "down"
  		break;
		default:
			// console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
  	// 	document.getElementById('Result').innerHTML =
  	// 		'myKeyDown()--keyCode='+ev.keyCode;
			break;
	}
}

function myKeyUp(ev) {}

function myKeyPress(ev) {}

function toggleTurret(ev) {
	isTurretTurn = !isTurretTurn;
};