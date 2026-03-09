// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDT_cbIEMkZvrvLr5beKGVAQZLLJSjliZo",
  authDomain: "loraguard-e2d70.firebaseapp.com",
  databaseURL: "https://loraguard-e2d70-default-rtdb.firebaseio.com",
  projectId: "loraguard-e2d70",
  storageBucket: "loraguard-e2d70.firebasestorage.app",
  messagingSenderId: "990271413011",
  appId: "1:990271413011:web:7c9a9f1dadd795491318e6",
  measurementId: "G-WWV17TFNM3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);