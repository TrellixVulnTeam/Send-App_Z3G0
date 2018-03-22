const database = firebase.database();
const auth=firebase.auth();

function initializeApp(){
  const txtUsername=document.getElementById("txtUsername");
  const txtPassword=document.getElementById("txtPassword");
  const btnSignup=document.getElementById("btnSignup");
  const divUsernameCheck=document.getElementById("usernameCheck");
  const usernameCheckCircle=document.getElementById("usernameCheckCircle");
  const usernameExistsText=document.getElementById("usernameExistsText");
  const usernameInvalidString=document.getElementById("usernameInvalidString");
  var usernameValid=false;


  txtUsername.onkeyup = function checkUsername(){
    var username=txtUsername.value.toString().toLowerCase();
    if (username.indexOf('.') > -1||username.indexOf('#') > -1||username.indexOf('$') > -1||username.indexOf('[') > -1||username.indexOf(']') > -1) {
      divUsernameCheck.style.display='inline-block';
      usernameCheckCircle.style.background='red';
      usernameInvalidString.style.display='inline-block';
      usernameExistsText.style.display='none';
      usernameValid=false;
    } else if (username!=='') {
      usernameInvalidString.style.display='none';
      divUsernameCheck.style.display="inline-block";
      database.ref('usernames/'+username).once('value').then( function(snapshot) {
        if (snapshot.val()==null) {
          usernameCheckCircle.style.background='green';
          usernameExistsText.style.display='none';
          usernameValid=true;
        } else {
          usernameCheckCircle.style.background='red';
          usernameExistsText.style.display='inline-block';
          usernameValid=false;
        }
      });
    } else {
      divUsernameCheck.style.display='none';
      usernameCheckCircle.style.background='green';
      usernameExistsText.style.display='none';
      usernameInvalidString.style.display='none';
    }
  };

  btnSignup.addEventListener('click', e=> {
    console.log('Clicked Button');
    if (usernameInvalidString) {
      console.log('Valid Username');
      auth.createUserWithEmailAndPassword(txtUsername.value.toString().toLowerCase()+"@send-app.com", txtPassword.value).catch(function(error) {
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
}
//new accounts
function checkForAccountSetup(uid){
  database.ref('users/'+uid).once('value').then( function (snapshot){
    if (snapshot.val()===null){
      document.body.background='gray.png';
      document.body.innerHTML='<div class = "row"><div class = "col s12 m6 push-s0 push-m3"><div class = "card-panel red lighten-2" style = " overflow: overflow;"><div class="card-content valign center" style = "font-size: 28px; color: whitesmoke;">Please wait while we set up your account...</div><div class="progress"><div class="indeterminate"></div></div><div id="buttonDiv" class="card-content valign center" style = "font-size: 16px; color: whitesmoke;">We are refreshing every 3 seconds automatically,but if you are impatient=> </div></div></div></body>'
      <a class="waves-effect waves-light btn">Manual Refresh</a>
      var refreshButton=document.createElement('a');\
      refreshButton.setAttribute('class', 'waves-effect waves-light btn');
      refreshButton.innerHTML='Manual Refresh';
      refreshButton.addEventListener('click', e=> {
        checkForAccountSetup(uid);
      });
      document.getElementById('buttonDiv').appendChild(refreshButton);
      await wait(3000);
      checkForAccountSetup(uid);
      //initializeApp();
    } else {
      window.location.href = 'chat.html';
    }
  })
}

firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    checkForAccountSetup(firebaseUser.uid);
  }else{
    console.log("Not Logged In");
    initializeApp();
  }
});
