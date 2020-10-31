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
arrDiamondPos = [[6*64+32,5*64], [7*64+32,5*64], [8*64+32,5*64], [9*64+32,5*64], [10*64+32,5*64], [11*64+32, 5*64], [12*64+32,5*64],[13*64+32,5*64], [14*64+32,5*64]],
arrGrassPos = [[6*64+32,4*64], [7*64+32,4*64], [8*64+32,4*64], [9*64+32,4*64], [10*64+32,4*64], [11*64+32, 4*64], [12*64+32,4*64],[13*64+32,4*64], [14*64+32,4*64]],
arrRockPos = [[7*64+32,6*64],[8*64+32,6*64],[9*64+32,6*64],[10*64+32,6*64],[11*64+32,6*64],[12*64+32,6*64],[13*64+32,6*64]],
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
}).listen(port, '192.168.1.109'),


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
                
// if(listClient == null) => implement
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
        // console.log("four time1");
        var id = socket.userID;

        // TEST
        updateObject();

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
            
        
        // COLLISION WITH OBJECT (GRASS DIAMOND)
        if(arrAllObjects.length > 0){
            for(var i = 0; i < listClient.length; i++){
                listClient[0].posX = Number(listClient[0].posX);
                listClient[0].posY = Number(listClient[0].posY);
    
                var x = Math.floor(listClient[0].posX/64);
                var y = Math.floor(listClient[0].posY/64);
    
                
                if(arrAllObjects[x]){
                    if(arrAllObjects[x][y] == GRASS){
                        for(var i = 0; i < grasses.length; i++){
                            if(Math.floor(grasses[i].x/64) == x && Math.floor(grasses[i].y/64) == y){
                                arrAllObjects[x][y] = NONE;
                                grasses[i].y = -150;
                                listClient[0].emit('update_object_grass', i+"/"+ -150);
                            }
                        }
                    }
                    else if(arrAllObjects[x][y] == DIAMOND){
                        for(var i = 0; i < diamonds.length; i++){
                            if(Math.floor(diamonds[i].x/64) == x && Math.floor(diamonds[i].y/64) == y){
                                arrAllObjects[x][y] = NONE;
                                diamonds[i].y = -150;
                                listClient[0].emit('update_object_diamond', i+"/"+ -150);
                            }
                        }
                    }
                }
            }
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

var updateObject = function(){
    // UPDATE DIAMOND POS
    for(var i = 0; i < diamonds.length; i++){
        var diamonX = Math.floor(diamonds[i].x/64);
        var diamonY = Math.floor((diamonds[i].y-1)/64);
        //console.log("hahaha " + arrAllObjects[diamonX][diamonY]);
        if(arrAllObjects[diamonX][diamonY] == NONE){
            arrAllObjects[diamonX][Math.floor((diamonds[i].y)/64)] = NONE;
            diamonds[i].y-=0.7;
            listClient[0].emit('update_object_diamond', i+"/"+diamonds[i].y);
        }
        else{
            arrAllObjects[diamonX][diamonY+1] = DIAMOND;
        }
        
    }

    // // GRASS
    // for(var i = 0; i < grasses.length; i++){
    //     var grassX = Math.floor(grasses[i].x/64);
    //     var grassY = Math.floor((grasses[i].y-1)/64);

    //     if(arrAllObjects[grassX][grassY] == NONE){
    //         arrAllObjects[grassX][Math.floor((grasses[i].y)/64)] = NONE;
    //         grasses[i].y-=0.7;

    //         listClient[0].emit('update_object_grass', i+"/"+grasses[i].y);

    //     }
    //     else{
    //         arrAllObjects[grassX][grassY+1] = GRASS;
    //     }
    // }

    // ROCK
    for(var i = 0; i < rocks.length; i++){
        var rockX = Math.floor(rocks[i].x/64);
        var rockY = Math.floor((rocks[i].y-1)/64);

        if(arrAllObjects[rockX][rockY] == NONE){
            arrAllObjects[rockX][Math.floor((rocks[i].y)/64)] = NONE;
            rocks[i].y-=0.7;

            listClient[0].emit('update_object_rock', i+"/"+rocks[i].y);

        }
        else{
            arrAllObjects[rockX][rockY+1] = ROCK;
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

        arrAllObjects[Math.floor(x/64)][Math.floor(y/64)] = DIAMOND;
    }

    for(var i = 0; i < arrGrassPos.length; i++){
        var grass = {x:0, y:0, alive:true};

        var x = arrGrassPos[i][0];
        var y = arrGrassPos[i][1];

        grass.x = x;
        grass.y = y;
        grass.alive = true;

        grasses.push(grass);

        arrAllObjects[Math.floor(x/64)][Math.floor(y/64)] = GRASS;
    }

    for(var i = 0; i < arrRockPos.length; i++){
        var rock = {x:0, y:0, alive:true};

        var x = arrRockPos[i][0];
        var y = arrRockPos[i][1];

        rock.x = x;
        rock.y = y;
        rock.alive = true;

        rocks.push(rock);

        arrAllObjects[Math.floor(x/64)][Math.floor(y/64)] = ROCK;
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