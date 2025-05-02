// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZA-_AafepGvi1KyQyNcNbmPhRlx3IXXk",
  authDomain: "learning-4b145.firebaseapp.com",
  databaseURL: "https://learning-4b145-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "learning-4b145",
  storageBucket: "learning-4b145.firebasestorage.app",
  messagingSenderId: "73508727769",
  appId: "1:73508727769:web:89609c4515bcf3b4b087c8",
  measurementId: "G-WK99CKXKQY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);