const messageBox=document.getElementById("messageBox");
const messageScroller=document.getElementById("messageScroller");
const btnSignOut=document.getElementById("signOut");
const btnLoadMore=document.getElementById('loadOldMess');

const newThreadUsername=document.getElementById('toUsername');
const btnSubmitNewThread=document.getElementById('submitNewThread');

const database = firebase.database();

const recipBox=document.getElementById("recipBox");
const recipScroller=document.getElementById("recipScroller");

const msgContent=document.getElementById("msgContent");
const btnSend=document.getElementById("msgSend");

// var assigned to callback tracking new messages
var currMessageCallback=null;

// var to keep track of last message downloaded
var earliestMessageDownloadedKey='';

// threadList is global list of threads in arbitrary order
var threadList=[];

// currentThread is global string with threadID of visible thread messages
var currentThread='';

function updateScroll(){
    var element = document.getElementById("messageScroller");
    element.scrollTop = element.scrollHeight;
}

function createThreadElement() {
  // do whatever html and js you need here
}

// Doesnt work because of async, just put code you want to pull with around here
/*
function getUsername(targetuid) {
    firebase.database().ref('/users/'+targetuid.toString()+'/username').once('value').then( function (snapshot){
      console.log("GetUsername: "+snapshot.val());
      return snapshot.val();
    });
}*/

function mkThreadTest (content, time, senderUsername, threadID) {
  var newDiv=document.createElement("div");
  var recipTxt=document.createTextNode(senderUsername);
  newDiv.className='recipient';
  newDiv.appendChild(recipTxt);
  newDiv.id=threadID;
  newDiv.onclick=function(){
    if (currentThread !== newDiv.id) {
      currentThread = newDiv.id;
      getMessages();
    }
  };
  recipScroller.appendChild(newDiv);
}

function mkTxtBubble (message, time, senderUid, senderUsername) {
  var msgContent=document.createTextNode(message);
  var msgTime = document.createTextNode('[' + time + ']');
  var senderFont=document.createElement("font");
  var outputElement=document.createElement("p");

  if (senderUid===window.userUid) {
    var senderColor='blue';
  } else {
    var senderColor='red';
  }
  var senderName=document.createTextNode(" ["+senderUsername+"]: ");
  senderFont.style.color=senderColor;
  senderFont.appendChild(senderName);
  outputElement.appendChild(msgTime);     //used this bc I didn't like small time
  outputElement.appendChild(senderName);
  outputElement.appendChild(msgContent);
  return outputElement;
}

function clearThreadlist() {
  recipScroller.innerHTML="";
}

function createChatElement (content, timestamp, sender) {
  // add styling for creating new element for message
  /* EXAMPLE:
  var newp=document.createElement("p");
  var newpText=document.createTextNode('[' + sender + ']: ' + content);
  newp.appendChild(newpText);
  return newp;
  */
}

function clearChat() {
  messageScroller.innerHTML = "";
}

// called when user makes new thread
function newThread () {
  createThreadElement(); //add arguments for new message thread element to display a (mostly) blank thread
  // set chat window to show blank chat with no recipients
  sendMessageToNewThread(); // creates new thread and handles adding recipients and sending message
}

// Will get the last 30 messages from the thread and those sent after and display them.
function getMessages() {
  var msgDict={};
  var setEarliestKey=false;
  // turn off when you change current thread: database.ref('threads/' + currentThread + '/messages').off("child_added", currMessageCallback);
  clearChat();
  currMessageCallback = database.ref('threads/' + currentThread + '/messages').orderByKey().limitToLast(30).on("child_added", function(snapshot) {
    //find sender from, as of now it's the uid
    if (setEarliestKey === false) {
      earliestMessageDownloadedKey=snapshot.key;
      setEarliestKey=true;
    }
    //var newChatElement=createChatElement(snapshot.val().content, snapshot.val().timestamp, snapshot.val().sender);
    //WHATEVERELEMENT.appendChild(newChatElement);
    firebase.database().ref('/users/'+snapshot.val().sender.toString()+'/username').once('value').then( function (usernameSnapshot){
      var newChatElement=mkTxtBubble (snapshot.val().content, convertTimestamp(snapshot.val().timestamp, false), snapshot.val().sender, usernameSnapshot.val());
      messageScroller.appendChild(newChatElement);
      updateScroll();
    });
  });
}

function getMoreMessages() {
  var setEarliestKey=false;
  var lastElementPosted=null;
  var endKey=earliestMessageDownloadedKey;
  // changing to get object with target chats then go through them
  var currListener = database.ref('threads/' + currentThread + '/messages').orderByKey().endAt(earliestMessageDownloadedKey).limitToLast(21).on('child_added', function(snapshot) {
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
          lastElementPosted.after(newChatElement);
        }
        lastElementPosted=newChatElement;
      });
    } else {
      database.ref('threads/' + currentThread + '/messages').off('child_added', currListener);
    }
  });
}

// Get all threads for user
function updateThreadList() {
  database.ref('users/' + window.userUid + '/threads').once("value").then( function(snapshot) {
    var threadList=new Array()
    for (var key in snapshot.val()) {
      threadList.push(key); // push thread ID keys to list
    }

    var threadDict={};
    var timestampKeys=[];
    var counter=0;
    for (var i = 0; i < threadList.length; i++) {
      (function(cntr) {
        // here the value of i was passed into as the argument cntr
        // and will be captured in this function closure so each
        // iteration of the loop can have it's own value
        var currThreadID=threadList[i];
        memberArray=[];
        console.log(window.userUsername);
        database.ref('/threads/'+currThreadID+'/info/members').once('value').then(function(indexSnap){
          for (var key in indexSnap.val()) {
            if (key!==window.userUsername){
              memberArray.push(key); // push member usernames to list
            }
          }
          //(content, time, senderUsername, threadID)
          var senderString='';
          for (var key in indexSnap.val()){
            if (key!==window.userUsername){
              senderString = senderString+key+' ';
            }
          }
          mkThreadTest(null, null, senderString, currThreadID);
        });
      })(i);
    }
  });
}

      //database.ref('threads/'+currThreadID).once('value').then(function(checkMessSnap){
        /* //CODE FOR GETTING LAST MESSAGE DATA TO USE FOR THREAD BUTTON WHEN WE GET FANCIER
        if (checkMessSnap.child('messages').val()!==null){ // if there are no messages then don't try to get last message data
          database.ref('threads/' + currThreadID + '/messages').limitToLast(1).once("child_added").then( function(lastMsgSnap) {
            threadDict[lastMsgSnap.val().timestamp]=[currThreadID,lastMsgSnap.val().content,lastMsgSnap.val().sender];//TODO add memberslist/name to info pulled\
            timestampKeys.push(lastMsgSnap.val().timestamp);
            if (counter==threadList.length-1) {
              timestampKeys.sort(function(a, b){return b-a}); //sort timestampKeys to be descending (newest thread first)
              clearThreadlist();
              for (i=0; i < timestampKeys.length; i++) {
                ////threadDict[timestampKeys[i]]  gives list: [THREADID, preview_content, sender]
                var currThreadDictObject=threadDict[timestampKeys[i]];
                ////createThreadElement(currThreadDictObject[1], timestampKeys[i], currThreadDictObject[2]);
                firebase.database().ref('/users/'+currThreadDictObject[2].toString()+'/username').once('value').then( function (usernameSnapshot){
                  //(content, time, senderUsername, threadID)
                  mkThreadTest(currThreadDictObject[1], convertTimestamp(timestampKeys[i], true), usernameSnapshot.val(), currThreadDictObject[0]);
                });
              }
              threadListeners=[];
              for (i=0; i<threadList.length; i++) {
                var listener = database.ref('threads/' + currThreadID + '/messages').on('child_changed', function (snapshot) {
                  for (j=0; j<threadListeners.length; j++) {
                    database.ref('threads/' + threadListeners[j][0] + '/messages').off('child_changed', threadListeners[j][1]);
                  }
                  updateThreadList();
                });
                threadListeners.push([currThreadID,listener]);
              }
            }
            counter++;
          });
        } else{
        }
        */
        // NOTE was writing code for pulling memberslist from each thread
        // Promises are hard: https://stackoverflow.com/questions/38362231/how-to-use-promise-in-foreach-loop-of-array-to-populate-an-object?rq=1
        // another:   https://stackoverflow.com/questions/35879695/promise-all-with-firebase-datasnapshot-foreach


/*
function sendMessageToNewThread(content, recipList) {
  var timestamp = Date.now();
  var threadData = {
    info: {
      created: timestamp,
      name: '',
      owner: window.userUid,
    },
    messages: {},
  };
  // generate new thread push key
  var newThreadKey=database.ref('threads').push().key;
  // set thread metadata
  database.ref('threads/' + newThreadKey).set(threadData);
  // push first message to thread
  database.ref('threads/' + newThreadKey + '/messages').push({
    content: content,
    timestamp: timestamp,
    sender: window.userUid,
  });
  // for each recipient, add the thread to their threads key (must set up security so it can't be accessed by people who arent your friend and people who dont own the thread)
  for(var i = 0; i < recipList.length; i++) {
    var recipUid = recipList[i];
    database.ref('users/' + recipUid + '/threads').update({
      [newThreadKey]: true,
    });
  }
}
*/

// Sends message with content to threadId
function sendMessage(content){
  console.log("Sending message: "+content);
  const timestamp = Date.now();
    database.ref('threads/' + currentThread + '/messages/').push({
      content: content,
      timestamp: timestamp,
      sender: window.userUid,
    });
}

// outdated function to pull thread ids and put them into threadlist box. Kept to reference
/*
function getRecipients() {

  const threadsRef=database.ref('users/'+ window.userUid + '/threads');
  //gets all thread uids
  threadsRef.on('child_added', function addToRecipList(snapshot){
    var uidOfThread=snapshot.key;
    database.ref('usernames').orderByValue().equalTo(uidOfThread).once("child_added", function(usernameSnapshot){
      var username=usernameSnapshot.key;
      var newDiv=document.createElement("div");
      var recipTxt=document.createTextNode(username);
      newDiv.className='recipient';
      newDiv.id=username;
      newDiv.appendChild(recipTxt);
      recipScroller.appendChild(newDiv);
      document.getElementById(username).onclick=function(){
        if (window.matchUid !== uidOfThread) {
          clearChat();
          window.matchUid=uidOfThread;
          generateChat();
        }
      };
    });
  });

}
*/

//MODIFIED TO SHOW JUST TIME NOT DATE
//TODO: add argument to change output format
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
    var addition=mm+'/'+dd+'/'+yyyy.toString().slice(0,-2)
    time = time + ' '+ yyyy.toString().slice(0,-2)
    function stripLeadingZerosDate(dateStr){
      return dateStr.split('/').reduce(function(date, datePart){
          return date += parseInt(datePart) + '/'
      }, '').slice(0, -1);
    }
    yyyy=yyyy.toString().slice(0,-2).toString();
    var addition='02/01/'+yyyy;
    addition=addition.split('/').reduce(function(date, datePart){
        return date += parseInt(datePart) + '/'
    }, '').slice(0, -1);
    time=time+' '+addition
  }

	return time;
}

// create functionailty for content box enter to click send button
/*
MESSAGE_CONTENT_OBJECT.addEventListener("keyup", function(event) {
    event.preventDefault();
    // if enter pressed
    if (event.keyCode === 13) {
        btnSend.click();
    }
});
*/

// create functionaily for sending
btnSend.addEventListener('click', e=> {
  var content= msgContent.value;
  sendMessage(content);
  msgContent.value='';
});

btnSignOut.addEventListener('click', e=>{
  firebase.auth().signOut().then(function() {
  console.log('Signed Out');
  }, function(error) {
  console.error('Sign Out Error', error);
  });
});

btnSubmitNewThread.addEventListener('click', e=>{
  var targetUsername=newThreadUsername.value;
  database.ref('/usernames/'+targetUsername).once('value').then(function(usernameSnapshot){
    var targetUid=usernameSnapshot.value;
    var currTime=Date.now();
    var newThreadKey=database.ref('threads').push().key;
    database.ref('threads/'+newThreadKey).set({
      'info':{
        'created':currTime,
        'name':'',
        'owner':window.userUid,
        'members':{
          [window.userUsername]:window.userUid,
          [targetUsername]:targetUid,
        },
      },
    });
    database.ref('users/'+targetUsername+'/threads').update({[newThreadKey]:true});
  });
});

newThreadUsername.addEventListener("keyup", function(event) {
    event.preventDefault();
    // if enter pressed
    if (event.keyCode === 13) {
        btnSubmitNewThread.click();
    }
});

msgContent.addEventListener("keyup", function(event) {
    event.preventDefault();
    // if enter pressed
    if (event.keyCode === 13) {
        btnSend.click();
    }
});

messageScroller.addEventListener('scroll', function(){
  if (messageScroller.scrollTop == 0){
    getMoreMessages()
  }
});



firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    window.userUid = firebaseUser.uid;
    database.ref('/users/'+window.userUid).once('value').then(function(snapshot){
      database.ref('/users/'+window.userUid+'/username').once('value').then( function (usernameSnapshot){
        window.userUsername = usernameSnapshot.val();
        if (snapshot.val()!==null){
          console.log('Updating Threadlist...')
          updateThreadList();
        } else {
          alert("Ya done messed up ya acc.");
          window.location.href = 'sign_up.html';
        }
      });
    });
  }else{
    window.location.href = 'login.html';
  }
});
