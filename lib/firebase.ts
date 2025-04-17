import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyB81wK2yjMcbtGAxd-zZHorL8biJdQEEtE",
  authDomain: "procurement-edecs.firebaseapp.com",
  databaseURL: "https://procurement-edecs-default-rtdb.firebaseio.com",
  projectId: "procurement-edecs",
  storageBucket: "procurement-edecs.appspot.com",
  messagingSenderId: "286460493603",
  appId: "1:286460493603:web:b0cf208790e3824c8dd696",
  measurementId: "G-GC4D2RJW11",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const rtdb = getDatabase(app) // Realtime Database
export const storage = getStorage(app)

export default app
