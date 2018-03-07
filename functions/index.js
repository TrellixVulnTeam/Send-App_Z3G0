const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Decided to use a database trigger here
exports.valAndSetupNewUser = functions.auth.user().onCreate((event) => {
  user=event.data;
  var uid = user.uid.toString();
  var email = user.email.toString();
  var username = null;
  // Checking for email validity
  if (email.indexOf('@send-app.com') === -1 || email.length - email.indexOf('@send-app.com') !== 13 || email.indexOf(' ') !== -1 || email.toLowerCase() !== email) {  // Checking if email is @send-app.com and ends in @send-app.com
    return admin.auth().deleteUser(uid);
  } else {
    username = email.replace('@send-app.com','').toLowerCase();
  }
  // Checking username validity
  if (username.indexOf('.') === -1 && username.indexOf('#') === -1 && username.indexOf('$') === -1 && username.indexOf('[') === -1 && username.indexOf(']') === -1 ) {
    admin.database().ref('/usernames/'+username).once('value').then( function(usernameSnap) {
      if (usernameSnap.val() !== null) {
        admin.auth().deleteUser(uid);
        return 1;
      } else {
        // At this point, email is valid username @send-app.com and username doesnt exist yet
        admin.database().ref('/usernames/').update({
          [username]: uid,
        });
        admin.database().ref('/users/'+uid).set({
            'username': username,
            'threads': {
              '-L51jzGWxwo0eDe0fLwc':true,
            },
            'picture': 'https://www.chcs.org/media/Profile_avatar_placeholder_large-1-200x200.png'
        });
        return 0;
      }
    }).catch(error => {
    console.log(error);
    return admin.auth().deleteUser(uid);
  });
  } else {
    return admin.auth().deleteUser(uid);
  }
});

//adding timestamp to new messages
exports.addMsgTimestampToNewMessage = functions.database.ref('/threads/{threadPushId}/messages/{msgPushId}').onCreate((event) => {
  const timestamp = Date.now();
  return event.data.ref.child('timestamp').set(timestamp);
});

//adding timestamp to new threads
exports.addMsgTimestampToNewThread = functions.database.ref('/threads/{threadPushId}/info').onCreate((event) => {
  const timestamp = Date.now();
  return event.data.ref.child('created').set(timestamp);
});

//adding thread to user threadlist if added to thread
exports.addThreadIdToUserProfile = functions.database.ref('/threads/{threadPushId}/info/members/{username}').onCreate((event) => {
  // check that username exists
  admin.database().ref('/usernames/'+event.params.username).once('value').then(function(usernameSnap) {
    if (usernameSnap.val()===event.data.val()) {
      // Add thread Id to the user's threadlist
      return admin.database().ref('/users/'+event.data.val()+'/threads').update({[event.params.threadPushId]:true});
    } else {
      return admin.database().ref('/threads/'+event.params.threadPushId+'/info/members/'+event.params.username).remove();
    }
  });
});

//removing thread from user threadlist if removed form thread
exports.removeThreadIdFromUserProfile = functions.database.ref('/threads/{threadPushId}/info/members/{username}').onDelete((event) => {
  return admin.database().ref('/users/'+event.data.previous.val()+'/threads/'+event.params.threadPushId).remove();
});

//update message count whenever changed
exports.countNumMessages = functions.database.ref('/threads/{threadPushId}/messages').onWrite((event) => {
  return admin.database().ref('/threads/'+event.params.threadPushId+'/info').update({'messageCount': event.data.numChildren()});
});

//delete thread when owner deletes 'owner' field
exports.cleanUpAfterDeletingThread = functions.database.ref('/threads/{threadPushId}/info/owner').onDelete((event) => {
  //Removing threadID from user threadlists is handled above in removeThreadIdFromUserProfile
  return admin.database().ref('/threads/'+event.params.threadPushId).remove();
});
