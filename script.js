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
        alert(translations[currentLang].id_not_found);
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
            updateDimensions();
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
        ghostPage.style.overflowWrap = 'break-word';
        ghostPage.style.visibility = 'hidden';
        ghostPage.style.position = 'absolute';
        ghostPage.style.padding = '0';
        ghostPage.style.margin = '0';
        ghostPage.style.border = 'none';
        ghostPage.style.boxSizing = 'border-box';
        ghostPage.style.hyphens = 'auto';
    };

    const getActiveChapter = () => chapters.find(c => c.id === activeChapterId) || chapters[0];

    const repaginate = () => {
        const chapter = getActiveChapter();
        const text = chapter.content || '';
        const pages = [];
        syncGhost();
        ghostPage.innerHTML = '';
        
        // Helper to get closing tags from a stack
        const getClosingTags = (stack) => {
            return stack.slice().reverse().map(tag => {
                const match = tag.match(/<([a-z0-9]+)/i);
                return match ? `</${match[1]}>` : '';
            }).join('');
        };

        const isSelfClosing = (tag) => {
            return /<br|hr|img|input|meta/i.test(tag) || tag.endsWith('/>');
        };

        const tokens = text.split(/(<[^>]+>|\s+)/);
        let currentHTML = '';
        let tagStack = [];

        for (let token of tokens) {
            if (token === undefined) continue;
            // Note: we don't skip "" because it might be at the start of original split

            const isTag = token.startsWith('<');
            const isClosing = token.startsWith('</');

            // Preview Page 1 with the token + closing any tags from our stack
            ghostPage.innerHTML = currentHTML + token + getClosingTags(tagStack);
            
            if (ghostPage.scrollHeight > WRITING_HEIGHT) {
                // If currentHTML is empty, it means this single token is already too big.
                // We must force it onto the page anyway, otherwise we'd loop forever.
                if (currentHTML === '') {
                    currentHTML = token;
                    if (isTag) {
                        if (isClosing) tagStack.pop();
                        else if (!isSelfClosing(token)) tagStack.push(token);
                    }
                    pages.push(currentHTML + getClosingTags(tagStack));
                    currentHTML = tagStack.join('');
                } else {
                    // This token overflows! 
                    // Close current page
                    pages.push(currentHTML + getClosingTags(tagStack));
                    
                    // Start new page with reopened tags
                    if (isClosing) {
                        // If we overflowed on a closing tag, account for it but don't start next page with it
                        tagStack.pop();
                        currentHTML = tagStack.join('');
                    } else {
                        // Trim leading whitespace for the new page start
                        let nextToken = token;
                        if (!isTag && typeof nextToken === 'string') {
                            nextToken = nextToken.replace(/^\s+/, '');
                        }
                        currentHTML = tagStack.join('') + nextToken;
                        // If opening tag, it will be added to stack in the next successful iteration
                    }
                }
            } else {
                currentHTML += token;
                if (isTag) {
                    if (isClosing) tagStack.pop();
                    else if (!isSelfClosing(token)) tagStack.push(token);
                }
            }
        }
        
        if (currentHTML !== '' || pages.length === 0) {
            const finalContent = currentHTML + getClosingTags(tagStack);
            if (finalContent.trim() !== '' || pages.length === 0) {
                pages.push(finalContent);
            }
        }

        allPages = pages;
        render();
        updateStats();
    };

    const normalizeHTML = (html) => {
        if (!html) return '';
        // Merge synthetic tag splits created by pagination (e.g., </div><div> -> "")
        // Only merge if they are DIRECTLY adjacent (no spaces) to avoid shifting user text
        return html.replace(/<\/([a-z0-9]+)><\1[^>]*>/gi, (match, tag) => {
            if (['div', 'p', 'span', 'b', 'i', 'strong', 'em'].includes(tag.toLowerCase())) {
                return ''; 
            }
            return match;
        });
    };

    const render = () => {
        const isMobile = window.innerWidth <= 800;
        
        // Auto-correct currentSpreadIdx if it's out of bounds
        const maxSpread = isMobile ? (allPages.length - 1) : (Math.max(0, Math.ceil(allPages.length / 2) - 1));
        if (currentSpreadIdx > maxSpread) {
            currentSpreadIdx = Math.max(0, maxSpread);
        }

        const updatePage = (el, content) => {
            content = content || '';
            if (el.innerHTML === content) return;

            // Preserve Caret Position
            let offset = -1;
            const sel = window.getSelection();
            const isFocused = (document.activeElement === el);
            
            if (isFocused && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const preRange = range.cloneRange();
                preRange.selectNodeContents(el);
                preRange.setEnd(range.startContainer, range.startOffset);
                offset = preRange.toString().length;
            }

            el.innerHTML = content;

            if (isFocused && offset !== -1) {
                const range = document.createRange();
                const nodeIterator = document.createNodeIterator(el, NodeFilter.SHOW_TEXT);
                let node, currentPos = 0, found = false;
                while (node = nodeIterator.nextNode()) {
                    if (currentPos + node.textContent.length >= offset) {
                        range.setStart(node, offset - currentPos);
                        range.collapse(true);
                        found = true;
                        break;
                    }
                    currentPos += node.textContent.length;
                }
                if (!found) {
                    range.selectNodeContents(el);
                    range.collapse(false);
                }
                sel.removeAllRanges();
                sel.addRange(range);
            }
        };

        if (isMobile) {
            updatePage(leftText, allPages[currentSpreadIdx]);
            leftNum.textContent = currentSpreadIdx + 1;
            pageLabel.textContent = `${translations[currentLang].page_count} ${currentSpreadIdx + 1}`;
            prevBtn.disabled = currentSpreadIdx === 0;
            nextBtn.disabled = currentSpreadIdx >= allPages.length - 1;
        } else {
            const lIdx = currentSpreadIdx * 2;
            const rIdx = lIdx + 1;
            updatePage(leftText, allPages[lIdx]);
            updatePage(rightText, allPages[rIdx]);
            leftNum.textContent = lIdx + 1;
            rightNum.textContent = rIdx + 1;
            pageLabel.textContent = `${translations[currentLang].page_count} ${lIdx + 1} - ${rIdx + 1}`;
            prevBtn.disabled = currentSpreadIdx === 0;
            nextBtn.disabled = (currentSpreadIdx * 2 + 1) >= allPages.length - 1;
        }
        renderChapterItems();
    };

    const onInput = (e) => {
        const el = e.target;
        
        // Immediate scroll lock
        el.scrollTop = 0;

        const isMobile = window.innerWidth <= 800;
        let idx = isMobile ? currentSpreadIdx : (currentSpreadIdx * 2 + (el.id === 'left-text' ? 0 : 1));
        const chapter = getActiveChapter();

        // Small margin for error (+1 instead of +3) to be more responsive
        if (el.scrollHeight > WRITING_HEIGHT + 1) {
            allPages[idx] = el.innerHTML;
            chapter.content = normalizeHTML(allPages.join(''));
            repaginate();
            if (isMobile) { 
                if (allPages.length > idx+1) { 
                    currentSpreadIdx++; 
                    render(); 
                    setCursor(leftText); 
                } 
            } else { 
                if (el.id === 'left-text') setCursor(rightText); 
                else { 
                    currentSpreadIdx++; 
                    render(); 
                    setCursor(leftText); 
                } 
            }
        } else {
            allPages[idx] = el.innerHTML;
            chapter.content = normalizeHTML(allPages.join(''));
            debounceRepaginate();
        }
        debounceSave();
        updateStats();
    };

    const isSelectionAtEnd = (el) => {
        const sel = window.getSelection();
        if (sel.rangeCount === 0) return false;
        const range = sel.getRangeAt(0);
        const postRange = range.cloneRange();
        postRange.selectNodeContents(el);
        postRange.setStart(range.endContainer, range.endOffset);
        return postRange.toString().length === 0;
    };

    const isSelectionAtStart = (el) => {
        const sel = window.getSelection();
        if (sel.rangeCount === 0) return false;
        const range = sel.getRangeAt(0);
        const preRange = range.cloneRange();
        preRange.selectNodeContents(el);
        preRange.setEnd(range.startContainer, range.startOffset);
        return preRange.toString().length === 0;
    };

    const onKeyDown = (e) => {
        const el = e.target;
        const isMobile = window.innerWidth <= 800;

        if (e.key === 'Backspace' && isSelectionAtStart(el)) {
            if (!isMobile) {
                if (el.id === 'right-text') {
                    e.preventDefault();
                    setCursor(leftText);
                } else if (currentSpreadIdx > 0) {
                    e.preventDefault();
                    currentSpreadIdx--;
                    render();
                    setCursor(rightText);
                }
            } else {
                if (currentSpreadIdx > 0) {
                    e.preventDefault();
                    currentSpreadIdx--;
                    render();
                    setCursor(leftText);
                }
            }
        }

        if (e.key === 'Delete' && isSelectionAtEnd(el)) {
            if (!isMobile) {
                if (el.id === 'left-text') {
                    e.preventDefault();
                    setCursor(rightText, false);
                } else if ((currentSpreadIdx * 2 + 1) < allPages.length - 1) {
                    e.preventDefault();
                    currentSpreadIdx++;
                    render();
                    setCursor(leftText, false);
                }
            }
        }
    };

    let repaginateTimer;
    const debounceRepaginate = () => {
        clearTimeout(repaginateTimer);
        repaginateTimer = setTimeout(() => {
            repaginate();
        }, 500); // Reduced from 2000 to 500ms for better responsiveness
    };

    const setCursor = (el, toEnd = true) => {
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        
        if (toEnd) {
            // Robust way to find the deepest last node to avoid breaking out of tags
            let node = el;
            while (node.lastChild) {
                if (node.lastChild.nodeName === 'BR') break;
                node = node.lastChild;
            }
            range.setStart(node, node.nodeType === 3 ? node.length : node.childNodes.length);
            range.collapse(true);
        } else {
            range.selectNodeContents(el);
            range.collapse(true);
        }

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
                if (chapters.length <= 1) return alert(translations[currentLang].last_chapter_alert);
                if (confirm(translations[currentLang].delete_chapter_confirm)) {
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
        const t = prompt(translations[currentLang].chapter_name_prompt);
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
    trans.innerHTML = '<div class="transition-logo">Noctis Kitap Dünyası</div>';
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
    leftText.onkeydown = onKeyDown;
    rightText.onkeydown = onKeyDown;
    
    updateDimensions();
});
