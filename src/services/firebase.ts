// src/services/firebase.ts
import { initializeApp } from 'firebase/app'

// 幾乎必備的兩個服務
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyC8JERsbXeDq2MLEMqIHlMb5xz8Jq6ctqw',
  authDomain: 'auth-demo-32ad5.firebaseapp.com',
  projectId: 'auth-demo-32ad5',
  storageBucket: 'auth-demo-32ad5.firebasestorage.app',
  messagingSenderId: '507513309880',
  appId: '1:507513309880:web:03e2772dd4575f0452024d',
}
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }