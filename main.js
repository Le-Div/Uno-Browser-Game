// create Websocket
var socket = null;

//List of variables
var PLAYER_LIST = []; 
var READY_LIST = [];
var myName = null;
var HIDDENCARD_DIC = {};
var myCardStack = {};
var CurrentCard = null;
var CurrentPlayer = null;
var ColorFlag = null;
var holdflag = false;
var game_running = false;
var unoflag = false;
var unotrigger = false;
var drawn_flag = false;

var IP = '____________';
var PORT = "________";

//add connect and disconnect function
var connect_func = connect;
var disconnect_f = null;

//add connect and disconnect button
const ConBut = document.getElementById("join");
ConBut.addEventListener('click',connect_func);

const DcBut = document.getElementById("disconnect");

const PassBut = document.getElementById("pass");
PassBut.addEventListener('click',()=>{if(myName==CurrentPlayer&&holdflag==false&&drawn_flag==true){socket.emit('pass',{name:myName});drawn_flag=false;PassBut.style.backgroundColor='white';setTimeout(()=>{PassBut.style.backgroundColor='coral'},1000)}});

// getting the Display element of the draw and the play stack
const dstack = document.getElementById('draw_stack');
const pstack = document.getElementById('play_stack');

// initializing the draw events
dstack.addEventListener('click',()=>{if(myName==CurrentPlayer&&holdflag==false){
                                        socket.emit('draw',{name:myName});
                                        drawn_flag=true};
                                    });

const UnoBut = document.getElementById('UNO-button');
UnoBut.addEventListener('click',()=>{unoflag=true;UnoBut.style.backgroundColor='white';
                                     setTimeout(()=>{UnoBut.style.backgroundColor='coral'},1000)});


// Function which creates the playcard function 
function play_card(card,name){
    
    CurrentCard = card;
    
    var path =`http://${IP}:${PORT}/image?Cardpics/${card}`
    
    console.log('Card played');
    pstack.style.backgroundImage = `url(${path})`;
    pstack.style.backgroundSize = 'contain';
    pstack.style.backgroundRepeat = 'no-repeat';
}

// Function which creates the get card function
function add_to_my_stack(Card){
    
    // providing the location to the correct image
    var Cardid = 'card'+Math.random();
    var path =`http://${IP}:${PORT}/image?Cardpics/${Card}`;

    // get the card_stack element for display
    myCards = document.getElementById('my_card_stack');
    newCard = document.createElement('div');

    // set the stying of the drawn card so that it can be displaed properly
    set_newCard_styling(newCard,path);

    // giving the new card an individual id 
    newCard.id = Cardid;
    myCardStack[Card] = Cardid;
    
    // crating a play card function which can be added to the click event 
    // of playing this card
    var func = triggerPlayCard_f(Card,Cardid);
    newCard.addEventListener('click',func);

    // inserting the card to the div box so that it can be displayed there
    myCards.appendChild(newCard);

    // Changeing the eventlistener on the draw stack div box so that the next 
    // card can be drawn.
}
    
function triggerPlayCard_f(Card,Cardid){
    function triggerPlayCard(){
        
        var CC = CurrentCard;
        
        if(check_card(Card,CC)&&myName==CurrentPlayer&&holdflag==false){
            socket.emit('playCard',{Card:Card,name:myName});
            remove_card(Card);
            document.getElementById(Cardid).remove();
        }
    }
    return triggerPlayCard;
}

function check_card(Card,CC){
    
    var Cardinfo1 = Card.split('_');
    var Cardinfo2 = CC.split('_');
    
    if(Cardinfo2[1]!='colorwish.png'&&Cardinfo2[1]!='add'){
        if((Cardinfo1[1]==Cardinfo2[1]||Cardinfo1[2]==Cardinfo2[2])&&(myName==CurrentPlayer)){
            return true;
        } 
        else if((Cardinfo1[1]=='add'&&Cardinfo1[2]=='4.png')||Cardinfo1[1]=='colorwish.png'){
            return true;
        }
        else{
            return false;
        }
    }
    else{
        
        if(Cardinfo1[2]==(ColorFlag[0]+'.png')){
            return true;
        }
        else{
            return false;
        }   
    }  
}


function add_player(playername){
    
    var playerBox = document.getElementById('player_card_stacks');
    var newPlayer = document.createElement('div');
    
    newPlayer.style.textAlign='center'
    newPlayer.style.paddingTop='7px'
    newPlayer.style.margin = '10px';
    newPlayer.style.width = '160px';
    newPlayer.style.height= '25px';
    newPlayer.style.border='2px solid';
    newPlayer.style.display ='inline-block';
    newPlayer.innerHTML = playername;
    newPlayer.id = playername;
    PLAYER_LIST.push(playername);
    
    playerBox.appendChild(newPlayer);
    
    add_status(newPlayer,playername);
    
}

function add_status(playerbox,name){
    var newStatus = document.createElement('textbox');
    
    newStatus.innerHTML = 'waiting';
    newStatus.style.margin = '10px';
    newStatus.style.padding = '2px';
    newStatus.style.color = 'red';
    newStatus.style.border='1px solid';
    newStatus.style.borderColor='red';
    //newStatus.style.display='inline-block'
    newStatus.id = name+'stat';
    if(name==myName){
        newStatus.addEventListener('click',()=>{
        newStatus.innerHTML = 'ready';
        newStatus.style.color='green';
        newStatus.style.borderColor='green';
        socket.emit('ready',{player:myName});
    });}
    
    playerbox.appendChild(newStatus);
    
}

function set_status(playername){
    
    READY_LIST.push(playername);
    const pstat = document.getElementById(playername+'stat');
    pstat.innerHTML='ready';
    pstat.style.color='green';
    pstat.style.borderColor='green';
}


function connect(){
    
    myName = document.getElementById("myName").value;
       
    ConBut.removeEventListener('click',connect_func);
    
    disconnect_f = get_disconnect_f(myName);
    
    DcBut.addEventListener('click',disconnect_f);
    
    socket = io();     
    socket.on('connect',function(){socket.emit('username',{name:myName})});
    socket.on('welcome',(data)=>{console.log(data.msg)})
    socket.on('newPlayer',(data)=>{filterList(PLAYER_LIST,data.player,add_player)});
    socket.on('PlayerDC',(data)=>{document.getElementById(data.player).remove();
                                  PLAYER_LIST = delEntry(PLAYER_LIST,data.player);
                                  READY_LIST = delEntry(READY_LIST,data.player);});
    socket.on('disconnect',()=>{console.log('Disconnected from server');});
    socket.on('ready',(data)=>{ filterList(READY_LIST,data.player,set_status)});
    socket.on('gameStart',(data)=>{console.log(data.msg);
                                   CurrentCard = data.StartCard;
                                   display_cc(data.StartCard);
                                   change_player_display();
                                   init_my_CardStack(data.Cards);
                                   set_turn(data.StartPlayer);
                                   game_running = true;
                                  });
    socket.on('playCard',(data)=>{play_card(data.Card);
                                  CurrentCard=data.Card;
                                  display_cc(data.Card);
                                  remove_hidden_card(data.name);
                                  set_turn(data.TurnPlayer);
                                  if(data.remFlag==0){color_set('coral');};
                                 });
    socket.on('draw',(data)=>{add_to_my_stack(data.Card)});
    
    socket.on('addHidden',(data)=>{add_hidden_card(data.name)});
    
    socket.on('pass',(data)=>{set_turn(data.TurnPlayer);});
    
    socket.on('colorwish',()=>{color_select();});
    
    socket.on('colorset',(data)=>{color_set(data.col);
                                  holdflag=false;
                                 });
    
    socket.on('hold',()=>{holdflag=true});
    
    socket.on('win',(data)=>{display_winner(data.name);
                             reset_game();
                            });
    
}

function get_disconnect_f(playername){
    function disconnect(){
        socket.disconnect();
        ConBut.addEventListener('click',connect_func);
        DcBut.removeEventListener('click',disconnect_f);
        
        for(i in PLAYER_LIST){
            document.getElementById(PLAYER_LIST[i]).remove();
        }
        
        var KeyList = Object.keys(myCardStack);
        console.log(KeyList);
        for(i in KeyList){
            document.getElementById(myCardStack[KeyList[i]]).remove();
        }
        
        document.getElementById('play_stack').style.backgroundImage = 'none';
        
        const disCol = document.getElementById('colorset');
        disCol.style.color = 'coral';
        
        reset_game();
    }
   return disconnect;
}
    
function change_player_display(){
    
    for(i in READY_LIST){
        document.getElementById(READY_LIST[i]+'stat').remove();
        add_other_cards(READY_LIST[i]);
    } 
    
    READY_LIST = [];
    
}

function add_other_cards(playername){
    
    HIDDENCARD_DIC[playername] = 0;
    
    for(var i=0;i<7;i++){
        add_hidden_card(playername);
    }
}

function add_hidden_card(playername){
    
    var playerbox = document.getElementById(playername);
    var newCards = document.createElement('div');
    
    const path = `http://${IP}:${PORT}/image?pics/UNO-Back.png`;
    
    newCards.style.width='10px';
    newCards.style.height='15px';
    newCards.style.marginLeft='3px';
    newCards.style.backgroundImage=`url(${path})`;
    newCards.style.backgroundSize= 'contain';
    newCards.style.backgroundRepeat = 'no-repeat'
    newCards.style.display='inline-block';
    
    var num = HIDDENCARD_DIC[playername]
    num++
    newCards.id= playername+'hid'+num;
    HIDDENCARD_DIC[playername]=num;
    
    playerbox.appendChild(newCards);
}

function remove_hidden_card(playername){
    
    var num = HIDDENCARD_DIC[playername];
    console.log(playername+'hid'+num);
    document.getElementById(playername+'hid'+num).remove();
    num--;
    HIDDENCARD_DIC[playername] = num;
}


function init_my_CardStack(Cards){
    console.log(Cards)
    for(i in Cards){
        add_to_my_stack(Cards[i]);
    }
}

function display_cc(Card){
    
    var path =`http://${IP}:${PORT}/image?Cardpics/${Card}`; 
    pstack.style.backgroundImage = `url(${path})`;
    pstack.style.backgroundRepeat ='no-repeat';
    pstack.style.backgroundSize= 'contain';    
    
}

function set_turn(players){
    console.log(players);
    CurrentPlayer = players[0];
    
    for(i in PLAYER_LIST){
        
        if(PLAYER_LIST[i]==players[0]){
            color = 'white';
        }
        else if(PLAYER_LIST[i]==players[1]){
            color = 'blue';
        }
        else{
            color = 'black';
        }
        document.getElementById(PLAYER_LIST[i]).style.color = color;
    }   
}

function color_select(){
    
    const table = document.getElementById('table');
    
    const colorbar = document.createElement('div');
    
    const path = `http://${IP}:${PORT}/image?pics/colorCircle.png`;
    
    colorbar.style.height = '250px';
    colorbar.style.width = '400px';
    //colorbar.style.backgroundColor='black';
    colorbar.style.backgroundImage= `url(${path})`;
    colorbar.style.backgroundRepeat='no-repeat';
    colorbar.style.backgroundPosition='center';
    colorbar.style.position = 'absolute';
    colorbar.style.top = '0px';
    colorbar.style.left = '0px';
    colorbar.id = 'colorbar';
    
    const colors = [];
    const col = ['red','green','blue','yellow'];
    const top = ['0px','0px','125px','125px'];
    const left = ['0px','200px','0px','200px'];
    const func = [];
    
    for(var i=0;i<4;i++){
        colors.push(document.createElement('div'));
        colors[i].style.width='200px';
        colors[i].style.height='125px';
        //colors[i].style.backgroundColor=col[i];
        colors[i].style.position='absolute';
        colors[i].style.top = top[i];
        colors[i].style.left = left[i];
        
        func.push(get_col_Event(col[i],colorbar))
        
        colors[i].addEventListener('click',func[i]);
        colorbar.appendChild(colors[i]);
    }
    
    
    table.appendChild(colorbar);    
}

function get_col_Event(col,colorbar){
    function color_Event(){
        
        socket.emit('colorwish',{col:col});
        colorbar.remove();
    }
    return color_Event;
}

function color_set(col){
    
    ColorFlag = col;
    
    const colinfo = document.getElementById('colorset');
    
    colinfo.innerHTML = col;
    colinfo.style.color = col;
}


setInterval(()=>{
    
    const numCards = Object.keys(myCardStack).length;
    
    if(numCards==0&&game_running==true){
        socket.emit('win',{name:myName});
    }
    if(numCards==1&&game_running==true){
        
        if(unotrigger==false){
            setTimeout(()=>{
                if(unoflag==false){
                socket.emit('uno',{name:myName});
                }
            },3000)
            unotrigger=true;
        }
    }
    else if(numCards>1&&unoflag==true){
        unoflag=false;
        unotrigger=false;
    }
        
},100)


function display_winner(name){
    
    const winner = document.createElement('textbox');
    const table = document.getElementById('table');
    
    winner.innerHTML = name+' Wins!';
    winner.style.fontSize = '100px';
    winner.style.color = 'Black';
    winner.style.position = 'absolute';
    winner.style.top = '125px';
    winner.style.left = '200px';
    
    table.appendChild(winner);
    
    setTimeout(()=>{
        winner.remove();
    },10000);
}

function reset_game(){
    
    document.getElementById('play_stack').style.backgroundImage = 'none'
    
    for(i in PLAYER_LIST){
        const player = document.getElementById(PLAYER_LIST[i]);
        
        player.style.color = 'black';
        
        var child = player.lastElementChild;  
        while (child) { 
            player.removeChild(child); 
            child = player.lastElementChild; 
        }
        
        add_status(player,PLAYER_LIST[i]);
        
    }
    
    const Card_list = Object.keys(myCardStack);
    
    if(Card_list.length>0){
        for(i in Card_list){
            document.getElementById(myCardStack[Card_list[i]]).remove();
        }
    }
    
    READY_LIST = [];
    HIDDENCARD_DIC = {};
    myCardStack = {};
    CurrentCard = null;
    CurrentPlayer = null;
    ColorFlag = null;
    holdflag = false;
    game_running = false;
    unoflag = false;
    unotrigger = false;
    
}
    
    






        
