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

var messagesDownloaded=0;

// var to keep track of last message downloaded
var earliestMessageDownloadedKey='';

// threadList is global list of threads in arbitrary order
var threadList=[];

// currentThread is global string with threadID of visible thread messages
var currentThread=null;

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

function mkThreadTest (mainNameOrMembersList, content, time, senderUsername, threadID) {
  console.log("Making thread with memberlist: "+mainNameOrMembersList+' content: '+content+' time: '+time+' sender: '+senderUsername+' ID: '+threadID);
  var newDiv=document.createElement("div");
  var recipTxt=document.createTextNode(mainNameOrMembersList);
  newDiv.className='recipient';
  newDiv.appendChild(recipTxt);
  newDiv.id=threadID;
  newDiv.onclick=function(){
    if (currentThread !== newDiv.id) {
      if (currentThread!= null){
        database.ref('threads/' + currentThread + '/messages').off('child_added', currMessageCallback);
      }
      currentThread = newDiv.id;
      messagesDownloaded=0;
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
// TODO fix message duplication with canceling pulling if no more messages
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
  /*
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
  */
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

// Get all threads for user
function updateThreadList() {
  database.ref('users/' + window.userUid + '/threads').once("value", function(snapshot) {
    var threadList=new Array()
    for (var key in snapshot.val()) {
      threadList.push(key); // push thread ID keys to list
    }
    // generate thread listeners
    threadListeners=[];
    for (i=0; i<threadList.length; i++) {
      var listener = database.ref('threads/' + threadList[i] + '/messages').on('child_changed', function (snapshot) {
        for (j=0; j<threadListeners.length; j++) {
          database.ref('threads/' + threadListeners[j][0] + '/messages').off('child_changed', threadListeners[j][1]);
        }
        updateThreadList();
      });
      threadListeners.push([threadList[i],listener]);
    }
    var endThreadId=threadList[threadList.length-1];
    var threadDict={};
    var timestampKeys=[];
    for (var i = 0; i < threadList.length; i++) {
      (function(i) {
        // here the value of i was passed into as the argument cntr
        // and will be captured in this function closure so each
        // iteration of the loop can have it's own value
        database.ref('threads/'+threadList[i]+'/info').once('value').then( function(infoSnap){
          if (snapshot.child(threadList[i]).val()===true || snapshot.child(threadList[i]).val()===null || snapshot.child(threadList[i]).val()===''){  // if no thread name assigned
            //(content, time, senderUsername, threadID)
            var senderString='';
            for (var key in infoSnap.child('members').val()){
              if (key!==window.userUsername){
                senderString = senderString+key+' ';
              }
            }
            //mkThreadTest(null,null, null, senderString, threadList[i]);
          } else {  // if thread name assigned
            senderString=snapshot.child(threadList[i]).val();
            //mkThreadTest(null,null,null,infoSnap.child('name').val(),threadList[i]);
          }

          // get last message sent metadata
          //CODE FOR GETTING LAST MESSAGE DATA TO USE FOR THREAD BUTTON WHEN WE GET FANCIER
          if (infoSnap.child('messageCount').val()!==null && infoSnap.child('messageCount').val()!==0){ // If there are messages, pull last one
            database.ref('threads/' + threadList[i] + '/messages').limitToLast(1).once("child_added").then( function(lastMsgSnap) {
              // [timestamp]=[threadID, lastMsgContent, lastMsgSender, senderString(thread name if applicable)]
              threadDict[lastMsgSnap.val().timestamp]=[threadList[i], lastMsgSnap.val().content, lastMsgSnap.val().sender, senderString];
              timestampKeys.push(lastMsgSnap.val().timestamp);
              if (endThreadId === threadList[i]) { // if last thread, push them all
                timestampKeys.sort(function(a, b){return a-b}); //sort timestampKeys to be descending (newest thread first)
                clearThreadlist();
                for (var j=0; j < timestampKeys.length; j++) {
                  (function(j) {
                    ////threadDict[timestampKeys[i]]  gives list: [THREADID, preview_content, sender]
                    var currThreadDictObject=threadDict[timestampKeys[j]];
                    ////createThreadElement(currThreadDictObject[1], timestampKeys[i], currThreadDictObject[2]);

                    if (currThreadDictObject[2]!==null){
                      firebase.database().ref('/users/'+currThreadDictObject[2].toString()+'/username').once('value').then( function (usernameSnapshot){
                        mkThreadTest(currThreadDictObject[3], currThreadDictObject[1], convertTimestamp(timestampKeys[j], true), usernameSnapshot.val(), currThreadDictObject[0]);
                      });
                    } else {
                      mkThreadTest(currThreadDictObject[3], null, null, null, currThreadDictObject[0]);
                    }
                  })(j);
                }
              }
            });
          } else{ // No messages
            threadDict[infoSnap.child('created').val()]=[threadList[i],null,null,senderString];
            timestampKeys.push(infoSnap.child('created').val());
            if (endThreadId === threadList[i]) { // if last thread, push them all
              timestampKeys.sort(function(a, b){return a-b}); //sort timestampKeys to be descending (newest thread first)
              clearThreadlist();
              for (var j=0; j < timestampKeys.length; j++) {
                (function(j) {
                  ////threadDict[timestampKeys[i]]  gives list: [THREADID, preview_content, sender]
                  var currThreadDictObject=threadDict[timestampKeys[j]];
                  ////createThreadElement(currThreadDictObject[1], timestampKeys[i], currThreadDictObject[2]);

                  if (currThreadDictObject[2]!==null){
                    firebase.database().ref('/users/'+currThreadDictObject[2].toString()+'/username').once('value').then( function (usernameSnapshot){
                      mkThreadTest(currThreadDictObject[3], currThreadDictObject[1], convertTimestamp(timestampKeys[j], true), usernameSnapshot.val(), currThreadDictObject[0]);
                    });
                  } else {
                    mkThreadTest(currThreadDictObject[3], null, null, null, currThreadDictObject[0]);
                  }
                })(j);
              }
            }
          }
        });
      }) (i);
    }
  });
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
/*
function sendFriendRequest(useruid){
  console.log('Setting users/'+useruid+'/friendReq/'+window.userUsername+' to '+window.userUid);
  database.ref('users/'+useruid+'/friendReq').update({[window.userUsername]: window.userUid});
}

// create functionailty for content box enter to click send button

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
    var targetUid=usernameSnapshot.val();
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
    newThreadUsername.value='';
    updateThreadList();
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

/*
function addUsersByUsername(newThreadKey, usernameList, numAdded){
  database.ref('/usernames/'+usernameList[numAdded]).once('value').then(function(usernameSnapshot){
    var targetUid=usernameSnapshot.val();
    database.ref('threads/'+newThreadKey+'/members').update({[usernameList[numAdded]]:targetUid});
    numAdded++;
    if (numAdded !== usernameList.length){
      addUsersByUsername(newThreadKey, usernameList, numAdded);
    }
}
*/

firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    window.userUid = firebaseUser.uid;
    database.ref('/users/'+window.userUid).once('value').then(function(snapshot){
      database.ref('/users/'+window.userUid+'/username').once('value').then( function (usernameSnapshot){
        window.userUsername = usernameSnapshot.val();
        if (snapshot.val()!==null){
          database.ref('users/'+window.userUid+'/threads').on('child_changed', function(snapshot){
            updateThreadList();
          });
          updateThreadList();
        } else {
          alert("Ya done messed up ya account");
          window.location.href = 'sign_up.html';
        }
      });
    });
  }else{
    window.location.href = 'login.html';
  }
});
