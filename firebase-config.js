// --- Unified Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyCxPH0ohsOMat7cuww92JqGZ5WGKeh-xYY",
    authDomain: "noctis-book.firebaseapp.com",
    projectId: "noctis-book",
    storageBucket: "noctis-book.firebasestorage.app",
    messagingSenderId: "15928220680",
    appId: "1:15928220680:web:a72396eaa6387bb83d45bd",
    measurementId: "G-VTW367KQWE"
};

// Initialize Firebase once
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global instances
const auth = firebase.auth();
const db = firebase.firestore();

// Global closeModal for all modals
window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 400);
    }
};
