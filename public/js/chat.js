const messageBox=document.getElementById("messageBox");
const messageScroller=document.getElementById("messageScroller");
const btnSignOut=document.getElementById("signOut");
const database = firebase.database();

const recipBox=document.getElementById("recipBox");
const recipScroller=document.getElementById("recipScroller");

const msgContent=document.getElementById("msgContent");
const btnSend=document.getElementById("msgSend");

function generateChat(){
  window.sentRef = database.ref('users/' + window.userUid + '/threads/' + window.matchUid);
  window.recRef = database.ref('users/' + window.matchUid + '/threads/' + window.userUid);
  getSentMessages();
  getRecMessages();
}

function clearChat() {
  messageScroller.innerHTML = "";
}

//var sentRef = firebase.database().ref('users/uid/threads/uid2');

function getSentMessages () {
  window.sentRef.orderByKey().on("child_added", function(snapshot) {
    mkTxtBubble(snapshot.val().content, convertTimestamp(snapshot.val().timestamp), true);
    //alert('Content: ' + snapshot.val().content + '\nTime: ' + snapshot.val().timestamp);
  });
}

//getting match message data
function getRecMessages () {
  window.recRef.orderByKey().on("child_added", function(snapshot) {
    mkTxtBubble(snapshot.val().content, convertTimestamp(snapshot.val().timestamp), false);
    //alert('Content: ' + snapshot.val().content + '\nTime: ' + snapshot.val().timestamp);
  });
}


function sendMessage(content){
  const timestamp = Date.now();
  window.sentRef.push({
    content: content,
    timestamp: timestamp,
  });
}


//figure out css for this shit
function mkTxtBubble (message, time, sent) {
  var mainDiv = document.createElement("div");
  var msgContent=document.createTextNode(message);
  var msgTime = document.createTextNode('[' + time + ']');
  var senderFont=document.createElement("font");

  if (sent) {
    var senderColor='blue';
    var senderName=document.createTextNode(" [You]: ");
  } else {
    var senderColor='red';
    var senderName=document.createTextNode(" [Other Guy]: ");
  }
  senderFont.style.color=senderColor;
  senderFont.appendChild(senderName);
  messageScroller.appendChild(document.createElement('br'));
  messageScroller.appendChild(msgTime);     //used this bc I didn't like small time
  messageScroller.appendChild(senderName);
  messageScroller.appendChild(msgContent);
  
}

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

    /*
    WAS TRYING TO DISPLAY USERNAMES IN ORDER OF RECENT MESSAGES

    var key= snapshot.key

    threadsRef.child(key).orderByKey().limitToLast(1).on('child_added', function makeChatRecipBox(message){
      // message = snapshot of most recent message sent
      console.log(message.val().timestamp);
    });
    */

  });
}

//MODIFIED TO SHOW JUST TIME NOT DATE
function convertTimestamp(timestamp) {
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
  time = h+':'+min+' '+ampm;

	return time;
}

btnSignOut.addEventListener('click', e=>{
  firebase.auth().signOut().then(function() {
  console.log('Signed Out');
  }, function(error) {
  console.error('Sign Out Error', error);
  });
})


/*
function getUsername(uid) {
  database.ref('usernames').orderByChild().equalTo(uid).once('value', function(snapshot) {
    if (snapshot.val() !== null) {
      var username=snapshot.key;
      console.log(username);
    } else {
      console.log("Invalid Username");
    }
  });
}
//change so when clicked on item in scrolling list itll add it

btnConnect.addEventListener('click', e=> {
  var matchUsername=msgRecipient.value.toLowerCase();
  database.ref('usernames').child(matchUsername).once('value', function(snapshot) {
    if (snapshot.val() !== null) {
      window.matchUid=snapshot.val();
      recipBox.style.display = "none";
      messageBox.style.display = "inline-block";
      window.sentRef = database.ref('users/' + window.userUid + '/threads/' + window.matchUid);
      window.recRef = database.ref('users/' + window.matchUid + '/threads/' + window.userUid);
      getSentMessages();
      getRecMessages();
    } else {
      console.log("Invalid Username");
    }
  });
});
*/


btnSend.addEventListener('click', e=> {
  var content= msgContent.value;
  sendMessage(content);
});

firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    window.userUid = firebaseUser.uid;
    getRecipients();

  }else{
    window.location.href = 'login.html';
  }
})
