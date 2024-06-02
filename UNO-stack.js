
// Syling of the cards which are drawn from the draw stack
function set_newCard_styling(newCard,path){
    
    newCard.style.width = '120px';
    newCard.style.height = '170px';
    newCard.style.margin= '5px';
    newCard.style.backgroundColor='transparent'
    newCard.style.backgroundImage = `url(${path})`;
    newCard.style.backgroundSize = 'contain';
    newCard.style.backgroundRepeat = 'no-repeat';
    newCard.style.display = "inline-block";
}

// remove a card from my card stack
function remove_card(card){
    delete myCardStack[card];
}

//remove an element from a List
function delEntry(remList,element){
    var index = remList.indexOf(element);
    remList.splice(index,1);
    return remList;
}

//filter for elements already displayed
function filterList(refList,filList,func){
    var index = 0;
    for(i in filList){
        index= refList.indexOf(filList[i]);
        if(index==(-1)){
            func(filList[i]);
        }
    }
}
