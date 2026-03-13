import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCXv6LCno8Q9T58cnL-TEi596XCWdC1Lhg",
    authDomain: "dummy-47193.firebaseapp.com",
    databaseURL: "https://dummy-47193-default-rtdb.firebaseio.com",
    projectId: "dummy-47193",
    storageBucket: "dummy-47193.firebasestorage.app",
    messagingSenderId: "1072586042806",
    appId: "1:1072586042806:web:6ea7c1ec05969d01d5e517",
    measurementId: "G-Y5YDFCX3E8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
