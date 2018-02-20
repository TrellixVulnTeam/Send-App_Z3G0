const txtUsername=document.getElementById("txtUsername");
const txtPassword=document.getElementById("txtPassword");
const btnSignup=document.getElementById("btnSignup");
const divUsernameCheck=document.getElementById("usernameCheck");
const usernameCheckCircle=document.getElementById("usernameCheckCircle");
const usernameExistsText=document.getElementById("usernameExistsText");
const usernameInvalidString=document.getElementById("usernameInvalidString");
var usernameValid=false;

const database = firebase.database();
const auth=firebase.auth();

// check for valid username dynamically
txtUsername.onkeyup = function checkUsername(){
  var username=txtUsername.value.toLowerCase();
  if (username.indexOf('.') > -1||username.indexOf('#') > -1||username.indexOf('$') > -1||username.indexOf('[') > -1||username.indexOf(']') > -1) {
    usernameCheckCircle.style.background='red';
    usernameInvalidString.style.display='inline-block';
    usernameExistsText.style.display='none';
    usernameValid=false;
  } else if (username) {
    usernameInvalidString.style.display='none';
    divUsernameCheck.style.display="inline-block";
    database.ref('usernames').once('value', function(snapshot) {
      if (snapshot.hasChild(username)) {
        usernameCheckCircle.style.background='red';
        usernameExistsText.style.display='inline-block';
        usernameValid=false;
      } else {
        usernameCheckCircle.style.background='green';
        usernameExistsText.style.display='none';
        usernameValid=true;
      }
    });
  }
};

btnSignup.addEventListener('click', e=> {
  if (usernameValid) {
    var username = txtUsername.value.toString().toLowerCase();
    var password = txtPassword.value;
    auth.createUserWithEmailAndPassword(username + '@send-app.com',password);
  }
});

firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    if (usernameValid) {
      var username=txtUsername.value.toString().toLowerCase();
      // add username to usernames
      database.ref('usernames').update({
        [username]: firebaseUser.uid,
      });
      // add username to uid
      database.ref('users/' + firebaseUser.uid).set({
        username: username,
      });
    }
    window.location.href = 'chat.html';
  }else{
    console.log("Not Logged In");
  }
});
