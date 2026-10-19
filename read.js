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
    const paperBookTitle = document.getElementById('paper-book-title');
    const paperPageNum = document.getElementById('paper-page-num');
    const readerPrevBtn = document.getElementById('reader-prev-btn');
    const readerNextBtn = document.getElementById('reader-next-btn');
    const readerPrevText = document.getElementById('reader-prev-text');
    const readerNextText = document.getElementById('reader-next-text');
    const readerPageCurrent = document.getElementById('reader-page-current');
    const readerPageTotal = document.getElementById('reader-page-total');
    const readerGhost = document.getElementById('reader-ghost');
    const paperView = document.getElementById('paper-view');
    const progressBar = document.getElementById('progress-bar');

    let currentBook = null;
    let currentChapterIdx = 0;
    let currentPageIdx = 0;
    let chapterPages = [];

    const saveReadingProgress = () => {
        if (!bookId) return;
        try {
            localStorage.setItem(`noctis_read_pos_${bookId}`, JSON.stringify({
                chapterIdx: currentChapterIdx,
                pageIdx: currentPageIdx
            }));
        } catch (e) {
            console.warn(e);
        }
    };

    const getSavedReadingProgress = () => {
        if (!bookId) return null;
        try {
            const raw = localStorage.getItem(`noctis_read_pos_${bookId}`);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    };

    const loadBookData = async () => {
        try {
            // Wait for fonts to be ready so measurements use the exact EB Garamond font
            if (document.fonts) {
                try {
                    await document.fonts.ready;
                } catch (e) {
                    console.warn("Fonts ready warning:", e);
                }
            }

            const bookDoc = await db.collection('user_books').doc(bookId).get();
            if (!bookDoc.exists) {
                alert('Kitap bulunamadı.');
                window.location.href = 'index.html';
                return;
            }

            currentBook = { id: bookDoc.id, ...bookDoc.data() };
            renderBookMeta();
            renderChapterList();
            
            // Auto load saved progress or first chapter
            if (currentBook.chapters && currentBook.chapters.length > 0) {
                const savedProgress = getSavedReadingProgress();
                if (savedProgress && currentBook.chapters[savedProgress.chapterIdx]) {
                    loadChapter(savedProgress.chapterIdx, savedProgress.pageIdx || 0);
                } else {
                    loadChapter(0, 0);
                }
            } else {
                if (displayChapterTitle) displayChapterTitle.textContent = currentLang === 'tr' ? "Henüz Bölüm Yok" : "No Chapters Yet";
                displayChapterContent.innerHTML = `<p>${currentLang === 'tr' ? "Bu yazar henüz bir bölüm yayınlamadı." : "This author hasn't published any chapters yet."}</p>`;
                if (paperPageNum) paperPageNum.textContent = '— 0 —';
                updatePaginationControls();
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
        if (paperBookTitle) paperBookTitle.textContent = currentBook.title;
        bookAuthorEl.textContent = `✍ ${currentBook.authorName || (translations[currentLang].nav_guest)}`;
        bookCoverEl.src = currentBook.cover || 'kapak.png';
        const catName = currentBook.category || 'Roman';
        bookCategoryEl.textContent = (translations[currentLang].cat_map && translations[currentLang].cat_map[catName]) || catName;
        bookViewsEl.textContent = currentBook.views || 0;
        document.title = `${currentBook.title} | Noctis ${currentLang === 'tr' ? 'Kitap Dünyası' : 'Book World'}`;
    };

    const renderChapterList = () => {
        chapterNav.innerHTML = '';
        if (currentBook.chapters) {
            currentBook.chapters.forEach((ch, index) => {
                const btn = document.createElement('div');
                btn.className = 'chapter-nav-item' + (index === currentChapterIdx ? ' active' : '');
                btn.textContent = `${index + 1}. ${ch.title}`;
                btn.onclick = () => {
                    loadChapter(index, 0);

                    // Mobile sidebar auto-close
                    if (window.innerWidth <= 1024) {
                        readSidebar.classList.remove('open');
                        sidebarToggle.classList.remove('active');
                    }
                };
                chapterNav.appendChild(btn);
            });
        }
    };

    // Pagination helper functions
    const getClosingTags = (stack) => {
        return stack.slice().reverse().map(tag => {
            const match = tag.match(/<([a-z0-9]+)/i);
            return match ? `</${match[1]}>` : '';
        }).join('');
    };

    const isSelfClosing = (tag) => {
        return /<br|hr|img|input|meta/i.test(tag) || tag.endsWith('/>');
    };

    const paginateText = (htmlContent) => {
        if (!htmlContent) return ['<p>...</p>'];
        
        let content = htmlContent;
        if (!content.includes('<p>')) {
            content = content.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');
        }

        // Measure available text width and height
        const isMobile = window.innerWidth <= 1024;
        const isSmallMobile = window.innerWidth <= 480;

        let targetWidth = displayChapterContent ? displayChapterContent.clientWidth : 0;
        if (!targetWidth || targetWidth <= 0) {
            const horizontalDeduction = isSmallMobile ? 40 : (isMobile ? 56 : 144);
            targetWidth = Math.max(260, window.innerWidth - horizontalDeduction);
            if (!isMobile) targetWidth = Math.min(targetWidth, 656);
        }

        // Rich, authentic book page height: guarantees ~22-26 lines of text on both PC and real mobile
        const targetHeight = isMobile
            ? Math.max(580, Math.min(680, window.innerHeight - 130))
            : 620;

        const mobileFontSize = isSmallMobile ? '14.5px' : '15px';
        const mobileLineHeight = isSmallMobile ? '1.6' : '1.62';

        // Synchronize ghost container styling accurately and prevent any min-height inheritance
        readerGhost.className = 'chapter-text-content';
        readerGhost.style.setProperty('min-height', '0px', 'important');
        readerGhost.style.setProperty('height', 'auto', 'important');
        readerGhost.style.setProperty('max-height', 'none', 'important');
        readerGhost.style.setProperty('width', targetWidth + 'px', 'important');
        readerGhost.style.setProperty('font-family', "'EB Garamond', Georgia, serif", 'important');
        readerGhost.style.setProperty('font-size', isMobile ? mobileFontSize : '16.5px', 'important');
        readerGhost.style.setProperty('line-height', isMobile ? mobileLineHeight : '1.7', 'important');
        readerGhost.style.setProperty('text-align', 'justify', 'important');
        readerGhost.style.setProperty('text-justify', 'inter-word', 'important');
        readerGhost.style.setProperty('hyphens', 'auto', 'important');
        readerGhost.style.setProperty('-webkit-hyphens', 'auto', 'important');
        readerGhost.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
        readerGhost.style.setProperty('text-size-adjust', '100%', 'important');
        readerGhost.style.setProperty('word-wrap', 'break-word', 'important');
        readerGhost.style.setProperty('overflow-wrap', 'break-word', 'important');
        readerGhost.style.setProperty('padding', '0', 'important');
        readerGhost.style.setProperty('margin', '0', 'important');
        readerGhost.style.setProperty('box-sizing', 'border-box', 'important');

        const tokens = content.split(/(<[^>]+>|\s+)/);
        let currentHTML = '';
        let tagStack = [];
        const pages = [];

        for (let token of tokens) {
            if (token === undefined || token === '') continue;
            const isTag = token.startsWith('<');
            const isClosing = token.startsWith('</');

            readerGhost.innerHTML = currentHTML + token + getClosingTags(tagStack);
            if (readerGhost.scrollHeight > targetHeight) {
                if (currentHTML === '') {
                    currentHTML = token;
                    if (isTag) {
                        if (isClosing) tagStack.pop();
                        else if (!isSelfClosing(token)) tagStack.push(token);
                    }
                } else {
                    pages.push(currentHTML + getClosingTags(tagStack));
                    currentHTML = tagStack.join('') + token.replace(/^\s+/, '');
                }
            } else {
                currentHTML += token;
                if (isTag) {
                    if (isClosing) tagStack.pop();
                    else if (!isSelfClosing(token)) tagStack.push(token);
                }
            }
        }

        if (currentHTML.trim() !== '' || pages.length === 0) {
            pages.push(currentHTML + getClosingTags(tagStack));
        }

        return pages.length > 0 ? pages : ['<p>...</p>'];
    };

    const loadChapter = (chapterIdx, startPageIdx = 0) => {
        if (!currentBook || !currentBook.chapters || !currentBook.chapters[chapterIdx]) return;
        currentChapterIdx = chapterIdx;
        const chapter = currentBook.chapters[chapterIdx];

        if (displayChapterTitle) displayChapterTitle.textContent = chapter.title;

        // Update active chapter in sidebar
        const navItems = chapterNav.querySelectorAll('.chapter-nav-item');
        navItems.forEach((b, i) => b.classList.toggle('active', i === currentChapterIdx));

        // Paginate chapter
        chapterPages = paginateText(chapter.content);

        // Set start page (e.g. 0 for start, or -1 for last page if coming from next chapter)
        if (startPageIdx === -1) {
            currentPageIdx = chapterPages.length - 1;
        } else {
            currentPageIdx = Math.max(0, Math.min(startPageIdx, chapterPages.length - 1));
        }

        renderCurrentPage();
    };

    const renderPaginationBar = () => {
        const pagesList = document.getElementById('reader-pages-list');
        if (!pagesList) return;
        pagesList.innerHTML = '';

        const totalPages = chapterPages.length;
        if (totalPages <= 1) {
            pagesList.style.display = 'none';
            return;
        }
        pagesList.style.display = 'flex';

        const createPageBtn = (pageIndex) => {
            const btn = document.createElement('button');
            btn.className = 'page-num-btn' + (pageIndex === currentPageIdx ? ' active' : '');
            btn.textContent = pageIndex + 1;
            btn.setAttribute('aria-label', `Sayfa ${pageIndex + 1}`);
            
            const handleSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (pageIndex !== currentPageIdx) {
                    currentPageIdx = pageIndex;
                    renderCurrentPage();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
            btn.addEventListener('click', handleSelect);
            btn.addEventListener('touchend', handleSelect);
            return btn;
        };

        const createEllipsis = () => {
            const span = document.createElement('span');
            span.className = 'page-num-ellipsis';
            span.textContent = '…';
            return span;
        };

        const isMobile = window.innerWidth <= 640;
        const maxVisibleButtons = isMobile ? 5 : 7;

        if (totalPages <= maxVisibleButtons) {
            for (let i = 0; i < totalPages; i++) {
                pagesList.appendChild(createPageBtn(i));
            }
        } else {
            const delta = isMobile ? 1 : 2;
            let left = Math.max(1, currentPageIdx - delta);
            let right = Math.min(totalPages - 2, currentPageIdx + delta);

            if (currentPageIdx - delta <= 1) {
                right = Math.min(totalPages - 2, 1 + delta * 2);
            }
            if (currentPageIdx + delta >= totalPages - 2) {
                left = Math.max(1, totalPages - 2 - delta * 2);
            }

            pagesList.appendChild(createPageBtn(0));

            if (left > 1) {
                pagesList.appendChild(createEllipsis());
            }

            for (let i = left; i <= right; i++) {
                pagesList.appendChild(createPageBtn(i));
            }

            if (right < totalPages - 2) {
                pagesList.appendChild(createEllipsis());
            }

            pagesList.appendChild(createPageBtn(totalPages - 1));
        }
    };

    const renderCurrentPage = () => {
        if (chapterPages.length === 0) return;

        // Subtle page turn animation
        paperView.style.transition = 'opacity 0.15s ease';
        paperView.style.opacity = '0.4';
        setTimeout(() => {
            displayChapterContent.innerHTML = chapterPages[currentPageIdx];
            paperView.style.opacity = '1';
        }, 80);

        // Update indicators
        if (paperPageNum) paperPageNum.textContent = `— ${currentPageIdx + 1} / ${chapterPages.length} —`;
        if (readerPageCurrent) readerPageCurrent.textContent = currentPageIdx + 1;
        if (readerPageTotal) readerPageTotal.textContent = chapterPages.length;

        renderPaginationBar();
        updatePaginationControls();
        updateProgressBar();
        saveReadingProgress();
    };

    const updatePaginationControls = () => {
        const totalChapters = currentBook?.chapters?.length || 0;
        const isFirstChapter = currentChapterIdx === 0;
        const isLastChapter = currentChapterIdx >= totalChapters - 1;
        const isFirstPage = currentPageIdx === 0;
        const isLastPage = currentPageIdx >= chapterPages.length - 1;

        // Prev Button
        if (isFirstPage && isFirstChapter) {
            readerPrevBtn.disabled = true;
            readerPrevText.textContent = translations[currentLang].btn_prev_page || 'Önceki';
        } else if (isFirstPage && !isFirstChapter) {
            readerPrevBtn.disabled = false;
            readerPrevText.textContent = translations[currentLang].btn_prev_chapter || 'Önceki Bölüm';
        } else {
            readerPrevBtn.disabled = false;
            readerPrevText.textContent = translations[currentLang].btn_prev_page || 'Önceki';
        }

        // Next Button
        if (isLastPage && isLastChapter) {
            readerNextBtn.disabled = true;
            readerNextText.textContent = translations[currentLang].btn_next_page || 'Sonraki';
        } else if (isLastPage && !isLastChapter) {
            readerNextBtn.disabled = false;
            readerNextText.textContent = translations[currentLang].btn_next_chapter || 'Sonraki Bölüm';
        } else {
            readerNextBtn.disabled = false;
            readerNextText.textContent = translations[currentLang].btn_next_page || 'Sonraki';
        }
    };

    const goToPrevPage = () => {
        if (currentPageIdx > 0) {
            currentPageIdx--;
            renderCurrentPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (currentChapterIdx > 0) {
            loadChapter(currentChapterIdx - 1, -1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToNextPage = () => {
        if (currentPageIdx < chapterPages.length - 1) {
            currentPageIdx++;
            renderCurrentPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (currentChapterIdx < (currentBook?.chapters?.length || 0) - 1) {
            loadChapter(currentChapterIdx + 1, 0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        goToPrevPage();
    };

    const handleNextClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        goToNextPage();
    };

    if (readerPrevBtn) {
        readerPrevBtn.onclick = handlePrevClick;
        readerPrevBtn.addEventListener('touchend', handlePrevClick);
    }
    if (readerNextBtn) {
        readerNextBtn.onclick = handleNextClick;
        readerNextBtn.addEventListener('touchend', handleNextClick);
    }

    // Tap on paper to navigate (Left 45% = Prev, Right 55% = Next)
    paperView.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        const rect = paperView.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        if (clickX > width * 0.55) {
            goToNextPage();
        } else if (clickX < width * 0.45) {
            goToPrevPage();
        }
    });

    // Touch Swipe Gesture for Mobile
    let touchStartX = 0;
    let touchStartY = 0;
    paperView.addEventListener('touchstart', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    paperView.addEventListener('touchend', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
                goToNextPage(); // Swiped left -> next page
            } else {
                goToPrevPage(); // Swiped right -> prev page
            }
        }
    }, { passive: true });

    const updateProgressBar = () => {
        const totalChapters = currentBook?.chapters?.length || 1;
        const totalPagesInChap = chapterPages.length || 1;
        const currentFraction = (currentChapterIdx + (currentPageIdx / totalPagesInChap)) / totalChapters;
        progressBar.style.width = Math.min(100, Math.max(0, currentFraction * 100)) + '%';
    };

    // Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const readSidebar = document.getElementById('read-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    const readerChaptersTopBtn = document.getElementById('reader-chapters-top-btn');

    if (readSidebar) {
        const toggleSidebar = () => {
            readSidebar.classList.toggle('open');
            if (sidebarToggle) sidebarToggle.classList.toggle('active');
        };

        if (sidebarToggle) {
            sidebarToggle.onclick = (e) => {
                e.stopPropagation();
                toggleSidebar();
            };
        }

        if (readerChaptersTopBtn) {
            readerChaptersTopBtn.onclick = (e) => {
                e.stopPropagation();
                toggleSidebar();
            };
        }

        if (sidebarOverlay) {
            sidebarOverlay.onclick = () => {
                readSidebar.classList.remove('open');
                if (sidebarToggle) sidebarToggle.classList.remove('active');
            };
        }
    }

    // Top Bar Back Button (Returns to previous page and maintains position)
    const readerTopBackBtn = document.getElementById('reader-top-back-btn');
    if (readerTopBackBtn) {
        readerTopBackBtn.onclick = (e) => {
            e.preventDefault();
            if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
                window.history.back();
            } else {
                const returnUrl = sessionStorage.getItem('noctis_return_url') || 'discover.html';
                window.location.href = returnUrl;
            }
        };
    }

    // Resize & Orientation Handlers with Debounce
    let resizeTimer = null;
    const handleViewportChange = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (currentBook && currentBook.chapters && currentBook.chapters[currentChapterIdx]) {
                const currentRatio = currentPageIdx / (chapterPages.length || 1);
                chapterPages = paginateText(currentBook.chapters[currentChapterIdx].content);
                currentPageIdx = Math.min(chapterPages.length - 1, Math.floor(currentRatio * chapterPages.length));
                renderCurrentPage();
            }
        }, 150);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    loadBookData();

    window.addEventListener('langChanged', (e) => {
        if (currentBook) {
            renderBookMeta();
            updatePaginationControls();
        }
    });
});
