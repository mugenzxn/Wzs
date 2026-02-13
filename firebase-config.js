// Configuration Firebase - Wasl Transport
const firebaseConfig = {
    apiKey: "AIzaSyAmTDHA5RMcT0FG_jL8woyxZh9_hBOibbg",
    authDomain: "wasl-55907.firebaseapp.com",
    projectId: "wasl-55907",
    storageBucket: "wasl-55907.firebasestorage.app",
    messagingSenderId: "1031181701536",
    appId: "1:1031181701536:web:74b58a901ad491bc8c94c5",
    measurementId: "G-VP7957QFGP"
  };
  
  // Initialiser Firebase (mode compat)
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  console.log("✅ Firebase connecté au projet wasl-55907 !");
  