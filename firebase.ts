import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// This configuration has been updated with your Firebase project details.
const firebaseConfig = {
  apiKey: "AIzaSyAviXAzUk3G_oInyYql401xVX94I-GmOGs",
  authDomain: "ai-chatbot-434f1.firebaseapp.com",
  projectId: "ai-chatbot-434f1",
  storageBucket: "ai-chatbot-434f1.appspot.com",
  messagingSenderId: "768495308848",
  appId: "1:768495308848:web:762ceef354841a22399df5",
  measurementId: "G-N7NZT8TCYX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);