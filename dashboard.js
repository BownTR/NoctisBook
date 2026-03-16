// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyCxPH0ohsOMat7cuww92JqGZ5WGKeh-xYY",
    authDomain: "noctis-book.firebaseapp.com",
    projectId: "noctis-book",
    storageBucket: "noctis-book.firebasestorage.app",
    messagingSenderId: "15928220680",
    appId: "1:15928220680:web:a72396eaa6387bb83d45bd",
    measurementId: "G-VTW367KQWE"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Global closeModal for inline onclick
window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 400);
    }
};

const handleDropdownLogic = () => {
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileTrigger && profileDropdown) {
        profileTrigger.onclick = (e) => {
            console.log("Profile clicked"); // Debug
            e.preventDefault();
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        };

        window.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    } else {
        console.error("Profile elements not found:", { profileTrigger, profileDropdown });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const userNameEl = document.getElementById('user-name');
    const totalBooksEl = document.getElementById('total-books');
    const totalChaptersEl = document.getElementById('total-chapters');
    const booksGrid = document.getElementById('books-grid');
    const logoutBtn = document.getElementById('logout-btn');

    // Modals
    const createBookModal = document.getElementById('create-book-modal');
    const openCreateBtn = document.getElementById('open-create-book');
    const createBookForm = document.getElementById('create-book-form');
    
    const chaptersOverlay = document.getElementById('chapters-overlay');
    const overlayBookTitle = document.getElementById('overlay-book-title');
    const overlayBookStats = document.getElementById('overlay-book-stats');
    const overlayChaptersList = document.getElementById('overlay-chapters-list');
    const startWritingBtn = document.getElementById('start-writing-btn');

    let userBooks = [];

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        userNameEl.textContent = user.displayName ? user.displayName.split(' ')[0] : 'Yazar';
        const userInfoName = document.getElementById('user-info-name');
        if (userInfoName) userInfoName.textContent = user.displayName || 'Yazar';
        
        handleDropdownLogic();
        loadBooks(user.uid);
    });

    const loadBooks = async (uid) => {
        try {
            console.log("Kitaplar yükleniyor: ", uid);
            // Index gereksinimini ortadan kaldırmak için orderBy'ı geçici olarak kaldırıyoruz
            const snapshot = await db.collection('user_books')
                .where('userId', '==', uid)
                .get();
            
            userBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Manuel sıralama (En yeni en üstte)
            userBooks.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.seconds : 0;
                const dateB = b.createdAt ? b.createdAt.seconds : 0;
                return dateB - dateA;
            });

            console.log("Yüklenen Kitap Sayısı: ", userBooks.length);
            renderBooks();
            calculateGlobalStats();
        } catch (err) {
            console.error('Yükleme hatası detayı:', err);
            alert('Veriler çekilirken bir sorun oluştu: ' + err.message);
            booksGrid.innerHTML = '<div class="loading-spinner">Bilinmeyen bir hata oluştu. Lütfen sayfayı yenileyin.</div>';
        }
    };

    const renderBooks = () => {
        booksGrid.innerHTML = '';
        if (userBooks.length === 0) {
            booksGrid.innerHTML = '<div class="loading-spinner">Henüz kitap oluşturmadınız.</div>';
            return;
        }

        userBooks.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            const coverImg = book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
            
            card.innerHTML = `
                <div class="book-cover-area">
                    <div class="book-spine-effect"></div>
                    <img src="${coverImg}" alt="${book.title}">
                </div>
                <div class="book-info-minimal">
                    <h3>${book.title}</h3>
                    <span>${book.chapters ? book.chapters.length : 0} Bölüm</span>
                </div>
            `;

            card.onclick = () => showChaptersOverlay(book);
            booksGrid.appendChild(card);
        });
    };

    const calculateGlobalStats = () => {
        let chaptersCount = 0;
        userBooks.forEach(book => {
            chaptersCount += (book.chapters || []).length;
        });
        totalBooksEl.textContent = userBooks.length;
        totalChaptersEl.textContent = chaptersCount;
    };

    // --- Overlay Logic ---
    const showChaptersOverlay = (book) => {
        overlayBookTitle.textContent = book.title;
        const count = book.chapters ? book.chapters.length : 0;
        overlayBookStats.textContent = `${count} Bölüm Yazıldı`;
        
        overlayChaptersList.innerHTML = '';
        if (count > 0) {
            book.chapters.forEach((ch, idx) => {
                const item = document.createElement('div');
                item.className = 'overlay-chapter-item';
                const wordCount = ch.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
                item.innerHTML = `
                    <span>${idx + 1}. ${ch.title}</span>
                    <span class="meta">${wordCount} Kelime</span>
                `;
                item.onclick = () => {
                    window.location.href = `editor.html?bookId=${book.id}&chapterId=${ch.id}`;
                };
                overlayChaptersList.appendChild(item);
            });
            startWritingBtn.textContent = 'Son Bölümden Devam Et';
        } else {
            overlayChaptersList.innerHTML = '<div class="loading-spinner">Bölüm bulunamadı.</div>';
            startWritingBtn.textContent = 'Yazmaya Başla (İlk Bölüm)';
        }

        startWritingBtn.onclick = () => {
            window.location.href = `editor.html?bookId=${book.id}`;
        };

        chaptersOverlay.style.display = 'flex';
        setTimeout(() => chaptersOverlay.classList.add('open'), 10);
    };

    // --- Create Book Logic ---
    const coverInput = document.getElementById('book-cover-input');
    const coverPreview = document.getElementById('cover-preview');
    let selectedCoverBase64 = null;

    coverInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize image to keep it small (Firestore safe)
                const canvas = document.createElement('canvas');
                // Profesyonel Kitap Kapağı Standartı: 400x600 px (2:3)
                canvas.width = 400;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');
                
                // Resmi ortalayarak ve kırparak (crop) çiz
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;
                
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                
                selectedCoverBase64 = canvas.toDataURL('image/jpeg', 0.8);
                coverPreview.innerHTML = `<img src="${selectedCoverBase64}">`;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    openCreateBtn.onclick = () => {
        selectedCoverBase64 = null;
        coverPreview.innerHTML = '<p>Henüz görsel seçilmedi</p>';
        createBookForm.reset();
        createBookModal.style.display = 'flex';
        setTimeout(() => createBookModal.classList.add('open'), 10);
    };

    createBookForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('book-title').value;
        const user = auth.currentUser;

        try {
            await db.collection('user_books').add({
                userId: user.uid,
                title: title,
                cover: selectedCoverBase64,
                chapters: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            closeModal('create-book-modal');
            loadBooks(user.uid);
            createBookForm.reset();
            selectedCoverBase64 = null;
        } catch (err) {
            alert('Kitap oluşturulurken hata: ' + err.message);
        }
    };

    logoutBtn.onclick = (e) => {
        e.preventDefault();
        auth.signOut().then(() => window.location.href = 'index.html');
    };
});
