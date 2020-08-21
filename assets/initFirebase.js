//https://firebase.google.com/docs/web/setup
//project: fogeinator
var firebaseConfig = {
  apiKey: "AIzaSyAIMp3JESFOhvSTxI_82d_e1I_ohaSzw0k",
  authDomain: "mlkittest-53d8f.firebaseapp.com",
  databaseURL: "https://mlkittest-53d8f.firebaseio.com",
  projectId: "mlkittest-53d8f",
  storageBucket: "mlkittest-53d8f.appspot.com",
  messagingSenderId: "1039507463020",
  appId: "1:1039507463020:web:895dd783cecd733a1cb149",
  measurementId: "G-5FNZ3KSDW0"
};
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  console.log("firebase and analytics initialised");
}