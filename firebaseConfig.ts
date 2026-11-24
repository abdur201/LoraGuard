// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC9ChJKmgpLdG64B2bxGh2lXT6wh00obUA",
  authDomain: "esp32-deneme-72093.firebaseapp.com",
  databaseURL: "https://esp32-deneme-72093-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "esp32-deneme-72093",
  storageBucket: "esp32-deneme-72093.firebasestorage.app",
  messagingSenderId: "1062955559068",
  appId: "1:1062955559068:android:6f3f72d7c593e69614e559"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);