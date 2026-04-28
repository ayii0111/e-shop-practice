// src/services/firebase.ts
import { initializeApp } from 'firebase/app'

// 幾乎必備的兩個服務
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// const firebaseConfig = {
//   apiKey: 'AIzaSyAS8AlSV-rbncy5hVvg-DkPaL_z1d9BPMM',
//   authDomain: 'findwork-b0600.firebaseapp.com',
//   projectId: 'findwork-b0600',
//   storageBucket: 'findwork-b0600.firebasestorage.app',
//   messagingSenderId: '146087924239',
//   appId: '1:146087924239:web:43a9c48ee97bc02491497a',
//   measurementId: 'G-8V7ZDZETH9',
// }

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