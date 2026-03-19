// Firebase is now initialized in firebase-config.js

// auth and db are now provided by firebase-config.js

const handleDropdownLogic = () => {
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    const userInfoName = document.getElementById('user-info-name');

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
};

document.addEventListener('DOMContentLoaded', () => {
    // URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');
    const targetChapterId = urlParams.get('chapterId');

    if (!bookId) {
        alert('Kitap ID bulunamadı. Kütüphaneye yönlendiriliyorsunuz.');
        window.location.href = 'dashboard.html';
        return;
    }

    // Elements Reference
    const leftText = document.getElementById('left-text');
    const rightText = document.getElementById('right-text');
    const leftNum = document.getElementById('left-num');
    const rightNum = document.getElementById('right-num');
    const pageLabel = document.getElementById('page-label');
    const chaptersList = document.getElementById('chapters-list');
    const addChapterBtn = document.getElementById('add-chapter-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const statWords = document.getElementById('stat-words');
    const statChars = document.getElementById('stat-chars');
    const statPages = document.getElementById('stat-pages');
    const ghostPage = document.getElementById('ghost-page');
    const saveLabel = document.getElementById('save-notification');
    const bookEl = document.getElementById('book-el');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // --- State ---
    let chapters = [{ id: Date.now(), title: 'Giriş', content: 'Buraya hikayenizi yazmaya başlayın...' }];
    let activeChapterId = chapters[0].id;
    let currentSpreadIdx = 0;
    let allPages = [];

    // --- Load Data ---
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        const userInfoName = document.getElementById('user-info-name');
        if (userInfoName) userInfoName.textContent = user.displayName || 'Yazar';
        handleDropdownLogic();

        try {
            // Fetch Specific Book
            const doc = await db.collection('user_books').doc(bookId).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.userId !== user.uid) {
                    alert('Bu kitaba erişim izniniz yok.');
                    window.location.href = 'dashboard.html';
                    return;
                }

                if (data.chapters && data.chapters.length > 0) {
                    chapters = data.chapters;
                    // Jump to chapter if specified, else last or first
                    if (targetChapterId) {
                        activeChapterId = parseInt(targetChapterId);
                    } else {
                        activeChapterId = chapters[0].id;
                    }
                } else {
                    // Start fresh if no chapters
                    chapters = [{ id: Date.now(), title: 'Giriş', content: '' }];
                    activeChapterId = chapters[0].id;
                }
            } else {
                alert('Kitap bulunamadı.');
                window.location.href = 'dashboard.html';
                return;
            }
            repaginate();
        } catch (err) {
            console.error('Veri yükleme hatası:', err);
        }
    });

    // Pagination Logic
    let WRITING_HEIGHT = 580;
    let WRITING_WIDTH = 400;

    const updateDimensions = () => {
        WRITING_HEIGHT = leftText.clientHeight;
        WRITING_WIDTH = leftText.clientWidth;
        if (WRITING_WIDTH < 50) WRITING_WIDTH = 400;
        if (WRITING_HEIGHT < 50) WRITING_HEIGHT = 580;
        syncGhost();
    };

    const syncGhost = () => {
        ghostPage.style.width = WRITING_WIDTH + 'px';
        ghostPage.style.fontSize = '14px';
        ghostPage.style.lineHeight = '1.6';
        ghostPage.style.fontFamily = "'Poppins', sans-serif";
        ghostPage.style.textAlign = 'left';
        ghostPage.style.whiteSpace = 'pre-wrap';
        ghostPage.style.wordWrap = 'break-word';
        ghostPage.style.visibility = 'hidden';
        ghostPage.style.position = 'absolute';
    };

    const getActiveChapter = () => chapters.find(c => c.id === activeChapterId) || chapters[0];

    const repaginate = () => {
        const chapter = getActiveChapter();
        const text = chapter.content || '';
        const pages = [];
        syncGhost();
        ghostPage.innerHTML = '';
        const tokens = text.split(/(\s+)/);
        let currentHTML = '';

        for (let token of tokens) {
            ghostPage.innerHTML = currentHTML + token;
            if (ghostPage.scrollHeight > WRITING_HEIGHT) {
                if (currentHTML === '') { pages.push(token); currentHTML = ''; }
                else { pages.push(currentHTML); currentHTML = token; }
            } else { currentHTML += token; }
        }
        pages.push(currentHTML);
        allPages = pages;
        render();
        updateStats();
    };

    const render = () => {
        const isMobile = window.innerWidth <= 800;
        if (isMobile) {
            const content = allPages[currentSpreadIdx] || '';
            if (leftText.innerHTML !== content) leftText.innerHTML = content;
            leftNum.textContent = currentSpreadIdx + 1;
            pageLabel.textContent = `Sayfa ${currentSpreadIdx + 1}`;
            prevBtn.disabled = currentSpreadIdx === 0;
        } else {
            const lIdx = currentSpreadIdx * 2;
            const rIdx = lIdx + 1;
            if (leftText.innerHTML !== (allPages[lIdx] || '')) leftText.innerHTML = allPages[lIdx] || '';
            if (rightText.innerHTML !== (allPages[rIdx] || '')) rightText.innerHTML = allPages[rIdx] || '';
            leftNum.textContent = lIdx + 1;
            rightNum.textContent = rIdx + 1;
            pageLabel.textContent = `Sayfa ${lIdx + 1} - ${rIdx + 1}`;
            prevBtn.disabled = currentSpreadIdx === 0;
        }
        renderChapterItems();
    };

    const onInput = (e) => {
        const el = e.target;
        const isMobile = window.innerWidth <= 800;
        let idx = isMobile ? currentSpreadIdx : (currentSpreadIdx * 2 + (el.id === 'left-text' ? 0 : 1));
        const chapter = getActiveChapter();

        if (el.scrollHeight > WRITING_HEIGHT + 3) {
            allPages[idx] = el.innerHTML;
            chapter.content = allPages.join('');
            repaginate();
            if (isMobile) { if (allPages.length > idx+1) { currentSpreadIdx++; render(); setCursor(leftText); } }
            else { if (el.id === 'left-text') setCursor(rightText); else { currentSpreadIdx++; render(); setCursor(leftText); } }
        } else {
            allPages[idx] = el.innerHTML;
            chapter.content = allPages.join('');
        }
        debounceSave();
        updateStats();
    };

    const setCursor = (el) => {
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    };

    const updateStats = () => {
        const chapter = getActiveChapter();
        const plain = (chapter.content ||'').replace(/<[^>]*>/g, ' ');
        statWords.textContent = plain.trim() ? plain.trim().split(/\s+/).length : 0;
        statChars.textContent = plain.length;
        statPages.textContent = allPages.length;
    };

    let saveTimer;
    const debounceSave = () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
            const user = auth.currentUser;
            if (user && bookId) {
                await db.collection('user_books').doc(bookId).update({
                    chapters: chapters,
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            saveLabel.classList.add('show');
            setTimeout(() => saveLabel.classList.remove('show'), 2000);
        }, 1500);
    };

    const renderChapterItems = () => {
        chaptersList.innerHTML = '';
        chapters.forEach(c => {
            const li = document.createElement('li');
            li.className = `chapter-item ${c.id === activeChapterId ? 'active' : ''}`;
            li.innerHTML = `<span>${c.title}</span><button class="delete-chapter-btn">×</button>`;
            li.querySelector('.delete-chapter-btn').onclick = (e) => {
                e.stopPropagation();
                if (chapters.length <= 1) return alert('Son bölüm silinemez.');
                if (confirm('Bölüm silinsin mi?')) {
                    chapters = chapters.filter(chap => chap.id !== c.id);
                    if (activeChapterId === c.id) { activeChapterId = chapters[0].id; currentSpreadIdx = 0; }
                    repaginate(); debounceSave();
                }
            };
            li.onclick = () => {
                if (c.id === activeChapterId) return;
                activeChapterId = c.id;
                currentSpreadIdx = 0;
                bookEl.classList.add('flip-anim');
                setTimeout(() => { repaginate(); bookEl.classList.remove('flip-anim'); }, 400);
            };
            chaptersList.appendChild(li);
        });
    };

    addChapterBtn.onclick = () => {
        const t = prompt('Bölüm İsmi:');
        if (!t) return;
        chapters.push({ id: Date.now(), title: t, content: '' });
        activeChapterId = chapters[chapters.length - 1].id;
        currentSpreadIdx = 0;
        repaginate(); debounceSave();
    };

    prevBtn.onclick = () => { if (currentSpreadIdx > 0) { currentSpreadIdx--; render(); } };
    nextBtn.onclick = () => { currentSpreadIdx++; render(); };

    const trans = document.createElement('div');
    trans.id = 'page-transition'; trans.classList.add('active');
    trans.innerHTML = '<div class="transition-logo">Sonsuz Kitap</div>';
    document.body.appendChild(trans);
    window.addEventListener('load', () => setTimeout(() => {
        trans.classList.add('hidden'); setTimeout(()=>trans.classList.remove('active'), 600);
    }, 300));

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            auth.signOut().then(() => window.location.href = 'index.html');
        };
    }

    menuToggle.onclick = () => sidebar.classList.toggle('open');
    sidebarOverlay.onclick = () => sidebar.classList.remove('open');
    window.onresize = () => { updateDimensions(); repaginate(); };
    leftText.oninput = onInput;
    rightText.oninput = onInput;
    
    updateDimensions();
});
