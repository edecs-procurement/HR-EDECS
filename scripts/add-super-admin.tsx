import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { getDatabase, ref, set } from "firebase/database"

// Firebase configuration
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
const auth = getAuth(app)
const db = getDatabase(app)

async function addSuperAdmin() {
  try {
    // User details
    const email = "ah.tarek@edecs.com"
    const password = "hawwwe9zA@"
    const name = "Ahmed Gendy"
    const department = "Business Applications"
    const role = "super admin"

    console.log("Creating user account...")

    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    console.log("User created successfully with UID:", user.uid)

    // Update user profile with display name
    await updateProfile(user, { displayName: name })
    console.log("User profile updated with name:", name)

    // Add user to Realtime Database with super admin role
    await set(ref(db, `users/${user.uid}`), {
      name,
      email,
      department,
      role,
      createdAt: new Date().toISOString(),
    })

    console.log("User added to database as super admin")

    // Set system status to initialized
    await set(ref(db, "public/systemStatus"), {
      initialized: true,
      initializedAt: new Date().toISOString(),
    })

    console.log("System status set to initialized")
    console.log("Super admin user created successfully!")
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      console.log("User already exists. You can update their role in the Firebase console.")

      // Even if the user exists, make sure the system status is set
      try {
        await set(ref(db, "public/systemStatus"), {
          initialized: true,
          initializedAt: new Date().toISOString(),
        })
        console.log("System status set to initialized")
      } catch (statusError) {
        console.error("Error setting system status:", statusError)
      }
    } else {
      console.error("Error creating super admin:", error)
    }
  }
}

// Execute the function
addSuperAdmin()
