// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Correct and verified Firebase configuration
const firebaseConfig = {
  "projectId": "vtu-assistant-rkmf1",
  "appId": "1:998939257663:web:1b33f669b722eaa991c18a",
  "storageBucket": "vtu-assistant-rkmf1.firebasestorage.app",
  "apiKey": "AIzaSyAWfHPsEOU50o5oLLNKF0YycHlyNF6gjKA",
  "authDomain": "vtu-assistant-rkmf1.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "998939257663"
};

let app: FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const auth = getAuth(app);

export { app, auth };
