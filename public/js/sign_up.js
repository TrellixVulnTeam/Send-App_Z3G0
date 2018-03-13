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
  console.log('Clicked Button');
  if (usernameInvalidString) {
    console.log('Valid Username');
    auth.createUserWithEmailAndPassword(txtUsername.value+"@send-app.com", txtPassword.value).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      alert("Error "+errorCode+": "+errorMessage);
    });
  }
});

txtUsername.addEventListener("keyup", function(event) {
    event.preventDefault();
    // if enter pressed
    if (event.keyCode === 13) {
        btnSignup.click();
    }
});

txtPassword.addEventListener("keyup", function(event) {
    event.preventDefault();
    // if enter pressed
    if (event.keyCode === 13) {
        btnSignup.click();
    }
});

firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    window.location.href = 'chat.html';
  }else{
    console.log("Not Logged In");
  }
});
