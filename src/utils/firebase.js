// src/utils/firebase.js - Инициализация Firebase для онлайн-комнат
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyC2-xJe67RT2_hlpu82l1apkCyLtNUgxDM",
  authDomain: "campgame-156ac.firebaseapp.com",
  databaseURL: "https://campgame-156ac-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "campgame-156ac",
  storageBucket: "campgame-156ac.firebasestorage.app",
  messagingSenderId: "287989185216",
  appId: "1:287989185216:web:7c684d36d22f4d0346cb25",
  measurementId: "G-MS17TVJBJ4"
};

export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Предварительный прогрев WebSocket-соединения при загрузке приложения.
// Это устраняет задержку первого клика (когда TLS/WebSocket рукопожатие идет в Европу).
try {
  onValue(ref(database, '.info/connected'), () => {}, { onlyOnce: false });
} catch (e) {
  console.warn('Firebase pre-warm connection:', e);
}
