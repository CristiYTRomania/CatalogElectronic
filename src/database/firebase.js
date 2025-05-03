// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNeic3g7sGVCz0rI2TewmRu9NTi2H6Giw",
  authDomain: "catalog-cce7f.firebaseapp.com",
  projectId: "catalog-cce7f",
  storageBucket: "catalog-cce7f.appspot.com",
  messagingSenderId: "1050076419786",
  appId: "1:1050076419786:web:066fde7513bc7b91430633",
  measurementId: "G-QKL46BL0DV",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
