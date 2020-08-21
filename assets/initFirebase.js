//project: fogeinator
var firebaseConfig = {
  apiKey: "AIzaSyDXvTGjvmD1EIp9v_Kiia4E7YHXcuKyCgk",
  authDomain: "fogeinator.firebaseapp.com",
  databaseURL: "https://fogeinator.firebaseio.com",
  projectId: "fogeinator",
  storageBucket: "fogeinator.appspot.com",
  messagingSenderId: "977909330534",
  appId: "1:977909330534:web:bdb11530a9dde1060133a7",
  measurementId: "G-F75Z0N16Y9"
};

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
  console.log("firebase initialized");
}
firebase.analytics();