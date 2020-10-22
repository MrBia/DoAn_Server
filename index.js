var http = require('http'),
socketIO = require('socket.io'),

// port = 8888,
// ip = '127.0.0.1',
port = process.env.PORT || 8888,
// ip = '192.168.1.10',
userID = 0,

// MAP
xMap = 48,
yMap = 23,

// STATE
idle = "idle",
left = "left",
right = "right",
up = "up",
down = "down",

// VALUE OBJECT
NONE = 0,
DIAMOND = 1,
ROCK = 2,
GRASS = 3,
COLLISION_MAP = 4,

// POSITION OF OBJECT (DIAMOND, GRASS, ROCK)
arrDiamondPos = [[6,5], [7,5], [8,5], [9,5], [10,5], [11, 5], [12,5],[13,5], [14,5]],
arrGrassPos = [[6,4], [7,4], [8,4], [9,4], [10,4], [11, 4], [12,4],[13,4], [14,4]],
arrRockPos = [[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6]],
arrPlayerPos = [[2, 3], [3, 3]],

// POSITION OF MAP COLLISTION    x 0->47
arrMapCollistion = [
[2,3,4], [2,4], [2,4], [2,4], [2,4], [2,4,5], [1,6], [1,7], [1,7], [1,7],
[1,7], [1,7], [1,7], [1,7], [1,6], [1,4,5], [1,4], [1,5], [1,5], [1,5],
[1,5], [1,5], [1,4], [1, 4,5,6,7], [1,8,10,12,17,18], [1,9,10,12,16,19], [1,10,12,15,20], [2,3,4,5,10,12,14,21], [6,10,12,13,21], [6,10,18,21],
[6,10, 12, 13, 21], [6,10,12,14,21], [6,10,12,13,14,15,20], [7,10,15,16,19], [7,10,12,13,15,17,18], [6,12,13,15], [7,9,10,12,13,15], [7,9,10,12,13,15,16,20], [8,10,12,17,18,19,21], [10,12,21],
[10, 12,15,21], [9,12,21], [9,12,17,21], [9,14,21], [9,21], [10,12,18,19,20], [11,14,15,16,17],[12,13]],

// ARRAY OBJECT (DIAMOND, GRASS, ROCK, PLAYER)
diamonds = [],
grasses = [],
rocks = [],
listClient = [],

// ARRAY ALL OBJECT
arrAllObjects = new Array(xMap),

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

    if(listClient.length == 0){                 // one time init
        for(var i = 0; i < xMap; i++){
            arrAllObjects[i] = new Array(yMap);
        }
    }
    

    //  INIT ARRAY OBJECT FOR SAVE POSITION   
    if(listClient.length == 0){                 // one time init
        for(var i = 0; i < xMap; i++){
            for(var j = 0; j < yMap; j++){
                arrAllObjects[i][j] = NONE;
            }
        }
    }


    // INIT OBJECT (DIAMONDS, ROCK, GRASS)      
    if(listClient.length == 0){                 // one time init
        initObjects();
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
        test();
        var id = socket.userID;

        listClient[id].state = state;
        
        if(state == idle){
            ///////////////
            var x = Math.floor(listClient[id].posX/64);
            var y = Math.floor(listClient[id].posY/64);

            listClient[id].posX = x*64+32;
            listClient[id].posY = y*64;
        }
        else if(state == left){
            // console.log("left");
            listClient[id].posX = Number(listClient[id].posX);

            var x = Math.floor(listClient[id].posX/64);
            var y = Math.floor(listClient[id].posY/64);
            // console.log("left " + x +" " + y);
            var check = 1;


            // HANDLE COLLISION
            if(arrAllObjects[x-1][y] == COLLISION_MAP || arrAllObjects[x-1][y] == ROCK){
                check = 0;
            }

            if(check == 1) listClient[id].posX-=5;
            else listClient[id].posX = x*64 + 32;
        }
        else if(state == right){
            // console.log("right");
            listClient[id].posX = Number(listClient[id].posX);

            var x = Math.floor(listClient[id].posX/64);
            var y = Math.floor(listClient[id].posY/64);
            // console.log("right " + x +" " + y);
            var check = 1;

            // HANDLE COLLISION
            if(arrAllObjects[x+1][y] == COLLISION_MAP || arrAllObjects[x+1][y] == ROCK){
                check = 0;
            }

            if(check == 1) listClient[id].posX+=5;
            else listClient[id].posX = x*64 + 32;
        }
        else if(state == up){
            // console.log("up");
            listClient[id].posY = Number(listClient[id].posY);

            var x = Math.floor(listClient[id].posX/64);
            var y = Math.floor(listClient[id].posY/64);
            // console.log("up " + x +" " + y);
            var check = 1;

            
            // HANDLE COLLISION
            if(arrAllObjects[x][y+1] == COLLISION_MAP || arrAllObjects[x][y+1] == ROCK){
                check = 0;
            }


            if(check == 1) listClient[id].posY+=5;
        }
        else if(state == down){
            // console.log("right");
            listClient[id].posY = Number(listClient[id].posY);

            var x = Math.floor(listClient[id].posX/64);
            var y = Math.floor(listClient[id].posY/64);
            // console.log("down " + x +" " + y);
            var check = 1;

            
            // HANDLE COLLISION
            if(arrAllObjects[x][y-1] == COLLISION_MAP || arrAllObjects[x][y-1] == ROCK){
                check = 0;
            }

            if(check == 1) listClient[id].posY-=5;
            else listClient[id].posY = y*64 +1;
        }
            

        for(var i = 0; i < listClient.length; i++){
            // listClient[i].emit('stateFromServer', (state+"/"+listClient[i].userID));
            for(var j = 0; j < listClient.length; j++){
                listClient[i].emit('stateFromServer', (listClient[j].state+"/"+listClient[j].userID));
                listClient[i].emit('update_pos', {pos:(Math.floor(listClient[j].posX)+"/"+Math.floor(listClient[j].posY)), id:listClient[j].userID});
            }
        }

    });

    socket.on('update_object_client', function(update){
        // UPDATE DIAMOND POS
        for(var i = 0; i < diamonds.length; i++){
            var diamonX = Math.floor(diamonds[i].x/64);
            var diamonY = Math.floor(diamonds[i].y/64);

            if(arrAllObjects[diamonX][diamonY-1] == NONE){
                diamonds[i].y+=1;
            }
            
        }

        for(var i = 0; i < grasses.length; i++){
            var grassX = Math.floor(grasses[i].x/64);
            var grassY = Math.floor(grasses[i].y/64);

            if(arrAllObjects[grassX][grassY-1] == NONE){
                grasses[i].y+=1;
            }
            
        }
    });

    socket.on('camera_client', function(data){
        // console.log(socket.userID);
        listClient[socket.userID].emit('camera_server', socket.userID);
    });
}

var test = function(){
    // for(var i = 0; i < diamonds.length; i++){
    //     var diamonX = Math.floor(diamonds[i].x/64);
    //     var diamonY = Math.floor(diamonds[i].y/64);

    //     if(arrAllObjects[diamonX][diamonY-1] == NONE){
    //         diamonds[i].y+=1;
    //     }
        
    // }

    for(var i = 0; i < grasses.length; i++){
        var grassX = Math.floor(grasses[i].x);
        var grassY = Math.floor(grasses[i].y);

        if(arrAllObjects[grassX][grassY-1] == NONE){
            grasses[i].y-=1;
        }
        
    }
}

var initObjects = function(){
    for(var i = 0; i < arrDiamondPos.length; i++){
        var diamond = {x:0, y:0, alive:true};

        var x = arrDiamondPos[i][0];
        var y = arrDiamondPos[i][1];

        diamond.x = x;
        diamond.y = y;
        diamond.alive = true;

        diamonds.push(diamond);

        arrAllObjects[x][y] = DIAMOND;
    }

    for(var i = 0; i < arrGrassPos.length; i++){
        var grass = {x:0, y:0, alive:true};

        var x = arrGrassPos[i][0];
        var y = arrGrassPos[i][1];

        grass.x = x;
        grass.y = y;
        grass.alive = true;

        grasses.push(grass);

        arrAllObjects[x][y] = GRASS;
    }

    for(var i = 0; i < arrRockPos.length; i++){
        var rock = {x:0, y:0, alive:true};

        var x = arrRockPos[i][0];
        var y = arrRockPos[i][1];

        rock.x = x;
        rock.y = y;
        rock.alive = true;

        rocks.push(rock);

        arrAllObjects[x][y] = ROCK;
    }

    
    // C0LLISION MAP
    for(var i = 0; i < arrMapCollistion.length; i++){
        for(var j = 0; j < arrMapCollistion[i].length; j++){
            var index = arrMapCollistion[i][j];
            arrAllObjects[i][index] = COLLISION_MAP;
        }
    }


    // // log to test
    // for(var i = 0; i < diamonds.length; i++){
    //     console.log("afaf " + diamonds[i].x);
    // }
}

io.sockets.on('connection', run);