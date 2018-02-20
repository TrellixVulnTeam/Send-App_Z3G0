const txtUsername=document.getElementById("txtUsername");
const txtPassword=document.getElementById("txtPassword");
const btnLogin=document.getElementById("btnLogin");
const auth=firebase.auth();

btnLogin.addEventListener('click', e =>{
  const username=txtUsername.value.toString().toLowerCase();
  const pass=txtPassword.value;
  const auth=firebase.auth();
  auth.signInWithEmailAndPassword(email + '@send-app.com',pass);
});

firebase.auth().onAuthStateChanged(firebaseUser=>{
  if(firebaseUser){
    window.location.href = 'chat.html';
  }else{
    console.log("Logged Out");
  }
});
