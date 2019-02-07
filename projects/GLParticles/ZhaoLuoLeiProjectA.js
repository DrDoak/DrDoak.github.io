//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// BouncyBall.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//  BouncyBall01:---------------
//		--converted to 2D->4D; 
//		--3  verts changed to 'vCount' particles in one Vertex Buffer Object 
//			(VBO) in initVertexBuffers() function
//		--Fragment shader draw POINTS primitives as round and 'soft'
//
// BouncyBall02:----------------
//		--modified animation: removed rotation, added better animation comments, 
//				replaced 'currentAngle' with 'timeStep'.
//		--added keyboard & mouse controls:from EECS 351-1 Winter 2014 starter-code //				'5.04jt.ControlMulti.html'  (copied code almost verbatim)
//				(for now, 1,2,3 keys just controls the color of our 3 particles) 
//		--Added 'u_runMode' uniform to control particle-system animation.
//
//	BouncyBall03:---------------
//		--Eliminated 'obsolete' junk commented out in BouncyBall02
//		--initVertexBuffer() reduced to just one round particle; 
//		--added 'uniform' vec4 'u_ballOffset' for that particle's position
//		--in draw(), computed that offset as described in class in Week 1.
//		--implement user controls: 
//				--r or R key to 'restart' the bouncy ball;
//				--p or P key to pause/unpause the bouncy ball;
//				--SPACE BAR to single-step the bouncy ball.

//		NEXT TASKS:
//		--Convert to MKS units (meters-kilograms-seconds)
//		--Add 3D perspective camera; add user-controls to position & aim camera
//		--Add ground-plane (xy==ground; +z==up)
//		--extend particle system to 'bounce around' in a 3D box in world coords
//		--THE BIG TASK for Week 2: 'state-variable' formulation!
//			explore, experiment: how can we construct a 'state variable' that we
//			store and calculate and update on the graphics hardware?  How can we 
//			avoid transferring state vars from JavaScript to the graphics system
//			on each and every timestep?
//			-True, vertex shaders CAN'T modify attributes or uniforms (input only),
//			-But we CAN make a global array of floats, of structs ...
//				how could you use them?
//				can you use Vertex Buffer objects to initialize those arrays, then
//				use those arrays as your state variables?
//				HINT: create an attribute that holds an integer 'particle number';
//				use that as your array index for that particle... 
//
//==============================================================================

var VSHADER_SOURCE =
  'precision mediump float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform   float u_runMode; \n' +					// particle system state: 
  																				// 0=reset; 1= pause; 2=step; 3=run; 4 = not ball
  'attribute vec4 a_Position;\n' +
  'attribute highp vec3 a_Color;\n' + 
  'attribute float a_diam; \n' +          // current state: diameter in pixels
  'varying   vec4 v_Color; \n' +
  'attribute float a_Alpha; \n' +
  //'varying float v_runMode;\n' +
  'uniform mediump mat4 u_ModelMatrix;\n' +
  'uniform mediump mat4 u_projMatrix;\n' +
  'uniform mediump mat4 u_ViewMatrix;\n' +
  'uniform mediump mat4 u_NormalMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_projMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position.x, a_Position.y, a_Position.z, 1.0); \n' +  
  '  gl_PointSize = a_diam; \n' +
  '  float something = a_Alpha;\n' +
  '  v_Color = vec4(a_Color, a_Alpha); \n' +
  //'	 gl_Position = a_Position + u_ballShift; \n' +
  // '  if (u_runMode == 4.0) {\n'+
  // '   gl_Position = u_projMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;}\n' +	
  // '  else {\n'+
  // '   gl_Position = u_projMatrix * u_ViewMatrix * (a_Position + u_ballShift);}\n' +
  //'  v_runMode = u_runMode;\n' +
	// Let u_runMode determine particle color:
 //  '  if(u_runMode == 0.0) { \n' +
	// '	   v_Color = vec4(1.0, 0.0, 0.0, 1.0);	\n' +		// red: 0==reset
	// '  	 } \n' +
	// '  else if(u_runMode == 1.0) {  \n' +
	// '    v_Color = vec4(1.0, 1.0, 0.0, 1.0); \n' +	// yellow: 1==pause
	// '    }  \n' +
	// '  else if(u_runMode == 2.0) { \n' +    
	// '    v_Color = vec4(1.0, 1.0, 1.0, 1.0); \n' +	// white: 2==step
 //  '    } \n' +
	// '  else if (u_runMode == 3.0) { \n' +
	// '    v_Color = vec4(0.2, 1.0, 0.2, 1.0); \n' +	// green: >3==run
	// '		 } \n' +
 //  '   else if (u_runMode == 4.0){ \n' +
 //  //r'    v_Color = vec4(1.0, 0.0, 1.0, 1.0); \n' +  // green: >3==run
 //  '    v_Color = vec4(a_Color,1.0);\n'+
  // '   }\n' +
  '} \n'
// Each instance computes all the on-screen attributes for just one VERTEX,
// supplied by 'attribute vec4' variable a_Position, filled from the 
// Vertex Buffer Object (VBO) we created inside the graphics hardware by calling 
// the 'initVertexBuffers()' function. 

//==============================================================================// Fragment shader program:
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color; \n' +
  'uniform  float u_runMode; \n' +         // particle system state: 
  'void main() {\n' +
  '  if (u_runMode != 4.0 && v_Color.a == 1.0) {\n' + 
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '  if(dist < 0.5) { \n' +	
	'  	gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, v_Color.a);\n' +
	'  } else { discard; }\n' +
  ' }else if  (u_runMode != 4.0) {\n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '  if(dist < 0.5) { \n' + 
  '   gl_FragColor = vec4(v_Color.rgb,v_Color.a);\n' +
  '  } else { discard; }\n' +
  ' }else {\n' +
  '  gl_FragColor = v_Color;}\n' +
  '}\n';
// --Each instance computes all the on-screen attributes for just one PIXEL.
// --Draw large POINTS primitives as ROUND instead of square.  HOW?
//   See pg. 377 in  textbook: "WebGL Programming Guide".  The vertex shaders' 
// gl_PointSize value sets POINTS primitives' on-screen width and height, and
// by default draws POINTS as a square on-screen.  In the fragment shader, the 
// built-in input variable 'gl_PointCoord' gives the fragment's location within
// that 2D on-screen square; value (0,0) at squares' lower-left corner, (1,1) at
// upper right, and (0.5,0.5) at the center.  The built-in 'distance()' function
// lets us discard any fragment outside the 0.5 radius of POINTS made circular.
// (CHALLENGE: make a 'soft' point: color falls to zero as radius grows to 0.5)?
// -- NOTE! gl_PointCoord is UNDEFINED for all drawing primitives except POINTS;
// thus our 'draw()' function can't draw a LINE_LOOP primitive unless we turn off
// our round-point rendering.  
// -- All built-in variables: http://www.opengl.org/wiki/Built-in_Variable_(GLSL)

// Global Variables
// =========================
// Give meaningful names to array indices for the particle(s) in state vectors.
const PART_XPOS     = 0;  //  position    
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_XVEL     = 3; //  velocity    
const PART_YVEL     = 4;
const PART_ZVEL     = 5;
const PART_X_FTOT   = 6;  // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT   = 7;  // to zero, then adds each force to each particle.
const PART_Z_FTOT   = 8;        
const PART_R        = 9;  // color : red,green,blue
const PART_G        =10;  
const PART_B        =11;
const PART_MASS     =12;  // mass   
const PART_DIAM     =13;  // on-screen diameter (in pixels)
const PART_RENDMODE =14;  // on-screen appearance (square, round, or soft-round)
const PART_LIFE      =15;  // # of frame-times since creation/initialization
const PART_CHARGE   =16;  // for electrostatic repulsion/attraction
const PART_DIAM_VEL =17;  // time-rate-of-change of mass.
const PART_DIAM_FTOT=18;  // force-accumulator for mass-change
const PART_R_VEL    =19;  // time-rate-of-change of color:red
const PART_G_VEL    =20;  // time-rate-of-change of color:grn
const PART_B_VEL    =21;  // time-rate-of-change of color:blu
const PART_ALPHA   =22;  // force-accumulator for color-change: red
const PART_G_FTOT   =23;  // force-accumulator for color-change: grn
const PART_B_FTOT   =24;  // force-accumulator for color-change: blu

const PART_MAXVAR   =25;  // Size of array in CPart uses to store its values.

const SOLVER_EULER = 0;
const SOLVER_MIDPOINT = 1;
const SOLVER_IMPLICIT = 2;
const SOLVER_IMPLICITMP = 3;
const SOLVER_ADAMSBASHFORTH = 4;

var timeStep = 1.0/30.0;				// initialize; current timestep in seconds
var g_last = Date.now();				//  Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.

// Define just one 'bouncy ball' particle
var xposNow =  0.0;		var yposNow =  0.0;		var zposNow =  0.0;		
var xvelNow =  0.0;		var yvelNow =  0.0;		var zvelNow =  0.0;
var INIT_VEL = 0.1 * 30;		// adjusted by ++Start, --Start buttons.

// For keyboard, mouse-click-and-drag:		
var myRunMode = 3;	// particle system state: 0=reset; 1= pause; 2=step; 3=run

var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  
var ballMass = 1.0

var partCount = 50;       // # of particles in our state variable s[0] that

var modelMatrix = new Matrix4();  // Model matrix
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var u_ModelMatrix   = false;
var u_projMatrix    = false;
var u_ViewMatrix = false;
var canvas = document.getElementById('webgl');

var camPosX = -6;
var camPosY = 0;
var camPosZ = -1;

var GoalX= 0;
var GoalY = 0;
var GoalZ = 0;
var distPers = 100;

var angleX = 0;
var angleY = 0;
var angleZ = 0;
var gravity = 9.85;
var buffer = new Float32Array(2200 * PART_MAXVAR);
var forceCount = 1
var constraintCount = 1

floatsPerVertex = 6

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };				
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
 
 	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("keypress", myKeyPress, false);
	
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

 // initialize the particle system:
  //PartSys_init(0);      // 0 == full reset, bouncy-balls; 1==add velocity
                        // 2 == set up spring-mass system; ...
  var totPart
  mPartSys = new PartSys(0,partCount);
  mPartSys.PartSys_initCloth(0,0.0,1.0,0.0)
  mPartSys.PartSys_addForce(mPartSys.CForcerTest)
  mPartSys.PartSys_addForce(mPartSys.CForcerTest2)
  mPartSys.PartSys_addForce(mPartSys.FCloth)
  mPartSys.PartSys_addConstraint(mPartSys.CConstraintTest)
  mPartSys.PartSys_addConstraint(mPartSys.CWorld)
  mPartSys.PartSys_setSolver(SOLVER_IMPLICIT)
  mPartSys.PartSys_setPosition(0.0,0.0,-2.0)
  mPartSys.PartSys_setGravity(1.0)
  mPartSys.PartSys_addConstraint(mPartSys.CPin)
  totPart += partCount

  BlackHole = new PartSys(totPart,1000);
  BlackHole.PartSys_init(0,0.0,0.0,1.0)
  //BlackHole.PartSys_addForce(mPartSys.CForcerTest)
  BlackHole.PartSys_addForce(mPartSys.CForcerTest2)
  BlackHole.PartSys_addForce(mPartSys.FBlackHole)
  BlackHole.PartSys_addConstraint(mPartSys.CConstraintTest)
  BlackHole.PartSys_addConstraint(mPartSys.CWorld)
  BlackHole.PartSys_setSolver(SOLVER_IMPLICITMP)
  BlackHole.PartSys_setGravity(0.1)
  BlackHole.PartSys_setPosition(0.0,0.0,4.0)
  BlackHole.PartSys_setGoal(1.0,1.0,6.0)
  totPart += 1000

  FireSys = new PartSys(totPart,1000);
  FireSys.PartSys_addConstraint(mPartSys.CConstraintTest)
  FireSys.PartSys_addConstraint(mPartSys.CWorld)
  FireSys.PartSys_setPosition(1.0,0.0,-4.0)
  FireSys.PartSys_initFire()
  FireSys.PartSys_setGravity(0.005)
  FireSys.PartSys_addForce(mPartSys.CForcerTest)
  FireSys.PartSys_addConstraint(mPartSys.CFireLife)
  FireSys.PartSys_setSolver(SOLVER_EULER)
  totPart += 1000

  BoidsSys = new PartSys(totPart,90);
  BoidsSys.PartSys_setPosition(0.0,0.0,2.0)
  BoidsSys.PartSys_initBoids(0,1.0,0.0,0.0)

  BoidsSys.setBoxSize(40.0,40.0,40.0)
  BoidsSys.PartSys_addPreSolve(PartSys.prePos)
  BoidsSys.PartSys_addPreSolve(BoidsSys.preVel)
  BoidsSys.PartSys_addForce(mPartSys.CForcerTest2)

  BoidsSys.PartSys_addForce(mPartSys.FCohesion)
  BoidsSys.PartSys_addForce(mPartSys.FGoal)
  BoidsSys.PartSys_addForce(mPartSys.FSeperation)
  BoidsSys.PartSys_addForce(mPartSys.FAlignment)
  BoidsSys.PartSys_addForce(mPartSys.FAvoid)

  BoidsSys.PartSys_addConstraint(mPartSys.CConstraintTest)
  BoidsSys.PartSys_addConstraint(mPartSys.CWorld)
  BoidsSys.PartSys_addConstraint(mPartSys.CLeadingBird)
  BoidsSys.PartSys_addConstraint(mPartSys.CSpeedLimit)
  BoidsSys.PartSys_setSolver(SOLVER_EULER)

  totPart += 10

  RopeSys = new PartSys(totPart,21);
  RopeSys.PartSys_init(0,0.0,1.0,0.0)
  RopeSys.PartSys_addForce(mPartSys.CForcerTest)
  RopeSys.PartSys_addForce(mPartSys.CForcerTest2)
  RopeSys.PartSys_addForce(mPartSys.FSpring)
  RopeSys.PartSys_addConstraint(mPartSys.CConstraintTest)
  RopeSys.PartSys_addConstraint(mPartSys.CWorld)
  RopeSys.PartSys_addConstraint(mPartSys.CPinSpring)
  RopeSys.PartSys_setSolver(SOLVER_IMPLICIT)
  RopeSys.PartSys_setPosition(0.0,0.0,-6.0)
  RopeSys.PartSys_setGravity(0.2)

  totPart += 21

  MagnetSys = new PartSys(totPart,40);
  MagnetSys.PartSys_initCharge(0,0.0,0.0,1.0)
  //MagnetSys.PartSys_addForce(mPartSys.CForcerTest)
  MagnetSys.PartSys_addForce(mPartSys.CForcerTest2)
  MagnetSys.PartSys_addForce(mPartSys.FCoulomb)
  MagnetSys.PartSys_addConstraint(mPartSys.CConstraintTest)
  MagnetSys.PartSys_addConstraint(mPartSys.CWorld)
  MagnetSys.PartSys_addConstraint(mPartSys.CMagnet)
  MagnetSys.PartSys_setSolver(SOLVER_IMPLICITMP)
  MagnetSys.PartSys_setGravity(5)
  MagnetSys.PartSys_setPosition(0.0,0.0,0.0)
  MagnetSys.PartSys_setGoal(1.0,0.0,2.0)
  totPart += 40

  normalSys = new PartSys(totPart,100);
  normalSys.PartSys_init(0,1.0,1.0,1.0)
  normalSys.PartSys_addForce(mPartSys.CForcerTest)
  normalSys.PartSys_addForce(mPartSys.CForcerTest2)
  normalSys.PartSys_addConstraint(mPartSys.CConstraintTest)
  //normalSys.PartSys_addConstraint(mPartSys.CWorld)
  normalSys.PartSys_setSolver(SOLVER_EULER)
  normalSys.PartSys_setPosition(0.0,0.0,6.0)
  normalSys.PartSys_setGravity(1.0)
  totPart += 100

  switchRope()
  switchFire()
  switchCloth()
  switchMagnet()
  switchBoids()
  switchNormal()
  switchBlackHole()

  var myVerts = initVertexBuffers(gl);
  if (myVerts < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  gl.clearColor(0.2, 0.2, 0.2, 1);    // RGBA color for clearing <canvas>
  gl.enable(gl.DEPTH_TEST);  
  gl.enable(gl.BLEND); 
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE)
  
  // Get graphics system storage location of uniforms our shaders use:
  // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
  u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
  if(!u_runModeID) {
  	console.log('Failed to get u_runMode variable location');
  	return;
  }
	gl.uniform1f(u_runModeID, myRunMode);		// keyboard callbacks set 'myRunMode'
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
  u_projMatrix = gl.getUniformLocation(gl.program, 'u_projMatrix')
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix')


  var tick = function() {
    timeStep = animate(timeStep);  // get time passed since last screen redraw.
  	draw(gl, myVerts, timeStep/6);	// compute new particle state at current time

    requestAnimationFrame(tick, canvas);  // Call us again 'at next opportunity',
    																			// within the 'canvas' HTML-5 element.
  };
  tick();
}

function animate(timeStep) {
//==============================================================================  
// How much time passed since we last updated the 'canvas' screen elements?
  var now = Date.now();												
  var elapsed = now - g_last;								
  g_last = now;
  // Return the amount of time passed.
  return elapsed;
}

function draw(gl, numVertex, timeStep) {
//==============================================================================  
  gl.clear(gl.COLOR_BUFFER_BIT);
  var vpAspect = canvas.width/canvas.height;   // this camera: width/height.

  projMatrix.setPerspective(40,        // fovy: y-axis field-of-view in degrees  
                                      // (top <-> bottom in view frustum)
                            vpAspect, // aspect ratio: width/height
                            1, 100);  // near, far (always >0).
  //gl.uniform3fv(uLoc_eyePosWorld, eyePosWorld);// use it to set our uniform
  viewMatrix.setLookAt(camPosX,camPosY,camPosZ,GoalX,GoalY,GoalZ,0,1,0)
  gl.uniformMatrix4fv(u_projMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  drawMyScene(gl,numVertex,timeStep)
}

function drawMyScene(gl,numVertex,timeStep) {
  modelMatrix.setTranslate(-1.0,-1.0,-3.0)
  gl.uniform1f(u_runModeID, 1.0); //set to normal draw system
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
																					// update particle system state?
	// Make our 'bouncy-ball' move and bounce:
	// What happens when I rearrange the ordering of these steps? Why?
	// -- apply acceleration due to gravity to current velocity:
  mPartSys.PartSys_run(gl);
  BlackHole.PartSys_run(gl);
  FireSys.PartSys_run(gl);
  BoidsSys.PartSys_run(gl);
  RopeSys.PartSys_run(gl);
  MagnetSys.PartSys_run(gl);
  normalSys.PartSys_run(gl);
  
  gl.uniform1f(u_runModeID, 4.0); //set to normal draw system
  // PartSys_render(gl, s0);  // Draw the particle-system on-screen
  gl.bufferSubData(gl.ARRAY_BUFFER,     // GLenum target,
                              0,      // offset to data we'll transfer
                             gndVerts);     // Data source (Javascript array)
  gl.drawArrays(gl.LINES,							// use this drawing primitive, and
							0,	// start at this vertex number, and
							gndVerts.length/PART_MAXVAR);		// draw this many vertices

  modelMatrix.setTranslate(0.0,-0.5,1.0)
  modelMatrix.scale(0.2,0.2,0.2)
  myCube.draw(gl);
  gl.bufferSubData(gl.ARRAY_BUFFER,0, sphVerts);     // Data source (Javascript array)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, sphVerts.length/PART_MAXVAR); 

  gl.bufferSubData(gl.ARRAY_BUFFER,     // GLenum target,
                              0,      // offset to data we'll transfer
                             vertexColors);     // Data source (Javascript array)
  
  modelMatrix.setTranslate(0.0,0.0,0.0)
  myCube.setScale(20.0,1.0,20.0)
  myCube.setAngle(0,1,0,0)
  modelMatrix.translate(-1.0,-1.0,-2.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,2.0,0.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,-2.0,0.0)
  myCube.setAngle(270,1,0,0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,0.0,2.1)
  myCube.draw(gl);
  myCube.setAngle(90,0,0,1)
  modelMatrix.translate(2.1,0.0,-2.1)
  myCube.draw(gl);

  myCube.setScale(1.0,1.0,1.0)
  modelMatrix.translate(5.0,0.0,0.0)
  myCube.draw(gl)

  modelMatrix.setTranslate(0.0,0.0,-2.0)
  myCube.setScale(20.0,1.0,20.0)
  myCube.setAngle(0,1,0,0)
  modelMatrix.translate(-1.0,-1.0,-2.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,2.0,0.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,-2.0,0.0)
  myCube.setAngle(270,1,0,0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,0.0,2.1)
  myCube.draw(gl);
  myCube.setAngle(90,0,0,1)
  modelMatrix.translate(2.1,0.0,-2.1)
  myCube.draw(gl);
  myCube.setScale(1.0,1.0,1.0)
  modelMatrix.translate(5.0,0.0,0.0)
  myCube.draw(gl)

  modelMatrix.setTranslate(0.0,0.0,-4.0)
  myCube.setScale(20.0,1.0,20.0)
  myCube.setAngle(0,1,0,0)
  modelMatrix.translate(-1.0,-1.0,-2.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,2.0,0.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,-2.0,0.0)
  myCube.setAngle(270,1,0,0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,0.0,2.1)
  myCube.draw(gl);
  myCube.setAngle(90,0,0,1)
  modelMatrix.translate(2.1,0.0,-2.1)
  myCube.draw(gl);
  myCube.setScale(1.0,1.0,1.0)
  modelMatrix.translate(5.0,0.0,0.0)
  myCube.draw(gl)

  modelMatrix.setTranslate(0.0,0.0,2.0)
  myCube.setScale(20.0,1.0,20.0)
  myCube.setAngle(0,1,0,0)
  modelMatrix.translate(-1.0,-1.0,-2.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,2.0,0.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,-2.0,0.0)
  myCube.setAngle(270,1,0,0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,0.0,2.1)
  myCube.draw(gl);
  myCube.setAngle(90,0,0,1)
  modelMatrix.translate(2.1,0.0,-2.1)
  myCube.draw(gl);
  myCube.setScale(1.0,1.0,1.0)
  modelMatrix.translate(5.0,0.0,0.0)
  myCube.draw(gl)

  modelMatrix.setTranslate(0.0,0.0,-6.0)
  myCube.setScale(20.0,1.0,20.0)
  myCube.setAngle(0,1,0,0)
  modelMatrix.translate(-1.0,-1.0,-2.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,2.0,0.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,-2.0,0.0)
  myCube.setAngle(270,1,0,0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,0.0,2.1)
  myCube.draw(gl);
  myCube.setAngle(90,0,0,1)
  modelMatrix.translate(2.1,0.0,-2.1)
  myCube.draw(gl);
  myCube.setScale(1.0,1.0,1.0)
  modelMatrix.translate(5.0,0.0,0.0)
  myCube.draw(gl)

  modelMatrix.setTranslate(0.0,0.0,4.0)
  myCube.setScale(20.0,1.0,20.0)
  myCube.setAngle(0,1,0,0)
  modelMatrix.translate(-1.0,-1.0,-2.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,2.0,0.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,-2.0,0.0)
  myCube.setAngle(270,1,0,0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,0.0,2.1)
  myCube.draw(gl);
  myCube.setAngle(90,0,0,1)
  modelMatrix.translate(2.1,0.0,-2.1)
  myCube.draw(gl);
  myCube.setScale(1.0,1.0,1.0)
  modelMatrix.translate(5.0,0.0,0.0)
  myCube.draw(gl)

  modelMatrix.setTranslate(0.0,0.0,6.0)
  myCube.setScale(20.0,1.0,20.0)
  myCube.setAngle(0,1,0,0)
  modelMatrix.translate(-1.0,-1.0,-2.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,2.0,0.0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,-2.0,0.0)
  myCube.setAngle(270,1,0,0)
  myCube.draw(gl);
  modelMatrix.translate(0.0,0.0,2.1)
  myCube.draw(gl);
  myCube.setAngle(90,0,0,1)
  modelMatrix.translate(2.1,0.0,-2.1)
  myCube.draw(gl);
  myCube.setScale(1.0,1.0,1.0)
  modelMatrix.translate(5.0,0.0,0.0)
  myCube.draw(gl)

  // modelMatrix.setTranslate(0.0,0.0,0.0)
  // gl.uniform1f(u_runModeID, 1.0); //set to normal draw system
  // // PartSys_render(gl, s0);  // Draw the particle-system on-screen
  // mPartSys.PartSys_run(gl);
  // BlackHole.PartSys_run(gl);
  // FireSys.PartSys_run(gl);
  // BoidsSys.PartSys_run(gl);
  // RopeSys.PartSys_run(gl);
  // MagnetSys.PartSys_run(gl);
  
} 
function PartSys(start,partCount) {
  this.startIndex = start
  this.partCount = partCount
  this.endIndex = this.startIndex + this.partCount
  this.forceCount = 0
  this.constraintCount = 0
  this.forceList = new Array()
  this.constraintList = new Array()
  this.preSolveList = new Array()
  this.solverType = SOLVER_IMPLICITMP

  this.s0 = new Float32Array(partCount * PART_MAXVAR);
  this.s1 = new Float32Array(partCount * PART_MAXVAR);
  //console.log(this.s0)
  this.s0dot = new Float32Array(partCount * PART_MAXVAR);
  this.sM = new Float32Array(partCount * PART_MAXVAR);
  this.sMdot = new Float32Array(partCount * PART_MAXVAR);
  this.zero = new Float32Array(partCount * PART_MAXVAR);
  this.s2 = new Float32Array(partCount * PART_MAXVAR);
  this.s1dot = new Float32Array(partCount * PART_MAXVAR);
  this.sp = new Float32Array(partCount * PART_MAXVAR);
  this.spdot = new Float32Array(partCount * PART_MAXVAR);
  //console.log(this.s1dot)
  this.firstTimeAB = true
  this.sErr = new Float32Array(partCount * PART_MAXVAR);
  this.posX = 0
  this.posY = 0
  this.posZ = 0
  this.gravity = 9.8

  this.centerX = 0
  this.centerY = 0
  this.centerZ = 0
  this.flockGoalX = 0
  this.flockGoalY = 0
  this.flockGoalZ = 0
  this.flockVelX = 0
  this.flockVelY = 0
  this.flockVelZ = 0

  this.sphX = 0
  this.sphY = 0
  this.sphZ = 0

  this.boxX = 2.0
  this.boxY = 2.0
  this.boxZ = 2.0

  this.CForcerTest = function(pOff,startInd,endInd,s0,obj) {
    var mass = s0[PART_MASS + pOff]
    return [0,-(obj.gravity * mass),0]
  }
  // this.CForcerTest7 = function(pOff,startInd,endInd,s0,obj) {
  //   var mass = s0[PART_MASS + pOff]
  //   return [0,(obj.gravity * mass),0]
  // }
  this.CForcerTest2 = function(pOff,startInd,endInd,s0) {
    var mass = s0[PART_MASS + pOff]
    var Kd = 0.5
    xDrag = -s0[PART_XVEL+ pOff] *  Kd
    yDrag = -s0[PART_YVEL+ pOff] *  Kd
    zDrag = -s0[PART_ZVEL+ pOff] *  Kd
    return [xDrag,yDrag,zDrag]
    //return [0,0,0]
  }
  this.FSpring = function( pOff ,startInd,endInd,s0) {
    var stiffness
    var forceX = 0
    var forceY = 0
    var forceZ = 0
    var springLength = 0.02
    var K = 5
    var Kd = 0.5
    if (pOff > (startInd * PART_MAXVAR)) {
      var next = pOff - PART_MAXVAR
      var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[next + PART_XPOS],s0[next + PART_YPOS],s0[next + PART_ZPOS])
      var offset = dist - springLength
      
     // if (offset > 0.05) {
      if (Math.abs(offset) > 0.05 && dist > 0.01) {
        var force = K * offset
        forceX += force * ((s0[next + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist))
        forceY += force * ((s0[next + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist))
        forceZ += force * ((s0[next + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist))
        var dist2 = distPoints(s0[pOff + PART_XVEL],s0[pOff + PART_YVEL],s0[pOff + PART_ZVEL],s0[next + PART_XVEL],s0[next + PART_YVEL],s0[next + PART_ZVEL])
        if (Math.abs(dist2) > 0.01) {
      //if (dist2 > 0.01) {
          force = -Kd * dist2
          forceX -= force * ((s0[next + PART_XVEL] - s0[pOff + PART_XVEL]) * (1/dist2))
          forceY -= force * ((s0[next + PART_YVEL] - s0[pOff + PART_YVEL]) * (1/dist2))
          forceZ -= force * ((s0[next + PART_ZVEL] - s0[pOff + PART_ZVEL]) * (1/dist2))
        }
      }
    }
    if (pOff < ((endInd-1)*PART_MAXVAR)) {

      var next = pOff + PART_MAXVAR
      var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[next + PART_XPOS],s0[next + PART_YPOS],s0[next + PART_ZPOS])
      var offset = dist - springLength
      
     // if (offset > 0.05) {
      if (Math.abs(offset) > 0.05 && dist > 0.01) {
        var force = K * offset
        forceX += force * ((s0[next + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist))
        forceY += force * ((s0[next + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist))
        forceZ += force * ((s0[next + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist))
        var dist2 = distPoints(s0[pOff + PART_XVEL],s0[pOff + PART_YVEL],s0[pOff + PART_ZVEL],s0[next + PART_XVEL],s0[next + PART_YVEL],s0[next + PART_ZVEL])
        if (Math.abs(dist2) > 0.01) {
      //if (dist2 > 0.01) {
          force = -Kd * dist2
          forceX -= force * ((s0[next + PART_XVEL] - s0[pOff + PART_XVEL]) * (1/dist2))
          forceY -= force * ((s0[next + PART_YVEL] - s0[pOff + PART_YVEL]) * (1/dist2))
          forceZ -= force * ((s0[next + PART_ZVEL] - s0[pOff + PART_ZVEL]) * (1/dist2))
        }
      }
    }
    return [forceX,forceY,forceZ]
  }

  this.FCloth = function( pOff ,startInd,endInd,s0) {
    var stiffness
    var forceX = 0
    var forceY = 0
    var forceZ = 0
    var springLength = 0.02
    var width = 5
    var K = 5
    var Kd = 3.0
    var numInd = pOff/PART_MAXVAR
    
    if (((numInd+1) % (width)) != 0) {
      var next = pOff + PART_MAXVAR
      var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[next + PART_XPOS],s0[next + PART_YPOS],s0[next + PART_ZPOS])
      var offset = dist - springLength
      
     // if (offset > 0.05) {
      if (offset > 0.05 && dist > 0.01) {
        var force = K * offset
        forceX += force * ((s0[next + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist))
        forceY += force * ((s0[next + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist))
        forceZ += force * ((s0[next + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist))
        var dist2 = distPoints(s0[pOff + PART_XVEL],s0[pOff + PART_YVEL],s0[pOff + PART_ZVEL],s0[next + PART_XVEL],s0[next + PART_YVEL],s0[next + PART_ZVEL])
        if (Math.abs(dist2) > 0.01) {
      //if (dist2 > 0.01) {
          force = -Kd * dist2
          forceX -= force * ((s0[next + PART_XVEL] - s0[pOff + PART_XVEL]) * (1/dist2))
          forceY -= force * ((s0[next + PART_YVEL] - s0[pOff + PART_YVEL]) * (1/dist2))
          forceZ -= force * ((s0[next + PART_ZVEL] - s0[pOff + PART_ZVEL]) * (1/dist2))
        }
      }
    }

    if ((numInd % width) != 0) {

      var next = pOff - PART_MAXVAR
      var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[next + PART_XPOS],s0[next + PART_YPOS],s0[next + PART_ZPOS])
      var offset = dist - springLength
      
     // if (offset > 0.05) {
      if (offset > 0.05 && dist > 0.01) {
        var force = K * offset
        forceX += force * ((s0[next + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist))
        forceY += force * ((s0[next + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist))
        forceZ += force * ((s0[next + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist))
        var dist2 = distPoints(s0[pOff + PART_XVEL],s0[pOff + PART_YVEL],s0[pOff + PART_ZVEL],s0[next + PART_XVEL],s0[next + PART_YVEL],s0[next + PART_ZVEL])
        if (Math.abs(dist2) > 0.01) {
      //if (dist2 > 0.01) {
          force = -Kd * dist2
          forceX -= force * ((s0[next + PART_XVEL] - s0[pOff + PART_XVEL]) * (1/dist2))
          forceY -= force * ((s0[next + PART_YVEL] - s0[pOff + PART_YVEL]) * (1/dist2))
          forceZ -= force * ((s0[next + PART_ZVEL] - s0[pOff + PART_ZVEL]) * (1/dist2))
        }
      }
    }
	
    if (numInd > (width - 1)) {
      var next = pOff - (PART_MAXVAR * (width )) 
      var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[next + PART_XPOS],s0[next + PART_YPOS],s0[next + PART_ZPOS])
      var offset = dist - springLength
      
     // if (offset > 0.05) {
      if (offset > 0.05 && dist > 0.01) {
        var force = K * offset
        forceX += force * ((s0[next + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist))
        forceY += force * ((s0[next + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist))
        forceZ += force * ((s0[next + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist))
        var dist2 = distPoints(s0[pOff + PART_XVEL],s0[pOff + PART_YVEL],s0[pOff + PART_ZVEL],s0[next + PART_XVEL],s0[next + PART_YVEL],s0[next + PART_ZVEL])
        if (Math.abs(dist2) > 0.01) {
      //if (dist2 > 0.01) {
          force = -Kd * dist2
          forceX -= force * ((s0[next + PART_XVEL] - s0[pOff + PART_XVEL]) * (1/dist2))
          forceY -= force * ((s0[next + PART_YVEL] - s0[pOff + PART_YVEL]) * (1/dist2))
          forceZ -= force * ((s0[next + PART_ZVEL] - s0[pOff + PART_ZVEL]) * (1/dist2))
        }
      }
    }
    if (numInd < ((endInd-width)*PART_MAXVAR)) {

      var next = pOff + ((width ) * PART_MAXVAR)
      var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[next + PART_XPOS],s0[next + PART_YPOS],s0[next + PART_ZPOS])
      var offset = dist - springLength
      
     // if (offset > 0.05) {
      if (offset > 0.05 && dist > 0.01) {
        var force = K * offset
        forceX += force * ((s0[next + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist))
        forceY += force * ((s0[next + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist))
        forceZ += force * ((s0[next + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist))
        var dist2 = distPoints(s0[pOff + PART_XVEL],s0[pOff + PART_YVEL],s0[pOff + PART_ZVEL],s0[next + PART_XVEL],s0[next + PART_YVEL],s0[next + PART_ZVEL])
        if (Math.abs(dist2) > 0.01) {
      //if (dist2 > 0.01) {
          force = -Kd * dist2
          forceX -= force * ((s0[next + PART_XVEL] - s0[pOff + PART_XVEL]) * (1/dist2))
          forceY -= force * ((s0[next + PART_YVEL] - s0[pOff + PART_YVEL]) * (1/dist2))
          forceZ -= force * ((s0[next + PART_ZVEL] - s0[pOff + PART_ZVEL]) * (1/dist2))
        }
      }
    }
    return [forceX,forceY,forceZ]
  }

  this.FCohesion = function( pOff ,startInd,endInd,s0,obj) {
  var stiffness
  var forceX = 0
  var forceY = 0
  var forceZ = 0
  var Force = 0.05
    var tolerance = 0.1
  var next = pOff - PART_MAXVAR
  var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],obj.centerX,obj.centerY,obj.centerZ)
  var offset = dist - tolerance
  if (Math.abs(offset) > 0.05) {
    var force = Force * offset
    forceX += force * ((obj.flockGoalX - s0[pOff + PART_XPOS]) * (1/dist))
    forceY += force * ((obj.flockGoalY - s0[pOff + PART_YPOS]) * (1/dist))
    forceZ += force * ((obj.flockGoalZ - s0[pOff + PART_ZPOS]) * (1/dist))
  }
    return [forceX,forceY,forceZ]
  }

  this.FGoal = function( pOff ,startInd,endInd,s0,obj) {
	var stiffness
	var forceX = 0
	var forceY = 0
	var forceZ = 0
	var Force = 1.0
    var tolerance = 0.1
	var next = pOff - PART_MAXVAR
	var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],obj.flockGoalX,obj.flockGoalY,obj.flockGoalZ)
	var offset = dist - tolerance
	if (Math.abs(offset) > 0.05) {
		var force = Force * offset
		forceX += force * ((obj.flockGoalX - s0[pOff + PART_XPOS]) * (1/dist))
		forceY += force * ((obj.flockGoalY - s0[pOff + PART_YPOS]) * (1/dist))
		forceZ += force * ((obj.flockGoalZ - s0[pOff + PART_ZPOS]) * (1/dist))
	}
    return [forceX,forceY,forceZ]
  }

  this.FAvoid = function( pOff ,startInd,endInd,s0,obj) {
  var forceX = 0
  var forceY = 0
  var forceZ = 0
  var distLength = 0.3
  var Force = 1.0
  var dist2 = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],obj.sphX,obj.sphY,obj.sphZ)
  var offset = dist2 - distLength
  if (offset < 0) {
    force = -Force 
    forceX += force * ((obj.sphX - s0[pOff + PART_XPOS]) * (1/dist2))
    forceY += force * ((obj.sphY - s0[pOff + PART_YPOS]) * (1/dist2))
    forceZ += force * ((obj.sphZ - s0[pOff + PART_ZPOS]) * (1/dist2))
  }
  return [forceX,forceY,forceZ]
  }

  this.FAlignment = function( pOff ,startInd,endInd,s0,obj) {
	var forceX = 0
	var forceY = 0
	var forceZ = 0
  var Force = 0.3
	var dist2 = distPoints(s0[pOff + PART_XVEL],s0[pOff + PART_YVEL],s0[pOff + PART_ZVEL],obj.flockVelX,obj.flockVelY,obj.flockVelZ)
  if (Math.abs(dist2) > 0.01) {
    force = -Force * dist2
    forceX -= force * (obj.flockVelX - s0[pOff + PART_XVEL]  * (1/dist2))
    forceY -= force * (obj.flockVelY - s0[pOff + PART_YVEL]  * (1/dist2))
    forceZ -= force * (obj.flockVelZ - s0[pOff + PART_ZVEL]  * (1/dist2))
  }
    return [forceX,forceY,forceZ]
  }

  this.FSeperation = function( pOff ,startInd,endInd,s0,obj) {
	var forceX = 0
	var forceY = 0
	var forceZ = 0
	var distLength = 0.01
    var Force = 0.3
    for (var i=0;i<obj.partCount;i++) {
      var pOff2 = i * PART_MAXVAR; 
      if (pOff2 != pOff) {
      	var dist2 = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[pOff2 + PART_XPOS],s0[pOff2 + PART_YPOS],s0[pOff2 + PART_ZPOS])
        var offset = dist2 - distLength
        if (offset < 0) {
        	force = -Force 
          	forceX += force * ((s0[pOff2 + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist2))
        	forceY += force * ((s0[pOff2 + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist2))
        	forceZ += force * ((s0[pOff2 + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist2))
        }
      }
    }
    return [forceX,forceY,forceZ]
  }

  this.prePos = function( obj,s0) {
	var totalMass = 0
	var totalX = 0
	var totalY = 0
	var totalZ = 0
	for (var i=0;i<this.partCount;i++) {
    	var pOff2 = i * PART_MAXVAR; 
		totalX += s0[pOff + PART_XPOS] 
		totalY += s0[pOff + PART_YPOS] 
		totalZ += s0[pOff + PART_ZPOS]
	}
	obj.centerX = totalX/obj.partCount
	obj.centerY = totalY/obj.partCount
	obj.centerZ = totalZ/obj.partCount
	return false
  }

  this.preVel = function( obj,s0) {
	var totalMass = 0
	var totalX = 0
	var totalY = 0
	var totalZ = 0
	for (var i=0;i<this.partCount;i++) {
    	var pOff2 = i * PART_MAXVAR; 
		totalX += s0[pOff + PART_XVEL] 
		totalY += s0[pOff + PART_YVEL] 
		totalZ += s0[pOff + PART_ZVEL]
	}
	obj.flockVelX = totalX/obj.partCount
	obj.flockVelY = totalY/obj.partCount
	obj.flockVelZ = totalZ/obj.partCount
	return false
  }

  this.FBlackHole = function( pOff ,startInd,endInd,s0,obj) {
	var stiffness
	var forceX = 0
	var forceY = 0
	var forceZ = 0
	var MassOfCenterTimesG = 0.05
    
	var next = pOff - PART_MAXVAR
	var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],obj.goalX,obj.goalY,obj.goalZ)
	if (Math.abs(dist) > 0.12) {
		var force = MassOfCenterTimesG/(dist * dist)
		forceX += force * ((obj.goalX - s0[pOff + PART_XPOS]) * (1/dist))
		forceY += force * ((obj.goalY - s0[pOff + PART_YPOS]) * (1/dist))
		forceZ += force * ((obj.goalZ - s0[pOff + PART_ZPOS]) * (1/dist))
	}
    return [forceX,forceY,forceZ]
  }

  this.FCoulomb = function( pOff ,startInd,endInd,s0,obj) {
	var stiffness
	var forceX = 0
	var forceY = 0
	var forceZ = 0
	var mCharge = s0[pOff + PART_CHARGE]
    var Ke = 0.01
	var next = pOff - PART_MAXVAR
	var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],obj.goalX,obj.goalY,obj.goalZ)
	for (var i=0;i<obj.partCount;i++) {
      var pOff2 = i * PART_MAXVAR; 
      if (pOff2 != pOff) {
      	var charge2 = s0[pOff2 + PART_CHARGE]
      	var dist2 = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[pOff2 + PART_XPOS],s0[pOff2 + PART_YPOS],s0[pOff2 + PART_ZPOS])
        //console.log(dist2)
        if (dist2 > 0.05) {
        	force = (Ke * mCharge * charge2)/(dist2)
          	forceX -= force * ((s0[pOff2 + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist2))
        	forceY -= force * ((s0[pOff2 + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist2))
        	forceZ -= force * ((s0[pOff2 + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist2))
        }
      }
    }
    return [forceX,forceY,forceZ]
  }
/*
  this.FMagnet = function( pOff ,startInd,endInd,s0,obj) {
	var stiffness
	var forceX = 0
	var forceY = 0
	var forceZ = 0
	var mCharge = s0[pOff + PART_CHARGE]
    var Ke = 0.1
	var next = pOff - PART_MAXVAR
	var dist = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],obj.goalX,obj.goalY,obj.goalZ)
	for (var i=0;i<obj.partCount;i++) {
      var pOff2 = i * PART_MAXVAR; 
      if (pOff2 != pOff) {
      	var charge2 = s0[pOff2 + PART_CHARGE]
      	var dist2 = distPoints(s0[pOff + PART_XPOS],s0[pOff + PART_YPOS],s0[pOff + PART_ZPOS],s0[pOff2 + PART_XPOS],s0[pOff2 + PART_YPOS],s0[pOff2 + PART_ZPOS])
        //console.log(dist2)
        if (dist2 > 0.05) {
        	force = (Ke * mCharge * charge2)/(dist2 * dist2)
          	forceX += force * ((s0[pOff2 + PART_XPOS] - s0[pOff + PART_XPOS]) * (1/dist2))
        	forceY += force * ((s0[pOff2 + PART_YPOS] - s0[pOff + PART_YPOS]) * (1/dist2))
        	forceZ += force * ((s0[pOff2 + PART_ZPOS] - s0[pOff + PART_ZPOS]) * (1/dist2))
        }
      }
    }
    return [forceX,forceY,forceZ]
  }
*/
  this.setBoxSize = function(x,y,z) {
  	self.boxX = x
  	self.boxY = y
  	self.boxZ = z
  }
   this.CConstraintTest = function( pOff ,startInd,endInd,s0,s1,obj) {
    //===================================================================
    // APPLY CONSTRAINTS to the 'next' state of our particle system:
    //===================================================================
    // -- 'bounce' our ball off the walls at (0,0), (1.8, 1.8):

    if(s1[PART_YPOS+ pOff] < (0.1 + obj.posY) && s1[PART_YVEL+ pOff] < 0.0) {    
       s1[PART_YVEL+ pOff] -= (s1[PART_YVEL+ pOff] - s0[PART_YVEL+ pOff]);
       //console.log(s1[PART_YVEL+ pOff] - s0[PART_YVEL+ pOff])
    }

    var restitution = 0.95
    if(s1[PART_XPOS+ pOff] < (0.0 + obj.posX) && s1[PART_XVEL+ pOff] < 0.0) {  
       s1[PART_XVEL+ pOff] = -s0[PART_XVEL+ pOff] * restitution;
       // bounce on left wall.
    }
    else if (s1[PART_XPOS+ pOff] > (obj.boxX + obj.posX) && s1[PART_XVEL+ pOff] > 0.0) {    
      s1[PART_XVEL+ pOff] = -s0[PART_XVEL+ pOff] * restitution;
      // bounce on right wall
    }
    if(s1[PART_YPOS+ pOff] < (0.1 + obj.posY) && s1[PART_YVEL+ pOff] < 0.0) {    
       s1[PART_YVEL+ pOff] = -(s1[PART_YVEL+ pOff] * restitution);
       // bounce on floor
       
    }
    else if( s1[PART_YPOS+ pOff] > (obj.boxY + obj.posY) && s1[PART_YVEL+ pOff] > 0.0) {    
      s1[PART_YVEL+ pOff] = -s1[PART_YVEL+ pOff] * restitution;
      // bounce on ceiling
    }
    if(s1[PART_ZPOS+ pOff] < (1.0 + obj.posZ) && s1[PART_ZVEL+ pOff] < 0.0) {    
       s1[PART_ZVEL+ pOff] = -s1[PART_ZVEL+ pOff] * restitution;
       // bounce on leftWall
    }
    else if( s1[PART_ZPOS+ pOff] > (1.0 + obj.boxZ + obj.posZ) && s1[PART_ZVEL+ pOff] > 0.0) {    
      s1[PART_ZVEL+ pOff] = -s1[PART_ZVEL+ pOff] * restitution;
      // bounce on rightWall
    }

    //  -- hard limit on 'floor' keeps y position >= 0;
    if(s1[PART_YPOS+ pOff] <  (0.1 + obj.posY)) {
      s1[PART_YPOS+ pOff] = (0.1 + obj.posY);
    }
    //  -- add hard limits to the other walls too...
    if(s1[PART_XPOS+ pOff] <  (-0.0 + obj.posX)) { 
      s1[PART_XPOS+ pOff] = (0.0 + obj.posX);    
    }  

    if(s1[PART_XPOS+ pOff] >=  (obj.boxX + obj.posX)) {
      s1[PART_XPOS+ pOff] = (obj.boxX + obj.posX);
    }
    if(s1[PART_YPOS+ pOff] >=  (obj.boxY + obj.posY)) {
      s1[PART_YPOS+ pOff] = (2.0 + obj.posY);
    }

    if(s1[PART_ZPOS+ pOff] <  (1.0 + obj.posZ)) {
      s1[PART_ZPOS+ pOff] = (1.0 + obj.posZ);
    }
    if(s1[PART_ZPOS+ pOff] >=  (1.0 + obj.boxZ+ obj.posZ)) {
      s1[PART_ZPOS+ pOff] = (1.0 + obj.boxZ + obj.posZ);
    }
  }

   this.CWorld = function( pOff ,startInd,endInd,s0,s1,obj) {
    //  -- hard limit on 'floor' keeps y position >= 0;
    if(s1[PART_YPOS+ pOff] <  (0.1)) {
      s1[PART_YPOS+ pOff] = (0.1);
    }
    //  -- add hard limits to the other walls too...
    if(s1[PART_XPOS+ pOff] <  (-8)) { 
      s1[PART_XPOS+ pOff] = (-8);    
    }  

    if(s1[PART_XPOS+ pOff] >=  (8)) {
      s1[PART_XPOS+ pOff] = (8);
    }
    if(s1[PART_YPOS+ pOff] >=  (8)) {
      s1[PART_YPOS+ pOff] = (8);
    }

    if(s1[PART_ZPOS+ pOff] <  (-8)) {
      s1[PART_ZPOS+ pOff] = (8);
    }
    if(s1[PART_ZPOS+ pOff] >=  (8)) {
      s1[PART_ZPOS+ pOff] = (8);
    }
  }

  this.CConstraintTest3 = function(pOf,startInd,endInd,s0) {
    //var mass = s0[PART_MASS + pOff]

    s0[PART_XVEL+ pOff] = s0[PART_XVEL+ pOff] * 0.98
    s0[PART_YVEL+ pOff] = s0[PART_YVEL+ pOff] * 0.98
    s0[PART_ZVEL+ pOff] = s0[PART_ZVEL+ pOff] * 0.98
  }
  this.CFireLife = function(pOff,startInd,endInd,s0,s1,obj) {
    //var mass = s0[PART_MASS + pOff]
    if (s1[PART_LIFE + pOff] <= 0 ) {
    	obj.initFireParticle(s1,pOff,obj)
    }
    else {
    	s1[PART_LIFE+ pOff] = s1[PART_LIFE+ pOff] - 1
    }
 
  }
  this.CSpeedLimit = function(pOff,startInd,endInd,s0,s1,obj) {
    var dist2 = distPoints(s1[pOff + PART_XVEL],s1[pOff + PART_YVEL],s1[pOff + PART_ZVEL],0,0,0)
    if (dist2 > 1) {
      var prop = 1/dist2
      s1[pOff + PART_XVEL] *= prop
      s1[pOff + PART_YVEL] *= prop
      s1[pOff + PART_ZVEL] *= prop
    }
  }
  this.initFireParticle = function(s,pOff,obj) {
  	s[PART_XPOS + pOff] = obj.posX 
  	s[PART_YPOS + pOff] = obj.posY
  	s[PART_ZPOS + pOff] = obj.posZ + 2.0 +  (0.2 * Math.random())
  	s[PART_LIFE + pOff] = 600 * Math.random()
  	s[PART_YVEL + pOff] = 0.08 * Math.random() + 0.04
  	s[PART_XVEL + pOff] = (0.03 * Math.random()) - 0.015
  	s[PART_ZVEL + pOff] = (0.03 * Math.random()) - 0.015
  	//s[PART_R + pOff] = 0.9 + (0.1 * Math.random())
  	//s[PART_G + pOff] = 0.8 + (0.1 * Math.random())
	s[PART_R + pOff] = 1.0
	s[PART_G + pOff] = 0.9

  	s[PART_R_VEL + pOff] = 0.03 * Math.random()
  	s[PART_G_VEL + pOff] = -0.03 * Math.random()

    s[pOff + PART_X_FTOT] = 0.0;
    s[pOff + PART_Y_FTOT] = 0.0;
    s[pOff + PART_Z_FTOT] = 0.0;
    
    s[pOff + PART_MASS] = 0.9 + 0.2*Math.random();
    s[pOff + PART_DIAM] = 5.0 + 7.0*Math.random();
    s[PART_DIAM_VEL + pOff] = -(0.4)//-(1/s[PART_LIFE + pOff])
    s[pOff + PART_ALPHA] = 0.1;
    s[pOff + PART_RENDMODE] = Math.floor(4.0*Math.random()); // 0,1,2 or 3.
  }
  this.CPin = function(pOff,startInd,endInd,s0,s1,obj) {
    if (pOff == 0) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 10.0
      s1[pOff + PART_ZPOS] = obj.posZ + 1.6
    }
    if (pOff == (1 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 10.0
      s1[pOff + PART_ZPOS] = obj.posZ + 1.8
    }
    if (pOff == (2 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 10.0
      s1[pOff + PART_ZPOS] = obj.posZ + 2.0
    }
    if (pOff == (3 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 10.0
      s1[pOff + PART_ZPOS] = obj.posZ + 2.2
    }
    if (pOff == (4 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 10.0
      s1[pOff + PART_ZPOS] = obj.posZ + 2.4
    }
    
  }
  this.CLeadingBird = function(pOff,startInd,endInd,s0,s1,obj) {
    var now = Date.now();
    var offsetZ = 0.8 * Math.cos(now/600)
    var offsetY = 0.8 * Math.sin(now/600)
    if (pOff == 0) {
    	obj.flockGoalX = obj.posX + 1 
    	obj.flockGoalY = obj.posY + 1 + offsetY
    	obj.flockGoalZ = obj.posZ + 2 + offsetZ
      obj.sphX = obj.posX + 1 
      obj.sphY = obj.posY + 0.3
      obj.sphZ = obj.posZ + 2 
		s1[pOff + PART_XPOS] = obj.flockGoalX
		s1[pOff + PART_YPOS] = obj.flockGoalY
		s1[pOff + PART_ZPOS] = obj.flockGoalZ
    }
  }

  this.CMagnet = function(pOff,startInd,endInd,s0,s1,obj) {
    if (pOff == 0) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 1.8
      s1[pOff + PART_ZPOS] = obj.posZ + 1.6
    }
    if (pOff == (2 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 1.8
      s1[pOff + PART_ZPOS] = obj.posZ + 1.8
    }
    if (pOff == (4 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 1.8
      s1[pOff + PART_ZPOS] = obj.posZ + 2.0
    }
    if (pOff == (6 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 1.8
      s1[pOff + PART_ZPOS] = obj.posZ + 2.2
    }
    if (pOff == (8 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 1.8
      s1[pOff + PART_ZPOS] = obj.posZ + 2.4
    }

    if (pOff == 1) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 0.2
      s1[pOff + PART_ZPOS] = obj.posZ + 1.6
    }
    if (pOff == (3 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 0.2
      s1[pOff + PART_ZPOS] = obj.posZ + 1.8
    }
    if (pOff == (5 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 0.2
      s1[pOff + PART_ZPOS] = obj.posZ + 2.0
    }
    if (pOff == (7 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 0.2
      s1[pOff + PART_ZPOS] = obj.posZ + 2.2
    }
    if (pOff == (9 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 0.2
      s1[pOff + PART_ZPOS] = obj.posZ + 2.4
    }
    
  }

  this.CPinSpring = function(pOff,startInd,endInd,s0,s1,obj) {
    if (pOff == 0) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 3.0
      s1[pOff + PART_ZPOS] = obj.posZ + 1.6
    }
    if (pOff == (20 * PART_MAXVAR)) {
      s1[pOff + PART_XPOS] = obj.posX + 0.2
      s1[pOff + PART_YPOS] = obj.posY + 3.0
      s1[pOff + PART_ZPOS] = obj.posZ + 2.4
    }
    
  }
  this.PartSys_setGravity = function(gravity) {
  	this.gravity = gravity
  }
  this.PartSys_setPosition = function(x,y,z) {
  	this.posX = x
  	this.posY = y
  	this.posZ = z
  }
  this.PartSys_setGoal = function(x,y,z) {
  	this.goalX = x
  	this.goalY = y
  	this.goalZ = z
  }
  this.PartSys_run = function(gl) {

  	this.PartSys_preSolve()
    
    this.PartSys_applyForces()
    
    //console.log(this.s1[0 + PART_XPOS])
    this.PartSys_DotMaker(this.s0dot,this.s0)
    
    //console.log(this.s1[0 + PART_XPOS])
    this.PartSys_render(gl)
    
    //console.log(this.s1[0 + PART_XPOS])

    this.PartSys_solver()
    
    //console.log(this.s1[0 + PART_XPOS])
    this.PartSys_constraint()
    
    //console.log(this.s1[0 + PART_XPOS])
    this.PartSys_swap()
    
   // console.log(this.s1[0 + PART_XPOS])
    //fhiwoe[4]
  }
  this.PartSys_addConstraint = function( newFunc) {
    this.constraintList.push(newFunc)
    this.constraintCount = this.constraintCount + 1
  }
  this.PartSys_addForce = function(newFunc) {
    this.forceList.push(newFunc)
    this.forceCount = this.forceCount + 1
  }
  this.PartSys_addPreSolve = function(newFunc) {
    this.preSolveList.push(newFunc)
    this.preSolveCounts = this.preSolveCounts + 1
  }
  this.PartSys_applyForces = function() {
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      // -- move our particle using current velocity
      var totX = 0
      var totY = 0
      var totZ = 0
      //var mass = s0[PART_MASS + pOff]
      for (var j=0;j<this.forceCount;j++){
        returnVal = this.forceList[j](pOff,0,this.partCount,this.s0,this)//mForces[j](i)
        totX += returnVal[0]
        totY += returnVal[1]
        totZ += returnVal[2]
      }
      this.s0[PART_X_FTOT + pOff] = totX
      this.s0[PART_Y_FTOT + pOff] = totY
      this.s0[PART_Z_FTOT + pOff] = totZ
    }
  }

  this.PartSys_preSolve = function() {
  	for (var j=0;j<this.preSolveCount;j++){
        this.preSolveList[j](this,this.s0)
    }
  }
  this.PartSys_DotMaker = function(dotArray,zeroArray) {
    var timeInverse = (1/timeStep)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      // -- move our particle using current velocity
      var mass = 1/zeroArray[PART_MASS + pOff]
      //console.log(mass)
      dotArray[PART_XVEL+ pOff] = (zeroArray[PART_X_FTOT+ pOff] * mass);
      dotArray[PART_YVEL+ pOff] = (zeroArray[PART_Y_FTOT+ pOff] * mass); 
      dotArray[PART_ZVEL+ pOff] = (zeroArray[PART_Z_FTOT+ pOff] * mass);
      dotArray[PART_XPOS+ pOff] = zeroArray[PART_XVEL+ pOff]
      dotArray[PART_YPOS+ pOff] = zeroArray[PART_YVEL+ pOff]
      dotArray[PART_ZPOS+ pOff] = zeroArray[PART_ZVEL+ pOff]
      dotArray[PART_R+ pOff] = zeroArray[PART_R_VEL+ pOff]
      dotArray[PART_G+ pOff] = zeroArray[PART_G_VEL+ pOff]
      dotArray[PART_B+ pOff] = zeroArray[PART_B_VEL+ pOff]
      dotArray[PART_DIAM + pOff] = zeroArray[PART_DIAM_VEL + pOff]
    }
  }

  this.PartSys_render = function(gl, s) {
    // for (var i = this.partCount * PART_MAXVAR; i >= 0; i--) {
    //   buffer[i + self.startIndex] = this.s0[i]
    // }
    //console.log(this.s0)
    gl.bufferSubData(gl.ARRAY_BUFFER,     // GLenum target,
                                  0,      // offset to data we'll transfer
                                 this.s0);     // Data source (Javascript array)  
    // console.log(this.partCount)
    // console.log(this.startIndex)

    gl.drawArrays(gl.POINTS, 0, this.partCount); 
    // =drawing primitive, starting index, number of indices to render
  }

  this.PartSys_Eulersolver = function() {
    //Euler: s1 = s0 + s0dot * h //(wth timestep h)
    //Midpoint: sM = s0 + s0dot*(h/2)
    // s1 = s0 + sMdot*h

    var h = (1/timeStep)
    //s1[j + pOff] = s0[j + pOff] + (s0dot[j+pOff] * h)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      // -- move our particle using current velocity
      //console.log(s0dot[PART_YPOS+ pOff] )
      //console.log[PART_XVEL ]
      for (var j=0;j<PART_MAXVAR;j++){
      	// console.log("Euler")
      	// console.log(this.s1[j + pOff])
      	// console.log(this.s0[j + pOff])
      	// console.log(this.s0dot[j+pOff] * h)
        this.s1[j + pOff] = this.s0[j + pOff] + (this.s0dot[j+pOff] * h)
       //  console.log(this.s1[j + pOff])
      	// console.log(this.s0[j + pOff])
        // sM[j + pOff] = s0[j + pOff] + s0dot[j + pOff]*(h/2)
        // sMdot[] = dotFinder(sM)
        // s1[j + pOff] = s0[j + pOff] + sMdot[j + pOff]*h
      }
      // f(a + x) = f(a) + f'(a)x + (f''(a)x^2)/2! + (f'''(a)x^3)/3! ...
      // replace a with current state, and x with timesteps
      // s1 = s0 + h(s0dot) + (h^2/2) * s0dot2 + (h^3/6)*s0dot3 + ... + (h^N/N!) * s0dotN
      // s1[PART_XPOS+ pOff] = s0[PART_XPOS+ pOff] + (s0dot[PART_XVEL+ pOff] * (1/timeStep));
      // s1[PART_YPOS+ pOff] = s0[PART_YPOS+ pOff] + (s0dot[PART_YVEL+ pOff] * (1/timeStep)); 
      // s1[PART_ZPOS+ pOff] = s0[PART_ZPOS+ pOff] + (s0dot[PART_ZVEL+ pOff] * (1/timeStep));
    }
  }
  this.PartSys_MidPointSolver = function() {
    
    var h = (1/timeStep)
    //s1[j + pOff] = s0[j + pOff] + (s0dot[j+pOff] * h)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s1[j + pOff] = this.s0[j + pOff] + (this.s0dot[j+pOff] * h)
        this.sM[j + pOff] = this.s0[j + pOff] + this.s0dot[j + pOff]*(h/2)
      }
    }

    this.PartSys_DotMaker(this.sMdot,this.sM)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s1[j + pOff] = this.s0[j + pOff] + this.sMdot[j + pOff]*h
      }
    }
  }

  this.PartSys_ImplicitsolverMP = function() {
    
    var h = (1/timeStep)
    //s1[j + pOff] = s0[j + pOff] + (s0dot[j+pOff] * h)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.sM[j + pOff] = this.s0[j + pOff] + this.s0dot[j + pOff]*(h/2)
      }
    }
    this.PartSys_DotMaker(this.sMdot,this.sM)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s1[j + pOff] = this.s0[j + pOff] + (this.sMdot[j + pOff]*h)
      }
    }
    //console.log(this.s1[0 + PART_XPOS])

    this.PartSys_DotMaker(this.s1dot, this.s1)
    //console.log(this.s1dot[0 + PART_XPOS])
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.sM[j + pOff] = this.s1[j + pOff] + this.s1dot[j + pOff]*(h/2)
      }
    }
    //console.log(this.sM[0 + PART_XPOS])

    this.PartSys_DotMaker(this.sMdot,this.sM)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s2[j + pOff] = this.s1[j + pOff] + this.sMdot[j + pOff]*h
      }
    }

    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s2[j + pOff] = this.s1[j + pOff] - (this.s1dot[j+pOff] * (h/2))
      }
    }
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.sErr[j + pOff] = this.s2[j + pOff] - this.s0[j+pOff]
      }
    }
    
    //console.log(this.sErr[0 + PART_XPOS])

    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s1[j + pOff] -= (0.5*(this.sErr[j+pOff]))
      }
    }
    //console.log(this.s1[0 + PART_XPOS])
  }

  this.PartSys_Implicitsolver = function() {
    
    var h = (1/timeStep)
    //s1[j + pOff] = s0[j + pOff] + (s0dot[j+pOff] * h)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s1[j + pOff] = this.s0[j + pOff] + (this.s0dot[j+pOff] * h)
      }
    }

    this.PartSys_DotMaker(this.s1dot, this.s1)
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s2[j + pOff] = this.s1[j + pOff] - (this.s1dot[j+pOff] * h)
      }
    }

    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.sErr[j + pOff] = this.s2[j + pOff] - this.s0[j+pOff]
      }
    }
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      for (var j=0;j<PART_MAXVAR;j++){
        this.s1[j + pOff] -= (0.5*(this.sErr[j+pOff]))
      }
    }
  }
  this.PartSys_AdamsBashforth = function() {
    var h = (1/timeStep)
    //s1[j + pOff] = s0[j + pOff] + (s0dot[j+pOff] * h)
    if (this.firstTimeAB) {
      this.PartSys_Eulersolver()
    } else {
      for (var i=0;i<this.partCount;i++) {
        var pOff = i * PART_MAXVAR; 
        for (var j=0;j<PART_MAXVAR;j++){
          this.s1[j + pOff] = this.s0[j + pOff] + (1.5 * this.s0dot[j+pOff] * h) - ((h/2) * this.spdot)
        }
      }
      for (var i=0;i<this.partCount;i++) {
        var pOff = i * PART_MAXVAR; 
        for (var j=0;j<PART_MAXVAR;j++){
          this.spdot[j + pOff] = this.s0dot[j+pOff]
        }
      }
    }
  }
  this.PartSys_solver = function() {
    if (this.solverType == SOLVER_EULER){
      this.PartSys_Eulersolver()
    } 
    else if (this.solverType == SOLVER_MIDPOINT){
      this.PartSys_MidPointSolver()
    } 
    else if (this.solverType == SOLVER_IMPLICIT){
      this.PartSys_Implicitsolver()
    } 
    else if (this.solverType == SOLVER_IMPLICITMP){
      this.PartSys_ImplicitsolverMP()
    }else if (this.solverType == SOLVER_ADAMSBASHFORTH){
      this.PartSys_AdamsBashforth()
    }
  }
  this.PartSys_setSolver = function(solverType) {
    this.solverType = solverType
  }
  this.PartSys_swap = function() {
    temp = this.s0
    this.s0 = this.s1
    //this.s1 = this.s0
    this.s1 = temp
    //console.log(this.s0[PART_XPOS+ pOff])
  }

  this.PartSys_constraint = function() {
    for (var i=0;i<this.partCount;i++) {
      var pOff = i * PART_MAXVAR; 
      // -- move our particle using current velocity
      var mass = this.s0[PART_MASS + pOff]

      for (var j=0;j<this.constraintCount;j++){
        this.constraintList[j](pOff,0,this.partCount,this.s0,this.s1,this)//mConstraints[j](i)
        //this.CPin(pOff)//mConstraints[j](i)
        //this.CConstraintTest3(pOff)//mConstraints[j](i)
      }
    }
  }
  this.PartSys_initFire = function() {
  	for (var i=0;i<this.partCount;i++){
  		var pOff = i*PART_MAXVAR;
  		this.initFireParticle(this.s0,pOff,this)
  	}
  }
  this.PartSys_initBoids = function(sel,red,green,blue) {
  	var doit = 1
  	var redB = Math.max(Math.min(red, 0.8),0.0)
    var greenB = Math.max(Math.min(green, 0.8),0.0)
    var blueB =  Math.max(Math.min(blue, 0.8),0.0)
  	for (var i=0;i<this.partCount;i++){
  		var pOff = i*PART_MAXVAR;     // starting index of each particle
            var xcyc = this.roundRand3D();
            if(doit==1) {
              console.log('xc,yc,zc= '+xcyc[0]+', '+xcyc[1]+', '+xcyc[2]);
              doit=0;
              }
            this.s0[pOff + PART_XPOS] = 0.0 + 0.2*xcyc[0];   // 0.0 <= randomRound() < 1.0
            this.s0[pOff + PART_YPOS] = this.posY + 20.0 + 0.2*xcyc[1];
            this.s0[pOff + PART_ZPOS] = this.posZ + 20.0 + 0.2*xcyc[2];;
            xcyc = this.roundRand3D();
            this.s0[pOff + PART_XVEL] = 0//INIT_VEL*(0.1 + 0.2*xcyc[0]);
            this.s0[pOff + PART_YVEL] = INIT_VEL*(0.1 + 0.2*xcyc[1]);
            this.s0[pOff + PART_ZVEL] = 0//INIT_VEL*(0.1 + 0.2*xcyc[2]);
            this.s0[pOff + PART_X_FTOT] = 0.0;
            this.s0[pOff + PART_Y_FTOT] = 0.0;
            this.s0[pOff + PART_Z_FTOT] = 0.0;
            if (pOff == 0) {
            	this.s0[pOff + PART_R] = 0.0
	            this.s0[pOff + PART_G] = 1.0
	            this.s0[pOff + PART_B] = 0.0
            } else {
            	this.s0[pOff + PART_R] = redB + 0.2*Math.random();
	            this.s0[pOff + PART_G] = greenB + 0.2*Math.random();
	            this.s0[pOff + PART_B] = blueB + 0.2*Math.random();
            }
            
            this.s0[pOff + PART_MASS] = 0.9 + 0.2*Math.random();
            this.s0[pOff + PART_DIAM] = 5.0
            this.s0[pOff + PART_ALPHA] = 1.0
            this.s0[pOff + PART_RENDMODE] = Math.floor(4.0*Math.random()); // 0,1,2 or 3.
  	}
  }
  this.PartSys_initCloth = function(sel,red,green,blue) {
  	var doit = 1
  	var redB = Math.max(Math.min(red, 0.8),0.0)
    var greenB = Math.max(Math.min(green, 0.8),0.0)
    var blueB =  Math.max(Math.min(blue, 0.8),0.0)
    var width = 20
    var currWidth = 0
    var currHeight = 0
  	for (var i=0;i<this.partCount;i++){
  		var pOff = i*PART_MAXVAR;     // starting index of each particle
            var xcyc = this.roundRand3D();
            if(doit==1) {
              console.log('xc,yc,zc= '+xcyc[0]+', '+xcyc[1]+', '+xcyc[2]);
              doit=0;
              }
            currWidth = currWidth + 0.1
            if (currWidth == 2) {
            	currWidth = 0.0
            	currHeight  = currHeight + 0.1
            }
            this.s0[pOff + PART_XPOS] = currHeight  // 0.0 <= randomRound() < 1.0
            this.s0[pOff + PART_YPOS] = this.posY
            this.s0[pOff + PART_ZPOS] = currWidth;
            xcyc = this.roundRand3D();
            this.s0[pOff + PART_XVEL] = 0//INIT_VEL*(0.1 + 0.2*xcyc[0]);
            this.s0[pOff + PART_YVEL] = 0;
            this.s0[pOff + PART_ZVEL] = 0//INIT_VEL*(0.1 + 0.2*xcyc[2]);
            this.s0[pOff + PART_X_FTOT] = 0.0;
            this.s0[pOff + PART_Y_FTOT] = 0.0;
            this.s0[pOff + PART_Z_FTOT] = 0.0;
            if (i%5 == 0 ) {
            	this.s0[pOff + PART_R] = 1.0
		        this.s0[pOff + PART_G] = 0.0
		        this.s0[pOff + PART_B] = 0.0

            } else if (i% 5 == 1) {
            	this.s0[pOff + PART_R] = 1.0
		        this.s0[pOff + PART_G] = 1.0
		        this.s0[pOff + PART_B] = 0.0

            } else if (i% 5 == 2) {
            	this.s0[pOff + PART_R] = 0.0
		        this.s0[pOff + PART_G] = 1.0
		        this.s0[pOff + PART_B] = 0.0
            	
            } else if (i% 5 == 3) {
            	this.s0[pOff + PART_R] = 0.0
		        this.s0[pOff + PART_G] = 1.0
		        this.s0[pOff + PART_B] = 1.0
            	
            } else if (i% 5 == 4) {
            	this.s0[pOff + PART_R] = 0.0
		        this.s0[pOff + PART_G] = 0.0
		        this.s0[pOff + PART_B] = 1.0
            }
            this.s0[pOff + PART_MASS] = 1.0;
            this.s0[pOff + PART_DIAM] = 5.0;
            this.s0[pOff + PART_ALPHA] = 1.0;
            this.s0[pOff + PART_RENDMODE] = Math.floor(4.0*Math.random()); // 0,1,2 or 3.
  	}
  }

  this.PartSys_initCharge = function(sel,red,green,blue) {
  	var doit = 1
  	var redB = Math.max(Math.min(red, 0.8),0.0)
    var greenB = Math.max(Math.min(green, 0.8),0.0)
    var blueB =  Math.max(Math.min(blue, 0.8),0.0)
    var width = 20
    var currWidth = 0
    var currHeight = 0
  	for (var i=0;i<this.partCount;i++){
  		var pOff = i*PART_MAXVAR;     // starting index of each particle
            var xcyc = this.roundRand3D();
            if(doit==1) {
              console.log('xc,yc,zc= '+xcyc[0]+', '+xcyc[1]+', '+xcyc[2]);
              doit=0;
              }
            currWidth = currWidth + 0.1
            if (currWidth == 2) {
            	currWidth = 0.0
            	currHeight  = currHeight + 0.1
            }
            this.s0[pOff + PART_XPOS] = this.posX + 0.0 + 0.5*xcyc[0];   // 0.0 <= randomRound() < 1.0
            this.s0[pOff + PART_YPOS] = this.posY + 1.0 + 0.5*xcyc[1];
            xcyc = this.roundRand3D();
            this.s0[pOff + PART_XVEL] = 0//INIT_VEL*(0.4 + 0.2*xcyc[0]);
            this.s0[pOff + PART_YVEL] = 0//INIT_VEL*(0.4 + 0.2*xcyc[1]);
            this.s0[pOff + PART_ZVEL] = 0//INIT_VEL*(0.4 + 0.2*xcyc[2]);
            this.s0[pOff + PART_X_FTOT] = 0.0;
            this.s0[pOff + PART_Y_FTOT] = 0.0;
            this.s0[pOff + PART_Z_FTOT] = 0.0;
            console.log("inti")
            if (i % 2 == 0) {
            	this.s0[pOff + PART_ZPOS] = this.posZ + 1.2 + 0.2*xcyc[2];;
            	this.s0[pOff + PART_R] = 0.8 + 0.2*Math.random();
	            this.s0[pOff + PART_G] = 0.0 + 0.2*Math.random();
	            this.s0[pOff + PART_B] = 0.0 + 0.2*Math.random();
	            this.s0[pOff + PART_CHARGE] = 1.0
            } else {
            	this.s0[pOff + PART_ZPOS] = this.posZ + 2.8 + 0.2*xcyc[2];;
            	this.s0[pOff + PART_R] = 0.0 + 0.2*Math.random();
	            this.s0[pOff + PART_G] = 0.0 + 0.2*Math.random();
	            this.s0[pOff + PART_B] = 0.8 + 0.2*Math.random();
	            this.s0[pOff + PART_CHARGE] = -1.0
            }
            this.s0[pOff + PART_MASS] = 1.0;
            this.s0[pOff + PART_DIAM] = 5.0;

            this.s0[pOff + PART_ALPHA] = 1.0
            this.s0[pOff + PART_RENDMODE] = Math.floor(4.0*Math.random()); // 0,1,2 or 3.
  	}
  }

  this.PartSys_init = function(sel,red,green,blue) {
    //==============================================================================
    // set initial values of all particle-system state.
    // sel==0 for 3 bouncy-ball particles, == 1 to add velocity to all particles.
    var redB = Math.max(Math.min(red, 0.8),0.0)
    var greenB = Math.max(Math.min(green, 0.8),0.0)
    var blueB =  Math.max(Math.min(blue, 0.8),0.0)
    var doit=1;
      switch(sel) {
        case 0:
          for(var i=0; i<this.partCount; i++) {
            var pOff = i*PART_MAXVAR;     // starting index of each particle
            var xcyc = this.roundRand3D();
            if(doit==1) {
              console.log('xc,yc,zc= '+xcyc[0]+', '+xcyc[1]+', '+xcyc[2]);
              doit=0;
              }
            this.s0[pOff + PART_XPOS] = this.posX + 3.0 + 0.2*xcyc[0];   // 0.0 <= randomRound() < 1.0
            this.s0[pOff + PART_YPOS] = this.posY + 3.0 + 0.2*xcyc[1];
            this.s0[pOff + PART_ZPOS] = this.posZ + 3.0 + 0.2*xcyc[2];;
            xcyc = this.roundRand3D();
            this.s0[pOff + PART_XVEL] = INIT_VEL*(0.4 + 0.2*xcyc[0]);
            this.s0[pOff + PART_YVEL] = INIT_VEL*(0.4 + 0.2*xcyc[1]);
            this.s0[pOff + PART_ZVEL] = INIT_VEL*(0.4 + 0.2*xcyc[2]);
            this.s0[pOff + PART_X_FTOT] = 0.0;
            this.s0[pOff + PART_Y_FTOT] = 0.0;
            this.s0[pOff + PART_Z_FTOT] = 0.0;
            this.s0[pOff + PART_R] = redB + 0.2*Math.random();
            this.s0[pOff + PART_G] = greenB + 0.2*Math.random();
            this.s0[pOff + PART_B] = blueB + 0.2*Math.random();
            this.s0[pOff + PART_MASS] = 0.9 + 0.2*Math.random();
            this.s0[pOff + PART_DIAM] = 3.0 + 7.0*Math.random();
            this.s0[pOff + PART_ALPHA] = 1.0
            this.s0[pOff + PART_RENDMODE] = Math.floor(4.0*Math.random()); // 0,1,2 or 3.
          }
           break;
        case 1:         // increase current velocity by INIT_VEL
        default:
          for(var i=0; i<this.partCount; i++) {
            var pOff = i*PART_MAXVAR;     // starting index of each particle
            if(  this.s0[pOff + PART_XVEL] > 0) {
                 this.s0[pOff + PART_XVEL] += (0.2 + 0.8*Math.random())*INIT_VEL;
              }
            else this.s0[pOff + PART_XVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL;
            if(  this.s0[pOff + PART_YVEL] > 0) {
                 this.s0[pOff + PART_YVEL] += (0.2 + 0.8*Math.random())*INIT_VEL;
              }
            else this.s0[pOff + PART_YVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL;
            if(  this.s0[pOff + PART_ZVEL] > 0) {
                 this.s0[pOff + PART_ZVEL] += (0.2 + 0.8*Math.random())*INIT_VEL;
              }
            else this.s0[pOff + PART_ZVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL;
          }
          break;
       }
       
  }

  this.roundRand2D = function() {
  //==============================================================================
  // On each call, make a different 2D point (xdisc, ydisc) chosen 'randomly' 
  // and 'uniformly' inside a circle of radisu 1.0 centered at the origin.  
  // More formally: 
  //    --xdisc*xdisc + ydisc*ydisc < 1.0, and 
  //    --uniform probability density function (PDF) within this radius=1 circle.
  //    (within this circle, all regions of equal area are equally likely to
  //    contain the the point (xdisc,ydisc)).
  var xy = [0,0];
    do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.
      xy[0] = 2.0*Math.random() -1.0;     // choose an equally-likely 2D point
      xy[1] = 2.0*Math.random() -1.0;     // within the +/-1, +/-1 square.
      }
    while(xy[0]*xy[0] + xy[1]*xy[1] >= 1.0);    // keep 1st point inside circle
  //  while(xdisc*xdisc + ydisc*ydisc >= 1.0);    // keep 1st point inside circle.
    return xy;
  }

  this.roundRand3D = function() {
    //==============================================================================
    // On each call, find a different 3D point (xball, yball, zball) chosen 
    // 'randomly' and 'uniformly' inside a sphere of radius 1.0 centered at origin.  
    // More formally: 
    //    --xball*xball + yball*yball + zball*zball < 1.0, and 
    //    --uniform probability density function inside this radius=1 circle.
    //    (within this sphere, all regions of equal volume are equally likely to
    //    contain the the point (xball,yball,zball)).
      do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.
        xball = 2.0*Math.random() -1.0;     // choose an equally-likely 2D point
        yball = 2.0*Math.random() -1.0;     // within the +/-1, +/-1 square.
        zball = 2.0*Math.random() -1.0;
        }
      while(xball*xball + yball*yball + zball*zball >= 1.0);    // keep 1st point inside sphere.
      ret = new Array(xball,yball,zball);
      return ret;
    }

}
function distPoints(x1,y1,z1,x2,y2,z2) {
  var dist = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)+ (z2-z1)*(z2-z1)
  return dist
}
function initVertexBuffers(gl) {
  initShapeVertexBuffer(gl)
  return initPartVertexBuffer(gl)

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
	gndVerts = new Float32Array(PART_MAXVAR*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= PART_MAXVAR) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j + PART_XPOS  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+ PART_ZPOS] = -xymax;								// y
			gndVerts[j+ PART_YPOS] = 0.0;									// z
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j+ PART_XPOS] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+ PART_ZPOS] = xymax;								// y
			gndVerts[j+ PART_YPOS] = 0.0;									// z
		}
		gndVerts[j+PART_R] = xColr[0];			// red
		gndVerts[j+PART_G] = xColr[1];			// grn
		gndVerts[j+PART_B] = xColr[2];			// blu
    gndVerts[j + PART_ALPHA] = 1.0
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= PART_MAXVAR) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j+PART_XPOS] = -xymax;								// x
			gndVerts[j+PART_ZPOS] = -xymax + (v  )*ygap;	// y
			gndVerts[j+PART_YPOS] = 0.0;									// z
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j+PART_XPOS ] = xymax;								// x
			gndVerts[j+PART_ZPOS] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+PART_YPOS] = 0.0;									// z
		}
		gndVerts[j+PART_R] = yColr[0];			// red
		gndVerts[j+PART_G] = yColr[1];			// grn
		gndVerts[j+PART_B] = yColr[2];			// blu
    gndVerts[j + PART_ALPHA] = 1.0
	}
}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;    // # of slices of the sphere along the z axis. >=3 req'd
                      // (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts  = 27; // # of vertices around the top edge of the slice
                      // (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);  // North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);  // Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);  // South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * PART_MAXVAR);
                    // # of vertices * # of elements needed to store them. 
                    // each slice requires 2*sliceVerts vertices except 1st and
                    // last ones, which require only 2*sliceVerts-1.
                    
  // Create dome-shaped top slice of sphere at z=+1
  // s counts slices; v counts vertices; 
  // j counts array elements (vertices * elements per vertex)
  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0; 
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for(s=0; s<slices; s++) { // for each slice of the sphere,
    // find sines & cosines for top and bottom of this slice
    if(s==0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;  
      cos0 = cos1;
      sin0 = sin1;
    }               // & compute sine,cosine for new bottom edge.
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);
    // go around the entire slice, generating TRIANGLE_STRIP verts
    // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
    if(s==slices-1) isLast=1; // skip last vertex of last slice.
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=PART_MAXVAR) { 
      sphVerts[j + PART_ALPHA] = 1.0
      if(v%2==0)
      {       // put even# vertices at the the slice's top edge
              // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
              // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
        sphVerts[j+PART_XPOS  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphVerts[j+PART_YPOS] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphVerts[j+PART_ZPOS] = cos0;        
      }
      else {  // put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        sphVerts[j+ PART_XPOS] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphVerts[j+PART_YPOS] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphVerts[j+PART_ZPOS] = cos1;                                       // z   
      }
      if(s==0) {  // finally, set some interesting colors for vertices:
        sphVerts[j+PART_R]=topColr[0]; 
        sphVerts[j+PART_G]=topColr[1]; 
        sphVerts[j+PART_B]=topColr[2]; 
        }
      else if(s==slices-1) {
        sphVerts[j+PART_R]=botColr[0]; 
        sphVerts[j+PART_G]=botColr[1]; 
        sphVerts[j+PART_B]=botColr[2]; 
      }
      else {
          sphVerts[j+PART_R]=Math.random();// equColr[0]; 
          sphVerts[j+PART_G]=Math.random();// equColr[1]; 
          sphVerts[j+PART_B]=Math.random();// equColr[2];          
      }
    }
  }
}

function initPartVertexBuffer(gl) {
//==============================================================================
// Set up all buffer objects on our graphics hardware.
//
// Create a buffer object in the graphics hardware: get its ID# 
 vertexBufferID = gl.createBuffer();        //(make it global: PartSys_render()
                                            // modifies this buffers' contents)
  if (!vertexBufferID) {
    console.log('Failed to create the gfx buffer object');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of this selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //  == "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we need 
  //      for rendering (positions, colors, normals, etc), or 
  //  == "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  //      into a list of values we need; indices such as object #s, face #s, 
  //      edge vertex #s.
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferID);

 // Our particle system will use this buffer in a new way: all previous pgms
 // have created the buffer, then never changed it--we used it to draw over and
 // over again.  From the OpenGL ES specification:
 //   --STATIC_DRAW is for vertex buffers that are rendered many times, 
 //       and whose contents are specified once and never change.
 //   --DYNAMIC_DRAW is for vertex buffers that are rendered many times, and 
 //       whose contents change during the rendering loop.
 //   --STREAM_DRAW is for vertex buffers that are rendered a small number of 
 //       times and then discarded.
 //  Recall that gl.bufferData() allocates and fills a new hunk of graphics 
 //   memory.  We always use gl.bufferData() in the creation of a new buffer.
 //  In comparison, gl.bufferSubData() modifies contents of an existing buffer;
 //   we will use that in our 'PartSys_render()' function.
  gl.bufferData(gl.ARRAY_BUFFER,        // GLenum target,
                             buffer,        // ArrayBufferView data (or size)
                gl.DYNAMIC_DRAW);       // Usage hint.
                
  // ---------------Connect 'a_Position' attribute to bound buffer:-------------
  // Get the ID# for the a_Position variable in the graphics hardware
  // (keep it as global var--we'll need it for PartSys_render())
  a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionID < 0) {
    console.log('Failed to get the gfx storage location of a_Position');
    return -1;
  }
  var FSIZE = buffer.BYTES_PER_ELEMENT; // how many bytes per stored value?

  // Tell GLSL to fill 'a_Position' attribute variable for each shader 
  // with values in the buffer object chosen by 'gl.bindBuffer()' command.
  // Websearch yields OpenGL version: 
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(
    a_PositionID, //index == attribute var. name used in the shader pgm.
    3,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  normalize before use? true or false
    PART_MAXVAR*FSIZE,// stride == #bytes (of other, interleaved data) between 
                    // separating OUR values.
    PART_XPOS*FSIZE); // Offset -- how many bytes from START of buffer to the
                  // value we will actually use?  We start with position.
  // Enable this assignment of the a_Position variable to the bound buffer:
  gl.enableVertexAttribArray(a_PositionID);

  // ---------------Connect 'a_Color' attribute to bound buffer:--------------
  // Get the ID# for the vec3 a_Color variable in the graphics hardware
  // (keep it as global var--we'll need it for PartSys_render())
  a_ColorID = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_ColorID < 0) {
    console.log('Failed to get the gfx storage location of a_Color');
    return -1;
  }
  // Tell GLSL to fill 'a_Color' attribute variable for each shader 
  // with values in the buffer object chosen by 'gl.bindBuffer()' command.
  // Websearch yields OpenGL version: 
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(
    a_ColorID,    //index == attribute var. name used in the shader pgm.
    3,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  normalize before use? true or false
    PART_MAXVAR * FSIZE,// stride == #bytes (of other, interleaved data) between 
                      // separating OUR values?
    PART_R * FSIZE);  // Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  We start with position.
  // Enable this assignment of the a_Position variable to the bound buffer:
  gl.enableVertexAttribArray(a_ColorID);

  a_alphaID = gl.getAttribLocation(gl.program, 'a_Alpha');
  if(a_alphaID < 0) {
    console.log('Failed to get the gfx storage location of a_Alpha');
    return -1;
  }
  gl.vertexAttribPointer(
    a_alphaID,    //index == attribute var. name used in the shader pgm.
    1,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  normalize before use? true or false
    PART_MAXVAR * FSIZE,// stride == #bytes (of other, interleaved data) between 
                      // separating OUR values?
    PART_ALPHA * FSIZE);  // Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  We start with position.
  // Enable this assignment of the a_Position variable to the bound buffer:
  gl.enableVertexAttribArray(a_alphaID);

  // ---------------Connect 'a_diam' attribute to bound buffer:---------------
  // Get the ID# for the scalar a_diam variable in the graphics hardware
  // (keep it as global var--we'll need it for PartSys_render())
  a_diamID = gl.getAttribLocation(gl.program, 'a_diam');
  if(a_diamID < 0) {
    console.log('Failed to get the storage location of scalar a_diam');
    return -1;
  }
  // Tell GLSL to fill 'a_Position' attribute variable for each shader 
  // with values in the buffer object chosen by 'gl.bindBuffer()' command.
  // Websearch yields OpenGL version: 
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(
    a_diamID,     //index == attribute var. name used in the shader pgm.
    1,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  to normalize before use? true or false
    PART_MAXVAR*FSIZE,// stride == #bytes (of other, interleaved data) between 
                      // separating OUR values?
    PART_DIAM*FSIZE); // Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  We start with position.
  // Enable this assignment of the a_Position variable to the bound buffer:
  gl.enableVertexAttribArray(a_diamID);

  // --------------DONE with connecting attributes to bound buffer:-----------
  return partCount;
}

function initShapeVertexBuffer(gl) {
  makeCube();
  makeSphere();           // create, fill the sphVerts array
  makeGroundGrid();
  //var vcount = 1;   // The number of vertices

  mySiz = myCube.vertArray.length + gndVerts.length;
  vertexColors = new Float32Array(mySiz);
  i = 0
  myCube.setStartP(0);            // we stored the cylinder first.
  for(j=0; j< myCube.vertArray.length; i++,j++) {
      vertexColors[i] = myCube.vertArray[j];
  }
  gndStart = i;						// next we'll store the ground-plane;
  console.log(gndVerts.length)
  for(j=0; j< gndVerts.length; i++, j++) {
	vertexColors[i] = gndVerts[j];
	}
  // return vcount;
}
//===================Mouse and Keyboard event-handling Callbacks================
//==============================================================================
function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
};


function myMouseMove(ev,gl,canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'draw()' function instead)
};

function myMouseUp(ev,gl,canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

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
	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
	// Put it on our webpage too...
};


function myKeyDown(ev) {
}

function myKeyUp(ev) {
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.  Use this instead of myKeyDown(), myKeyUp() if
// you don't need to respond separately to key-down and key-up events.

/*
	// Report EVERYTHING about this pressed key in the console:
	console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
												', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
												', altKey='   +ev.altKey   +
												', metaKey(Command key or Windows key)='+ev.metaKey);
*/
	myChar = String.fromCharCode(ev.keyCode);	//	convert code to character-string
	// Report EVERYTHING about this pressed key in the webpage 
	// in the <div> element with id='Result':r 
  // document.getElementById('KeyResult').innerHTML = 
  //  			'char= ' 		 	+ myChar 			+ ', keyCode= '+ ev.keyCode 	+ 
  //  			', charCode= '+ ev.charCode + ', shift= '	 + ev.shiftKey 	+ 
  //  			', ctrl= '		+ ev.shiftKey + ', altKey= ' + ev.altKey 		+ 
  //  			', metaKey= '	+ ev.metaKey 	+ '<br>' ;
  			
  // update particle system state? myRunMode 0=reset; 1= pause; 2=step; 3=run
 // console.log(ev.keyCode)
	switch(myChar) {
		case '1':	
			myRunMode = 0.0;			// RESET!
			break;
		case '2':
			myRunMode = 1.0;			// PAUSE!
			break;
		case '3':
			myRunMode = 2.0;			// STEP!
			break;
		case '4':							// RUN!
			myRunMode = 3.0;
			break;
		case 'R':  // HARD reset: position AND velocity.
		  myRunMode = 0;			// RESET!
			xposNow =  0.0;				yposNow =  0.0;				zposNow =  0.0;	
			xvelNow =  INIT_VEL;	yvelNow =  INIT_VEL;	zvelNow =  INIT_VEL;
			break;
		case 'r':		// 'SOFT' reset: boost velocity only.
			// don't change myRunMode
			mPartSys.PartSys_init(1);
      break;
    case 't':		// 'SOFT' reset: boost velocity only.
			// don't change myRunMode
			RopeSys.PartSys_init(1);
      break;
    case 'e':
      normalSys.PartSys_init(1);
      break;
		// case 'y':		// 'SOFT' reset: boost velocity only.
		// 	// don't change myRunMode
		// 	MangetSys.PartSys_init(1);
      console.log("soft reset")
			break;	
		case 'p':			// toggle pause/run:
			BlackHole.goalY = Math.min(2.0,BlackHole.goalY + 0.1)
			break;
		case ';':			// toggle pause/run:
			BlackHole.goalY = Math.max(0.0,BlackHole.goalY - 0.1)
			break;
		case 'l':			// toggle pause/run:
			BlackHole.goalZ = Math.max(5.0,BlackHole.goalZ - 0.1)
			break;
		case '\'':			// toggle pause/run:
			BlackHole.goalZ = Math.min(7.0,BlackHole.goalZ + 0.1)
			break;
    case 'h':    // left-arrow key
      // print in console:
      console.log(' left-arrow.');
        angleX = angleX - 0.02;
      break;
    case 'u':    // up-arrow key
      console.log('   up-arrow.');
      ev.preventDefault();
          angleY = angleY + 0.02
          GoalY = GoalY + 1
      break;
    case 'k':    // right-arrow key
      console.log('right-arrow.');
          angleX = angleX + 0.02;
      break;
    case 'j':    // down-arrow key
      console.log(' down-arrow.');
      ev.preventDefault();
          angleY = angleY - 0.02
          GoalY = GoalY - 1
      break;
     case 'w':    // down-arrow key
      console.log(' w-key.');
        move(0.1,0.0)
      
      break;
     case 's':    // down-arrow key
      console.log(' s-key.');
        move(-0.1,0.0)
      
      break;
     case 'a':
      console.log('a -key?');
        move(0,0.1)
      
      break;
    case 'd':
      console.log('d- key?');
        move(0,-0.1)
      break;
		default:
			console.log('myKeyPress(): Ignored key: '+myChar);
			break;
	}
  calculateLook()
}

function move(frontSpeed,sideSpeed) {
    camPosX = camPosX + (Math.cos(angleX) * frontSpeed) 
    PosX = camPosX + (Math.cos(angleX - (Math.PI/2)) * sideSpeed )
    camPosZ = camPosZ + (Math.sin(angleX) * frontSpeed)
    camPosZ = camPosZ + (Math.sin(angleX - (Math.PI/2)) * sideSpeed )
}
function calculateLook() {
    GoalX = camPosX + (distPers * Math.cos(angleX))
    GoalZ = camPosZ + (distPers * Math.sin(angleX))
    VecY = 1
    VecX = 0
    VecZ = 0
    AngleZ = 0
 // GoalY = GoalY + (distPers * Math.cos(angleZ) + Math.sin(GoalY))
}

function switchRope() {
  RopeSys.solverType += 1
  if  (RopeSys.solverType > 4) {
    RopeSys.solverType = 0
  }
  var type = RopeSys.solverType
  if (type == SOLVER_EULER) {
    text = "Euler"
  } else if (type == SOLVER_MIDPOINT) {
    text = "Midpoint"
  } else if (type == SOLVER_IMPLICIT) {
    text = "Implicit"
  } else if (type == SOLVER_IMPLICITMP) {
    text = "Implicit Midpoint"
  } else if (type == SOLVER_ADAMSBASHFORTH) {
    text = "Adams-Bashforth"
  } 
  document.getElementById('RopeSolver').innerHTML=
      'Rope Solver:\t'+text+', \t'+"solver"; 
}

function switchFire() {
  FireSys.solverType += 1
  if  (FireSys.solverType > 4) {
    FireSys.solverType = 0
  }
  var type = FireSys.solverType
  if (type == SOLVER_EULER) {
    text = "Euler"
  } else if (type == SOLVER_MIDPOINT) {
    text = "Midpoint"
  } else if (type == SOLVER_IMPLICIT) {
    text = "Implicit"
  } else if (type == SOLVER_IMPLICITMP) {
    text = "Implicit Midpoint"
  } else if (type == SOLVER_ADAMSBASHFORTH) {
    text = "Adams-Bashforth"
  } 
  document.getElementById('FireSolver').innerHTML=
      'Fire Solver:\t'+text+', \t'+"solver"; 
}

function switchCloth() {
  mPartSys.solverType += 1
  if  (mPartSys.solverType > 4) {
    mPartSys.solverType = 0
  }
  var type = mPartSys.solverType
  if (type == SOLVER_EULER) {
    text = "Euler"
  } else if (type == SOLVER_MIDPOINT) {
    text = "Midpoint"
  } else if (type == SOLVER_IMPLICIT) {
    text = "Implicit"
  } else if (type == SOLVER_IMPLICITMP) {
    text = "Implicit Midpoint"
  } else if (type == SOLVER_ADAMSBASHFORTH) {
    text = "Adams-Bashforth"
  } 
  document.getElementById('ClothSolver').innerHTML=
      'Cloth Solver:\t'+text+', \t'+"solver"; 
}

function switchMagnet() {
  MagnetSys.solverType += 1
  if  (MagnetSys.solverType > 4) {
    MagnetSys.solverType = 0
  }
  var type = MagnetSys.solverType
  if (type == SOLVER_EULER) {
    text = "Euler"
  } else if (type == SOLVER_MIDPOINT) {
    text = "Midpoint"
  } else if (type == SOLVER_IMPLICIT) {
    text = "Implicit"
  } else if (type == SOLVER_IMPLICITMP) {
    text = "Implicit Midpoint"
  } else if (type == SOLVER_ADAMSBASHFORTH) {
    text = "Adams-Bashforth"
  } 
  document.getElementById('MagnetSolver').innerHTML=
      'Magnet Solver:\t'+text+', \t'+"solver"; 
}

function switchBoids() {
  BoidsSys.solverType += 1
  if  (BoidsSys.solverType > 4) {
    BoidsSys.solverType = 0
  }
  var type = BoidsSys.solverType
  if (type == SOLVER_EULER) {
    text = "Euler"
  } else if (type == SOLVER_MIDPOINT) {
    text = "Midpoint"
  } else if (type == SOLVER_IMPLICIT) {
    text = "Implicit"
  } else if (type == SOLVER_IMPLICITMP) {
    text = "Implicit Midpoint"
  } else if (type == SOLVER_ADAMSBASHFORTH) {
    text = "Adams-Bashforth"
  } 
  document.getElementById('BoidsSolver').innerHTML=
      'Boids Solver:\t'+text+', \t'+"solver"; 
}

function switchBlackHole() {
  BlackHole.solverType += 1
  if  (BlackHole.solverType > 4) {
    BlackHole.solverType = 0
  }
  var type = BlackHole.solverType
  if (type == SOLVER_EULER) {
    text = "Euler"
  } else if (type == SOLVER_MIDPOINT) {
    text = "Midpoint"
  } else if (type == SOLVER_IMPLICIT) {
    text = "Implicit"
  } else if (type == SOLVER_IMPLICITMP) {
    text = "Implicit Midpoint"
  } else if (type == SOLVER_ADAMSBASHFORTH) {
    text = "Adams-Bashforth"
  } 
  document.getElementById('BlackHoleSolver').innerHTML=
      'Black Hole Solver:\t'+text+', \t'+"solver"; 
}

function switchNormal() {
  normalSys.solverType += 1
  if  (normalSys.solverType > 4) {
    normalSys.solverType = 0
  }
  var type = normalSys.solverType
  if (type == SOLVER_EULER) {
    text = "Euler"
  } else if (type == SOLVER_MIDPOINT) {
    text = "Midpoint"
  } else if (type == SOLVER_IMPLICIT) {
    text = "Implicit"
  } else if (type == SOLVER_IMPLICITMP) {
    text = "Implicit Midpoint"
  } else if (type == SOLVER_ADAMSBASHFORTH) {
    text = "Adams-Bashforth"
  } 
  document.getElementById('NormalSolver').innerHTML=
      'Bouncy Ball Solver:\t'+text+', \t'+"solver"; 
}

function makeCube() {
  myCube = new ThreeDShape("cube");
  //myCube.setMaterial(MATL_SILVER_DULL)
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
  myCube.setColor(0.4,0.4,0.9);
  myCube.addVertex(0.0,0.0,0.1);
  myCube.setColor(0.2,0.2,0.3);
  myCube.addVertex(0.1,0.1,0.1);
  myCube.addVertex(0.1,0.0,0.1);
  
  myCube.setColor(0.4,0.4,0.9);
  myCube.addVertex(0.0,0.0,0.1);
  myCube.setColor(0.2,0.2,0.3);
  myCube.addVertex(0.0,0.1,0.1);
  myCube.addVertex(0.1,0.1,0.1);
  
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

  //bottom face
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
  myCube.setColor(0.0,0.4,1.0);
  myCube.addVertex(0.0,0.1,0.0);
  myCube.setColor(0.0,0.2,0.5);
  myCube.addVertex(0.0,0.1,0.1);
  myCube.addVertex(0.1,0.1,0.1);
  
  myCube.setColor(0.4,0.4,0.4);
  myCube.addVertex(0.0,0.1,0.0);
  myCube.setColor(0.2,0.2,1.0);
  myCube.addVertex(0.1,0.1,0.1);
  myCube.addVertex(0.1,0.1,0.0);
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
    // this.vertArray[i] = x;
    // this.vertArray[i+1] = y;
    // this.vertArray[i+2] = z;
    // this.vertArray[i+3] = this.colorArray[0];
    // this.vertArray[i+4] = this.colorArray[1];
    // this.vertArray[i+5] = this.colorArray[2];
    this.vertArray[i + PART_XPOS] = x;
    this.vertArray[i + PART_YPOS] = y;
    this.vertArray[i + PART_ZPOS] = z;
    this.vertArray[i + PART_R] = this.colorArray[0];
    this.vertArray[i + PART_G] = this.colorArray[1];
    this.vertArray[i + PART_B] = this.colorArray[2];
    this.vertArray[i + PART_ALPHA] = 1.0
    this.vertArray[i + PART_MAXVAR] = 0.0
    this.endPoint = this.endPoint + PART_MAXVAR
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
  this.draw = function( gl) {
    modelMatrix.translate(this.xTrans,this.yTrans, this.zTrans); 
    modelMatrix.rotate(this.angle, this.rotX,this.rotY,this.rotZ);
    modelMatrix.scale(this.xScale, this.yScale, this.zScale);
      // spin around y axis.
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    //gl.bindBuffer(gl.ARRAY_BUFFER, vertexColors);
    gl.drawArrays(gl.TRIANGLES,this.startP/PART_MAXVAR, (this.vertArray.length)/PART_MAXVAR);

    modelMatrix.scale(1/this.xScale, 1/this.yScale, 1/this.zScale);
    modelMatrix.rotate(-this.angle, this.rotX,this.rotY,this.rotZ);
    modelMatrix.translate(-this.xTrans,-this.yTrans, -this.zTrans); 
    
    
  };
};