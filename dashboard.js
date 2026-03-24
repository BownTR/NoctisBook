// auth and db are now provided by firebase-config.js global scope

// Global closeModal for inline onclick (now in config but keeping redundant for safety or replacing)
if (typeof window.closeModal !== 'function') {
    window.closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('open');
            setTimeout(() => modal.style.display = 'none', 400);
        }
    };
}

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
    const editBookBtnOverlay = document.getElementById('edit-book-btn');

    const editBookModal = document.getElementById('edit-book-modal');
    const editBookForm = document.getElementById('edit-book-form');
    const deleteBookBtn = document.getElementById('delete-book-btn');

    let userBooks = [];
    let currentEditingBookId = null;

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        userNameEl.textContent = user.displayName ? user.displayName.split(' ')[0] : (translations[currentLang].nav_guest);
        const userInfoName = document.getElementById('user-info-name');
        if (userInfoName) userInfoName.textContent = user.displayName || (translations[currentLang].nav_guest);
        
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
            alert(translations[currentLang].id_not_found + ': ' + err.message);
            booksGrid.innerHTML = `<div class="loading-spinner">${translations[currentLang].id_not_found}</div>`;
        }
    };

    const renderBooks = () => {
        booksGrid.innerHTML = '';
        if (userBooks.length === 0) {
            booksGrid.innerHTML = `<div class="loading-spinner">${translations[currentLang].loading_books}</div>`;
            return;
        }

        userBooks.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            const coverImg = book.cover || 'kapak.png';
            
            card.innerHTML = `
                <div class="book-cover-area">
                    <div class="book-spine-effect"></div>
                    <img src="${coverImg}" alt="${book.title}">
                    ${book.published ? `<div class="published-badge">${translations[currentLang].published_badge}</div>` : ''}
                </div>
                <div class="book-info-minimal">
                    <h3>${book.title}</h3>
                    <span>${book.chapters ? book.chapters.length : 0} ${translations[currentLang].chapters}</span>
                </div>
                <div class="book-actions">
                    <button class="btn-publish" onclick="event.stopPropagation(); window.openPublishModal('${book.id}')">
                        ${book.published ? translations[currentLang].unpublish_btn : translations[currentLang].publish_btn}
                    </button>
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
        currentEditingBookId = book.id;
        overlayBookTitle.textContent = book.title;
        const count = book.chapters ? book.chapters.length : 0;
        overlayBookStats.textContent = `${count} ${translations[currentLang].chapters_written}`;
        
        overlayChaptersList.innerHTML = '';
        if (count > 0) {
            book.chapters.forEach((ch, idx) => {
                const item = document.createElement('div');
                item.className = 'overlay-chapter-item';
                const wordCount = ch.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
                item.innerHTML = `
                    <span>${idx + 1}. ${ch.title}</span>
                    <span class="meta">${wordCount} ${translations[currentLang].word_count}</span>
                `;
                item.onclick = () => {
                    window.location.href = `editor.html?bookId=${book.id}&chapterId=${ch.id}`;
                };
                overlayChaptersList.appendChild(item);
            });
            startWritingBtn.textContent = translations[currentLang].last_chapter_continue;
        } else {
            overlayChaptersList.innerHTML = `<div class="loading-spinner">${translations[currentLang].no_chapters_found}</div>`;
            startWritingBtn.textContent = translations[currentLang].start_first_chapter;
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

    // --- Edit Book Logic ---
    const editCoverInput = document.getElementById('edit-book-cover-input');
    const editCoverPreview = document.getElementById('edit-cover-preview');
    let selectedEditCoverBase64 = null;

    if (editCoverInput) {
        editCoverInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 400;
                    canvas.height = 600;
                    const ctx = canvas.getContext('2d');
                    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                    const x = (canvas.width / 2) - (img.width / 2) * scale;
                    const y = (canvas.height / 2) - (img.height / 2) * scale;
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    selectedEditCoverBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    editCoverPreview.innerHTML = `<img src="${selectedEditCoverBase64}">`;
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };
    }

    if (editBookBtnOverlay) {
        editBookBtnOverlay.onclick = () => {
            const book = userBooks.find(b => b.id === currentEditingBookId);
            if(!book) return;

            document.getElementById('edit-book-id').value = book.id;
            document.getElementById('edit-book-title').value = book.title;
            selectedEditCoverBase64 = null; // Reset to null, will only update if user picks new one
            
            if (book.cover) {
                editCoverPreview.innerHTML = `<img src="${book.cover}">`;
            } else {
                editCoverPreview.innerHTML = '<p>Mevcut görsel korunacak</p>';
            }

            editBookModal.style.display = 'flex';
            setTimeout(() => editBookModal.classList.add('open'), 10);
        };
    }

    if (editBookForm) {
        editBookForm.onsubmit = async (e) => {
            e.preventDefault();
            const title = document.getElementById('edit-book-title').value;
            const bookId = document.getElementById('edit-book-id').value;
            const user = auth.currentUser;

            try {
                const updateData = {
                    title: title,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                if (selectedEditCoverBase64) {
                    updateData.cover = selectedEditCoverBase64;
                }

                await db.collection('user_books').doc(bookId).update(updateData);
                
                closeModal('edit-book-modal');
                closeModal('chapters-overlay');
                loadBooks(user.uid);
                alert(translations[currentLang].update_success);
            } catch (err) {
                alert('Güncelleme hatası: ' + err.message);
            }
        };
    }

    if (deleteBookBtn) {
        deleteBookBtn.onclick = async () => {
            const bookId = document.getElementById('edit-book-id').value;
            const book = userBooks.find(b => b.id === bookId);
            if (!book) return;

            const confirmText = `"${book.title}" ${translations[currentLang].delete_book_confirm}`;
            
            if (confirm(confirmText)) {
                try {
                    await db.collection('user_books').doc(bookId).delete();
                    closeModal('edit-book-modal');
                    closeModal('chapters-overlay');
                    loadBooks(auth.currentUser.uid);
                    alert(translations[currentLang].delete_success);
                } catch (err) {
                    alert('Hata: ' + err.message);
                }
            }
        };
    }

    // --- Publish Logic ---
    window.openPublishModal = async (bookId) => {
        const book = userBooks.find(b => b.id === bookId);
        if (!book) return;

        if (book.published) {
            if (confirm(translations[currentLang].unpublish_confirm)) {
                try {
                    await db.collection('user_books').doc(bookId).update({
                        published: false,
                        category: firebase.firestore.FieldValue.delete()
                    });
                    loadBooks(auth.currentUser.uid);
                } catch(e) {
                    alert('Hata: ' + e.message);
                }
            }
            return;
        }

        document.getElementById('publish-book-id').value = bookId;
        const modal = document.getElementById('publish-book-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('open'), 10);
    };

    const publishBookForm = document.getElementById('publish-book-form');
    if (publishBookForm) {
        publishBookForm.onsubmit = async (e) => {
            e.preventDefault();
            const bookId = document.getElementById('publish-book-id').value;
            const category = document.getElementById('book-category').value;
            const user = auth.currentUser;

            try {
                await db.collection('user_books').doc(bookId).update({
                    published: true,
                    category: category,
                    authorName: user.displayName || 'Anonim Yazar',
                    publishedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(translations[currentLang].publish_success);
                closeModal('publish-book-modal');
                publishBookForm.reset();
                loadBooks(user.uid);
            } catch(error) {
                alert('Yayınlama hatası: ' + error.message);
            }
        };
    }

    logoutBtn.onclick = (e) => {
        e.preventDefault();
        auth.signOut().then(() => window.location.href = 'index.html');
    };

    // Re-render when language changes
    window.addEventListener('langChanged', (e) => {
        userNameEl.textContent = auth.currentUser?.displayName ? auth.currentUser.displayName.split(' ')[0] : (translations[e.detail.lang].nav_guest);
        const userInfoName = document.getElementById('user-info-name');
        if (userInfoName) userInfoName.textContent = auth.currentUser?.displayName || (translations[e.detail.lang].nav_guest);
        renderBooks();
        calculateGlobalStats();
    });
});
