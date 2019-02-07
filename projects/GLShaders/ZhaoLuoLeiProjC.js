
var VSHADER_GOURAUDSOURCE =
  //--------------- GLSL Struct Definitions:
  'struct MatlT {\n' +    // Describes one Phong material by its reflectances:
  '   vec3 emit;\n' +     // Ke: emissive -- surface 'glow' amount (r,g,b);
  '   vec3 ambi;\n' +     // Ka: ambient reflectance (r,g,b)
  '   vec3 diff;\n' +     // Kd: diffuse reflectance (r,g,b)
  '   vec3 spec;\n' +     // Ks: specular reflectance (r,g,b)
  '   int shiny;\n' +     // Kshiny: specular exponent (integer >= 1; typ. <200)
  '   };\n' +
  'struct LampT {\n' +    // Describes one point-like Phong light source
  '   vec3 pos;\n' +      // (x,y,z,w); w==1.0 for local light at x,y,z position
  '   vec3 ambi;\n' +     // Ia ==  ambient light source strength (r,g,b)
  '   vec3 diff;\n' +     // Id ==  diffuse light source strength (r,g,b)
  '   vec3 spec;\n' +     // Is == specular light source strength (r,g,b)
  ' float isLit;\n' +
  '}; \n' +

  'attribute vec4 a_Position;\n' +
  'uniform LampT u_LampSet[4];\n' +   // Array of all light sources.
  'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' +  // Camera/eye location in world coords.
   //  'attribute vec4 a_Color;\n' + // Defined constant in main()
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_ProjMatrix; \n' +
  'uniform mat4 u_ViewMatrix; \n' +
  'uniform mat4 u_ModelMatrix; \n' +    // Model matrix

  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'varying vec4 v_Color;\n' +
  'uniform float u_Gmode;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
     // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
     // Calculate world coordinate of vertex
  ' vec3 ambient;\n'+
  ' vec3 diffuse;\n'+
  ' vec3 speculr;\n'+
  ' vec3 emissiv =                    u_MatlSet[0].emit;' +
  'for (int i = 0;i < 2; i ++) {\n' +
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
     // Calculate the light direction and make it 1.0 in length
  '  vec3 eyeDirection = normalize(u_eyePosWorld - a_Position.xyz); \n' +
  '  vec3 lightDirection = normalize(u_LampSet[i].pos - vec3(vertexPosition));\n' +
     // The dot product of the light direction and the normal
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  float e64;\n' +
  '  if (u_Gmode == 1.0) {\n' +
  '  lightDirection = lightDirection * vec3(-1,1,-1);\n'+
  '  vec3 reflect = reflect(lightDirection, normal);\n' +
  '  float nDotP = max(dot(eyeDirection,reflect),0.0);\n' +
  '  e64 = pow(nDotP, float(u_MatlSet[i].shiny));\n' +
  '} else {  float nDotH = max(dot(H, normal), 0.0); \n' +
  '  e64 = pow(nDotH, float(u_MatlSet[i].shiny));}\n' +
  '  vec3 mAmbient = u_LampSet[i].ambi * u_MatlSet[0].ambi * u_LampSet[i].isLit;\n' +
  '  vec3 mDiffuse = u_LampSet[i].diff * u_MatlSet[0].diff * nDotL * u_LampSet[i].isLit;\n' +
  '  vec3 mSpeculr = u_LampSet[i].spec * u_MatlSet[0].spec * e64 * u_LampSet[i].isLit;\n' +
  '  ambient += mAmbient;\n'+
  '  diffuse += mDiffuse;\n'+
  '  speculr += mSpeculr;}\n'+
     // Add the surface colors due to diffuse reflection and ambient reflection
  '  v_Color = vec4(emissiv + ambient + diffuse + speculr , 1.0);\n' +
  '}\n';

// Fragment shader program
var FSHADER_GOURAUDSOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


var VSHADER_SOURCE =
	//--------------- GLSL Struct Definitions:
	'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	'		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	'		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	'		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	'		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	'		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +
												
	//-------------ATTRIBUTES of each vertex, read from our Vertex Buffer Object
  'attribute vec4 a_Position; \n' +		// vertex position (model coord sys)
  'attribute vec4 a_Normal; \n' +			// vertex normal vector (model coord sys)

										
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
// 	'uniform vec3 u_Kd; \n' +						// Phong diffuse reflectance for the 
 																			// entire shape. Later: as vertex attrib.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform mat4 u_ProjMatrix; \n' +
  'uniform mat4 u_ViewMatrix; \n' +
  'uniform mat4 u_ModelMatrix; \n' + 		// Model matrix
  'uniform mat4 u_NormalMatrix; \n' +  	// Inverse Transpose of ModelMatrix;
  																			// (won't distort normal vec directions
  																			// but it usually WILL change its length)
  
	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
																				// (I didn't make per-pixel Ke,Ka,Ks;
																				// we use 'uniform' values instead)
  'varying vec4 v_Position; \n' +				
  'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
	//-----------------------------------------------------------------------------
  'void main() { \n' +
		// Compute CVV coordinate values from our given vertex. This 'built-in'
		// 'varying' value gets interpolated to set screen position for each pixel.
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
		// Calculate the vertex position & normal vec in the WORLD coordinate system
		// for use as a 'varying' variable: fragment shaders get per-pixel values
		// (interpolated between vertices for our drawing primitive (TRIANGLE)).
  '  v_Position = u_ModelMatrix * a_Position; \n' +
		// 3D surface normal of our vertex, in world coords.  ('varying'--its value
		// gets interpolated (in world coords) for each pixel's fragment shader.
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
	'	 v_Kd = u_MatlSet[0].diff; \n' +		// find per-pixel diffuse reflectance from per-vertex
													// (no per-pixel Ke,Ka, or Ks, but you can do it...)
  '}\n';
//=============================================================================
// Fragment shader program
//=============================================================================
var FSHADER_SOURCE =
  'precision highp float;\n' +
  'precision highp int;\n' +
	//--------------- GLSL Struct Definitions:
	'struct LampT {\n' +		// Describes one point-like Phong light source
	'		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
	' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
	' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
	'		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
	'	float isLit;\n' +
	'}; \n' +
	'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	'		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	'		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	'		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	'		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	'		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
	'uniform LampT u_LampSet[4];\n' +		// Array of all light sources.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
  'uniform float u_Gmode;\n' +
  
 	//-------------VARYING:Vertex Shader values sent per-pix'''''''''''''''';el to Fragment shader: 
  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  													// Ambient? Emissive? Specular? almost
  													// NEVER change per-vertex: I use 'uniform' values

  'void main() { \n' +
	'  vec3 normal = normalize(v_Normal); \n' +
	' vec3 ambient;\n'+
	' vec3 diffuse;\n'+
	' vec3 speculr;\n'+
	' vec3 emissiv = 										u_MatlSet[0].emit;' +
//	'  vec3 normal = v_Normal; \n' +
     	// Find the unit-length light dir vector 'L' (surface pt --> light):
    'for (int i = 0;i < 2; i ++) {\n' +
	'  vec3 lightDirection = normalize(u_LampSet[i].pos - v_Position.xyz);\n' +
			// Find the unit-length eye-direction vector 'V' (surface pt --> camera)
	'  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
	'  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
	'  vec3 H = normalize(lightDirection + eyeDirection); \n' +

  //PHONG!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  '  float e64;\n' +
  '  if (u_Gmode == 1.0) {\n' +
  '  lightDirection = lightDirection * vec3(-1,1,-1);\n'+
  '  vec3 reflect = reflect(lightDirection,normal);\n' +
  '  float nDotP = max(dot(eyeDirection,reflect),0.0);\n' +
  '  e64 = pow(nDotP, float(u_MatlSet[i].shiny));\n' +
	'} else {  float nDotH = max(dot(H, normal), 0.0); \n' +
	'  e64 = pow(nDotH, float(u_MatlSet[i].shiny));}\n' +
  '  vec3 mAmbient = u_LampSet[i].ambi * u_MatlSet[0].ambi * u_LampSet[i].isLit;\n' +
  '  vec3 mDiffuse = u_LampSet[i].diff * v_Kd * nDotL * u_LampSet[i].isLit;\n' +
  '	 vec3 mSpeculr = u_LampSet[i].spec * u_MatlSet[0].spec * e64 * u_LampSet[i].isLit;\n' +
  '	 ambient += mAmbient;\n'+
  '	 diffuse += mDiffuse;\n'+
  '	 speculr += mSpeculr;}\n'+
  '  gl_FragColor = vec4(emissiv + ambient + diffuse + speculr , 1.0);\n' +
  '}\n';

//=============================================================================
// REMAINING GLOBAL VARIABLES   (absorb them into objects, please!)
//=============================================================================
// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

// Global vars for 3D scene variables (previously used as arguments to draw() function)
var canvas 	= false;
var gl 			= false;
var n_vcount= false;	// formerly 'n', but that name is far too vague and terse
											// to use safely as a global variable.
											
//  Global vars that hold GPU locations for 'uniform' variables.
//		-- For 3D camera and transforms:
var uLoc_eyePosWorld 	= false;
var uLoc_Gmode = false;
var gMode = 0.0;
var sMode = 0;
var u_ModelMatrix 	= false;
var uLoc_MvpMatrix 		= false;
var u_NormalMatrix = false;
var floatsPerVertex = 10;

// global vars that contain the values we send thru those uniforms,
//  ... for our camera:
var	eyePosWorld = new Float32Array(3);	// x,y,z in world coords
//  ... for our transforms:
var modelMatrix = new Matrix4();  // Model matrix
var	normalMatrix= new Matrix4();	// Transformation matrix for normals
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var isTurretTurn = false;

//	... for our first light source:   (stays false if never initialized)
var lamp0 = new LightsT();
var lamp1 = new LightsT();
var lamp2 = new LightsT();
var lamp3 = new LightsT();
var PosX = -2;
var PosY = 0;
var PosZ = 0;
var GoalX = 0;
var GoalY = 0;
var GoalZ = 0;
var lightX = 1.0;
var lightY = 1.0;
var lightZ = 0;
var distPers = 100;
var angleX = 0;
var angleY = 0;
var angleZ = 0;
var height = 0
var width = 0
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

	// ... for our first material:
var matlSel= MATL_RED_PLASTIC;				// see keypress(): 'm' key changes matlSel
var matl0 = new Material(matlSel);	

// ---------------END of global vars----------------------------

//=============================================================================
function main() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context \'gl\' for WebGL');
    return;
  }
  loadShaders(gl)
  n_vcount = initVertexBuffers(gl);
  if (n_vcount < 0) {
    console.log('Failed to set the vertex information: n_vcount false');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.4, 0.4, 0.4, 1.0);
  gl.enable(gl.DEPTH_TEST);
	window.addEventListener("keydown", myKeyDown, false);
  gMode = 0.0;

	// Position the camera in world coordinates:
	// (Note: uniform4fv() expects 4-element float32Array as its 2nd argument)
	
  // Init World-coord. position & colors of first light source in global vars;
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

  lamp2.I_pos.elements.set( [-6.0, 5.0, 5.0]);
  lamp2.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp2.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp2.I_spec.elements.set([1.0, 1.0, 1.0]);
  lamp2.isLit = 0.0

  lamp3.I_pos.elements.set( [0.0, -5.0, 5.0]);
  lamp3.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp3.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp3.I_spec.elements.set([1.0, 1.0, 1.0]);
  lamp3.isLit = 0.0
  calculateLook()
  winResize(); 
  var tick = function() {
    var now = Date.now();
    turretAngle = animateSin(turretAngle, isTurretTurn,now)
    turboAngle = animateSin2(turretAngle,now)
    currentAngle = animate(currentAngle);  // Update the rotation angle
    // Send this matrix to our Vertex and Fragment shaders through the
    lamp0.I_pos.elements.set( [PosX,PosY,PosZ]);
  	lamp1.I_pos.elements.set( [-lightX,lightZ,lightY]);
    draw(gl);   // Draw the triangles
    requestAnimationFrame(tick, canvas); 
  };
  tick(); 
}

function draw(gl) {
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//==============================================================================
  pushLightUniforms(gl)
	pushMatlUniforms(gl)
  // Clear <canvas> color AND DEPTH buffer
  gl.viewport(0,                              // Viewport lower-left corner
              0,       // location(in pixels)
              width,          // viewport width,
              height);      // viewport height in pixels.

  var vpAspect = (width/2)/(height);   // this camera: width/height.

  projMatrix.setPerspective(40,        // fovy: y-axis field-of-view in degrees  
                                      // (top <-> bottom in view frustum)
                            vpAspect, // aspect ratio: width/height
                            1, 100);  // near, far (always >0).
  eyePosWorld.set([PosX,PosY,PosZ]);
  gl.uniform3fv(uLoc_eyePosWorld, eyePosWorld);// use it to set our uniform
  viewMatrix.setLookAt(PosX,PosY,PosZ,GoalX,GoalY,GoalZ,VecX,VecY,VecZ)
  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

 drawMyScene(gl)
  //myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
}

function initVertexBuffers(gl) { // Create a sphere
//-------------------------------------------------------------------------------
	makeCube();
	makeCockPit();
	makeTopWing();
	makeWing();
	makeBody();
	makeGun();
	makeOctagon();
	makeSphere();
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
    + myBody.vertArray.length + myGun.vertArray.length + sphereVerts.length;

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
  axisStart = i;           // next we'll store the axis
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
  sphereStart = i;
  for(j=0; j< sphereVerts.length; i++,j++) {
      verticesColors[i] = sphereVerts[j];
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
  //var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  //if(a_Color < 0) {
  //  console.log('Failed to get the storage location of a_Color');
  //  return -1;
  //}
  //gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 10, FSIZE * 3);
  //gl.enableVertexAttribArray(a_Color);

                    // Enable assignment of vertex buffer object's position data
  var a_Normal = gl.getAttribLocation(gl.program,'a_Normal');
  if(a_Normal < 0) {
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


function myKeyDown(ev) {

switch(ev.keyCode) {			// keycodes !=ASCII, but are very consistent for 
    case 37:    // left-arrow key
      // print in console:
      console.log(' left-arrow.');
        angleX = angleX - 0.02;
      break;
    case 38:    // up-arrow key
      console.log('   up-arrow.');
      ev.preventDefault();
          angleY = angleY + 0.02
          GoalY = GoalY + 1
      break;
    case 39:    // right-arrow key
      console.log('right-arrow.');
          angleX = angleX + 0.02;
      break;
    case 40:    // down-arrow key
      console.log(' down-arrow.');
      ev.preventDefault();
          angleY = angleY - 0.02
          GoalY = GoalY - 1
      break;
    case 73:    // left-arrow key
      // print in console:
      console.log(' I button.');
        lightY = lightY + 0.1;
      break;
    case 74:    // up-arrow key
      console.log(' J button.');
          lightX = lightX - 0.1
      break;
    case 75:    // right-arrow key
      console.log('K button');
          lightY = lightY - 0.1
      break;
    case 76:    // down-arrow key
      console.log(' L button.');
          lightX = lightX + 0.1
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
    case 71:
      if (gMode == 1.0) {
        console.log("setting to Blinn")
        gMode = 0.0
      } else {
        console.log("setting to Phong")
        gMode = 1.0
      }
      gl.uniform1f(uLoc_Gmode  ,gMode)
    break;
    case 72:
      console.log("gulp... switching shading");
      if (sMode == 0) {
        console.log("setting to Gourand Shading")
        sMode = 1
      } else {
        console.log("setting to Phong Shading")
        sMode = 0
      }
      loadShaders(gl)
    break;
    case 82:
      console.log('r');
      PosY = PosY + 0.1
    break;
    case 32:
      console.log(lamp0.isLit)
      if (lamp0.isLit == 1.0) {
      	console.log("Turning light off")
      	lamp0.isLit = 0.0
      }else if (lamp0.isLit == 0.0) {
      	console.log("Turning light on")
      	lamp0.isLit = 1.0
      }
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



















function drawMyScene(myGL) {		  
 // Rotate to make a new set of 'world' drawing axes: 
 // old one had "+y points upwards", but
	modelMatrix.setTranslate(0.0,0.0,0.0)
	modelMatrix.rotate(-90.0, 1,0,0);	// new one has "+z points upwards",
	modelMatrix.translate(0.0, 0.0, -0.6);	
   normalMatrix.setInverseOf(modelMatrix);
   normalMatrix.transpose()
 //  // Pass our current matrix to the vertex shaders:
   myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
   myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

 //  // Now, using these drawing axes, draw our ground plane:
 	myCube.setMaterial(MATL_CHROME)
	myCube.setScale(300.0,300.0,1.0) 
	modelMatrix.translate(-15.0,-15.0,-0.1)
	myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
	myCube.setMaterial(MATL_BRONZE_DULL)
	modelMatrix.translate(15.0,15.0,0.1)
	modelMatrix.scale(1.0,1.0,1.5)
  // Now, using these drawing axes, draw our ground plane: 
	drawTurret(myGL, -2.0,-2.0,0,currentAngle*2,turboAngle);
	modelMatrix.rotate(90,1,0,0)
	drawAxis(myGL);
	modelMatrix.rotate(-90,1,0,0)
	//drawTurret(myGL,  2.0,-2.0,0,currentAngle*2,turboAngle)
	//drawTurret(myGL,  2.0,  2.0,0,-currentAngle,turboAngle)
	drawTurret(myGL, -2.0, 2.0,0,-currentAngle*2,turboAngle)
	drawShuttle(myGL,4.0,12.0,5.0,turboAngle*2,turboAngle);
	drawProbe(myGL,5.0,0.0,1,currentAngle,turboAngle);
	modelMatrix.scale(8.0,8.0,8.0)
	drawBuilding(myGL,-0.2,0.0,0.4,currentAngle*2);
	// drawBuilding(myGL,-0.2,0.4,0.4,currentAngle*2);
	// drawBuilding(myGL,-0.2,-0.4,0.4,currentAngle*2);
	// drawBuilding(myGL,0.2,0.7,0.4,currentAngle*2);
	// drawBuilding(myGL,0.6,0.7,0.4,currentAngle*2);
	// drawBuilding(myGL,1.0,0.7,0.4,currentAngle*2);
	// drawBuilding(myGL,1.4,0.7,0.4,currentAngle*2);
	modelMatrix.setTranslate(-lightX,lightZ,lightY)
	myCube.setMaterial(MATL_JADE)
	myCube.setScale(2.0,2.0,2.0)
	myCube.setAngle(45,1,1,0)
	myCube.draw(gl,modelMatrix, normalMatrix, u_ModelMatrix);
	myCube.setAngle(0,1,1,1)
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
  this.material = MATL_RED_PLASTIC

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
  this.setMaterial = function (mat) {
  	this.material = mat
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
    matl0.setMatl(this.material);	
    pushMatlUniforms(gl)
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
  myCube.setMaterial(MATL_BRASS)
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
  myBody.setMaterial(MATL_GOLD_DULL)
  myTopWing.setMaterial(MATL_BRONZE_DULL)
  myWing.setMaterial(MATL_BRONZE_SHINY)
  modelMatrix.rotate(90,1,0,0)
  modelMatrix.scale(10.0,10.0,10.0);

  modelMatrix.translate(-0.3,0,-0.15);
  myBody.setScale(1.0,1.0,1.5);
  myCockPit.setMaterial(MATL_GOLD_SHINY)
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
  myBody.setMaterial(MATL_SILVER_DULL)
  myCube.setMaterial(MATL_BRASS)
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
  myCube.setMaterial(MATL_SILVER_DULL)
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
  myCockPit.setNormal(0,0.545454,-0.454545);
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
  myTopWing.setNormal(1.0,0.0,0.0)
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
  myTopWing.setNormal(-1.0,0.0,0.0)
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
  myTopWing.setNormal(0.0,0.0,1.0)
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
  myTopWing.setNormal(0.0,0.9,0.1)
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
  myBody.setMaterial(MATL_GOLD_DULL)
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
  myBody.setNormal(-0.8,0.2,0.0)
  myBody.setColor(0.5,0.5,0.5);
  myBody.addVertex(0.1,0.1,0.0);
  myBody.addVertex(0.15,0.25,0.3);
  myBody.addVertex(0.1,0.1,0.3);
  
  myBody.addVertex(0.1,0.1,0.0);
  myBody.addVertex(0.15,0.25,0.3);
  myBody.addVertex(0.15,0.25,0.0);

  myBody.setNormal(0.8,0.2,0.0)
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
  myGun.setMaterial(MATL_GOLD_SHINY)
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

function makeSphere() {
  var SPHERE_DIV = 13; //default: 13.  JT: try others: 11,9,7,5,4,3,2,
  var i, ai, si, ci;
  var j, aj, sj, cj,next,p2again;
  var p1, p2;
  sphereVerts = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      sphereVerts.push(si * sj);  // X
      sphereVerts.push(cj);       // Y
      sphereVerts.push(ci * sj);  // Z
      sphereVerts.push(0)
      sphereVerts.push(0)
      sphereVerts.push(0)

      p2again = i + SPHERE_DIV+1
      ai = p2again * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);
      sphereVerts.push(si * sj);  // X
      sphereVerts.push(cj);       // Y
      sphereVerts.push(ci * sj);  // Z
      sphereVerts.push(0)
      next = i + 1
      ai = next * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);
      sphereVerts.push(si * sj);  // X
      sphereVerts.push(cj);       // Y
      sphereVerts.push(ci * sj);  // Z
      sphereVerts.push(0)
      sphereVerts.push(0)
      sphereVerts.push(0)
      sphereVerts.push(si * sj);  // X
      sphereVerts.push(cj);       // Y
      sphereVerts.push(ci * sj);  // Z
      sphereVerts.push(0)
      ai = p2again * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);
      sphereVerts.push(si * sj);  // X
      sphereVerts.push(cj);       // Y
      sphereVerts.push(ci * sj);  // Z
      sphereVerts.push(0)
      p2again = p2again + 1
      ai = p2again * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);
      sphereVerts.push(si * sj);  // X
      sphereVerts.push(cj);       // Y
      sphereVerts.push(ci * sj);  // Z
      sphereVerts.push(0)
      sphereVerts.push(0)
      sphereVerts.push(0)
      sphereVerts.push(0)
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }
}

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

function pushLightUniforms(gl) {
	gl.uniform3fv(lamp0.u_pos,  lamp0.I_pos.elements.slice(0,3));
	gl.uniform3fv(lamp0.u_ambi, lamp0.I_ambi.elements);		// ambient
	gl.uniform3fv(lamp0.u_diff, lamp0.I_diff.elements);		// diffuse
	gl.uniform3fv(lamp0.u_spec, lamp0.I_spec.elements);		// Specular
	gl.uniform1f(lamp0.u_isLit,lamp0.isLit)
	
	gl.uniform3fv(lamp1.u_pos,  lamp1.I_pos.elements.slice(0,3));
	gl.uniform3fv(lamp1.u_ambi, lamp1.I_ambi.elements);		// ambient
	gl.uniform3fv(lamp1.u_diff, lamp1.I_diff.elements);		// diffuse
	gl.uniform3fv(lamp1.u_spec, lamp1.I_spec.elements);		// Specular
	gl.uniform1f(lamp1.u_isLit,lamp1.isLit)

	gl.uniform3fv(lamp2.u_pos,  lamp2.I_pos.elements.slice(0,3));
	gl.uniform3fv(lamp2.u_ambi, lamp2.I_ambi.elements);		// ambient
	gl.uniform3fv(lamp2.u_diff, lamp2.I_diff.elements);		// diffuse
	gl.uniform3fv(lamp2.u_spec, lamp2.I_spec.elements);		// Specular
	gl.uniform1f(lamp2.u_isLit,lamp2.isLit)

	gl.uniform3fv(lamp2.u_pos,  lamp3.I_pos.elements.slice(0,3));
	gl.uniform3fv(lamp2.u_ambi, lamp3.I_ambi.elements);		// ambient
	gl.uniform3fv(lamp2.u_diff, lamp3.I_diff.elements);		// diffuse
	gl.uniform3fv(lamp2.u_spec, lamp3.I_spec.elements);		// Specular
	gl.uniform1f(lamp3.u_isLit,lamp3.isLit)
}

function pushMatlUniforms(gl) {
	gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
	gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
 	gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
	gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
	gl.uniform1i(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 
}


function loadLights(gl) {
	lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');	
	lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
	lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
	lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
	lamp0.u_isLit = gl.getUniformLocation(gl.program,'u_LampSet[0].isLit');
	if( !lamp0.u_pos || !lamp0.u_ambi	|| !lamp0.u_diff || !lamp0.u_spec	) {
    	console.log('Failed to get GPUs Lamp0 storage locations');
    	return;
  	}
  	lamp1.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[1].pos');	
	lamp1.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[1].ambi');
	lamp1.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[1].diff');
	lamp1.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[1].spec');
	lamp1.u_isLit = gl.getUniformLocation(gl.program,'u_LampSet[1].isLit');
	if( !lamp1.u_pos || !lamp1.u_ambi	|| !lamp1.u_diff || !lamp1.u_spec	) {
    	console.log('Failed to get GPUs Lamp1 storage locations');
    	return;
  	}
  	lamp2.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[2].pos');	
	lamp2.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[2].ambi');
	lamp2.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[2].diff');
	lamp2.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[2].spec');
	lamp2.u_isLit = gl.getUniformLocation(gl.program,'u_LampSet[2].isLit');
	if( !lamp2.u_pos || !lamp2.u_ambi	|| !lamp2.u_diff || !lamp2.u_spec	) {
    	console.log('Failed to get GPUs Lamp2 storage locations');
    	return;
  	}
  	lamp3.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[3].pos');	
	lamp3.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[3].ambi');
	lamp3.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[3].diff');
	lamp3.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[3].spec');
	lamp3.u_isLit = gl.getUniformLocation(gl.program,'u_LampSet[3].isLit');
	if( !lamp3.u_pos || !lamp3.u_ambi	|| !lamp3.u_diff || !lamp3.u_spec	) {
    	console.log('Failed to get GPUs Lamp3 storage locations');
    	return;
  	}
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

function loadShaders(gl) {
  if (sMode == 0) {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
    return;
    } 
  } else {
    if (!initShaders(gl, VSHADER_GOURAUDSOURCE, FSHADER_GOURAUDSOURCE)) {
      console.log('Failed to intialize shaders.');
    return;
    }
  }
  uLoc_eyePosWorld  = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  uLoc_Gmode  = gl.getUniformLocation(gl.program, 'u_Gmode');
  
  u_ModelMatrix  = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ProjMatrix  = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_ViewMatrix  = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!uLoc_eyePosWorld ||
    !u_ModelMatrix  || !u_ProjMatrix || !u_NormalMatrix) {
    console.log('Failed to get GPUs matrix storage locations');
      return;
    }
  //  ... for Phong light source:
  // NEW!  Note we're getting the location of a GLSL struct array member:
  loadLights(gl);

  // ... for Phong material/reflectance:
  matl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
  matl0.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
  matl0.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
  matl0.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
  matl0.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
  if(!matl0.uLoc_Ke || !matl0.uLoc_Ka || !matl0.uLoc_Kd || !matl0.uLoc_Ks || !matl0.uLoc_Kshiny) {
    console.log('Failed to get GPUs Reflectance storage locations');
    return;
  }
}
function ambientSubmit() {
  var R=document.getElementById('ambientR').value; 
  var G=document.getElementById('ambientG').value; 
  var B=document.getElementById('ambientB').value; 
  lamp1.I_ambi.elements.set([Math.min(Math.max(R,0),1.0), Math.min(Math.max(G,0),1.0), Math.min(Math.max(B,0),1.0)]);
};
function diffuseSubmit() {
  var R=document.getElementById('diffuseR').value; 
  var G=document.getElementById('diffuseG').value; 
  var B=document.getElementById('diffuseB').value; 
  lamp1.I_diff.elements.set([Math.min(Math.max(R,0),1.0), Math.min(Math.max(G,0),1.0), Math.min(Math.max(B,0),1.0)]);
};
function specularSubmit() {
  var R=document.getElementById('specularR').value; 
  var G=document.getElementById('specularG').value; 
  var B=document.getElementById('specularB').value; 
  lamp1.I_spec.elements.set([Math.min(Math.max(R,0),1.0), Math.min(Math.max(G,0),1.0), Math.min(Math.max(B,0),1.0)]);
};
function toggleLight() {
  if (lamp1.isLit == 1.0){
    lamp1.isLit = 0.0
  } else {
    lamp1.isLit = 1.0
  }
}