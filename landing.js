// --- Firebase Configuration ---
// ÖNEMLİ: Firebase Console'dan (Proje Ayarları) aldığınız bilgileri buraya yapıştırın!
const firebaseConfig = {
    apiKey: "AIzaSyCxPH0ohsOMat7cuww92JqGZ5WGKeh-xYY",
    authDomain: "noctis-book.firebaseapp.com",
    projectId: "noctis-book",
    storageBucket: "noctis-book.firebasestorage.app",
    messagingSenderId: "15928220680",
    appId: "1:15928220680:web:a72396eaa6387bb83d45bd",
    measurementId: "G-VTW367KQWE"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Animations & Scroll Logic ---
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.feature-card, .section-title, .cta-box');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // --- Page Transitions ---
    const transitionOverlay = document.createElement('div');
    transitionOverlay.id = 'page-transition';
    transitionOverlay.classList.add('hidden');
    transitionOverlay.innerHTML = '<div class="transition-logo">Sonsuz Kitap</div>';
    document.body.appendChild(transitionOverlay);

    window.addEventListener('load', () => {
        setTimeout(() => {
            transitionOverlay.classList.add('hidden');
            transitionOverlay.classList.remove('active');
        }, 300);
    });

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.endsWith('.html') && !href.startsWith('#')) {
                e.preventDefault();
                transitionOverlay.classList.remove('hidden');
                transitionOverlay.classList.add('active');
                document.body.classList.add('page-exit');
                setTimeout(() => { window.location.href = href; }, 600);
            }
        });
    });

    // --- Auth Logic ---
    const authModal = document.getElementById('auth-modal');
    const loginOpen = document.getElementById('login-open');
    const modalClose = authModal.querySelector('.modal-close');
    const tabBtns = authModal.querySelectorAll('.tab-btn');
    const authForms = authModal.querySelectorAll('.auth-form');

    const openModal = () => {
        authModal.style.display = 'flex';
        setTimeout(() => authModal.classList.add('open'), 10);
    };

    const closeModal = () => {
        authModal.classList.remove('open');
        setTimeout(() => authModal.style.display = 'none', 400);
    };

    loginOpen.onclick = (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                auth.signOut().then(() => window.location.reload());
            }
        } else {
            openModal();
        }
    };
    
    modalClose.onclick = closeModal;
    authModal.onclick = (e) => { if (e.target === authModal) closeModal(); };

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const tab = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tab}-form`) form.classList.add('active');
            });
        };
    });

    // --- Firebase Auth Operations ---
    const registerForm = document.getElementById('register-form');
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = registerForm.querySelector('input[type="text"]').value;
        const email = registerForm.querySelectorAll('input[type="email"]')[0].value;
        const password = registerForm.querySelector('input[type="password"]').value;

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            
            // İlk kayıt sonrası kullanıcı bilgisini Firestore'a (gerekirse) kaydedebiliriz
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Başarıyla kayıt oldunuz!');
            window.location.href = 'dashboard.html';
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    const loginForm = document.getElementById('login-form');
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = 'dashboard.html';
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    // Unified Navbar Logic
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    const userInfoName = document.getElementById('user-info-name');
    const loginOpenBtn = document.getElementById('login-open');
    const loggedInMenu = document.getElementById('logged-in-menu');

    auth.onAuthStateChanged(user => {
        const heroBtns = document.querySelectorAll('.btn-hero');
        if (user) {
            if (loginOpenBtn) loginOpenBtn.style.display = 'none';
            if (loggedInMenu) loggedInMenu.style.display = 'flex';
            if (userInfoName) userInfoName.textContent = user.displayName || 'Yazar';
            
            heroBtns.forEach(btn => {
                if (btn.getAttribute('href') === 'editor.html') btn.onclick = null;
            });

            if (profileTrigger) {
                profileTrigger.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    profileDropdown.classList.toggle('show');
                };
            }
        } else {
            if (loginOpenBtn) {
                loginOpenBtn.style.display = 'block';
                loginOpenBtn.onclick = (e) => {
                    e.preventDefault();
                    openModal();
                };
            }
            if (loggedInMenu) loggedInMenu.style.display = 'none';

            heroBtns.forEach(btn => {
                if (btn.getAttribute('href') === 'editor.html') {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        openModal();
                    };
                }
            });
        }
    });

    // Logout handling for all pages
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            auth.signOut().then(() => window.location.href = 'index.html');
        };
    }

    // Close dropdown on click outside
    window.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.classList.contains('show')) {
            if (!profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        }
    });
});
