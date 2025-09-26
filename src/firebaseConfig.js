// src/firebaseConfig.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <-- Adiciona a importação do Firestore

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhVLgfVlbhAepHsjCAjOWfwxDmP7QHqCc",
  authDomain: "skyburners-app.firebaseapp.com",
  projectId: "skyburners-app",
  storageBucket: "skyburners-app.appspot.com", // Corrigi para .appspot.com, que é o padrão. Verifique se o seu é diferente.
  messagingSenderId: "999989404319",
  appId: "1:999989404319:web:b73818e54e079c987878aa",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app); // <-- Adiciona a exportação da conexão 'db'
