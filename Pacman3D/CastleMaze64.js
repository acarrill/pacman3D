var gl;

var VSHADER_SOURCE =
    'attribute highp vec3 a_VertexPosition;\n' +
    'attribute highp vec2 a_TextureCoord;\n' +
    'attribute highp vec3 a_VertexNormal;\n' +

    'uniform highp mat4 u_NormalMatrix;\n' +
    'uniform highp mat4 u_MvpMatrix;\n' +
    'uniform highp mat4 u_ModelMatrix;\n' +
    'uniform highp mat4 u_ViewMatrix;\n' +

    'varying highp vec2 v_TextureCoord;\n' +
    'varying highp vec4 v_vertexPosition;\n' +
    'varying highp vec4 v_TransformedNormal;\n' +

    'varying highp vec4 v_viewSpace;\n' +


    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * vec4(a_VertexPosition, 1.0);\n' +

    '  v_TextureCoord = a_TextureCoord;\n' +
    '  v_vertexPosition = u_ModelMatrix * vec4(a_VertexPosition, 1.0);\n' +
    '  v_TransformedNormal = u_NormalMatrix * vec4(a_VertexNormal, 1.0);\n' +
      //Matriz que guarda posición, s y t respecto a la cámara
  	'  v_viewSpace = u_ViewMatrix * u_ModelMatrix * vec4(a_VertexPosition, 1.0);\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'varying highp vec2 v_TextureCoord;\n' +
    'varying highp vec4 v_vertexPosition;\n' +
    'varying highp vec4 v_TransformedNormal;\n' +
    'varying highp vec4 v_viewSpace;\n' +

    'const highp float fogStart = 0.0;\n' +
    'const highp float fogEnd = 5.0;\n' +
    'const highp float fogStaart = -0.5;\n' +
    'const highp float fogEend = 0.5;\n' +

    'uniform sampler2D u_wall;\n' +
    'uniform highp float u_FogDensity;\n' +
    'uniform highp vec4 u_CameraDirection;\n' +
    'uniform highp vec4 u_CameraPosition;\n' +
    'uniform sampler2D u_imageBlason;\n' +
    //Uniforms de luz especular y niebla, a inicializar segun nivel (startGame)
    'uniform highp vec3 u_FogColor;\n' +
    'uniform highp vec3 u_PointLightingSpecularColor;\n' +
    'uniform highp float u_MaterialShiness;\n' +

    'void main() {\n' +
    '  highp vec3 ambientLight = vec3(0.25, 0.25, 0.25);\n' +
	'  highp vec3 directionalLightColor = vec3(0.0, 0.0, 0.0);\n' +

    '  highp vec4 pointLightPosition = u_CameraDirection;\n' +

    '  highp float dist = length(v_viewSpace);\n' +
	//'  highp float fogFactoor = 1.0 /exp(dist * u_FogDensity);\n' + //Exponential
    '	 highp float fogFloor = ((v_vertexPosition.z/v_vertexPosition.w)-fogStaart) / (fogEend - fogStaart);\n' +
	'	 highp float fogFactor = max(u_FogDensity*((fogEnd  - dist) / (fogEnd - fogStart)), fogFloor);\n' +

	'  fogFactor = clamp( fogFactor, 0.0, 1.0);\n' +

	'  highp vec3 normal = normalize(v_TransformedNormal.xyz);\n'+
    '  highp vec3 eyeDirection = normalize((u_CameraPosition - v_vertexPosition).xyz);\n' +

	'  highp vec3 lightDirection = normalize((pointLightPosition - v_vertexPosition).xyz);\n' +
    '  highp vec3 reflectionDirection = reflect(-lightDirection, normal);\n'+

    '  highp float specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), u_MaterialShiness);\n'+
	'  highp float directionalW = max(dot(v_TransformedNormal.xyz, lightDirection), 0.0);\n' +

    '  highp vec3 v_Lighting = ambientLight + (u_PointLightingSpecularColor * specularLightWeighting) + (directionalLightColor * directionalW);\n' +

    '  highp vec4 blason0 = texture2D(u_imageBlason, vec2(v_TextureCoord.s, v_TextureCoord.t));\n' +
    '  highp vec4 texelColor = texture2D(u_wall, vec2(v_TextureCoord.s, v_TextureCoord.t));\n' +
    '  highp vec4 Color = blason0*texelColor;\n' +

    '  gl_FragColor = vec4(u_FogColor*(1.0-fogFactor), 1.0) + fogFactor*vec4(Color.rgb * v_Lighting.rgb, Color.a);\n' +
    '}\n';

/*
Constructor control de camara.
El código de este constructor es aprovechado para crear otros objetos dinámicos
ya que solo hace falta modificar su función move.
Todo esta inicializado para ser usado para la cámara
*/
function ViewControl(numLevel) {
      //Interfaz de parámetros y método que usaremos para crear y controlar la camara/vista
      this.yPos = 0.5;
      this.xPos = 2.0;
      this.zPos = 0.0;
      this.vectorY = 0.061;
      this.vectorX = 0.998;
      this.vectorZ = 0;
      this.speed = 0.045;
      this.left = 0;
      this.right = 0;
      //parámetros control de cámara por mouse
      this.middleXPos = 400; //middle inicializado al centro del canvas
      this.middleYPos = 300;
      this.xMousePos = 0;
      this.yMousePos = 0;
      this.xOffset = 0;
      this.yOffset = 0;
      this.sensitivity = 0.000075;
      this.pitch = 0;
      this.maxPitch = Math.PI/2-0.2; //Algo menos que 90 grados
      this.yaw = 0;
      this.mouseCameraOn = false;
      //Otros
      this.joggingAngle = 0.0; //uso: sensación de que la cámara camina
      this.numCamera = 0;
      this.numLevel = numLevel; //uso: lleva cuenta del nivel actual en que se encuentra el personaje
      this.move = function(speed) {
          this.xPos += speed * this.vectorX;
          this.yPos += speed * this.vectorY;
      }
      this.rote = function() {
          this.vectorX = Math.cos(this.pitch) * Math.cos(this.yaw);
          this.vectorY = Math.cos(this.pitch) * Math.sin(-this.yaw); //seno es impar
          this.vectorZ = Math.sin(this.pitch)
      }
}

//Constructor de sonidos
function Sound(src) {
      this.Sound = document.createElement("audio");
      this.Sound.src = src;
      this.Sound.setAttribute("preload", "auto");
      this.Sound.setAttribute("controls", "none");
      this.Sound.setAttribute("loop", "loop");
      this.Sound.style.display = "none";
      document.body.appendChild(this.Sound);
      this.play = function(){
          this.Sound.play();
      }
      this.stop = function(){
          this.Sound.pause();
      }
}

//Contructor que contiene matrices modelos y contruye los buffer de los objetos del mapa
function ModelConstructor(vertices, indexs, textureCoor, vertexNormals) {
    this.mMatrix = new Matrix4();
    this.numElements = 36;  //INICIALIZAR
    this.texture00 = gl.createTexture();
    this.texture01 = gl.createTexture();
    this.image00 = new Image();
    this.image00.src = "resources/textura-muro.jpg"; //INICIALIZAR
    this.image01 = new Image();
    this.image01.src = "resources/blason1.jpg"; //INICIALIZAR
    this.vertices = vertices;
    this.VerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    this.vertexIndices = indexs;
    this.VerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.VerticesIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndices, gl.STATIC_DRAW);

    this.textureCoordinates = textureCoor;
    this.VerticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VerticesTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.textureCoordinates, gl.STATIC_DRAW);

    this.vertexNormals = vertexNormals;
    this.VerticesNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VerticesNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexNormals, gl.STATIC_DRAW);

    this.referBuffer = function(){

        var vertexPositionAttribute = gl.getAttribLocation(gl.program, "a_VertexPosition");
        gl.enableVertexAttribArray(vertexPositionAttribute);

        var textureCoordAttribute = gl.getAttribLocation(gl.program, "a_TextureCoord");
        gl.enableVertexAttribArray(textureCoordAttribute);

        var vertexNormalAttribute = gl.getAttribLocation(gl.program, "a_VertexNormal");
        gl.enableVertexAttribArray(vertexNormalAttribute);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.VerticesBuffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        // Set the texture coordinates attribute for the vertices.

        gl.bindBuffer(gl.ARRAY_BUFFER, this.VerticesTextureCoordBuffer);
        gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.VerticesNormalBuffer);
        gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture00);
        gl.uniform1i(gl.getUniformLocation(gl.program, "u_wall"), 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture01);

        gl.uniform1i(gl.getUniformLocation(gl.program, "u_imageBlason"), 1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.VerticesIndexBuffer);
    }
    var that = this;
    this.initTextures = function() {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 255, 255]));
        that.image00.onload = function() { handleTextureLoaded(that.image00, that.texture00); }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 255, 255]));
        that.image01.onload = function() { handleTextureLoaded(that.image01, that.texture01); }
    }
}

/*
Esta función solo se utilizará una vez, creando la cámara del nivel 1,
la función main se encargará de crear las cámaras de niveles posteriores.
*/
function createGame(){
    window.confirm("Debes recolectar las 2 picas escondidas en el laberinto, luego dirigete a la esquina superior derecha para ir al siguiente nivel");
    var camera = new ViewControl(1);
    startGame(camera);
}

function startGame(camera) {
    //Tomamos canvas de webgl e inicializamos gl
    var canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    //Obtenemos localización para control de ambientación por nivel
    var u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
    if (!u_FogColor) {
        console.log('Failed to get the storage location of u_FogColor');
        return;
    }
    var u_PointLightingSpecularColor = gl.getUniformLocation(gl.program, 'u_PointLightingSpecularColor');
    if (!u_PointLightingSpecularColor) {
        console.log('Failed to get the storage location of u_PointLightingSpecularColor');
        return;
    }
    var u_MaterialShiness = gl.getUniformLocation(gl.program, 'u_MaterialShiness');
    if (!u_MaterialShiness) {
        console.log('Failed to get the storage location of u_MaterialShiness');
        return;
    }
    if (camera.numLevel == 1) {
        //Creamos nuevo objeto para camara y soundtrack
        var soundtrack = new Sound("Bolero-tratado.mp3");
        gl.uniform1f(u_MaterialShiness, 0.1);
        gl.uniform3f(u_FogColor, 0.3, 0.3, 0.3);
        gl.uniform3f(u_PointLightingSpecularColor, 0.3, 0.3, 0.3);
    }else if (camera.numLevel == 2) {
        gl.uniform1f(u_MaterialShiness, 0.0);
        gl.uniform3f(u_FogColor, 0.3, 0.1, 0.3);
        gl.uniform3f(u_PointLightingSpecularColor, 0.3, 0.1, 0.3);
        var soundtrack = new Sound("prelude.mp3");
    }else if (camera.numLevel == 3) {
        gl.uniform1f(u_MaterialShiness, 0.1);
        gl.uniform3f(u_FogColor, 0.0, 0.3, 0.3);
        gl.uniform3f(u_PointLightingSpecularColor, 0.0, 0.3, 0.3);
        var soundtrack = new Sound("bosque.mp3");
    }

    main(gl, camera, soundtrack, canvas);
}

function main(gl, camera, soundtrack, canvas) {
    //Inicializamos canvas
	var canvas2d = document.getElementById('2d');
	var ctx_2d = canvas2d.getContext("2d");
    //Array que contiene balas para su posterior control
    var bullets_array = [];
    //Inicializamos maze
    var my_maze_array = [];
    var my_maze_size;
	var my_maze = new Maze(MAZESZ);
    my_maze.randPrim(new Pos(0, 0));
	//my_maze.determ(new Pos(0, 0));
    my_maze_array = my_maze.rooms;
    my_maze_size = my_maze.sz;

    do{ //Posición de inicio aleatoria de cámara
        camera.xPos = (Math.floor(Math.random() * (my_maze_size-5)) + 5);
        camera.yPos = (Math.floor(Math.random() * (my_maze_size-5)) + 5);
    }while (!my_maze_array[camera.xPos][camera.yPos]);

    //Creamos objeto para la pirámide y lo inicializamos
    var pyramidControl = new ViewControl()
    pyramidControl.move = function() {
        pyramidControl.xPos += pyramidControl.speed * pyramidControl.vectorX;
        pyramidControl.yPos += pyramidControl.speed * pyramidControl.vectorY;
        pyramidControl.joggingAngle += 0.05;
        pyramidControl.zPos += 0.003*Math.sin(pyramidControl.joggingAngle * Math.PI/2);
    }
    do{ //Posición de inicio aleatoria
        pyramidControl.xPos = (Math.floor(Math.random() * (my_maze_size-5)) + 5);
        pyramidControl.yPos = (Math.floor(Math.random() * (my_maze_size-5)) + 5);
    }while (!my_maze_array[pyramidControl.xPos][pyramidControl.yPos]);

    //actualización de posición en el mapa
	my_maze.pos.x = camera.xPos;
	my_maze.pos.y = camera.yPos;
	my_maze.draw(ctx_2d, 0, 0, 5, 0);

    //Creamos variables para establecer la posición de las picas en el mapa
    var picaXPos1;
    var picaYPos1;
    var picaXPos2;
    var picaYPos2;
    var pica1Caught = false;
    var pica2Caught = false;
    do{ //Posición de inicio aleatoria
        picaXPos1 = (Math.floor(Math.random() * (my_maze_size-5)) + 5);
        picaYPos1 = (Math.floor(Math.random() * (my_maze_size-5)) + 5);
    }while (!my_maze_array[picaXPos1][picaYPos1]);
    do{ //Posición de inicio aleatoria
        picaXPos2 = (Math.floor(Math.random() * (my_maze_size-5)) + 5);
        picaYPos2 = (Math.floor(Math.random() * (my_maze_size-5)) + 5);
    }while (!my_maze_array[picaXPos2][picaYPos2]);

    //Funciónes donde se realiza todo el control de la cámara, mouse y audio
    //Control de choques
    function notValidPosition(x, y) {
        var notValid = false;
        notValid = !(my_maze_array[Math.floor(x)][Math.floor(y)]);
        return notValid;
    }
    //Main control
    (function startCamera() {
        soundtrack.play();
        var canvasPos = canvas.getBoundingClientRect();
        camera.middleXPos += canvasPos.left;
        camera.keyHandlerMove = function(event) {
            switch(event.key) {
                case "w":
                    //console.log("actual:",camera.xPos, camera.yPos)
                    camera.move(camera.speed);
                    var notValidW = notValidPosition(camera.xPos,camera.yPos);
                    if (notValidW) {
                        var speed = -0.15;
                        camera.move(speed);
                    }
                    camera.joggingAngle += 0.5;
                    break;
                case "s":
                    camera.move(-camera.speed);
                    var notValidS = notValidPosition(camera.xPos,camera.yPos);
                    if (notValidS) {
                        var speed = 0.05;
                        camera.move(camera.speed);
                    }
                    camera.joggingAngle += 0.5;
                    break;
                default:
                    console.log("Key not handled");
              }
          }
          //Escuchamos en el canvas para obtener las coordenadas del raton
          camera.keyHandlerMouse = function(evt){
              camera.xMousePos = Math.round(evt.clientX);
              camera.yMousePos = Math.round(evt.clientY);
          }
          canvas.addEventListener("mousemove", camera.keyHandlerMouse, false);
          //Control de activación cámara por click
          canvas.onmousedown = function(){camera.mouseCameraOn = true};
          canvas.onmouseup = function(){camera.mouseCameraOn = false};
          //Utilizamos el input del mouse para cambiar ángulo de cámara
          function mouseViewControl() {
              if (camera.mouseCameraOn){
                  camera.xOffset = camera.xMousePos - camera.middleXPos;
                  camera.yOffset = camera.middleYPos - camera.yMousePos; // al reves para coordenadas de abajo arriba
                  camera.xOffset *= camera.sensitivity;
                  camera.yOffset *= camera.sensitivity;
                  camera.pitch += camera.yOffset;
                  camera.yaw += camera.xOffset;
                  //Limitación ángulo vertical
                  if (camera.pitch > camera.maxPitch){
                      camera.pitch = camera.maxPitch;
                  }else if (camera.pitch < -camera.maxPitch) {
                      camera.pitch = -camera.maxPitch;
                  }
                  camera.rote()
              }

          }
          camera.mouseInterval = setInterval(mouseViewControl, 15);
          document.addEventListener("keydown", camera.keyHandlerMove, false);
      })()


    if (gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things


        //INICIALIZACION DE CONSTRUCTOR MODELO PARA UN CUBO
        var cubeVertices = new Float32Array([
            -1.0, -1.0,  1.0,   1.0, -1.0,  1.0,   1.0,  1.0,  1.0,  -1.0,  1.0,  1.0,   // Top face
            -1.0, -1.0, -1.0,  -1.0,  1.0, -1.0,   1.0,  1.0, -1.0,   1.0, -1.0, -1.0,   // Bottom face
            -1.0,  1.0, -1.0,  -1.0,  1.0,  1.0,   1.0,  1.0,  1.0,   1.0,  1.0, -1.0,   // Left face
            -1.0, -1.0, -1.0,   1.0, -1.0, -1.0,   1.0, -1.0,  1.0,  -1.0, -1.0,  1.0,   // Right face
             1.0, -1.0, -1.0,   1.0,  1.0, -1.0,   1.0,  1.0,  1.0,   1.0, -1.0,  1.0,   // Back face
            -1.0, -1.0, -1.0,  -1.0, -1.0,  1.0,  -1.0,  1.0,  1.0,  -1.0,  1.0, -1.0    // Front face
        ]);
        var cubeVertexIndices =  new Uint16Array([
            2,  3,  0,      1,  2,  0,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23    // left
        ]);
        var cubeTextureCoordinates = new Float32Array([
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Top
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Bottom
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Left
            1.0,  1.0,     0.0,  1.0,     0.0,  0.0,     1.0,  0.0,  // Right
            1.0,  1.0,     0.0,  1.0,     0.0,  0.0,     1.0,  0.0,  // Back
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0  // Front
        ]);
        var cubeVertexNormals = new Float32Array([
            0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,   // Top face
            0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,   // Bottom face
            0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,   // Left face
            0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,   // Right face
            1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,   // Back face
            -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0   // Front face
        ]);
        if (camera.numLevel < 3) {
            var wall = new ModelConstructor(cubeVertices, cubeVertexIndices, cubeTextureCoordinates, cubeVertexNormals);
            wall.numElements = 36;
            wall.image00.src = "resources/muro-castillo.jpeg";
            wall.image01.src = "resources/blason1.jpeg";
            wall.initTextures();
        }

        var bullet = new ModelConstructor(cubeVertices, cubeVertexIndices, cubeTextureCoordinates, cubeVertexNormals);
        bullet.numElements = 36;
        bullet.image00.src = "resources/fuego.jpg";
        bullet.image01.src = "resources/ojo2.jpg";
        bullet.initTextures();

        var pica = new ModelConstructor(cubeVertices, cubeVertexIndices, cubeTextureCoordinates, cubeVertexNormals);
        pica.numElements = 36;
        pica.image00.src = "resources/pica.jpg";
        pica.image01.src = "resources/vida2.jpg";
        pica.initTextures();

        if (camera.numLevel == 3) {
            //INICIALIZACION DE CONSTRUCTOR MODELO de pinos del bosque final
            var threeVertices = new Float32Array([
                -0.5, -0.5,  1.0,   0.5, -0.5,  1.0,   0.5,  0.5,  1.0,  -0.5,  0.5,  1.0,   // Top face
                -0.5, -0.5, -1.0,  -0.5,  0.5, -1.0,   0.5,  0.5, -1.0,   0.5, -0.5, -1.0,   // Bottom face
                -0.5,  0.5, -1.0,  -0.5,  0.5,  1.0,   0.5,  0.5,  1.0,   0.5,  0.5, -1.0,   // Left face
                -0.5, -0.5, -1.0,   0.5, -0.5, -1.0,   0.5, -0.5,  1.0,  -0.5, -0.5,  1.0,   // Right face
                 0.5, -0.5, -1.0,   0.5,  0.5, -1.0,   0.5,  0.5,  1.0,   0.5, -0.5,  1.0,   // Back face
                -0.5, -0.5, -1.0,  -0.5, -0.5,  1.0,  -0.5,  0.5,  1.0,  -0.5,  0.5, -1.0,    // Front face

                0.0, 0.0, 4.0,  -1.0, 1.0, 1.0, -1.0, -1.0, 1.0,     // v0-v1-v2-v3 front
                0.0, 0.0, 4.0,   1.0, 1.0, 1.0,  1.0, -1.0, 1.0,     // v4-v7-v6-v5 back
                0.0, 0.0, 4.0,  -1.0, 1.0, 1.0,  1.0,  1.0, 1.0,     // v4-v7-v6-v5 right
                0.0, 0.0, 4.0,   1.0,-1.0, 1.0, -1.0, -1.0, 1.0,    // v4-v7-v6-v5 left
                -1.0, -1.0, 1.0, -1.0,  1.0, 1.0,   1.0,  1.0, 1.0,   1.0, -1.0, 1.0   // Bottom face

            ]);
            var threeVertexIndices =  new Uint16Array([
                2,  3,  0,      1,  2,  0,    // front
                4,  5,  6,      4,  6,  7,    // back
                8,  9,  10,     8,  10, 11,   // top
                12, 13, 14,     12, 14, 15,   // bottom
                16, 17, 18,     16, 18, 19,   // right
                20, 21, 22,     20, 22, 23,    // left

                24, 25, 26,
                27, 28, 29,
                30, 31, 32,
                33, 34, 35,
                36, 37, 38,     36, 38, 39  // bottom
            ]);
            var threeTextureCoordinates = new Float32Array([
                1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Top
                1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Bottom
                1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Left
                1.0,  1.0,     0.0,  1.0,     0.0,  0.0,     1.0,  0.0,  // Right
                1.0,  1.0,     0.0,  1.0,     0.0,  0.0,     1.0,  0.0,  // Back
                1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Front
                1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Left
                1.0,  1.0,     0.0,  1.0,     0.0,  0.0,     1.0,  0.0,  // Right
                1.0,  1.0,     0.0,  1.0,     0.0,  0.0,     1.0,  0.0,  // Back
                1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0,  // Front
                1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  1.0  // Bottom
            ]);
            var threeVertexNormals = new Float32Array([
                0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,   // Top face
                0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,   // Bottom face
                0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,   // Left face
                0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,   // Right face
                1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,   // Back face
                -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0,   // Front face

                0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,   // Left face
                0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,   // Right face
                1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,   // Back face
                -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0,   // Front face
                0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0   // Bottom face
            ]);
            var wall = new ModelConstructor(threeVertices, threeVertexIndices, threeTextureCoordinates, threeVertexNormals);
            wall.numElements = 54;
            wall.image00.src = "resources/troncos.jpg";
            wall.image01.src = "resources/musgo.jpg";
            wall.initTextures();
        }

        //INICIALIZACIÓN PIRAMIDE ENEMIGA
        var pyramidVertices = new Float32Array([
            0.0, 0.0, 1.0,  -1.0, 1.0, -1.0, -1.0, -1.0, -1.0,     // v0-v1-v2-v3 front
            0.0, 0.0, 1.0,   1.0, 1.0, -1.0,  1.0, -1.0, -1.0,     // v4-v7-v6-v5 back
            0.0, 0.0, 1.0,  -1.0, 1.0, -1.0,  1.0,  1.0, -1.0,     // v4-v7-v6-v5 right
            0.0, 0.0, 1.0,   1.0,-1.0, -1.0, -1.0, -1.0, -1.0,    // v4-v7-v6-v5 left
           -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,   1.0,  1.0, -1.0,   1.0, -1.0, -1.0   // Bottom face
        ]);
        var pyramidVertexIndices =  new Uint16Array([
            0, 1, 2,
            3, 4, 5,
            6, 7, 8,
            9, 10, 11,
            12, 13, 14,  12, 14, 15   // front
        ]);
        var pyramidTextureCoordinates = new Float32Array([
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  0.5,  // Left
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  0.5,  // Right
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  0.5,  // Back
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  0.5,  // Front
            1.0,  1.0,     1.0,  0.0,     0.0,  0.0,     0.0,  0.5  // Bottom
        ]);
        var pyramidVertexNormals = new Float32Array([
            0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,   // Left face
            0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,   // Right face
            1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,   // Back face
           -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0,   // Front face
            0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0   // Bottom face
        ]);
        var pyramid = new ModelConstructor(pyramidVertices, pyramidVertexIndices, pyramidTextureCoordinates, pyramidVertexNormals);
        pyramid.numElements = 18;
        pyramid.image00.src = "resources/ojo1.jpg";
        pyramid.image01.src = "resources/fuego.jpg";
        pyramid.initTextures();

        //PACMAN
        var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = 2;

    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        var phi = longNumber * 2 * Math.PI / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        var u = 1 - (longNumber / longitudeBands);
        var v = 1 - (latNumber / latitudeBands);

        normalData.push(x);
        normalData.push(y);
        normalData.push(z);
        textureCoordData.push(u);
        textureCoordData.push(v);
        vertexPositionData.push(radius * x);
        vertexPositionData.push(radius * y);
        vertexPositionData.push(radius * z);
      }
    }

    var indexData = [];
     for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
       for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
         var first = (latNumber * (longitudeBands + 1)) + longNumber;
         var second = first + longitudeBands + 1;
         indexData.push(first);
         indexData.push(second);
         indexData.push(first + 1);

         indexData.push(second);
         indexData.push(second + 1);
         indexData.push(first + 1);
       }
     }
     console.log(textureCoordData)

     var pacman = new ModelConstructor(vertexPositionData, indexData, textureCoordData, normalData);
     pacman.numElements = indexData.length;
     pacman.image00.src = "resources/ojo1.jpg";
     pacman.image01.src = "resources/fuego.jpg";
     pacman.initTextures();


        //INICIALIZACION DE CONSTRUCTOR MODELO PARA EL SUELO
        var floorVertices = new Float32Array([
            0.0, 0.0, -0.5,  0.0, my_maze_size, -0.5,  my_maze_size, 0.0, -0.5,  my_maze_size, my_maze_size, -0.5
        ]);
        var floorVertexIndices = new Uint16Array([
            1,  0,  2,      1,  2,  3
        ]);
        var floorTextureCoordinates = new Float32Array([
            0.0,  0.0, my_maze_size,  0.0,     my_maze_size,  my_maze_size,     0.0,  my_maze_size
        ]);
        var floorVertexNormals = new Float32Array([
            0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0
        ]);

        var floor = new ModelConstructor(floorVertices, floorVertexIndices, floorTextureCoordinates, floorVertexNormals);
        floor.numElements = 6;
        if (camera.numLevel < 3) {
            floor.image00.src = "resources/muro-castillo2.jpeg";
        }else if (camera.numLevel == 3) {
            floor.image00.src = "resources/hojas-suelo.jpg";
        }
        floor.image01.src = "resources/marbletexture.png";
        floor.initTextures();

        req = requestAnimationFrame(drawScene, my_maze);
    }

    //Inicializamos niebla a valor de la cámara en primera persona

    var u_FogDensity = gl.getUniformLocation(gl.program, 'u_FogDensity');
    if (!u_FogDensity) {
        console.log('Failed to get the storage location of u_FogDensity');
        return;
    }
    gl.uniform1f(u_FogDensity, 0.3);


    function drawScene() {

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
        if (!u_MvpMatrix) {
            console.log('Failed to get the storage location of u_MvpMatrix');
            return;
        }

        var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
        if (!u_ModelMatrix) {
            console.log('Failed to get the storage location of u_ModelMatrix');
            return;
        }

        var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
        if (!u_ViewMatrix) {
            console.log('Failed to get the storage location of u_ViewMatrix');
            return;
        }

        var u_CameraDirection = gl.getUniformLocation(gl.program, 'u_CameraDirection');
        if (!u_CameraDirection) {
            console.log('Failed to get the storage location of u_CameraDirection');
            return;
        }

        var u_CameraPosition = gl.getUniformLocation(gl.program, 'u_CameraPosition');
        if (!u_CameraPosition) {
            console.log('Failed to get the storage location of u_CameraPosition');
            return;
        }

        var mMatrix   = new Matrix4();
        var vMatrix   = new Matrix4();
        var pMatrix   = new Matrix4();
        var mvpMatrix = new Matrix4();

        pMatrix.setPerspective(60, 1, 0.0001, 100);
        mMatrix = floor.mMatrix;

        //Control de disparo
        //Control de tipo de cámara por teclado
        document.onkeydown = function(event) {
            if (event.key == 'e') {
                camera.numCamera = 0;
            }else if (event.key == 'r') {
                camera.numCamera = 1;
            }else if (event.key == 't') {
                camera.numCamera = 2;
            }else if (event.key == 'q') {
                var index = bullets_array.length;
                //Creación bala y control de hora para eliminarla posteriormente
                bullets_array[index] = new ViewControl();
                var hour = new Date();
                var lastBullet = hour.getMinutes()* 60 + hour.getSeconds();
                bullets_array[index].removeTime = lastBullet + 1;
                //Inicialización de la bala
                bullets_array[index].move = function(){
                    this.xPos += this.speed * this.vectorX;
                    this.yPos += this.speed * this.vectorY;
                    this.zPos += this.speed * this.vectorZ;
                }
                bullets_array[index].xPos = camera.xPos;
                bullets_array[index].yPos = camera.yPos;
                bullets_array[index].vectorX = camera.vectorX;
                bullets_array[index].vectorY = camera.vectorY;
                bullets_array[index].vectorZ = camera.vectorZ;
            }
        }
        //Cambio a cámara seleccionada por teclado
        switch (camera.numCamera) {
            case 0:     //Vista primera persona
                vMatrix.lookAt(camera.xPos, camera.yPos, -0.2 + 0.01*Math.sin(camera.joggingAngle*Math.PI/2),
                                camera.xPos + camera.vectorX, camera.yPos + camera.vectorY, 0.002 + camera.vectorZ,
                                0, 0, 1);
                gl.uniform4f(u_CameraPosition, camera.xPos, camera.yPos, 0.002, 1)
                gl.uniform4f(u_CameraDirection, camera.xPos + camera.vectorX, camera.yPos + camera.vectorY, 0.002 + camera.vectorZ, 1);
                gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
                gl.uniform1f(u_FogDensity, 1.5);
                break;
            case 1:     //Vista desde arriba
                vMatrix.lookAt(camera.xPos, camera.yPos, 20,
                                0, 0, -10,
                                0, 0, 1);
                gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
                gl.uniform1f(u_FogDensity, 1.0);
            case 2:     //Vista "panorámica"
                vMatrix.lookAt(camera.xPos - 2, camera.yPos - 2, 3.5,
                                camera.xPos + camera.vectorX, camera.yPos + camera.vectorY, 0.002 + camera.vectorZ,
                                0, 0, 1);
                gl.uniform4f(u_CameraPosition, camera.xPos, camera.yPos, 0.002, 1);
                gl.uniform4f(u_CameraDirection, camera.xPos + camera.vectorX, camera.yPos + camera.vectorY, 0.002 + camera.vectorZ, 1);
                gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
                gl.uniform1f(u_FogDensity, 10.0);
        }

        //Dirección luz
        var normalMatrix = new Matrix4();
        normalMatrix.set(mMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        var nUniform = gl.getUniformLocation(gl.program, "u_NormalMatrix");
        gl.uniformMatrix4fv(nUniform, false, normalMatrix.elements);

        //Actualizamos información suelo en buffers y dibujamos
        floor.referBuffer();
        gl.uniformMatrix4fv(u_ModelMatrix, false, mMatrix.elements);
        gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
        mvpMatrix.set(pMatrix).multiply(vMatrix).multiply(mMatrix);
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.drawElements(gl.TRIANGLES, floor.numElements, gl.UNSIGNED_SHORT, 0);

        //Actualizamos información paredes en buffers y dibujamos
        mMatrix = wall.mMatrix;
        wall.referBuffer();
        for (var i=0; i <my_maze_size; i++){
            for (var j=0; j <my_maze_size; j++){
                var x = i;
                var y = j;
                mMatrix.setTranslate(x+0.5 , y+0.5, 0).scale(0.5,0.5,0.5)
                if (camera.numLevel == 3) {
                    mMatrix.setTranslate(x+0.5 , y+0.5, 0).scale(1.0,1.0,2.0)
                }
                gl.uniformMatrix4fv(u_ModelMatrix, false, mMatrix.elements);
                gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
                mvpMatrix.set(pMatrix).multiply(vMatrix).multiply(mMatrix);
                gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
                if (my_maze_array[i][j] == false){
                    gl.drawElements(gl.TRIANGLES, wall.numElements, gl.UNSIGNED_SHORT, 0);
                }
            }
        }

        //Dibujamos pacman
        mMatrix = pacman.mMatrix;
        pacman.referBuffer();
        mMatrix.setTranslate(camera.xPos, camera.yPos, -0.3).scale(1.0,1.0,1.0)
        gl.uniformMatrix4fv(u_ModelMatrix, false, mMatrix.elements);
        gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
        mvpMatrix.set(pMatrix).multiply(vMatrix).multiply(mMatrix);
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.drawElements(gl.TRIANGLES, pacman.numElements, gl.UNSIGNED_SHORT, 0);
        //Dibujamos las picas si no han sido recolectadas
        mMatrix = pica.mMatrix;
        pica.referBuffer();
        if (!pica1Caught){
            mMatrix.setTranslate(picaXPos1 + 0.5, picaYPos1 + 0.5, -0.3).scale(0.2,0.2,0.2)
            gl.uniformMatrix4fv(u_ModelMatrix, false, mMatrix.elements);
            gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
            mvpMatrix.set(pMatrix).multiply(vMatrix).multiply(mMatrix);
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
            gl.drawElements(gl.TRIANGLES, pica.numElements, gl.UNSIGNED_SHORT, 0);
        }
        if (!pica2Caught){
            mMatrix.setTranslate(picaXPos2 + 0.5, picaYPos2 + 0.5, -0.3).scale(0.2,0.2,0.2)
            gl.uniformMatrix4fv(u_ModelMatrix, false, mMatrix.elements);
            gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
            mvpMatrix.set(pMatrix).multiply(vMatrix).multiply(mMatrix);
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
            gl.drawElements(gl.TRIANGLES, pica.numElements, gl.UNSIGNED_SHORT, 0);
        }

        //Creamos piramide enemiga
        mMatrix = pyramid.mMatrix;
        pyramid.referBuffer();
        pyramidControl.speed = 0.045;
        pyramidControl.move();
        pyramidControl.vectorX = -(pyramidControl.xPos - camera.xPos);
        pyramidControl.vectorY = -(pyramidControl.yPos - camera.yPos);
        var notValid = notValidPosition(pyramidControl.xPos,pyramidControl.yPos);
        if (notValid) {
            pyramidControl.speed = -0.06;
            pyramidControl.move();
            pyramidControl.yaw += 0.1;
            pyramidControl.rote();
        }
        mMatrix.setTranslate(pyramidControl.xPos, pyramidControl.yPos, pyramidControl.zPos).scale(0.5,0.5,0.5)
        gl.uniformMatrix4fv(u_ModelMatrix, false, mMatrix.elements);
        gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
        mvpMatrix.set(pMatrix).multiply(vMatrix).multiply(mMatrix);
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.drawElements(gl.TRIANGLES, pyramid.numElements, gl.UNSIGNED_SHORT, 0);

        //Dibujamos balas si necesario
        mMatrix = bullet.mMatrix;
        bullet.referBuffer();
        var gameClock = new Date(); // Reloj del juego
        var now = gameClock.getMinutes()* 60 + gameClock.getSeconds();
        for (var i=0; i<bullets_array.length; i++){
            bullets_array[i].speed = 0.1;
            bullets_array[i].move();

            mMatrix.setTranslate(bullets_array[i].xPos, bullets_array[i].yPos, bullets_array[i].zPos - 0.2).scale(0.02,0.02,0.02)
            gl.uniformMatrix4fv(u_ModelMatrix, false, mMatrix.elements);
            gl.uniformMatrix4fv(u_ViewMatrix, false, vMatrix.elements);
            mvpMatrix.set(pMatrix).multiply(vMatrix).multiply(mMatrix);
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
            gl.drawElements(gl.TRIANGLES, bullet.numElements, gl.UNSIGNED_SHORT, 0);
            //Si exipra se borra para no perfer eficiencia en renderizado
            if (bullets_array[i].removeTime < now) {
                bullets_array.splice(i, 1);
            }
        }

        //Comprobamos si se ha recolectado alguna pica
        if (picaXPos1 == Math.floor(camera.xPos) && picaYPos1 == Math.floor(camera.yPos)){
            pica1Caught = true;
        }else if (picaXPos2 == Math.floor(camera.xPos) && picaYPos2 == Math.floor(camera.yPos)) {
            pica2Caught = true;
        }
        //Actualizamos posición en el mapa
        my_maze.pos.x = Math.floor(camera.xPos);
    	my_maze.pos.y = Math.floor(camera.yPos);
    	my_maze.draw(ctx_2d, 0, 0, 5, 0);
        req = requestAnimationFrame(drawScene);
        //Final del mapa
        if (Math.floor(camera.xPos) == 0 && Math.floor(camera.yPos) == 0 ){
            soundtrack.stop();
            camera.numLevel += 1;
            ctx_2d.clearRect(0,0,canvas2d.width,canvas2d.height);
            //eliminamos todos los intervalos y "listeners"
            cancelAnimationFrame(req);
            document.removeEventListener("keydown", camera.keyHandlerMove, false);
            canvas.removeEventListener("mousemove", camera.keyHandlerMouse, false);
            clearInterval(camera.mouseInterval);
            //preparamos cámara del siguiente nivel
            var cameraNextLvl = new ViewControl(camera.numLevel);
            if (camera.numLevel == 4){
                if (window.confirm("Felicidades, has completado el laberinto. ¿Deseas jugar de nuevo?") == true) {
                    cameraNextLvl.numLevel = 1;
                }
            }
            startGame(cameraNextLvl);
        }
    }

}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);//Acercarse
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
