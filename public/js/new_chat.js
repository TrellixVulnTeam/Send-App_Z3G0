const messageBox=document.getElementById("messageBox");
const messageScroller=document.getElementById("messageScroller");
const btnSignOut=document.getElementById("signOut");
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

function createThreadElement() {
  // do whatever html and js you need here
}

function clearThreadlist() {
  // when set html element, set innerhtml to ''
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
  var setEarliestKey=false;
  var displayKeychat=false;
  // turn off when you change current thread: database.ref('threads/' + currentThread + '/messages').off("child_added", currMessageCallback);
  currMessageCallback = database.ref('threads/' + currentThread + '/messages').orderByKey().limitToLast(51).on("child_added", function(snapshot) {
    //find sender from, as of now it's the uid
    if (snapshot.val() === null) {
      displayKeychat=true;
    } else if (setEarliestKey === false && displayKeychat === false) {
      earliestMessageDownloadedKey=snapshot.key;
      setEarliestKey=true;
    } else {
      var newChatElement=createChatElement(snapshot.val().content, snapshot.val().timestamp, snapshot.val().sender);
      WHATEVERELEMENT.appendChild(newChatElement);
    }
  });
}

function getMoreMessages() {
  var setEarliestKey=false;
  var lastElementPosted=null;
  var displayKeychat=false;
  var endKey=earliestMessageDownloadedKey;
  // changing to get object with target chats then go through them
  var currListener = database.ref('threads/' + currentThread + '/messages').orderByKey().endAt(earliestMessageDownloadedKey).limitToLast(21).on('child_added', function(snapshot) {
    if (snapshot.val() === null) {
      displayKeychat=true;
    } else if (setEarliestKey === false && displayKeychat === false) {
      earliestMessageDownloadedKey=snapshot.key;
      setEarliestKey=true;
    } else {
      var newChatElement=createChatElement(snapshot.val().content, snapshot.val().timestamp, snapshot.val().sender);
      if (lastElementPosted === null) {
        MESSAGESELEMENT.insertBefore(newChatElement, MESSAGESELEMENT.firstChild);
      } else if (snapshot.val() !== null) {
        lastElementPosted.after(newChatElement);
      }
      lastElementPosted=newChatElement;
    }
    // close callback when reached end of query
    if (snapshot.key===endKey) {
      database.ref('threads/' + currentThread + '/messages').off('child_added', currListener);
    }
  });


// Get all threads for user
function updateThreadList() {
  var threadList=[];
  database.ref('users/' + window.userUid + '/threads').once("value", function(snapshot) {
    // threadList is global list of threads in arbitrary order
    // could add check here to ensure thread owners are in friends list:
    /*
    database.ref('threads/' + snapshot.key + '/info/owner').once('value', function(data) {
      var threadOwner = data.val();
    });
    database.ref('users/' + window.userUid + '/friends/' + threadOwner).once('value', function(data) {
      if (data.val() === true) {
        threadList.push(snapshot.key);
      }
    });
    */
    for (var key in snapshot.val()) {
      threadList.push(key); // push thread ID keys to list
    }
  }).then(function (snapshot) {
    var threadDict={};
    var timestampKeys=[];
    var counter=0;
    for (i = 0; i < threadList.length; i++) {
      database.ref('threads/' + threadList[i] + '/messages').orderByKey().limitToLast(1).once("child_added", function(lastMsgSnap) {
        threadDict[lastMsgSnap.timestamp]=[threadList[i],lastMsgSnap.content,lastMsgSnap.sender];//TODO add memberslist/name to info pulled
        timestampKeys.push(lastMsgSnap.val().timestamp);
        if (counter==threadList.length-1) {
          timestampKeys.sort(function(a, b){return b-a}); //sort timestampKeys to be descending (newest thread first)
          clearThreadlist();
          for (i=0; i < timestampKeys.length; i++) {
            //threadDict[timestampKeys[i]]  gives list: [THREADID, preview_content, sender]
            const currThreadDictObject=threadDict[timestampKeys[i]];
            createThreadElement(currThreadDictObject[1], timestampKeys[i], currThreadDictObject[2]); //(content, timestamp, sender)
          }
          threadListeners=[];
          for (i=0; i<threadList.length; i++) {
            var listener = database.ref('threads/' + threadList[i] + '/messages').on('child_changed', function (snapshot) {
              for (j=0; j<threadListeners.length; j++) {
                database.ref('threads/' + threadListeners[j][0] + '/messages').off('child_changed', threadListeners[j][1]);
              }
              updateThreadListElement();
            });
            threadListeners.push([threadList[i],listener]);
          }
        }
        counter++;
      });
    }
  });
}


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

// Sends message with content to threadId
function sendMessage(content){
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
    var addition=mm+'/'+dd+'/'+yyyy.substring(2)
    time = time + ' '+ yyyy.substring(2)
    function stripLeadingZerosDate(dateStr){
      return dateStr.split('/').reduce(function(date, datePart){
          return date += parseInt(datePart) + '/'
      }, '').slice(0, -1);
    }
    yyyy=yyyy.toString().substring(2);
    var addition='02/01/'+yyyy;
    addition=addition.split('/').reduce(function(date, datePart){
        return date += parseInt(datePart) + '/'
    }, '').slice(0, -1);
    time=time+' '+addition
  }

	return time;
}

// create functionaily for sign out button
btnSignOut.addEventListener('click', e=>{
  firebase.auth().signOut().then(function() {
  console.log('Signed Out');
  }, function(error) {
  console.error('Sign Out Error', error);
  });
})

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
});

firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    window.userUid = firebaseUser.uid;
    updateThreads(0);
  }else{
    window.location.href = 'login.html';
  }
})
