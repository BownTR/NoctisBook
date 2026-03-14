document.addEventListener('DOMContentLoaded', () => {
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

    // Local File Sync Handle
    let directoryHandle = null;
    let isSyncing = false;

    // --- IndexedDB Helper for Handle Persistence ---
    const dbName = 'BookSyncDB';
    const storeName = 'handles';

    const saveHandle = async (handle) => {
        const db = await openDB();
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(handle, 'syncFolder');
    };

    const loadHandle = async () => {
        const db = await openDB();
        return new Promise((resolve) => {
            const req = db.transaction(storeName).objectStore(storeName).get('syncFolder');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    };

    const openDB = () => {
        return new Promise((resolve) => {
            const req = indexedDB.open(dbName, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(storeName);
            req.onsuccess = () => resolve(req.result);
        });
    };

    // State
    let chapters = JSON.parse(localStorage.getItem('book_v8_chapters')) || [
        { id: Date.now(), title: 'Giriş', content: 'Buraya hikayenizi yazmaya başlayın...' }
    ];
    let activeChapterId = parseInt(localStorage.getItem('book_v8_active_id')) || chapters[0].id;
    let currentSpreadIdx = 0;
    let allPages = [];

    // Constants must match CSS perfectly
    const WRITING_HEIGHT = 580; // Hardcoded in CSS
    const WRITING_WIDTH = 400;  // 500 - 100 padding

    // Re-check ghost styles once
    const syncGhost = () => {
        ghostPage.style.width = WRITING_WIDTH + 'px';
        ghostPage.style.padding = '0'; // Important: remove padding to match writing-area content width
        ghostPage.style.fontSize = '14px';
        ghostPage.style.lineHeight = '1.6';
        ghostPage.style.fontFamily = "'Poppins', sans-serif";
        ghostPage.style.textAlign = 'left';
        ghostPage.style.whiteSpace = 'pre-wrap';
        ghostPage.style.wordWrap = 'break-word';
        ghostPage.style.hyphens = 'auto';
        ghostPage.style.webkitHyphens = 'auto';
        ghostPage.style.visibility = 'hidden';
        ghostPage.style.position = 'absolute';
    };

    // --- Logic ---

    const getActiveChapter = () => chapters.find(c => c.id === activeChapterId) || chapters[0];

    // The core re-calculation engine
    const repaginate = () => {
        const chapter = getActiveChapter();
        const text = chapter.content;
        const pages = [];

        syncGhost();
        ghostPage.innerHTML = '';

        // Tokenize by word but keep all whitespace
        const tokens = text.split(/(\s+)/);
        let currentPageHTML = '';

        for (let token of tokens) {
            ghostPage.innerHTML = currentPageHTML + token;

            // overflow check
            if (ghostPage.scrollHeight > WRITING_HEIGHT) {
                // If the single token itself is too big (shouldn't happen with words), push it anyway
                if (currentPageHTML === '') {
                    pages.push(token);
                    currentPageHTML = '';
                } else {
                    pages.push(currentPageHTML);
                    currentPageHTML = token;
                }
            } else {
                currentPageHTML += token;
            }
        }
        pages.push(currentPageHTML); // push remainder

        allPages = pages;
        render();
        updateStats();
    };

    const render = () => {
        const leftIdx = currentSpreadIdx * 2;
        const rightIdx = leftIdx + 1;

        const leftContent = allPages[leftIdx] || '';
        const rightContent = allPages[rightIdx] || '';

        // Optimization: Only update DOM if changed to keep selection/cursor
        if (leftText.innerHTML !== leftContent) leftText.innerHTML = leftContent;
        if (rightText.innerHTML !== rightContent) rightText.innerHTML = rightContent;

        leftNum.textContent = leftIdx + 1;
        rightNum.textContent = rightIdx + 1;

        pageLabel.textContent = `Sayfa ${leftIdx + 1} - ${rightIdx + 1}`;

        prevBtn.disabled = currentSpreadIdx === 0;
        // Navigation is always available in forward direction
        nextBtn.disabled = false;

        renderChapterItems();
    };

    // Input flow handler
    const onInput = (e) => {
        const el = e.target;
        const isLeft = el.id === 'left-text';
        const pageIdx = currentSpreadIdx * 2 + (isLeft ? 0 : 1);
        const chapter = getActiveChapter();

        // 1. Check for immediate overflow
        if (el.scrollHeight > WRITING_HEIGHT) {
            // A word overflowed. Repaginate immediately to find the new split.
            // But first sync what we have
            allPages[pageIdx] = el.innerHTML;
            chapter.content = allPages.join('');

            repaginate();

            // Shift focus if text moved away from current container
            if (isLeft) {
                // Check if right page now has content it didn't have before
                setCursor(rightText, 0);
            } else {
                // Right overflowed -> turn spread
                currentSpreadIdx++;
                repaginate();
                setCursor(leftText, 0);
            }
        } else {
            // Normal typing, just sync data
            allPages[pageIdx] = el.innerHTML;
            chapter.content = allPages.join('');
        }

        debounceSave();
        updateStats();
    };

    const setCursor = (el, offset) => {
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(true); // to start of the new page
        sel.removeAllRanges();
        sel.addRange(range);
    };

    const updateStats = () => {
        const chapter = getActiveChapter();
        const plain = chapter.content.replace(/<[^>]*>/g, ' ');
        const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
        statWords.textContent = words;
        statChars.textContent = plain.length;
        statPages.textContent = allPages.length;
    };

    const syncFolderBtn = document.getElementById('sync-folder-btn');
    const syncStatus = document.getElementById('sync-status');

    const syncToLocal = async () => {
        if (!directoryHandle || isSyncing) {
            if (isSyncing) syncStatus.textContent = 'Meşgul...';
            return;
        }

        isSyncing = true;
        try {
            syncStatus.textContent = 'Güncelleniyor...';

            // 1. Collect file names first
            const filesToRemove = [];
            for await (const entry of directoryHandle.values()) {
                if (entry.kind === 'file' && entry.name.endsWith('.txt')) {
                    filesToRemove.push(entry.name);
                }
            }

            // 2. Sequential deletion
            for (const name of filesToRemove) {
                try {
                    await directoryHandle.removeEntry(name);
                } catch (e) {
                    console.warn(`${name} silinemedi:`, e);
                }
            }

            // 3. Sequential writing
            for (let chapter of chapters) {
                const safeTitle = (chapter.title || 'Adsiz').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const fileHandle = await directoryHandle.getFileHandle(`${safeTitle}.txt`, { create: true });
                const writable = await fileHandle.createWritable();

                const plainText = chapter.content
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<p>/gi, '')
                    .replace(/<\/p>/gi, '\n')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/<[^>]*>/g, '');

                await writable.write(plainText);
                await writable.close();
            }
            syncStatus.textContent = 'Eşitlendi ✅';
        } catch (err) {
            console.error('Senkronizasyon Hatası:', err);
            syncStatus.textContent = 'Eşitleme Hatası!';
        } finally {
            isSyncing = false;
        }
    };

    const startSync = async () => {
        try {
            // If we already have a handle, check permissions
            if (directoryHandle) {
                const permission = await directoryHandle.requestPermission({ mode: 'readwrite' });
                if (permission === 'granted') {
                    syncStatus.textContent = 'Eşitlendi ✅';
                    syncToLocal();
                    return;
                }
            }

            // Otherwise, pick new folder
            directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await saveHandle(directoryHandle);
            syncStatus.textContent = 'Eşitlendi ✅';
            syncToLocal();
        } catch (err) {
            console.warn('Klasör seçilmedi veya erişim reddedildi');
        }
    };

    const restoreSync = async () => {
        const storedHandle = await loadHandle();
        if (storedHandle) {
            directoryHandle = storedHandle;
            syncStatus.textContent = 'Erişim İzni Bekliyor...';
            syncStatus.style.color = '#d4af37';
        }
    };

    let saveTimer;
    const debounceSave = () => {
        const chapter = getActiveChapter();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            // LocalStorage Save
            localStorage.setItem('book_v8_chapters', JSON.stringify(chapters));
            localStorage.setItem('book_v8_active_id', activeChapterId);

            // Sync to local directory if selected
            syncToLocal();

            saveLabel.classList.add('show');
            setTimeout(() => saveLabel.classList.remove('show'), 2000);
        }, 1500);
    };

    syncFolderBtn.onclick = startSync;

    // Auto-restore handle if it exists
    restoreSync();

    const renderChapterItems = () => {
        chaptersList.innerHTML = '';
        chapters.forEach(c => {
            const li = document.createElement('li');
            li.className = `chapter-item ${c.id === activeChapterId ? 'active' : ''}`;

            const titleSpan = document.createElement('span');
            titleSpan.textContent = c.title || 'Bölüm';

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-chapter-btn';
            delBtn.innerHTML = '×';
            delBtn.title = 'Bölümü Sil';

            delBtn.onclick = async (e) => {
                e.stopPropagation(); // Don't trigger chapter switch
                if (chapters.length <= 1) {
                    alert('Son kalan bölümü silemezsiniz.');
                    return;
                }
                if (confirm(`"${c.title}" bölümünü silmek istediğinize emin misiniz?`)) {
                    chapters = chapters.filter(chap => chap.id !== c.id);
                    if (activeChapterId === c.id) {
                        activeChapterId = chapters[0].id;
                        currentSpreadIdx = 0;
                    }

                    // Structural changes (Delete/Add) should be immediate
                    localStorage.setItem('book_v8_chapters', JSON.stringify(chapters));
                    localStorage.setItem('book_v8_active_id', activeChapterId);
                    await syncToLocal();
                    repaginate();
                }
            };

            titleSpan.ondblclick = async (e) => {
                e.stopPropagation();
                const newTitle = prompt('Bölüm İsmini Düzenle:', c.title);
                if (newTitle && newTitle !== c.title) {
                    c.title = newTitle;
                    localStorage.setItem('book_v8_chapters', JSON.stringify(chapters));
                    renderChapterItems();
                    await syncToLocal(); // Klasördeki dosyayı yeniden adlandırmak için
                }
            };

            li.onclick = () => {
                if (c.id === activeChapterId) return;
                activeChapterId = c.id;
                currentSpreadIdx = 0;
                bookEl.classList.add('flip-anim');
                setTimeout(() => {
                    repaginate();
                    bookEl.classList.remove('flip-anim');
                }, 400);
            };

            li.appendChild(titleSpan);
            li.appendChild(delBtn);
            chaptersList.appendChild(li);
        });
    };

    // --- Controls ---

    addChapterBtn.onclick = async () => {
        const title = prompt('Bölüm İsmi:', `Bölüm ${chapters.length + 1}`);
        if (!title) return;
        chapters.push({ id: Date.now(), title, content: '' });
        activeChapterId = chapters[chapters.length - 1].id;
        currentSpreadIdx = 0;
        repaginate();
        await syncToLocal(); // Immediate sync for new chapter
    };

    prevBtn.onclick = () => {
        if (currentSpreadIdx > 0) {
            currentSpreadIdx--;
            render();
        }
    };

    nextBtn.onclick = () => {
        currentSpreadIdx++;
        // ensure placeholder pages exist
        const idx = currentSpreadIdx * 2;
        if (!allPages[idx]) allPages[idx] = '';
        render();
    };

    const onPaste = (e) => {
        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand("insertText", false, text);
        onInput({ target: e.target });
    };

    leftText.addEventListener('input', onInput);
    rightText.addEventListener('input', onInput);
    leftText.addEventListener('paste', onPaste);
    rightText.addEventListener('paste', onPaste);

    repaginate();
});
