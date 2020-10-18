$(document).ready(function(){
    var socket = io.connect('http://127.0.0.1:8888');
    socket.on('greeting', function(data){
        //alert(data);
    })

    socket.on('connect', function(){
        socket.emit('adduser', "hao");
    });

    socket.on('server', function(listClient){
        alert(listClient);
    });

    // $('#go').click(function(){
    //     socket.emit('adduser','hao');
    // })

    $('#go').click(function(){
        socket.emit('user-join',$('#name').val());
    })
})