const usernameCheckCircle=document.getElementById('usernameCheckCircle');
const messageScroller=document.getElementById("chatContainer");//fixed
const btnSignOut=document.getElementById("btnSignOut"); //fixed
const database = firebase.database();

var recipScroller=document.getElementById("recipScroller");
const newThreadUsername= document.getElementById('newThreadUsername');
const msgContent=document.getElementById("message");

if (!Object.keys) {
    Object.keys = function (object) {
        var keys = [];

        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
    }
}

var updating=false;
// var assigned to callback tracking new messages
var currMessageCallback=null;

var messagesDownloaded=0;

// var to keep track of last message downloaded
var earliestMessageDownloadedKey='';

// threadList is global list of threads in arbitrary order
var threadList=[];

// currentThread is global string with threadID of visible thread messages
var currentThread=null;

function updateScroll(){
    messageScroller.scrollTop = messageScroller.scrollHeight;
}

function setupNameListener(div, fontElement, threadId){
  fontElement.addEventListener('click', function(event){
    var newInputElement = document.createElement('input');
    newInputElement.setAttribute("type", "text");
    newInputElement.value=fontElement.innerHTML;
    function replaceInputWithFont(){
      var fontElement=document.createElement('font');
      fontElement.color='teal';
      fontElement.innerHTML=newInputElement.value;
      div.insertBefore(fontElement, div.firstChild);
      div.removeChild(newInputElement);
      div.removeEventListener('click', replaceInputWithFont, false);
      database.ref('/users/'+window.userUid+'/threads/'+threadId).update(newInputElement.value);
      setupNameListener(div, fontElement);
    };
    newInputElement.addEventListener("keyup", function(event) {
        event.preventDefault();
        // if enter pressed
        if (event.keyCode === 13) {
          replaceInputWithFont();
        }
    });

    div.addEventListener('click', replaceInputWithFont, false);

    newInputElement.addEventListener('click', function(event){
      event.stopPropagation();
    }, false);
    div.appendChild(newInputElement);
    div.removeChild(fontElement);
    event.stopPropagation();
  }, false);
}

// updated
function mkThreadElement (currentDivObject, mainNameOrMembersList, content, time, senderUsername, threadId) {
  var newParentDiv=document.createElement("div");

  var newFont=document.createElement('font');
  newFont.size='3';
  newFont.color='Teal';
  newFont.appendChild(document.createTextNode(mainNameOrMembersList));
  var newAElement=document.createElement('a');
  newAElement.setAttribute('class','waves-effect transparent waves-light btn large z-depth-0');
  newAElement.id=threadId;
  newAElement.style='border: 0px;';
  var newIElement=document.createElement('i');
  newIElement.setAttribute('class', 'material-icons left ');
  newIElement.style='color: teal;';
  newIElement.innerHTML='create';
  newAElement.appendChild(newIElement);
  newParentDiv.appendChild(newAElement);

  var newp=document.createElement('p');
  newp.appendChild(document.createTextNode(content));
  var newTimeDiv=document.createElement('div');
  newTimeDiv.appendChild(document.createTextNode(time));
  newTimeDiv.class='right';

  newParentDiv.insertBefore(newFont,newParentDiv.firstChild);
  newParentDiv.appendChild(newp);
  newParentDiv.appendChild(newTimeDiv);


  newParentDiv.onclick=function(){
    if (currentThread !== threadId) {
      if (currentThread!= null){
        database.ref('threads/' + currentThread + '/messages').off('child_added', currMessageCallback);
      }
      currentThread = threadId;
      messagesDownloaded=0;
      getMessages();
      updateThreadList();
    }
  };
  if (threadId!==currentThread){
    newParentDiv.setAttribute('class','card-panel whitesmoke');
    currentDivObject.appendChild(newParentDiv);
  } else {
    newParentDiv.setAttribute('class','card-panel red lighten-4');
    currentDivObject.insertBefore(newParentDiv, currentDivObject.firstChild);
  }

  function makeListener(threadId, newAElement, newFont, newParentDiv){
    var newInputElement=null;
    newAElement.addEventListener('click', function(event){
      event.stopPropagation();
      if (newInputElement===null){
        newInputElement = document.createElement('input');
        newInputElement.setAttribute("type", "text");
        newInputElement.value=newFont.innerHTML;
        newInputElement.addEventListener('click', function(event) {
          event.stopPropagation();
        });
        newInputElement.addEventListener("keyup", function(event) {
          event.preventDefault();
          // if enter pressed
          if (event.keyCode === 13) {
            newAElement.click();
          }
        });
        newParentDiv.insertBefore(newInputElement, newParentDiv.firstChild);
        newParentDiv.removeChild(newFont);
        newFont=null;
      } else {
        newInputElement.removeEventListener('click', function(event) {
          event.stopPropagation();
        });
        newInputElement.removeEventListener("keyup", function(event) {
          event.preventDefault();
          // if enter pressed
          if (event.keyCode === 13) {
            document.getElementById(threadId).click();
          }
        });
        newFont=document.createElement('font');
        newFont.color='teal';
        newFont.size='3';
        newFont.innerHTML=newInputElement.value;
        database.ref('/users/'+window.userUid+'/threads/').update({[threadId]: newInputElement.value});
        newParentDiv.insertBefore(newFont, newParentDiv.firstChild);
        newParentDiv.removeChild(newInputElement);
        newInputElement=null;
      }
    });
  }
  makeListener(threadId, newAElement,newFont, newParentDiv);
}

function mkTxtBubble (message, time, senderUid, senderUsername) {
  var outputElement=document.createElement('div');

  if (senderUid!==window.userUid) {
    outputElement.setAttribute('class','card red lighten-4');

    var cardContentElement=document.createElement('div');
    cardContentElement.setAttribute('class', 'card-content');

    var userElement=document.createElement('div');
    userElement.setAttribute('class', 'user');

    var fontElement=document.createElement('font');
    fontElement.size='3';
    fontElement.color='Teal';
    fontElement.appendChild(document.createTextNode(senderUsername));
    userElement.appendChild(fontElement);

    var messageDiv=document.createElement('div');
    messageDiv.setAttribute('class', 'theirmessage');
    messageDiv.appendChild(document.createTextNode(message));

    var timeDiv=document.createElement('div');
    timeDiv.setAttribute('class', 'left');
    timeDiv.appendChild(document.createTextNode(time));

    outputElement.appendChild(cardContentElement);
    cardContentElement.appendChild(userElement);
    cardContentElement.appendChild(document.createElement('br'));
    cardContentElement.appendChild(messageDiv);
    cardContentElement.appendChild(document.createElement('br'));
    cardContentElement.appendChild(timeDiv);

  } else {
    outputElement.setAttribute('class','card');

    var cardContentElement=document.createElement('div');
    cardContentElement.setAttribute('class', 'card-content');

    var userElement=document.createElement('div');
    userElement.setAttribute('class', 'right');

    var fontElement=document.createElement('font');
    fontElement.size='3';
    fontElement.color='Teal';
    fontElement.appendChild(document.createTextNode(senderUsername));
    userElement.appendChild(fontElement);

    var messageDiv=document.createElement('div');
    messageDiv.setAttribute('class', 'mymessage');
    messageDiv.appendChild(document.createTextNode(message));

    var timeDiv=document.createElement('div');
    timeDiv.setAttribute('class', 'right');
    timeDiv.appendChild(document.createTextNode(time));

    outputElement.appendChild(cardContentElement);
    cardContentElement.appendChild(userElement);
    cardContentElement.appendChild(document.createElement('br'));
    cardContentElement.appendChild(messageDiv);
    cardContentElement.appendChild(document.createElement('br'));
    cardContentElement.appendChild(timeDiv);
  }
  return outputElement;
}

function clearThreadlist() {
  recipScroller.innerHTML="";
}


function clearChat() {
  messageScroller.innerHTML = "";
}

// Will get the last 30 messages from the thread and those sent after and display them.
function getMessages() {
  var msgDict={};
  var setEarliestKey=false;
  var lastElementPosted=null;
  // turn off when you change current thread: database.ref('threads/' + currentThread + '/messages').off("child_added", currMessageCallback);
  clearChat();
  database.ref('/threads/'+currentThread+'/info').once('value').then(function(snap){
    if (snap.child('messageCount').val() === null) {
      var totalNumMessages=0;
    } else {
      var totalNumMessages=snap.child('messageCount').val();
    }
    var messagesToGet = 50;
    if (totalNumMessages<50){
      messagesToGet=totalNumMessages;
    }
    if (totalNumMessages!==0){
      var counter =0;
      var originPullListener = database.ref('threads/' + currentThread + '/messages').orderByKey().limitToLast(messagesToGet).on('child_added', function(snapshot) {
        if (setEarliestKey === false) {
          earliestMessageDownloadedKey=snapshot.key;
          setEarliestKey=true;
        }
        //var newChatElement=createChatElement(snapshot.val().content, snapshot.val().timestamp, snapshot.val().sender);
        firebase.database().ref('/users/'+snapshot.val().sender.toString()+'/username').once('value').then( function (usernameSnapshot){
          var newChatElement=mkTxtBubble (snapshot.val().content, convertTimestamp(snapshot.val().timestamp, false), snapshot.val().sender, usernameSnapshot.val());

          if (lastElementPosted === null) {
            messageScroller.appendChild(newChatElement);
            //MESSAGESELEMENT.insertBefore(newChatElement, MESSAGESELEMENT.firstChild);
          } else if (snapshot.val() !== null) {
            lastElementPosted.parentNode.insertBefore(newChatElement, lastElementPosted);
          }
          lastElementPosted=newChatElement;
          messagesDownloaded++;
          counter++;
          if (counter===messagesToGet){
            database.ref('threads/' + currentThread + '/messages').off('child_added', originPullListener);
            updateScroll();
          }
        });
      });
    }
    var passedExistingMessage=false
    // callback to find only new messages
    currMessageCallback = database.ref('/threads/'+currentThread+'/messages').orderByKey().limitToLast(1).on('child_added', function(snapshot) {
      if (passedExistingMessage===true){
        firebase.database().ref('/users/'+snapshot.val().sender.toString()+'/username').once('value').then( function (usernameSnapshot){
          var newChatElement=mkTxtBubble (snapshot.val().content, convertTimestamp(snapshot.val().timestamp, false), snapshot.val().sender, usernameSnapshot.val());
          messageScroller.appendChild(newChatElement);
          updateScroll();
          messagesDownloaded++;
        });
      }
      passedExistingMessage=true;
    });
  });
}

function getMoreMessages() {
  var setEarliestKey=false;
  var lastElementPosted=null;
  var endKey=earliestMessageDownloadedKey;
  database.ref('/threads/'+currentThread+'/info').once('value').then(function(snap){
    if (snap.child('messageCount').val() === null) {
      var totalNumMessages=0;
    } else {
      var totalNumMessages=snap.child('messageCount').val();
    }
    var messagesToGet = 20;
    if (totalNumMessages-messagesDownloaded<20){
      messagesToGet=totalNumMessages-messagesDownloaded;
    }
    if (totalNumMessages!==0){
      // changing to get object with target chats then go through them
      var currListener = database.ref('threads/' + currentThread + '/messages').orderByKey().endAt(earliestMessageDownloadedKey).limitToLast(messagesToGet+1).on('child_added', function(snapshot) {
        if (setEarliestKey === false) {
          earliestMessageDownloadedKey=snapshot.key;
          setEarliestKey=true;
        }
        if (snapshot.key !== endKey){
          //var newChatElement=createChatElement(snapshot.val().content, snapshot.val().timestamp, snapshot.val().sender);
          firebase.database().ref('/users/'+snapshot.val().sender.toString()+'/username').once('value').then( function (usernameSnapshot){
            var newChatElement=mkTxtBubble (snapshot.val().content, convertTimestamp(snapshot.val().timestamp, false), snapshot.val().sender, usernameSnapshot.val());
            messageScroller.appendChild(newChatElement);
            if (lastElementPosted === null) {
              messageScroller.insertBefore(newChatElement, messageScroller.firstChild);
              //MESSAGESELEMENT.insertBefore(newChatElement, MESSAGESELEMENT.firstChild);
            } else if (snapshot.val() !== null) {
              lastElementPosted.parentNode.insertBefore(newChatElement, lastElementPosted);
            }
            messagesDownloaded++;
            lastElementPosted=newChatElement;
          });
        } else {
          database.ref('threads/' + currentThread + '/messages').off('child_added', currListener);
        }
      });
    }
  });
}


function getThreadData(i, threadList, threadDict, currentDivObject, timestampKeys, snapshot){
  database.ref('threads/'+threadList[i]+'/info').once('value').then( function(infoSnap){
    if (snapshot.child(threadList[i]).val()===true && (infoSnap.child('name').val()===null || infoSnap.child('name').val()==='')){  // if no thread name assigned
      //if no manual name
      var senderString='';
      for (var key in infoSnap.child('members').val()){
        if (key!==window.userUsername){
          senderString = senderString+key+' ';
        }
      }
    } else if (snapshot.child(threadList[i]).val()!==true){  // if thread name assigned
      senderString=snapshot.child(threadList[i]).val();
    } else if (snapshot.child(threadList[i]).val()!==null && snapshot.child(threadList[i]).val()!==''){
      senderString=infoSnap.child('name').val();
    }

    if (infoSnap.child('messageCount').val()!==null && infoSnap.child('messageCount').val()!==0){
      // if thread has messages
      database.ref('threads/' + threadList[i] + '/messages').limitToLast(1).once("child_added").then( function(lastMsgSnap) {
        var content=lastMsgSnap.child('content').val();
        var sender=lastMsgSnap.child('sender').val();
        var timestamp=lastMsgSnap.child('timestamp').val();
        database.ref('/users/'+sender+'/username').once('value').then( function (usernameSnapshot){
          threadDict[timestamp]={'senderString':senderString, 'threadId':threadList[i], 'content':content, 'senderUsername':usernameSnapshot.val()};
          timestampKeys.push(timestamp);
          if (i===threadList.length-1){
            timestampKeys.sort(function(a, b){return b-a});
            pushThreadData(0, threadDict, timestampKeys, currentDivObject);
          } else {
            getThreadData(i+1, threadList, threadDict, currentDivObject, timestampKeys, snapshot);
          }
        });
      });
    } else {
      var created =infoSnap.child('created').val();
      threadDict[created]={'senderString':senderString, 'threadId':threadList[i], 'content':' ', 'senderUsername':' '};
      timestampKeys.push(created);
      if (i===threadList.length-1){
        timestampKeys.sort(function(a, b){return b-a});
        pushThreadData(0, threadDict, timestampKeys, currentDivObject);
      } else {
        getThreadData(i+1, threadList, threadDict, currentDivObject, timestampKeys, snapshot);
      }
    }
  });
}
function pushThreadData(i, threadDict, timestampKeys, currentDivObject){
  //(currentDivObject, mainNameOrMembersList, content, time, senderUsername, threadId)
  mkThreadElement(currentDivObject, threadDict[timestampKeys[i]]['senderString'], threadDict[timestampKeys[i]]['content'], convertTimestamp(timestampKeys[i], true), threadDict[timestampKeys[i]]['senderUsername'], threadDict[timestampKeys[i]]['threadId']);
  if (i===timestampKeys.length-1){
    document.getElementById('recipScroller').parentNode.replaceChild(currentDivObject, document.getElementById('recipScroller'));
    currentDivObject.setAttribute('id', "recipScroller");
    currentDivObject.addEventListener('scroll', function(){
      if (currentDivObject.scrollTop == 0){
        updateThreadList();
      }
    });
    if (updating=='updateAfterUpdateCompleted'){
      updating=false;
      updateThreadList();
    } else {
      updating=false;
    }
  } else {
    pushThreadData(i+1, threadDict, timestampKeys, currentDivObject);
  }
}

var threadList=new Array();
var threadDict=new Array();
// Get all threads for user
function updateThreadList() { //TODO fix issue of it updating twice then not again
  if (updating===true || updating==='updateAfterUpdateCompleted'){
    updating='updateAfterUpdateCompleted';
  } else {
    updating=true;
    var loadingGif=document.createElement('img');
    loadingGif.setAttribute('src', 'loading.gif');
    loadingGif.style='max-height:25px;max-width:25px;display:block;margin:auto;';
    document.getElementById('recipScroller').insertBefore(loadingGif, document.getElementById('recipScroller').firstChild);
    database.ref('users/' + window.userUid + '/threads').once("value", function(snapshot) {
      if (threadList){
        for (i=0; i<threadList.length;i++){
          (function(i) {
            database.ref('threads/' + threadListeners[i][0]).off(threadListeners[i][1], threadListeners[i][2]);
          })(i);
        }
      }

      // generate thread listeners
      threadList=[];
      for (var key in snapshot.val()) {
        threadList.push(key); // push thread ID keys to list
      }

      // generate thread listeners
      threadListeners=[];
      for (i=0; i<threadList.length; i++) {

        var listener = database.ref('threads/' + threadList[i]).on('child_changed', function (snapshot) {
          updateThreadList();
        });
        threadListeners.push([threadList[i],'child_changed',listener]);
      }

      var currentDivObject=document.createElement('div');
      currentDivObject.setAttribute('class', "card-panel red lighten-2");
      currentDivObject.setAttribute('style',"height: 86.5vh; overflow: auto;");
      getThreadData(0, threadList, {}, currentDivObject, [], snapshot);
    });
  }
}


// Sends message with content to threadId
function sendMessage(content){
  const timestamp = Date.now();
    database.ref('threads/' + currentThread + '/messages/').push({
      content: content,
      timestamp: timestamp,
      sender: window.userUid,
    });
}

function convertTimestamp(timestamp, fulldate) {
  var d = new Date(timestamp),
		yyyy = d.getFullYear(),
		mm = ('0' + (d.getMonth() + 1)).slice(-2),	// Months are zero based. Add leading 0.
		dd = ('0' + d.getDate()).slice(-2),			// Add leading 0.
		hh = d.getHours(),
		h = hh,
		min = ('0' + d.getMinutes()).slice(-2),		// Add leading 0.
		ampm = 'AM',
		time;

	if (hh > 12) {
		h = hh - 12;
		ampm = 'PM';
	} else if (hh === 12) {
		h = 12;
		ampm = 'PM';
	} else if (hh == 0) {
		h = 12;
	}

	// ie: 2013-02-18, 8:35 AM
	//time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;
  var time = h+':'+min+' '+ampm;
  if (fulldate===true) {
    var addition=mm+'/'+dd+'/'+yyyy.toString().slice(0,-2);
    yyyy=yyyy.toString().slice(0,-2).toString();
    addition=addition.split('/').reduce(function(date, datePart){
        return date += parseInt(datePart) + '/'
    }, '').slice(0, -1);
    time=time+' '+addition
  }

	return time;
}

btnSignOut.addEventListener('click', e=>{
  firebase.auth().signOut().then(function() {
  console.log('Signed Out');
  }, function(error) {
  console.error('Sign Out Error', error);
  });
});

newThreadUsername.addEventListener("keyup", function(event) {
    var username=newThreadUsername.value.toString().toLowerCase();
    if (username) {
      database.ref('usernames').once('value', function(snapshot) {
        if (snapshot.hasChild(username)) {
          usernameCheckCircle.style.background='green';
          usernameValid=true;
        } else {
          usernameCheckCircle.style.background='red';
          usernameValid=false;
        }
        usernameCheckCircle.style.display="inline-block";
      });
    }
    // if enter pressed
    if (event.keyCode === 13 && usernameValid===true) {
      var targetUsername=newThreadUsername.value.toString().toLowerCase();
      database.ref('/usernames/'+targetUsername).once('value').then(function(usernameSnapshot){
        var targetUid=usernameSnapshot.val();
        var newThreadKey=database.ref('threads').push().key;
        database.ref('threads/'+newThreadKey).set({
          'info':{
            'name':'',
            'owner':window.userUid,
            'members':{
              [window.userUsername]:window.userUid,
              [targetUsername]:targetUid,
            },
          },
        });
        newThreadUsername.value='';
        currentThread=newThreadKey;
        clearChat();
        if (currentThread!= null){
          database.ref('threads/' + currentThread + '/messages').off('child_added', currMessageCallback);
        }
        currMessageCallback = database.ref('/threads/'+currentThread+'/messages').orderByKey().limitToLast(1).on('child_added', function(snapshot) {
          firebase.database().ref('/users/'+snapshot.val().sender.toString()+'/username').once('value').then( function (usernameSnapshot){
            var newChatElement=mkTxtBubble (snapshot.val().content, convertTimestamp(snapshot.val().timestamp, false), snapshot.val().sender, usernameSnapshot.val());
            messageScroller.appendChild(newChatElement);
            updateScroll();
            messagesDownloaded++;
          });
        });
      });
    }
});

msgContent.addEventListener("keyup", function(event) {
    event.preventDefault();
    // if enter pressed
    if (event.keyCode === 13) {
      var content= msgContent.value;
      sendMessage(content);
      msgContent.value='';
    }
});

messageScroller.addEventListener('scroll', function(){
  if (messageScroller.scrollTop == 0){
    getMoreMessages();
  }
});

recipScroller.addEventListener('scroll', function(){
  if (recipScroller.scrollTop == 0){
    updateThreadList();
  }
});


firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    window.userUid = firebaseUser.uid;
    database.ref('/users/'+window.userUid+'/username').once('value').then( function (usernameSnapshot){
      window.userUsername = usernameSnapshot.val();
      if (usernameSnapshot.val()!==null){
        database.ref('users/'+window.userUid+'/threads').on('child_changed', function(snapshot){
          updateThreadList();
        });
        database.ref('users/'+window.userUid+'/threads').on('child_added', function(snapshot){
          updateThreadList();
        });
        updateThreadList();
      } else {
        alert("Ya done messed up ya account");
        window.location.href = 'sign_up.html';
      }
    });
  }else{
    window.location.href = 'login.html';
  }
});
