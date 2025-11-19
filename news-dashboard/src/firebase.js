// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-QvS6GaTcLyHM3AkonVuRSsNtD6dQ3Ec",
  authDomain: "tweetagent-6e113.firebaseapp.com",
  projectId: "tweetagent-6e113",
  storageBucket: "tweetagent-6e113.firebasestorage.app",
  messagingSenderId: "507886903732",
  appId: "1:507886903732:web:dcf3d808f59df9cb9c52e1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);