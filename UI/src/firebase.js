// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCK6NekdnqusHFQht9i4NMbyB4_LfbyY5E",
  authDomain: "mobile-otp-82bb2.firebaseapp.com",
  projectId: "mobile-otp-82bb2",
  storageBucket: "mobile-otp-82bb2.firebasestorage.app",
  messagingSenderId: "597864110685",
  appId: "1:597864110685:web:00bf971b55e23663e98bb4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);