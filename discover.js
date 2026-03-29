document.addEventListener('DOMContentLoaded', () => {
    const loadAllPublishedBooks = async () => {
        const grid = document.getElementById('all-discover-grid');
        if (!grid) return;

        try {
            const snapshot = await db.collection('user_books')
                .where('published', '==', true)
                .get();

            const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            books.sort((a, b) => {
                const dateA = a.publishedAt ? a.publishedAt.seconds : 0;
                const dateB = b.publishedAt ? b.publishedAt.seconds : 0;
                return dateB - dateA;
            });

            if (books.length === 0) {
                const noBooksMsg = currentLang === 'tr' ? 'Henüz yayınlanmış bir eser bulunmuyor. Kendi eserinizi yayınlayarak bir başlangıç yapın!' : 'No published works yet. Start by publishing your own!';
                grid.innerHTML = `<div class="loading-spinner" style="grid-column: 1 / -1; text-align: center; color: var(--text-dim);">${noBooksMsg}</div>`;
                return;
            }

            // Group by category
            const categories = {};
            books.forEach(book => {
                const cat = book.category || 'Diğer';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(book);
            });

            // Sort each category by VIEWS
            Object.keys(categories).forEach(cat => {
                categories[cat].sort((a, b) => (b.views || 0) - (a.views || 0));
            });

            grid.innerHTML = '';
            
            // Render each category
            Object.keys(categories).sort().forEach(catName => {
                const categorySection = document.createElement('div');
                categorySection.className = 'category-group fade-up';
                
                categorySection.innerHTML = `
                    <div class="category-header">
                        <h3>${(translations[currentLang].cat_map[catName]) || catName}</h3>
                        <div class="category-line"></div>
                    </div>
                    <div class="slider-container">
                        <button class="slider-btn prev">❮</button>
                        <div class="discover-grid slider-mode"></div>
                        <button class="slider-btn next">❯</button>
                    </div>
                `;
                
                const catGrid = categorySection.querySelector('.discover-grid');
                const prevBtn = categorySection.querySelector('.slider-btn.prev');
                const nextBtn = categorySection.querySelector('.slider-btn.next');

                categories[catName].forEach((book, idx) => {
                    const coverImg = book.cover || 'kapak.png';
                    const card = document.createElement('div');
                    card.className = `discover-card ${idx === 0 ? 'active' : ''}`;
                    card.onclick = () => window.incrementViewsAndRedirect(book.id);

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
                    catGrid.appendChild(card);
                });

                // Slider logic for this specific category
                let currentIndex = 0;
                const cards = catGrid.querySelectorAll('.discover-card');
                
                const updateSlider = (newIndex) => {
                    cards[currentIndex].classList.remove('active');
                    currentIndex = (newIndex + cards.length) % cards.length;
                    cards[currentIndex].classList.add('active');
                };

                if (cards.length <= 1) {
                    prevBtn.style.display = 'none';
                    nextBtn.style.display = 'none';
                } else {
                    prevBtn.onclick = () => updateSlider(currentIndex - 1);
                    nextBtn.onclick = () => updateSlider(currentIndex + 1);
                }

                grid.appendChild(categorySection);
            });
        } catch (err) {
            console.error("Discover Load Error:", err);
            grid.innerHTML = `
                <div class="loading-spinner" style="grid-column: 1 / -1; color: #ff6464; text-align: center;">
                    Eserler yüklenirken bir sorun oluştu.<br>
                    <small>${err.code === 'permission-denied' ? 'Firebase Güvenlik Kuralları erişimi engelliyor. Lütfen kuralları kontrol edin.' : err.message}</small>
                </div>`;
        }
    };

    // Firebase in landing.js might take a ms to be ready if on slow networks, but since it's synchronous up to initialization, this is fine
    loadAllPublishedBooks();

    window.addEventListener('langChanged', (e) => {
        loadAllPublishedBooks();
    });
});
