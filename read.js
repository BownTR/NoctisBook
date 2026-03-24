document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');

    if (!bookId) {
        window.location.href = 'index.html';
        return;
    }

    // Elements
    const loader = document.getElementById('loader');
    const bookTitleEl = document.getElementById('book-title');
    const bookAuthorEl = document.getElementById('book-author');
    const bookCoverEl = document.getElementById('book-cover');
    const bookCategoryEl = document.getElementById('book-category');
    const bookViewsEl = document.getElementById('book-views');
    const chapterNav = document.getElementById('chapter-nav');
    const displayChapterTitle = document.getElementById('display-chapter-title');
    const displayChapterContent = document.getElementById('display-chapter-content');
    const progressBar = document.getElementById('progress-bar');

    let currentBook = null;

    const loadBookData = async () => {
        try {
            const bookDoc = await db.collection('user_books').doc(bookId).get();
            if (!bookDoc.exists) {
                alert('Kitap bulunamadı.');
                window.location.href = 'index.html';
                return;
            }

            currentBook = { id: bookDoc.id, ...bookDoc.data() };
            renderBookMeta();
            renderChapterList();
            
            // Auto load first chapter
            if (currentBook.chapters && currentBook.chapters.length > 0) {
                displayChapter(0);
            } else {
                displayChapterTitle.textContent = currentLang === 'tr' ? "Henüz Bölüm Yok" : "No Chapters Yet";
                displayChapterContent.innerHTML = `<p>${currentLang === 'tr' ? "Bu yazar henüz bir bölüm yayınlamadı." : "This author hasn't published any chapters yet."}</p>`;
            }

            // Hide loader
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
            }, 800);

        } catch (err) {
            console.error("Load Error:", err);
            alert('Hata: ' + err.message);
        }
    };

    const renderBookMeta = () => {
        bookTitleEl.textContent = currentBook.title;
        bookAuthorEl.textContent = `✍ ${currentBook.authorName || (translations[currentLang].nav_guest)}`;
        bookCoverEl.src = currentBook.cover || 'kapak.png';
        const catName = currentBook.category || 'Roman';
        bookCategoryEl.textContent = (translations[currentLang].cat_map[catName]) || catName;
        bookViewsEl.textContent = currentBook.views || 0;
        document.title = `${currentBook.title} | Noctis ${currentLang === 'tr' ? 'Kitap Dünyası' : 'Book World'}`;
    };

    const renderChapterList = () => {
        chapterNav.innerHTML = '';
        if (currentBook.chapters) {
            currentBook.chapters.forEach((ch, index) => {
                const btn = document.createElement('div');
                btn.className = 'chapter-nav-item';
                btn.textContent = `${index + 1}. ${ch.title}`;
                btn.onclick = () => {
                    // Update active state
                    document.querySelectorAll('.chapter-nav-item').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    displayChapter(index);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                chapterNav.appendChild(btn);
            });
            // Mark first as active by default
            if (chapterNav.firstChild) chapterNav.firstChild.classList.add('active');
        }
    };

    const displayChapter = (index) => {
        const chapter = currentBook.chapters[index];
        displayChapterTitle.textContent = chapter.title;
        
        // Handle HTML content if present, or wrap plain text in paragraphs
        let content = chapter.content;
        if (!content.includes('<p>')) {
            content = content.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');
        }
        
        displayChapterContent.innerHTML = content;
    };

    // Scroll Progress Logic
    window.onscroll = () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    };

    loadBookData();

    window.addEventListener('langChanged', (e) => {
        if (currentBook) renderBookMeta();
    });
});
