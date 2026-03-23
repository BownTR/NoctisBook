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
                grid.innerHTML = '<div class="loading-spinner" style="grid-column: 1 / -1; text-align: center; color: var(--text-dim);">Henüz yayınlanmış bir eser bulunmuyor. Kendi eserinizi yayınlayarak bir başlangıç yapın!</div>';
                return;
            }

            // Group by category
            const categories = {};
            books.forEach(book => {
                const cat = book.category || 'Diğer';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(book);
            });

            grid.innerHTML = '';
            
            // Render each category
            Object.keys(categories).sort().forEach(catName => {
                const categorySection = document.createElement('div');
                categorySection.className = 'category-group fade-up';
                
                categorySection.innerHTML = `
                    <div class="category-header">
                        <h3>${catName}</h3>
                        <div class="category-line"></div>
                    </div>
                    <div class="discover-grid"></div>
                `;
                
                const catGrid = categorySection.querySelector('.discover-grid');
                categories[catName].forEach((book, idx) => {
                    const coverImg = book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
                    const card = document.createElement('div');
                    card.className = 'discover-card';
                    card.style.animationDelay = `${idx * 0.1}s`;
                    card.onclick = () => window.incrementViewsAndRedirect(book.id);

                    card.innerHTML = `
                        <div class="discover-card-inner">
                            <img src="${coverImg}" class="discover-cover" alt="Kapak">
                            <div class="discover-info">
                                <span class="discover-category">${book.category || 'Roman'}</span>
                                <h3 class="discover-title">${book.title}</h3>
                                <div class="discover-footer">
                                    <p class="discover-author">✍ ${book.authorName || 'Anonim Yazar'}</p>
                                    <div class="view-count-badge">👁 ${book.views || 0}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    catGrid.appendChild(card);
                });

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
});
