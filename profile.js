// auth and db are now provided by firebase-config.js

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const nameInput = document.getElementById('display-name-input');
    const emailDisplay = document.getElementById('email-display');
    const saveMsg = document.getElementById('save-msg');
    const logoutBtn = document.getElementById('logout-btn');

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-actions');

    if (menuToggle && navLinks) {
        menuToggle.onclick = (e) => {
            e.stopPropagation();
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        };

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // Profile Dropdown logic
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileTrigger && profileDropdown) {
        profileTrigger.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        };
        window.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        nameInput.value = user.displayName || '';
        emailDisplay.value = user.email || '';
    });

    profileForm.onsubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        try {
            await user.updateProfile({
                displayName: nameInput.value
            });
            
            saveMsg.style.display = 'block';
            setTimeout(() => {
                saveMsg.style.display = 'none';
            }, 3000);
        } catch (err) {
            alert('Güncelleme hatası: ' + err.message);
        }
    };

    logoutBtn.onclick = (e) => {
        e.preventDefault();
        if (confirm(translations[currentLang].logout_confirm)) {
            auth.signOut().then(() => window.location.href = 'index.html');
        }
    };
});
