var http = require('http'),
socketIO = require('socket.io'),

// port = 8888,
// ip = '127.0.0.1',
port = process.env.PORT || 8888,
// ip = '192.168.1.10',
userID = 0,

// STATE
idle = "idle",
left = "left",
right = "right",
up = "up",
down = "down",

// POSITION OF OBJECT (DIAMOND, GRASS, ROCK)
arrDiamondPos = [[6,5], [7,5], [8,5], [9,5], [10,5], [11, 5], [12,5],[13,5], [14,5]],
arrGrassPos = [[6,4], [7,4], [8,4], [9,4], [10,4], [11, 4], [12,4],[13,4], [14,4]],
arrRockPos = [[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6]],
arrPlayerPos = [[2, 3], [3, 3]],

// ARRAY OBJECT (DIAMOND, GRASS, ROCK, PLAYER)
diamonds = [],
grasses = [],
rocks = [],
listClient = [],


server = http.createServer(function (req, res) {
    res.write('Hello World!' + port); //write a response to the client
    res.end();
}).listen(port, '192.168.1.10'),


io = socketIO(server);
io.set('match origin protocol', true);
io.set('origins', '*:*');

var run = function(socket){
    // console.log("oke " + arrDiamondPos[0][0]);
    console.log('connect....');

    // INIT OBJECT (DIAMONDS, ROCK, GRASS)
    if(diamonds.length == 0){
        initDiamonds();
    }
    
    // ASSIGNED AN ID FOR PLAYER
    socket.userID = userID;

    // PUSH NEW PLAYER TO LIST
    listClient.push(socket);

    // NOTIFICATION CONNECTED
    socket.emit('connected', 'welcome');

    // INIT ONE CHARACTOR IN DEVICE
    socket.on('init_request', function(position){
        // console.log('Received: ' + position);
        // after receiving the initialization request, accept the initiation

        listClient[listClient.length-1].posX = position.split("/",2)[0];//console.log("here " + listClient[listClient.length-1].posX);
        listClient[listClient.length-1].posY = position.split("/",2)[1];//console.log("here " + listClient[listClient.length-1].posY);
        listClient[listClient.length-1].pos = position;
        
        // PLAYER
        for(var i = 0; i < listClient.length; i++){
            for(var j = 0; j < listClient.length; j++){
                // SEND POSITION INIT AND USERID TO PLAYER(DEVICE)
                listClient[i].emit('accept_init', {pos: listClient[j].pos, id: listClient[j].userID});
                
                // OBJECT (DIAMOND, GRASS, ROCK)
                listClient[i].emit('init_diamonds', diamonds);
                listClient[i].emit('init_grasses', grasses);
                listClient[i].emit('init_rocks', rocks);
                

                // console.log("four time");
            }
        }
        


        // ADD USERID FOR NEW PLAYER
        userID++;
    });

    // RECEIVE STATE AND ID OF PLAYER 
    socket.on('state', function(stateAndID){
        var state = stateAndID.split("/", 2)[0];
        // var id = stateAndID.split("/", 2)[1];
        
        // console.log("hahaha "+state+"  " + socket.userID);

        var id = socket.userID;

        listClient[id].state = state;
        
        if(state == idle){
            ///////////////
        }
        else if(state == left){
            // console.log("left");
            listClient[id].posX = Number(listClient[id].posX);
            listClient[id].posX-=5;
        }
        else if(state == right){
            // console.log("right");
            listClient[id].posX = Number(listClient[id].posX);
            listClient[id].posX+=5;
        }
        else if(state == up){
            // console.log("up");
            listClient[id].posY = Number(listClient[id].posY);
            listClient[id].posY+=5;
        }
        else if(state == down){
            // console.log("right");
            listClient[id].posY = Number(listClient[id].posY);
            listClient[id].posY-=5;
        }
            
        
        for(var i = 0; i < listClient.length; i++){
            // listClient[i].emit('stateFromServer', (state+"/"+listClient[i].userID));
            for(var j = 0; j < listClient.length; j++){
                listClient[i].emit('stateFromServer', (listClient[j].state+"/"+listClient[j].userID));
                listClient[i].emit('update_pos', {pos:(Math.floor(listClient[j].posX)+"/"+Math.floor(listClient[j].posY)), id:listClient[j].userID});
            }
        }
    });

    socket.on('camera_client', function(data){
        // console.log(socket.userID);
        listClient[socket.userID].emit('camera_server', socket.userID);
    });
}

var initDiamonds = function(){
    for(var i = 0; i < arrDiamondPos.length; i++){
        var diamond = {x:0, y:0, alive:true};
        diamond.x = arrDiamondPos[i][0];
        diamond.y = arrDiamondPos[i][1];
        diamond.alive = true;

        diamonds.push(diamond);
    }

    for(var i = 0; i < arrGrassPos.length; i++){
        var grass = {x:0, y:0, alive:true};
        grass.x = arrGrassPos[i][0];
        grass.y = arrGrassPos[i][1];
        grass.alive = true;

        grasses.push(grass);
    }

    for(var i = 0; i < arrRockPos.length; i++){
        var rock = {x:0, y:0, alive:true};
        rock.x = arrRockPos[i][0];
        rock.y = arrRockPos[i][1];
        rock.alive = true;

        rocks.push(rock);
    }

    // // log to test
    // for(var i = 0; i < diamonds.length; i++){
    //     console.log("afaf " + diamonds[i].x);
    // }
}

var setCamera = function(x, y, winSizeWidth, winSizeHeight, mapWidth, mapHeight){
    x = Math.max(x, winSizeWidth/2);
    y = Math.max(y, winSizeHeight/2);

    x = Math.min(x, mapWidth - winSizeWidth/2);
    y = Math.min(y, mapHeight- winSizeHeight/2);

    var actualPositionX = x;
    var actualPositionY = y;
    
    var centerOfViewX = winSizeWidth/2;
    var centerOfViewY = winSizeHeight/2;

    var viewPointX = centerOfViewX-actualPositionX;
    var viewPointY = centerOfViewY-actialPositionY;
}

io.sockets.on('connection', run);