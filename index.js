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

listClient = [],

server = http.createServer(function (req, res) {
    res.write('Hello World!!!!' + port); //write a response to the client
    res.end();
}).listen(port, '0.0.0.0'),



io = socketIO(server);
io.set('match origin protocol', true);
io.set('origins', '*:*');

var run = function(socket){

    console.log('connect....');

    // ASSIGNED AN ID FOR PLAYER
    socket.userID = userID;

    // PUSH NEW PLAYER TO LIST
    listClient.push(socket);

    // NOTIFICATION CONNECTED
    socket.emit('connected', 'welcome');

    // INIT ONE CHARACTOR IN DEVICE
    socket.on('init_request', function(position){
        console.log('Received: ' + position);
        // after receiving the initialization request, accept the initiation

        listClient[listClient.length-1].posX = position.split("/",2)[0];//console.log("here " + listClient[listClient.length-1].posX);
        listClient[listClient.length-1].posY = position.split("/",2)[1];//console.log("here " + listClient[listClient.length-1].posY);
        listClient[listClient.length-1].pos = position;
        
        for(var i = 0; i < listClient.length; i++){
            for(var j = 0; j < listClient.length; j++){
                // SEND POSITION INIT AND USERID TO PLAYER(DEVICE)
                listClient[i].emit('accept_init', {pos: listClient[j].pos, id: listClient[j].userID});
                console.log("four time");
            }
        }

        // ADD USERID FOR NEW PLAYER
        userID++;
    });

    // RECEIVE STATE AND ID OF PLAYER 
    socket.on('state', function(stateAndID){
        var state = stateAndID.split("/", 2)[0];
        // var id = stateAndID.split("/", 2)[1];
        
        console.log(state+"  " + socket.userID);

        var id = socket.userID;

        listClient[id].state = state;
        
        if(state == idle){
            ///////////////
        }
        else if(state == left){
            //console.log("left");
            listClient[id].posX = Number(listClient[id].posX);
            listClient[id].posX-=5;
        }
        else if(state == right){
            // console.log("right");
            listClient[id].posX = Number(listClient[id].posX);
            listClient[id].posX+=5;
        }
        else if(state == up){
            listClient[id].posY = Number(listClient[id].posY);
            listClient[id].posY+=5;
        }
        else if(state == down){
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
    })
}

io.sockets.on('connection', run);