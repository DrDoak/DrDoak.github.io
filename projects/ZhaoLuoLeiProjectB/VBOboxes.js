//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

/*=====================
  VBOboxes.js library: 
  ===================== 
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		the shapes made from vertices stored in one Vertex Buffer Object (VBO), 
		as drawn by one 'shader program' that runs on your computer's Graphical  
		Processing Unit(GPU).  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' and 'uniform' 
		variables.  Each VBObox object stores its own 'uniform' values in 
		JavaScript; its 'adjust()'	function computes newly-updated values and 
		transfers them to the GPU for use.
	-------------------------------------------------------
	A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	-------------------------------------------------------
As each 'VBObox' object will contain DIFFERENT GLSL shader programs, DIFFERENT 
		attributes for each vertex, DIFFERENT numbers of vertices in VBOs, and 
		DIFFERENT uniforms, I don't see any easy way to use the exact same object 
		constructors and prototypes for all VBObox objects.  Individual VBObox 
		objects may vary substantially, so I recommend that you copy and re-name an 
		existing VBObox prototype object, rename it, and modify as needed, as shown 
		here. (e.g. to make the VBObox2 object, copy the VBObox1 constructor and 
		all its prototype functions, then modify their contents for VBObox2 
		activities.)
Note that you don't really need a 'VBObox' object at all for simple, 
		beginner-level WebGL/OpenGL programs: if all vertices contain exactly the 
		same attributes (e.g. position, color, surface normal), and use the same 
		shader program (e.g. same Vertex Shader and Fragment Shader), then our 
		textbook's simple 'example code' will suffice.  But that's rare -- most 
		genuinely useful WebGL/OpenGL programs need different sets of vertices with 
		different sets of attributes rendered by different shader programs, where a 
		customized VBObox object for each VBO/shader pair will help you remember 
		and correctly implement all the WebGL/GLSL steps required for a working 
		program.
*/
// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2016.06.03 J. Tumblin-- adjusted for ray-tracing starter code.
//=============================================================================
// Tabs set to 2

//=============================================================================
//=============================================================================
function VBObox1() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox1' object  that holds all data and 
// fcns needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.

  // Vertex shader program----------------------------------
  this.VERT_SRC =
  //--------------- GLSL Struct Definitions:
  'struct MatlT {\n' +    // Describes one Phong material by its reflectances:
  '   vec3 emit;\n' +     // Ke: emissive -- surface 'glow' amount (r,g,b);
  '   vec3 ambi;\n' +     // Ka: ambient reflectance (r,g,b)
  '   vec3 diff;\n' +     // Kd: diffuse reflectance (r,g,b)
  '   vec3 spec;\n' +     // Ks: specular reflectance (r,g,b)
  '   int shiny;\n' +     // Kshiny: specular exponent (integer >= 1; typ. <200)
  '   };\n' +
                        
  //-------------ATTRIBUTES of each vertex, read from our Vertex Buffer Object
  'attribute vec4 a_Position; \n' +   // vertex position (model coord sys)
  'attribute vec4 a_Normal; \n' +     // vertex normal vector (model coord sys)

                    
  //-------------UNIFORMS: values set from JavaScript before a drawing command.
//  'uniform vec3 u_Kd; \n' +           // Phong diffuse reflectance for the 
                                      // entire shape. Later: as vertex attrib.
  'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.
  'uniform mat4 u_ProjMatrix; \n' +
  'uniform mat4 u_ViewMatrix; \n' +
  'uniform mat4 u_ModelMatrix; \n' +    // Model matrix
  'uniform mat4 u_NormalMatrix; \n' +   // Inverse Transpose of ModelMatrix;
                                        // (won't distort normal vec directions
                                        // but it usually WILL change its length)
  
  //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
  'varying vec3 v_Kd; \n' +             // Phong Lighting: diffuse reflectance
                                        // (I didn't make per-pixel Ke,Ka,Ks;
                                        // we use 'uniform' values instead)
  'varying vec4 v_Position; \n' +       
  'varying vec3 v_Normal; \n' +         // Why Vec3? its not a point, hence w==0
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
  '  v_Kd = u_MatlSet[0].diff; \n' +    // find per-pixel diffuse reflectance from per-vertex
                          // (no per-pixel Ke,Ka, or Ks, but you can do it...)
  '}\n';
//=============================================================================
// Fragment shader program
//=============================================================================
this.FRAG_SRC =
  '#define abs(x) ((x)<0.0? (-x): (x));\n' +
  'precision highp float;\n' +
  'precision highp int;\n' +
  //--------------- GLSL Struct Definitions:
  'struct LampT {\n' +    // Describes one point-like Phong light source
  '   vec3 pos;\n' +      // (x,y,z,w); w==1.0 for local light at x,y,z position
  '   vec3 ambi;\n' +     // Ia ==  ambient light source strength (r,g,b)
  '   vec3 diff;\n' +     // Id ==  diffuse light source strength (r,g,b)
  '   vec3 spec;\n' +     // Is == specular light source strength (r,g,b)
  ' float isLit;\n' +
  '}; \n' +
  'struct MatlT {\n' +    // Describes one Phong material by its reflectances:
  '   vec3 emit;\n' +     // Ke: emissive -- surface 'glow' amount (r,g,b);
  '   vec3 ambi;\n' +     // Ka: ambient reflectance (r,g,b)
  '   vec3 diff;\n' +     // Kd: diffuse reflectance (r,g,b)
  '   vec3 spec;\n' +     // Ks: specular reflectance (r,g,b)
  '   int shiny;\n' +     // Kshiny: specular exponent (integer >= 1; typ. <200)
  '   };\n' +
  //-------------UNIFORMS: values set from JavaScript before a drawing command.
  'uniform LampT u_LampSet[4];\n' +   // Array of all light sources.
  'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' +  // Camera/eye location in world coords.
  'uniform float u_Gmode;\n' +
  
  //-------------VARYING:Vertex Shader values sent per-pix'''''''''''''''';el to Fragment shader: 
  'varying vec3 v_Normal;\n' +        // Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +      // pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd; \n' +           // Find diffuse reflectance K_d per pix
                            // Ambient? Emissive? Specular? almost
                            // NEVER change per-vertex: I use 'uniform' values

  'void main() { \n' +
  '  vec3 normal = normalize(v_Normal); \n' +
  ' vec3 ambient;\n'+
  ' vec3 diffuse;\n'+
  ' vec3 speculr;\n'+
  ' vec3 emissiv = u_MatlSet[0].emit;' +
//  '  vec3 normal = v_Normal; \n' +
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
  '  vec3 mSpeculr = u_LampSet[i].spec * u_MatlSet[0].spec * e64 * u_LampSet[i].isLit;\n' +
  '  ambient += mAmbient;\n'+
  '  diffuse += mDiffuse;\n'+
  '  speculr += mSpeculr;}\n'+
  '  gl_FragColor = vec4(emissiv + ambient + diffuse + speculr , 1.0);\n' +
  '  float testFloat = abs(-5.0);\n'+
  '}\n';
  this.shapes()
	this.vboVerts = 10;						// # of vertices held in 'vboContents' array;
	this.vboLoc;										// Vertex Buffer Object location# on the GPU
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
																	// bytes req'd for 1 array element;
																	// (why? used to compute stride and offset 
																	// in bytes for vertexAttribPointer() calls) 
	this.shaderLoc;									// Shader-program location # on the GPU, made 
																	// by compile/link of VERT_SRC and FRAG_SRC.
								//-------------------- Attribute locations in our shaders
	this.a_PositionLoc;							// GPU location for 'a_Position' attribute
  this.a_ColorLoc;								// GPU location for 'a_Color' attribute
  this.a_NormalLoc;
								//-------------------- Uniform locations &values in our shaders
//	this.u_ModelMatrix;
}
VBObox1.prototype.loadShaderUniforms = function(gl) {
  uLoc_eyePosWorld  = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  uLoc_Gmode  = gl.getUniformLocation(gl.program, 'u_Gmode');
  
  u_ModelMatrix  = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ProjMatrix  = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_ViewMatrix  = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_isTextureID = gl.getUniformLocation(gl.program, 'u_isTexture');
  u_isTexture2ID = gl.getUniformLocation(gl.program, 'u_isTexture2');
  if (!uLoc_eyePosWorld ||
    !u_ModelMatrix  || !u_ProjMatrix || !u_NormalMatrix) {
    console.log('Failed to get GPUs matrix storage locations');
      return;
    }
  //  ... for Phong light source:
  // NEW!  Note we're getting the location of a GLSL struct array member:
  this.loadLights(gl);
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

VBObox1.prototype.loadLights = function(gl) {
  lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos'); 
  lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
  lamp0.u_isLit = gl.getUniformLocation(gl.program,'u_LampSet[0].isLit');
  if( !lamp0.u_pos || !lamp0.u_ambi || !lamp0.u_diff || !lamp0.u_spec ) {
      console.log('Failed to get GPUs Lamp0 storage locations');
      return;
    }
  lamp1.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[1].pos'); 
  lamp1.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[1].ambi');
  lamp1.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[1].diff');
  lamp1.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[1].spec');
  lamp1.u_isLit = gl.getUniformLocation(gl.program,'u_LampSet[1].isLit');
  if( !lamp1.u_pos || !lamp1.u_ambi || !lamp1.u_diff || !lamp1.u_spec ) {
      console.log('Failed to get GPUs Lamp1 storage locations');
      return;
    }
}
VBObox1.prototype.init = function(myGL) {
// Compile,link,upload shaders-------------------------------------------------
	this.shaderLoc = createProgram(myGL, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
	myGL.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  this.loadShaderUniforms(myGL)
  this.indexBuffer = myGL.createBuffer();
  if (!this.indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
// Create VBO on GPU, fill it--------------------------------------------------
	this.vboLoc = myGL.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
  								this.vboLoc);				// the ID# the GPU uses for this buffer.
  myGL.bufferData(myGL.ARRAY_BUFFER, 		// GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	myGL.STATIC_DRAW);		// Usage hint.

// Make/Load Texture Maps & Samplers:------------------------------------------
		//  NONE.
		// see VBObox2.prototype.init = function(myGL) below for a working example)
			
// Find & Set All Attributes:--------------------------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PositionLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Position');
  if(this.a_PositionLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
  }
  // this.a_ColorLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Color');
  // if(this.a_ColorLoc < 0) {
  //   console.log(this.constructor.name + 
  //   						'.init() Failed to get GPU location of attribute a_Color');
  //   return -1;	// error exit.
  // }
  this.a_NormalLoc = gl.getAttribLocation(gl.program,'a_Normal');
  if(this.a_NormalLoc < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
		this.a_PositionLoc, //index == ID# for attribute var in your GLSL shaders;
		3,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		myGL.FLOAT,		// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		10*this.FSIZE,	// Stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
	// myGL.vertexAttribPointer(this.a_ColorLoc, 3, myGL.FLOAT, false,
	// 	10*this.FSIZE, 3*this.FSIZE);		// Stride, offset.

  myGL.vertexAttribPointer(this.a_NormalLoc, 4, myGL.FLOAT,false, this.FSIZE * 10, this.FSIZE * 6);

  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PositionLoc);
 // myGL.enableVertexAttribArray(this.a_ColorLoc);
  myGL.enableVertexAttribArray(this.a_NormalLoc);  
}

VBObox1.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Adjust values for our uniforms,
/*
  this.ModelMat.setRotate(g_currentAngle, 0, 0, 1);	// rotate drawing axes,
  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  myGL.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 								// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
*/
}

VBObox1.prototype.draw = function(myGL) {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.  	

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.

//------CAREFUL! RE-BIND YOUR VBO AND RE-ASSIGN SHADER ATTRIBUTES!-------------
//		Each call to useProgram() reconfigures the GPU's processors & data paths 
// for efficient SIMD execution of the newly-selected shader program. While the 
// 'old' shader program's attributes and uniforms remain at their same memory 
// locations, starting the new shader program invalidates the old data paths 
// that connected these attributes to the VBOs in memory that supplied their 
// values. When we call useProgram() to return to our 'old' shader program, we 
// must re-establish those data-paths between shader attributes and VBOs, even 
// if those attributes, VBOs, and locations have not changed!
//		Thus after each useProgram() call, we must:
// a)--call bindBuffer() again to re-bind each VBO that our shader will use, &
// b)--call vertexAttribPointer() again for each attribute in our new shader
//		program, to re-connect the data-path(s) from bound VBO(s) to attribute(s):
// c)--call enableVertexAttribArray() to enable use of those data paths.
//----------------------------------------------------
	// a) Re-set the GPU's currently 'bound' vbo buffer;
	myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for this buffer.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  // b) Re-connect data paths from VBO to each shader attribute:
  pushLightUniforms(myGL)
  pushMatlUniforms(myGL)

	myGL.vertexAttribPointer( this.a_PositionLoc,3,myGL.FLOAT,false, 10*this.FSIZE, 0);           
 // myGL.vertexAttribPointer(this.a_ColorLoc, 3, myGL.FLOAT, false, 10*this.FSIZE, 3*this.FSIZE);   // Stride, offset.
  myGL.vertexAttribPointer(this.a_NormalLoc, 4, myGL.FLOAT,false, this.FSIZE * 10, this.FSIZE * 6);

  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PositionLoc);
 // myGL.enableVertexAttribArray(this.a_ColorLoc);
  myGL.enableVertexAttribArray(this.a_NormalLoc); 

	//-----------------------------

  // gl.uniform1i(u_isTextureID, 0);           // DON'T use texture,
  // gl.uniform1i(u_isTexture2ID, 0);            // DON'T use texture,
  //gl.drawArrays(gl.LINE_STRIP, 0, nV);  // Draw a simple red Z shape, or
  var vpAspect = (myGL.drawingBufferWidth/2)/(myGL.drawingBufferHeight);   // this camera: width/height.

  projMatrix.setPerspective(90, 1,1, 100);
  eyePosWorld.set([camPosX,camPosY,camPosZ]);
  myGL.uniform3fv(uLoc_eyePosWorld, eyePosWorld);// use it to set our uniform
  viewMatrix.setLookAt(camPosX,camPosY,camPosZ,GoalX,GoalY,GoalZ,VecX,VecY,VecZ)

  myGL.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  if (currentScene == 1) {
    this.drawScene1(myGL)
  } else {
    this.drawScene2(myGL)
  }
  myGL.drawArrays(myGL.LINES, 0, gndVerts.length/10); 	
}

VBObox1.prototype.prepDraw = function(myGL) {
  normalMatrix.setInverseOf(modelMatrix)
  normalMatrix.transpose()
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
}
VBObox1.prototype.drawScene1 = function(myGL) {  
  matl0.setMatl(MATL_TURQUOISE); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(0.5,-0.75,1.5)
  modelMatrix.scale(0.5,0.5,0.5)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  matl0.setMatl(MATL_PEARL); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(0.0,0.0,4.0)
  modelMatrix.scale(1.0,1.0,1.0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  matl0.setMatl(MATL_RUBY); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(-0.5,-0.75,2.0)
  modelMatrix.scale(0.5,0.5,0.5)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  matl0.setMatl(MATL_TURQUOISE); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(2.5,0.0,4.0)
  modelMatrix.scale(1.0,1.0,1.0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  matl0.setMatl(MATL_EMERALD); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(-2.0,3.0,4.0)
  modelMatrix.scale(0.5,0.5,0.5)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  // //====
  matl0.setMatl(MATL_SILVER_SHINY); 
  pushMatlUniforms(myGL) 
  modelMatrix.setTranslate(-2.0,0.5,4.0)
  modelMatrix.scale(1.0,1.0,1.0)
  modelMatrix.rotate(90,1,0,0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,cylStart/10,cylVerts.length/10)

  matl0.setMatl(MATL_SILVER_DULL); 
  pushMatlUniforms(myGL) 
  modelMatrix.setTranslate(-1.5,0.0,2.5)
  modelMatrix.scale(0.5,0.5,0.5)
  modelMatrix.rotate(90,1,0,0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,cylStart/10,cylVerts.length/10)

  matl0.setMatl(MATL_EMERALD); 
  pushMatlUniforms(myGL) 
  modelMatrix.setTranslate(1.5,0.0,2.0)
  modelMatrix.scale(0.5,0.5,0.5)
  modelMatrix.rotate(90,1,0,0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,cylStart/10,cylVerts.length/10)

  matl0.setMatl(MATL_PEARL); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(3.0,0.5,3.0)
  modelMatrix.rotate(90,1,0,0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,cylStart/10,cylVerts.length/10)

  matl0.setMatl(MATL_RUBY); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(-1.5,3.0,5.0)
  modelMatrix.scale(30.0,30.0,30.0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLES,cubStart/10,myCube.vertArray.length/10)

  modelMatrix.setTranslate(0.0,6.0,3.0)
  modelMatrix.setRotate(-90.0, 1,0,0); // new one has "+z points upwards",
  modelMatrix.translate(0.0,0.0,-1.0)
  myCube.draw(myGL,modelMatrix, normalMatrix, u_ModelMatrix);
}

VBObox1.prototype.drawScene2  = function(myGL) {
  matl0.setMatl(MATL_RUBY); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(0,0.5,4.0)
  modelMatrix.scale(2.0,2.0,2.0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  matl0.setMatl(MATL_SILVER_DULL); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(-1.5,-0.5,2.0)
  modelMatrix.scale(0.5,0.5,0.5)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  matl0.setMatl(MATL_EMERALD); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(3,0.0,4.0)
  modelMatrix.scale(1.0,1.0,1.0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  matl0.setMatl(MATL_TURQUOISE); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(-3,0.5,8.0)
  modelMatrix.scale(2.0,2.0,2.0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphereStart/10,sphereVerts.length/10)

  // //====
  matl0.setMatl(MATL_SILVER_SHINY); 
  pushMatlUniforms(myGL) 
  modelMatrix.setTranslate(2,1.0,8.0)
  modelMatrix.scale(2.0,2.0,2.0)
  modelMatrix.rotate(90,1,0,0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,cylStart/10,cylVerts.length/10)

  matl0.setMatl(MATL_EMERALD); 
  pushMatlUniforms(myGL) 
  modelMatrix.setTranslate(-4.0,-0.5,5.5)
  modelMatrix.scale(0.5,0.5,0.5)
  modelMatrix.rotate(90,1,0,0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,cylStart/10,cylVerts.length/10)

  matl0.setMatl(MATL_RUBY); 
  pushMatlUniforms(myGL) 
  modelMatrix.setTranslate(-6.0,0.0,6.5)
  modelMatrix.scale(1.0,1.0,1.0)
  modelMatrix.rotate(90,1,0,0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,cylStart/10,cylVerts.length/10)

  matl0.setMatl(MATL_PEARL); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(6.0,0.5,8.5)
  modelMatrix.scale(1.5,1.5,1.5)
  modelMatrix.rotate(90,1,0,0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLE_STRIP,cylStart/10,cylVerts.length/10)

  matl0.setMatl(MATL_TURQUOISE); 
  pushMatlUniforms(myGL)
  modelMatrix.setTranslate(2.0,-1.0,1.5)
  modelMatrix.scale(10.0,10.0,10.0)
  this.prepDraw(myGL)
  myGL.drawArrays(myGL.TRIANGLES,cubStart/10,myCube.vertArray.length/10)

  modelMatrix.setTranslate(0.0,6.0,3.0)
  modelMatrix.setRotate(-90.0, 1,0,0); // new one has "+z points upwards",
  modelMatrix.translate(0.0,0.0,-1.0)
  myCube.draw(myGL,modelMatrix, normalMatrix, u_ModelMatrix);

}

VBObox1.prototype.shapes = function(gl) { // Create a sphere
//-------------------------------------------------------------------------------
  makeCube();
  makeGroundGrid();
  makeSphere(gl);
  makeCylinder(gl)

  this.mySiz = myCube.vertArray.length + gndVerts.length + sphereVerts.length + cylVerts.length;

  // How many vertices total?
  var nn = this.mySiz / floatsPerVertex;
  console.log('nn is', nn, 'mySiz is', this.mySiz, 'floatsPerVertex is', floatsPerVertex);

  // Copy all shapes into one big Float32 array:
  this.vboContents = new Float32Array(this.mySiz);
  // Copy them:  remember where to start for each shape:
  cubStart = 0;
  myCube.setStartP(0);            // we stored the cylinder first.
  for(i=0,j=0; j< myCube.vertArray.length; i++,j++) {
    //  console.log(myCube.vertArray[j]);
    this.vboContents[i] = myCube.vertArray[j];
  }
  gndStart = i;           // next we'll store the ground-plane;
  for(j=0; j< gndVerts.length; i++, j++) {
    this.vboContents[i] = gndVerts[j];
  }
  sphereStart = i;
  for(j=0; j< sphereVerts.length; i++,j++) {
    this.vboContents[i] = sphereVerts[j];
  }
  cylStart = i;
  for(j=0; j< cylVerts.length; i++,j++) {
    this.vboContents[i] = cylVerts[j];
  }
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 100;     // # of lines to draw in x,y to make the grid.
  var ycount = 100;   
  var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([1.0, 1.0, 0.3]);  // bright yellow
  var yColr = new Float32Array([0.5, 1.0, 0.5]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(10*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= 10) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = xColr[0];     // red
    gndVerts[j+4] = xColr[1];     // grn
    gndVerts[j+5] = xColr[2];     // blu
    gndVerts[j+6] = 0.0
    gndVerts[j+7] = 1.0
    gndVerts[j+8] = 0.0
    gndVerts[j+9] = 1.0
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= 10) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = yColr[0];     // red
    gndVerts[j+4] = yColr[1];     // grn
    gndVerts[j+5] = yColr[2];     // blu
    gndVerts[j+6] = 0.0
    gndVerts[j+7] = 1.0
    gndVerts[j+8] = 0.0
    gndVerts[j+9] = 1.0
  }
}

function makeCylinder() {
 var capVerts = 16; // # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.0;   // radius of bottom of cylinder (top always 1.0)
 cylVerts = new Float32Array(  ((capVerts*6) + 12) * floatsPerVertex);

  for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {  
    if(v%2==0)
    {       // put even# vertices at center of cylinder's top cap:
      cylVerts[j  ]=0.0;      // x,y,z,w == 0,0,1,1
      cylVerts[j+1]=0.0;  
      cylVerts[j+2]=1.0; 

      cylVerts[j+6]=0.0; 
      cylVerts[j+7]=0.0; 
      cylVerts[j+8]=1.0; 
      cylVerts[j+9]=1.0; 
    }
    else {  // put odd# vertices around the top cap's outer edge;
      cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);     // x
      cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);     // y
      cylVerts[j+2] = 1.0;  // z

      cylVerts[j+6]=0.0; 
      cylVerts[j+7]=0.0; 
      cylVerts[j+8]=1.0; 
      cylVerts[j+9]=1.0; 

    }
  }
  console.log(j)
  // Create the cylinder side walls, made of 2*capVerts vertices.
  // v counts vertices within the wall; j continues to count array elements
  for(v=0; v< (2*capVerts) + 2; v++, j+=floatsPerVertex) {
    if(v%2==0)  // position all even# vertices along top cap:
    {   
        cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);   // x
        cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);   // y
        cylVerts[j+2] = 1.0;  // z
 
        if (v == 0) {
          console.log("123")
          cylVerts[j+6]=0.0; 
          cylVerts[j+7]=0.0; 
          cylVerts[j+8]=1.0; 
          cylVerts[j+9]=1.0; 

          j+= 10
          cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);   // x
          cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);   // y
          cylVerts[j+2] = 1.0;  // z

          cylVerts[j+6]= Math.cos(Math.PI*(v)/capVerts); 
          cylVerts[j+7]= Math.sin(Math.PI*(v)/capVerts);
          cylVerts[j+8]= 0.0;
          cylVerts[j+9]=1.0 
          

        } else {
          cylVerts[j+6]= Math.cos(Math.PI*(v)/capVerts); 
          cylVerts[j+7]= Math.sin(Math.PI*(v)/capVerts);
          cylVerts[j+8]= 0.0;
          cylVerts[j+9]=1.0   
        } 
    }
    else    // position all odd# vertices along the bottom cap:
    {
        cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);   // x
        cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);   // y
        cylVerts[j+2] =-1.0;  // z
         if (v == 1) {
          cylVerts[j+6]= Math.cos(Math.PI*(v)/capVerts); 
          cylVerts[j+7]= Math.sin(Math.PI*(v)/capVerts); 
          cylVerts[j+8]= 0.0;
          cylVerts[j+9]=1.0   
          
        } else {
          cylVerts[j+6]= Math.cos(Math.PI*(v)/capVerts); 
          cylVerts[j+7]= Math.sin(Math.PI*(v)/capVerts); 
          cylVerts[j+8]= 0.0;
          cylVerts[j+9]=1.0   
        }
    }
  }

  for(v=0; v < (2*capVerts) + 4; v++, j+= floatsPerVertex) {
    if(v%2==0) {  // position even #'d vertices around bot cap's outer edge
      cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);   // x
      cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);   // y
      cylVerts[j+2] =-1.0;  // z
      // r,g,b = topColr[]
      if (v == 0) {
        console.log("hiohiohiohi")
        cylVerts[j+6]= 0.0; 
        cylVerts[j+7]= 1.0;
        cylVerts[j+8]= 0.0;
        cylVerts[j+9]=1.0   
        j+= 10
        cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);   // x
        cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);   // y
        cylVerts[j+2] =-1.0;  // z

        cylVerts[j+6]= 0.0; 
        cylVerts[j+7]= 0.0; 
        cylVerts[j+8]= -1.0;
        cylVerts[j+9]= 1.0
      } else {
        cylVerts[j+6]= 0.0; 
        cylVerts[j+7]= 0.0; 
        cylVerts[j+8]= -1.0;
        cylVerts[j+9]= 1.0
      }
    } else {        // position odd#'d vertices at center of the bottom cap:
      cylVerts[j  ] = 0.0;      // x,y,z,w == 0,0,-1,1
      cylVerts[j+1] = 0.0;  
      cylVerts[j+2] =-1.0; 

      cylVerts[j+6]= 0.0; 
      cylVerts[j+7]= 0.0; 
      cylVerts[j+8]= -1.0;
      cylVerts[j+9]=1.0
    }
  }


}

function makeSphere() {

  var slices = 13;    // # of slices of the sphere along the z axis. >=3 req'd
                      // (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts  = 27; // # of vertices around the top edge of the slice

  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphereVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * 10);

  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0; 
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;

  for(s=0; s<slices; s++) {
    if(s==0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;  
      cos0 = cos1;
      sin0 = sin1;
    }
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);
    // go around the entire slice, generating TRIANGLE_STRIP verts
    // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
    if(s==slices-1) isLast=1; // skip last vertex of last slice.
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=10) { 
      if(v%2==0)
      {       // put even# vertices at the the slice's top edge
              // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
              // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
        sphereVerts[j+0  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphereVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphereVerts[j+2] = cos0; 

        sphereVerts[j+6  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphereVerts[j+7] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphereVerts[j+8] = cos0; 
        sphereVerts[j+9] = 1.0
      }
      else {  // put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        sphereVerts[j+0] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphereVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphereVerts[j+2] = cos1;                                       // z  

        sphereVerts[j+6] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphereVerts[j+7] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphereVerts[j+8] = cos1; 
        sphereVerts[j+9] = 1.0
      } 
    }
  }
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
    gl.drawArrays(gl.TRIANGLES,this.startP/floatsPerVertex, this.vertArray.length/10);

    modelMatrix.scale(1/this.xScale, 1/this.yScale, 1/this.zScale);
    modelMatrix.rotate(-this.angle, this.rotX,this.rotY,this.rotZ);
    modelMatrix.translate(-this.xTrans,-this.yTrans, -this.zTrans); 
  };
};
/*
/
VBObox1.prototype.reload = function(myGL) {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// myGL.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
function VBObox2() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox2' object  that holds all data and 
// fcns needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'attribute vec4 a_Position;\n' +	
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  //
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +							// set default precision
  //
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  //
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

	this.vboContents = //--------------------- 
	new Float32Array ([						// Array of vertex attribute values we will
  															// transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    -0.95,  0.95,   	0.0, 1.0,				// upper left corner (with a small border)
    -0.95, -0.95,   	0.0, 0.0,				// lower left corner,
     0.95,  0.95,   	1.0, 1.0,				// upper right corner,
     0.95, -0.95,   	1.0, 0.0,				// lower left corner.
		 ]);
	this.vboVerts = 4;						// # of vertices held in 'vboContents' array;
	this.vboLoc;										// Vertex Buffer Object location# on the GPU
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
																	// bytes req'd for 1 array element;
																	// (why? used to compute stride and offset 
																	// in bytes for vertexAttribPointer() calls) 
	this.shaderLoc;									// Shader-program location # on the GPU, made 
																	// by compile/link of VERT_SRC and FRAG_SRC.
								//-------------------- Attribute locations in our shaders
	this.a_PositionLoc;							// GPU location for 'a_Position' attribute
	this.a_TexCoordLoc;							// GPU location for 'a_TexCoord' attribute

								//-------------------- Uniform locations &values in our shaders
//	this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
//	this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform var.
	
								//-------------------- Texture-maps & samplers in our shaders
	this.u_TextureLoc;							// GPU location for our texture-map image;
	this.u_SamplerLoc;							// GPU location for our texture-sampler var
}

VBObox2.prototype.init = function(myGL) {
//=============================================================================
// Create, compile, link this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of	all our shaders' attribute- and uniform-variables; 
// assign the correct portions of VBO contents as the data source for each 
// attribute, and transfer current values to the GPU for each uniform variable.
// (usually called only once, within main()) 

// Compile,link,upload shaders-------------------------------------------------
	this.shaderLoc = createProgram(myGL, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
	myGL.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  // Write the indices to the buffer object

// Create VBO on GPU, fill it--------------------------------------------------
	this.vboLoc = myGL.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
  								this.vboLoc);				// the ID# the GPU uses for this buffer.
  											
 // Transfer data from JavaScript Float32Array object to the just-bound VBO. 
 //  (Recall gl.bufferData() changes GPU's memory allocation: use 
 //		gl.bufferSubData() to modify buffer contents without changing its size)
 //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
 //	(see OpenGL ES specification for more info).  Your choices are:
 //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents rarely or never change.
 //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents may change often as our program runs.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded; for rapidly supplied & consumed VBOs.
  myGL.bufferData(myGL.ARRAY_BUFFER, 		// GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	myGL.STATIC_DRAW);		// Usage hint.

// Make/Load Texture Maps & Samplers:------------------------------------------
  this.u_TextureLoc = myGL.createTexture();   // Create a texture object 
  if (!this.u_TextureLoc) {
    console.log(this.constructor.name + 
    						'.init() Failed to create the texture object on the GPU');
    return -1;	// error exit.
  }
  // Get the storage location of texture sampler held in u_Sampler
  var u_SamplerLoc = myGL.getUniformLocation(this.shaderLoc, 'u_Sampler');
  if (!u_SamplerLoc) {
    console.log(this.constructor.name + 
    						'.init() Failed to find GPU location for texture u_Sampler');
    return -1;	// error exit.
  }
	// -------------------------Make a 2D colorful L-shaped test image:
	//   8-bit unsigned integers in a 256*256*3 array
	// to store r,g,b,r,g,b integers (8-bit)
	// WebGL texture map sizes MUST be a power-of-two (2,4,8,16,32,64,...4096)
	// with origin at lower-left corner
	var imgXmax = 256;
	var imgYmax = 256;
  this.myImg = new Uint8Array(imgXmax*imgYmax*3);	// r,g,b; r,g,b; r,g,b pixels
  for(var j=0; j< imgYmax; j++) {					// for the j-th row of pixels
  	for(var i=0; i< imgXmax; i++) {				// and the i-th pixel on that row,
	  	var idx = (j*imgXmax + i)*3;					// pixel (i,j) array index (red)
	  	if(i<imgXmax/4 || j<imgYmax/4) {
	  		this.myImg[idx   ] = i;								// 0 <= red <= 255
	  		this.myImg[idx +1] = j;								// 0 <= grn <= 255
	  	}
	  	this.myImg[idx +2] = 255 -i -j;								// 0 <= blu <= 255
  	}
  }	//-----------------------(end test-image making)
  // Enable texture unit0 for our use
  myGL.activeTexture(myGL.TEXTURE0);
  // Bind the texture object we made in initTextures() to the target
  myGL.bindTexture(myGL.TEXTURE_2D, this.u_TextureLoc);
  // allocate memory and load the texture image into the GPU
  myGL.texImage2D(myGL.TEXTURE_2D, //  'target'--the use of this texture
  						0, 									//  MIP-map level (default: 0)
  						myGL.RGB, 					// GPU's data format (RGB? RGBA? etc)
							imgXmax,						// image width in pixels,
							imgYmax,						// image height in pixels,
							0,									// byte offset to start of data
  						myGL.RGB, 					// source/input data format (RGB? RGBA?)
  						myGL.UNSIGNED_BYTE,	// data type for each color channel				
							this.myImg);				// data source.
  // Set the WebGL texture-filtering parameters
  myGL.texParameteri(myGL.TEXTURE_2D,		// texture-sampling params: 
  						myGL.TEXTURE_MIN_FILTER, 
  						myGL.LINEAR);
  // Set the texture unit 0 to be driven by our texture sampler:
  myGL.uniform1i(this.u_SamplerLoc, 0);
  
// Find & Set All Attributes:--------------------------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PositionLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Position');
  if(this.a_PositionLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
  }
 	this.a_TexCoordLoc = myGL.getAttribLocation(this.shaderLoc, 'a_TexCoord');
  if(this.a_TexCoordLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location of attribute a_TexCoord');
    return -1;	// error exit.
  }
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
		this.a_PositionLoc,//index == ID# for attribute var in your GLSL shaders;
		2,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		myGL.FLOAT,		// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		4*this.FSIZE,	// Stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  myGL.vertexAttribPointer(this.a_TexCoordLoc, 2, myGL.FLOAT, false, 
  							4*this.FSIZE, 2*this.FSIZE);
  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PositionLoc);
  myGL.enableVertexAttribArray(this.a_TexCoordLoc);

// Find All Uniforms:----------------------------------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
/*	this.u_ModelMatLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMat');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
*/
}
/*
VBObox2.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Adjust values for our uniforms,
  this.ModelMat.setRotate(g_currentAngle, 0, 0, 1);	// rotate drawing axes,
  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  myGL.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 								// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
}
*/
VBObox2.prototype.draw = function(myGL) {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.  	

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
//------CAREFUL! RE-BIND YOUR VBO AND RE-ASSIGN SHADER ATTRIBUTES!-------------
//		Each call to useProgram() reconfigures the GPU's processors & data paths 
// for efficient SIMD execution of the newly-selected shader program. While the 
// 'old' shader program's attributes and uniforms remain at their same memory 
// locations, starting the new shader program invalidates the old data paths 
// that connected these attributes to the VBOs in memory that supplied their 
// values. When we call useProgram() to return to our 'old' shader program, we 
// must re-establish those data-paths between shader attributes and VBOs, even 
// if those attributes, VBOs, and locations have not changed!
//		Thus after each useProgram() call, we must:
// a)--call bindBuffer() again to re-bind each VBO that our shader will use, &
// b)--call vertexAttribPointer() again for each attribute in our new shader
//		program, to re-connect the data-path(s) from bound VBO(s) to attribute(s):
// c)--call enableVertexAttribArray() to enable use of those data paths.
//----------------------------------------------------
	// a) Re-set the GPU's currently 'bound' vbo buffer;
	myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for this buffer.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  //b) Re-connect data paths from VBO to each shader attribute:
	myGL.vertexAttribPointer( this.a_PositionLoc, 2, myGL.FLOAT, false,
													4*this.FSIZE, 0);						// Stride, Offset
  myGL.vertexAttribPointer(this.a_TexCoordLoc, 2, myGL.FLOAT, false, 
  												4*this.FSIZE, 2*this.FSIZE);
  // c) Re-Enable use of the data path for each attribute:
  myGL.enableVertexAttribArray(this.a_PositionLoc);
  myGL.enableVertexAttribArray(this.a_TexCoordLoc);

  myGL.drawArrays(myGL.TRIANGLE_STRIP, 0, this.vboVerts); 
  																						// Draw the textured rectangle
}

VBObox2.prototype.initTextures = function(gl, n,myImg) {
//==============================================================================
 gl.useProgram(this.shaderLoc); // In the GPU, SELECT our already-compiled
                                    // -and-linked executable shader progr
  textureID = gl.createTexture();   // Create a texture object 
  if (!textureID) {
    console.log('Failed to create the texture object on the GPU');
    return false;
  }

  // Get the storage location of u_Sampler
  // var u_SamplerID = gl.getUniformLocation(gl.program, 'u_Sampler');
  // if (!u_SamplerID) {
  //   console.log('Failed to get the GPU storage location of u_Sampler');
  //   return false;
  // }
 
  // 2D color image:  8-bit unsigned integers in a 256*256*3 array
  // to store r,g,b,r,g,b integers (8-bit)
  // WebGL texture map sizes MUST be a power-of-two (2,4,8,16,32,64,...4096)
  // with origin at lower-left corner
  var imgXmax = 256;
  var imgYmax = 256;
  if (myImg == false) {
    myImg = new Uint8Array(imgXmax*imgYmax*3);  // r,g,b; r,g,b; r,g,b pixels
    for(var j=0; j< imgYmax; j++) {         // for the j-th row of pixels
      for(var i=0; i< imgXmax; i++) {       // and the i-th pixel on that row,
        var idx = (j*imgXmax + i)*3;          // pixel (i,j) array index (red)
        if(i<imgXmax/4 || j<imgYmax/4) {
          myImg[idx   ] = i;                // 0 <= red <= 255
          myImg[idx +1] = j;                // 0 <= grn <= 255
        }
        myImg[idx +2] = 255 -i -j;                // 0 <= blu <= 255
      }
    }
  }
  // Enable texture unit0 for our use
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object we made in initTextures() to the target
  gl.bindTexture(gl.TEXTURE_2D, textureID);
  // allocate memory and load the texture image into the GPU
  gl.texImage2D(gl.TEXTURE_2D,  //  'target'--the use of this texture
                0,              //  MIP-map level (default: 0)
                gl.RGB,         // GPU's data format (RGB? RGBA? etc)
                256,            // image width in pixels,
                256,            // image height in pixels,
                0,              // byte offset to start of data
                gl.RGB,         // source/input data format (RGB? RGBA?)
                gl.UNSIGNED_BYTE,   // data type for each color channel       
                myImg); // data source.
                
  // Set the WebGL texture-filtering parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture unit 0 to be driven by the sampler
  //gl.uniform1i(u_SamplerID, 0);
  return true;                  // done.
}


/*

VBObox2.prototype.reload = function(myGL) {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// myGL.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox2.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox2.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
//=============================================================================

