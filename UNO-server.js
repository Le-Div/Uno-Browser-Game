const port = 1234;
const fs = require('fs');
const http = require('http');  
const url = require('url');

// HTTP server
const server = http.createServer(function (req, res) {  

    var path = url.parse(req.url).pathname;
    var query = url.parse(req.url).query;
    
    switch(path){
            case'/':
                var stream = fs.createReadStream('home.html');
            break;
            case'/image':
                var stream = fs.createReadStream(query);
            break;
            case'/css':
                var stream = fs.createReadStream(query);
            case'/java':
                var stream = fs.createReadStream(query);
    }

    if(stream!=undefined){
    stream.pipe(res)}
})  
server.listen(port) 

//Socket server

var SOCKET_LIST = {};
var READY_LIST = [];
var PLAYED_CARDS = [];
var CurrentPlayer =[];
var dirFlag = 1;
var remColFlag = 0;
var all_Cards = [];
var game_running = false;

// This is the WebSocket
const io = require('socket.io')(server,{});

io.sockets.on('connection',function(socket){

    var newSocketName = null;
    
    if(game_running==true){
        socket.disconnect();
    }
    
    socket.on('username',(data)=>{
        
        if(data.name==null){
           socket.disconnect();
        }
        
        else{
            newSocketName=data.name;
            console.log(data.name+' connected');
            SOCKET_LIST[data.name] = socket;
            io.emit('newPlayer',{player:Object.keys(SOCKET_LIST)});
            io.emit('ready',{player:READY_LIST});
        }
        
    })
    
    socket.emit('welcome',{msg:'Welcome to the server'});
    
    socket.on('disconnect',()=>{console.log(newSocketName+' disconnected');
                                delete SOCKET_LIST[newSocketName];
                                READY_LIST = delEntry(READY_LIST,newSocketName);
                                io.emit('PlayerDC',{player:newSocketName});
                               });
    
    socket.on('ready',(data)=>{
                               READY_LIST.push(data.player);
                               console.log(data.player+' is ready');
                               io.emit('ready',{player:READY_LIST})
                               });
    
    socket.on('playCard',(data)=>{  check_Card(data.Card);
                                    var Player = '';
                                    if(dirFlag==(-1)){
                                        Player = get_revers_Turn();
                                    }
                                    else{
                                        Player = get_Turn_Player();
                                    }
                                  
                                    PLAYED_CARDS.push(data.Card);
                                  
                                    io.emit('playCard',{Card:data.Card,name:data.name,TurnPlayer:Player,remFlag:remColFlag});
                                 });
    
    socket.on('draw',(data)=>{give_next_card(socket)
                              io.emit('addHidden',{name:data.name});
                            });
    socket.on('pass',(data)=>{var Player ='';
                                           
                                if(dirFlag==(-1)){
                                    Player = get_revers_Turn();
                                }
                                else{
                                    Player = get_Turn_Player();
                                }
                                io.emit('pass',{TurnPlayer:Player});
                             });
    
    socket.on('colorwish',(data)=>{console.log(data.col);io.emit('colorset',{col:data.col})})
    
    socket.on('uno',(data)=>{give_next_card(socket);give_next_card(socket)});
    
    socket.on('win',(data)=>{io.emit('win',{name:data.name});
                             reset_game();
                            });
    
})


setInterval(function(){
    
    const flag1 = READY_LIST.length===Object.keys(SOCKET_LIST).length;
    const flag2 = READY_LIST.length>=2;
    
    if(flag1 && flag2){
        console.log('ALL READY')
        READY_LIST = []
        game_running = true;
        all_Cards = shuffle(get_Deck());
        
        var Playerlist = Object.keys(SOCKET_LIST);
        var StartCard = all_Cards.shift();
        var StartPlayer = init_start_player();
        console.log(StartPlayer);
        for(i in Playerlist){
            
            var package = init_give_Cards();
            var socket = SOCKET_LIST[Playerlist[i]];
            socket.emit('gameStart',{msg:'Start',Cards:package,StartCard:StartCard,StartPlayer:StartPlayer});
        } 
    }
    
    if(all_Cards.length==0&&game_running==true){
        all_Cards = PLAYED_CARDS;
        PLAYED_CARDS = [];
    }
    
    if(Object.keys(SOCKET_LIST).length==0){
        reset_game();
    }

},100)


function reset_game(){
    READY_LIST = [];
    PLAYED_CARDS = [];
    CurrentPlayer =[];
    dirFlag = 1;
    remColFlag = 0;
    all_Cards = [];
    game_running = false;
    
}


function delEntry(remList,element){
    var index = remList.indexOf(element);
    if(index>=0){
    remList.splice(index,1);
    }
    return remList;
}

function give_next_card(socket){
    var nextCard = all_Cards.shift();
    socket.emit('draw',{Card:nextCard});
}


function check_Card(Card){
    
    var details = Card.split('_');
    
    remColFlag = 0;
    
    if(details[1]=='add2'){
        add_to_player(2);
    }
    else if(details[1]=='skip'){
        
        if(dirFlag==1){
        get_Turn_Player();
        }
        else{
        get_revers_Turn();
        }
    }
    else if(details[1]=='switch'){
        dirFlag *= -1;
    }
    else if(details[1]=='colorwish.png'){
        colorwish();
    }
    else if (details[1]=='add'){
        add_to_player(4);
        colorwish();
    }
}

function add_to_player(cnt){
    var nextPlayer = CurrentPlayer[1];
    var socket = SOCKET_LIST[nextPlayer];
    for(var i=0;i<cnt;i++){
    give_next_card(socket);
    io.emit('addHidden',{name:nextPlayer});
    }
}

function colorwish(){
    var curPlay = CurrentPlayer[0];
    var socket = SOCKET_LIST[curPlay];
    socket.emit('colorwish');
    io.emit('hold');
    remColFlag = 1;
}


function get_Turn_Player(){
    
    var PList = Object.keys(SOCKET_LIST);
    var numP = PList.length;
    var nextPlayers = [];
    turn++;
    
    if(turn>=numP){
    turn =0;
    }
   
    nextPlayers.push(PList[turn]);
    
    var turn2 = turn;
    turn2++
    
    if(turn2>=numP){
    turn2 =0;
    }
    
    nextPlayers.push(PList[turn2]);
    console.log(nextPlayers);
    CurrentPlayer = Object.assign([],nextPlayers);
    return nextPlayers;
}

function get_revers_Turn(){
    
    var PList = Object.keys(SOCKET_LIST);
    var numP = PList.length;
    var nextPlayers = [];
    turn--;
    
    if(turn<0){
    turn = numP-1;
    }
    
    nextPlayers.push(PList[turn]);
    
    var turn2 = turn;
    turn2--;
    
    if(turn2<0){
    turn2 = numP-1;
    }
    
    nextPlayers.push(PList[turn2]);
    console.log(nextPlayers);
    CurrentPlayer = Object.assign([],nextPlayers);
    return nextPlayers;
}


function init_give_Cards(){
    
    var send_stack = [];
    for(var i=0;i<7;i++){
        send_stack.push(all_Cards.shift());
    }
    return send_stack;
}

var turn = 0;

function init_start_player(){
    
    var PList = Object.keys(SOCKET_LIST);
    var numP = PList.length;
    var rand = getRandomInt(0,numP-1);
    turn = rand;
    var Players = [];
    Players.push(PList[rand]);
    if(rand++>=numP){
        Players.push(PList[0]);
    }
    else{
        Players.push(PList[rand++]);
    }
    CurrentPlayer = Object.assign([],Players);
    return Players;   
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


//function which shuffles the card array.
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


//Function contains all available cards
function get_Deck() {
    
    const Cards = ['Card_add2_r.png', 'Card_2_b.png', 'Card_6_g.png', 'Card_4_g.png', 'Card_9_r.png', 'Card_switch_b.png', 'Card_add2_g.png', 'Card_4_b.png', 'Card_8_y.png', 'Card_8_r.png', 'Card_switch_g.png', 'Card_add2_b.png', 'Card_2_g.png', 'Card_switch_r.png', 'Card_6_b.png', 'Card_1_r.png', 'Card_5_g.png', 'Card_1_b.png', 'Card_skip_r.png', 'Card_3_b.png', 'Card_skip_g.png', 'Card_3_r.png', 'Card_7_g.png',  'Card_3_g.png', 'Card_skip_b.png', 'Card_2_r.png', 'Card_7_b.png', 'Card_5_b.png', 'Card_1_g.png', 'Card_9_y.png', 'Card_5_y.png', 'Card_9_b.png', 'Card_7_r.png', 'Card_skip_y.png', 'Card_7_y.png', 'Card_6_r.png', 'Card_3_y.png',  'Card_1_y.png', 'Card_9_g.png', 'Card_4_r.png', 'Card_6_y.png', 'Card_4_y.png', 'Card_8_b.png', 'Card_add2_y.png', 'Card_8_g.png', 'Card_switch_y.png', 'Card_2_y.png', 'Card_5_r.png'];
    
    const Cards_zero = ['Card_0_r.png','Card_0_y.png','Card_0_b.png','Card_0_g.png'];
    
    const Special_cards = ['Card_add_4.png','Card_colorwish.png']
    
    const complete_deck = [];
    
    for(var i=1;i<3;i++){
        for( j in Cards){
            complete_deck.push(Cards[j]);
        }
    }
    
    for(var i=1;i<5;i++){
        for(j in Special_cards){
            complete_deck.push(Special_cards[j]);
        }
    }
    
    for(i in Cards_zero){
        complete_deck.push(Cards_zero[i]);
    }
    
    console.log(complete_deck.length);
    
    return complete_deck;
}
