// auth and db are now provided by firebase-config.js

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const nameInput = document.getElementById('display-name-input');
    const emailDisplay = document.getElementById('email-display');
    const saveMsg = document.getElementById('save-msg');
    const logoutBtn = document.getElementById('logout-btn');

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
