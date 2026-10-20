// auth and db are now provided by firebase-config.js global scope

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
    transitionOverlay.innerHTML = `<div class="transition-logo">Noctis ${currentLang === 'tr' ? 'Kitap Dünyası' : 'Book World'}</div>`;
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
            if (confirm(translations[currentLang].logout_confirm)) {
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

    // Helper for friendly Firebase Auth error messages
    const getAuthErrorMessage = (err) => {
        switch (err.code) {
            case 'auth/invalid-credential':
                return currentLang === 'tr' 
                    ? 'E-posta veya şifre hatalı. Eğer henüz bir hesap oluşturmadıysanız, lütfen üstteki "Kayıt Ol" sekmesinden yeni hesap açın.'
                    : 'Invalid email or password. If you do not have an account yet, please use the "Register" tab to create one.';
            case 'auth/user-not-found':
                return currentLang === 'tr'
                    ? 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı. Lütfen "Kayıt Ol" sekmesinden yeni bir hesap oluşturun.'
                    : 'No user found with this email. Please register first.';
            case 'auth/wrong-password':
                return currentLang === 'tr'
                    ? 'Girdiğiniz şifre hatalı.'
                    : 'Incorrect password.';
            case 'auth/email-already-in-use':
                return currentLang === 'tr'
                    ? 'Bu e-posta adresi zaten kullanımda. Lütfen "Giriş Yap" sekmesinden giriş yapın.'
                    : 'This email is already in use. Please log in.';
            case 'auth/weak-password':
                return currentLang === 'tr'
                    ? 'Şifre çok zayıf. Şifreniz en az 6 karakter olmalıdır.'
                    : 'Password is too weak. Must be at least 6 characters.';
            case 'auth/invalid-email':
                return currentLang === 'tr'
                    ? 'Lütfen geçerli bir e-posta adresi girin.'
                    : 'Please enter a valid email address.';
            case 'auth/operation-not-allowed':
                return currentLang === 'tr'
                    ? 'Firebase Konsolu\'nda "E-posta / Şifre" ile oturum açma yöntemi henüz etkinleştirilmemiş. Firebase Console -> Authentication -> Sign-in method bölümünden E-posta/Şifre sağlayıcısını etkinleştirin.'
                    : 'Email/Password provider is not enabled in Firebase Console. Please enable it under Authentication -> Sign-in method.';
            case 'auth/too-many-requests':
                return currentLang === 'tr'
                    ? 'Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.'
                    : 'Too many attempts. Please try again later.';
            case 'auth/network-request-failed':
                return currentLang === 'tr'
                    ? 'Ağ bağlantısı hatası oluştu. Lütfen internet bağlantınızı kontrol edin.'
                    : 'Network error. Please check your internet connection.';
            default:
                return err.message;
        }
    };

    // --- Firebase Auth Operations ---
    const registerForm = document.getElementById('register-form');
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const nameInput = registerForm.querySelector('input[type="text"]');
        const emailInput = registerForm.querySelectorAll('input[type="email"]')[0];
        const passwordInput = registerForm.querySelector('input[type="password"]');

        const name = (nameInput?.value || '').trim();
        const email = (emailInput?.value || '').trim();
        const password = passwordInput?.value || '';

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            
            // İlk kayıt sonrası kullanıcı bilgisini Firestore'a kaydet
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(translations[currentLang].register_success);
            window.location.href = 'dashboard.html';
        } catch (err) {
            console.error("Register Error:", err);
            alert('Hata: ' + getAuthErrorMessage(err));
        }
    };

    const loginForm = document.getElementById('login-form');
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const emailInput = loginForm.querySelector('input[type="email"]');
        const passwordInput = loginForm.querySelector('input[type="password"]');

        const email = (emailInput?.value || '').trim();
        const password = passwordInput?.value || '';

        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = 'dashboard.html';
        } catch (err) {
            console.error("Login Error:", err);
            alert('Hata: ' + getAuthErrorMessage(err));
        }
    };

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-actions');

    if (menuToggle && navLinks) {
        menuToggle.onclick = (e) => {
            e.stopPropagation();
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        };

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

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

    // --- Reading Mode & View Count Logic ---
    window.incrementViewsAndRedirect = (bookId, bookData = null) => {
        try {
            sessionStorage.setItem('noctis_return_scroll', window.scrollY.toString());
            sessionStorage.setItem('noctis_return_url', window.location.href);

            // Cache book data for instant 0ms reader opening
            if (bookData) {
                try {
                    sessionStorage.setItem('noctis_reading_book', JSON.stringify(bookData));
                } catch (cacheErr) {
                    try {
                        const bookLite = { ...bookData };
                        if (bookLite.cover && bookLite.cover.length > 50000) delete bookLite.cover;
                        sessionStorage.setItem('noctis_reading_book', JSON.stringify(bookLite));
                    } catch (e2) {
                        console.warn("Could not cache reading book:", e2);
                    }
                }
            }

            // Increment view count asynchronously in background (non-blocking)
            db.collection('user_books').doc(bookId).update({
                views: firebase.firestore.FieldValue.increment(1)
            }).catch(err => {
                console.warn("View increment skipped:", err);
            });
        } catch (err) {
            console.warn("Redirect error:", err);
        }
        // Redirect immediately without waiting for network
        window.location.href = `read.html?bookId=${bookId}`;
    };

    // --- Load Featured Books (Index) ---
    const loadFeaturedBooks = async () => {
        const discoverGrid = document.getElementById('featured-grid');
        if (!discoverGrid) return;

        const prevBtn = document.getElementById('slider-prev');
        const nextBtn = document.getElementById('slider-next');

        try {
            const snapshot = await db.collection('user_books')
                .where('published', '==', true)
                .get();

            let books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort by VIEWS (Highest to Lowest)
            books.sort((a, b) => (b.views || 0) - (a.views || 0));

            const featuredBooks = books.slice(0, 8); // Top 8 books

            if (featuredBooks.length === 0) {
                const noBooksMsg = currentLang === 'tr' ? 'Henüz yayınlanmış bir eser bulunmuyor. İlk eseri sen yayınla!' : 'No published works yet. Be the first to publish one!';
                discoverGrid.innerHTML = `<div class="loading-spinner" style="grid-column: 1 / -1; text-align: center; color: var(--text-dim);">${noBooksMsg}</div>`;
                if(prevBtn) prevBtn.style.display = 'none';
                if(nextBtn) nextBtn.style.display = 'none';
                return;
            }

            discoverGrid.innerHTML = '';
            featuredBooks.forEach((book, index) => {
                const coverImg = book.cover || 'kapak.png';
                const card = document.createElement('div');
                card.className = `discover-card ${index === 0 ? 'active' : ''}`;
                card.onclick = () => window.incrementViewsAndRedirect(book.id, book);

                card.innerHTML = `
                    <div class="discover-card-inner">
                        <img src="${coverImg}" class="discover-cover" alt="Kapak">
                        <div class="discover-info">
                            <span class="discover-category">${(translations[currentLang].cat_map[book.category]) || (book.category || 'Roman')}</span>
                            <h3 class="discover-title">${book.title}</h3>
                            <div class="discover-footer">
                                <p class="discover-author">✍ ${book.authorName || (translations[currentLang].nav_guest)}</p>
                                <div class="view-count-badge">👁 ${book.views || 0}</div>
                            </div>
                        </div>
                    </div>
                `;
                discoverGrid.appendChild(card);
            });

            // Slider Nav Logic
            let currentIndex = 0;
            const cards = discoverGrid.querySelectorAll('.discover-card');
            
            const updateSlider = (newIndex) => {
                const containerWidth = discoverGrid.parentElement.offsetWidth;
                const gap = 30;
                let visibleCount = 4;
                if (window.innerWidth <= 600) visibleCount = 1;
                else if (window.innerWidth <= 1024) visibleCount = 2;

                const maxIndex = Math.max(0, cards.length - visibleCount);
                currentIndex = Math.max(0, Math.min(newIndex, maxIndex));

                // Calculate exact shift
                const cardWidth = (discoverGrid.offsetWidth - (gap * (cards.length - 1))) / cards.length;
                const moveAmount = currentIndex * (100 / visibleCount);
                
                discoverGrid.style.transform = `translateX(calc(-${moveAmount}% - ${currentIndex * (gap / visibleCount * (visibleCount-1) / (cards.length-1) )}px))`;
                // Actually, simplified math for flex gap:
                const percentageShift = (currentIndex * 100) / visibleCount;
                const gapShift = currentIndex * (gap - (gap / visibleCount));
                
                // Let's use a cleaner approach:
                const shiftPerCard = (discoverGrid.scrollWidth + gap) / cards.length;
                discoverGrid.style.transform = `translateX(-${currentIndex * shiftPerCard}px)`;

                // Button states
                if (prevBtn && nextBtn) {
                    prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '1';
                    prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'all';
                    nextBtn.style.opacity = currentIndex >= maxIndex ? '0.3' : '1';
                    nextBtn.style.pointerEvents = currentIndex >= maxIndex ? 'none' : 'all';
                }
            };

            if (prevBtn && nextBtn) {
                if(cards.length <= 1) {
                    prevBtn.style.display = 'none';
                    nextBtn.style.display = 'none';
                } else {
                    prevBtn.onclick = () => updateSlider(currentIndex - 1);
                    nextBtn.onclick = () => updateSlider(currentIndex + 1);
                    // Initial state
                    updateSlider(0);
                }
            }

            window.addEventListener('resize', () => updateSlider(currentIndex));

            // Restore scroll position if returning from reading a book
            const savedScroll = sessionStorage.getItem('noctis_return_scroll');
            const savedUrl = sessionStorage.getItem('noctis_return_url');
            if (savedScroll && savedUrl && window.location.href.split('#')[0] === savedUrl.split('#')[0]) {
                sessionStorage.removeItem('noctis_return_scroll');
                sessionStorage.removeItem('noctis_return_url');
                setTimeout(() => {
                    window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'smooth' });
                }, 80);
            }

        } catch (err) {
            console.error("Home Load Error:", err);
        }
    };

    loadFeaturedBooks();

    window.addEventListener('langChanged', (e) => {
        loadFeaturedBooks();
        transitionOverlay.innerHTML = `<div class="transition-logo">Noctis ${e.detail.lang === 'tr' ? 'Kitap Dünyası' : 'Book World'}</div>`;
    });
});
