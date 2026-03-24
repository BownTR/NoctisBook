const translations = {
    tr: {
        // Navbar
        "nav_home": "🏠 Ana Sayfa",
        "nav_discover": "🌍 Keşfet",
        "nav_library": "📚 Kütüphanem",
        "nav_login_register": "Giriş Yap / Kayıt Ol",
        "nav_profile": "👤 Profilim",
        "nav_logout": "🚪 Çıkış Yap",
        "nav_guest": "Misafir Yazar",

        // Home (Index)
        "hero_title": "Zamana Meydan Okuyan <br><span class=\"italic\">Hikayeler Yazın</span>",
        "hero_subtitle": "Geleneksel kağıt hissini modern teknolojiyle buluşturan, sonsuz sayfa yapısına sahip en gelişmiş dijital yazı atölyesi.",
        "btn_start_writing": "Yazmaya Başla",
        "btn_discover": "Keşfet",
        "stat_infinite_pages": "Sonsuz Sayfa",
        "featured_books": "Öne Çıkan Kitaplar",
        "loading_works": "Yayınlanan eserler yükleniyor...",
        "why_title": "Neden Noctis Kitap Dünyası?",
        "feature_infinite_title": "Sonsuz Sayfa Yapısı",
        "feature_infinite_desc": "Siz yazdıkça genişleyen, harf harf büyüyen dinamik sayfa sistemiyle akışınızı bozmayın.",
        "feature_sync_title": "Klasör Eşitleme",
        "feature_sync_desc": "Dosyalarınız bulutta kaybolmasın. Doğrudan kendi bilgisayarınızdaki bir klasöre anlık eşitleyin.",
        "feature_design_title": "Dikkat Dağıtmayan Tasarım",
        "feature_design_desc": "Sadece siz ve kelimeleriniz. Gece modu ve kağıt dokusuyla gözlerinizi yormayan premium deneyim.",
        "cta_title": "Mirasınızı Bugün Yazmaya Başlayın",
        "cta_subtitle": "Ücretsiz, hızlı ve sonsuz. Hayalinizdeki kitabı oluşturmak için bir adım atın.",
        "btn_start_now": "Hemen Yazmaya Başla",
        "footer_copyright": "© 2026 Noctis Kitap Dünyası. Tüm hakları saklıdır.",

        // Auth Modal
        "login": "Giriş Yap",
        "register": "Kayıt Ol",
        "email": "E-posta",
        "password": "Şifre",
        "full_name": "Ad Soyad",
        "create_account": "Hesap Oluştur",
        "logout_confirm": "Çıkış yapmak istediğinize emin misiniz?",
        "login_success": "Başarıyla giriş yaptınız!",
        "register_success": "Başarıyla kayıt oldunuz!",

        // Dashboard
        "welcome": "Hoş Geldin,",
        "dashboard_subtitle": "Yazın yolculuğun burada saklı. Harf harf inşa ettiğin evrenin özeti.",
        "total_books": "Toplam Kitap",
        "total_chapters": "Toplam Bölüm",
        "my_books": "Kitaplarım",
        "btn_new_book": "+ Yeni Kitap Oluştur",
        "loading_books": "Kitaplarınız yükleniyor...",
        "modal_new_book": "Yeni Kitap Oluştur",
        "book_name_req": "Kitap İsmi (Zorunlu)",
        "book_cover_opt": "Kitap Kapağı (Önerilen: 400x600 px)",
        "btn_select_image": "📁 Görsel Seç",
        "no_image_selected": "Henüz görsel seçilmedi",
        "btn_create": "Kitabı Oluştur",
        "modal_edit_book": "Kitabı Düzenle",
        "btn_save_changes": "Değişiklikleri Kaydet",
        "btn_delete_book": "🗑 Kitabı Sil",
        "btn_edit": "✏️ Düzenle",
        "btn_publish": "🌍 Yayınla",
        "modal_publish_title": "Kitabını Yayınla",
        "modal_publish_desc": "Kitabını ana sayfada yüzlerce okurun keşfine sunmak üzeresin. Kitabının içeriğine uygun bir kategori seç.",
        "category_req": "Kategori (Zorunlu)",
        "select_category": "Bir kategori seç...",
        "btn_publish_now": "Şimdi Yayınla 🌍",

        // Discover
        "discover_title": "Keşfet",
        "discover_subtitle": "Diğer okurların kaleminden çıkan eşsiz mirasına göz atın ve yeni evrenlere yelken açın.",
        "loading_all": "Eserler yükleniyor...",

        // Editor
        "chapters": "Bölüm",
        "word_count": "Kelime",
        "char_count": "Karakter",
        "page_count": "Sayfa",
        "btn_sync_pc": "Bilgisayara Eşitle",
        "sync_not_selected": "Klasör Seçilmedi",
        "btn_prev": "Önceki",
        "btn_next": "Sonraki",
        "page_label": "Sayfa",
        "chapter_name_prompt": "Bölüm İsmi:",
        "delete_chapter_confirm": "Bölüm silinsin mi?",
        "last_chapter_alert": "Son bölüm silinemez.",
        "id_not_found": "Kitap ID bulunamadı. Kütüphaneye yönlendiriliyorsunuz.",

        // Profile
        "profile_settings": "Profil Ayarları",
        "profile_subtitle": "Yazarlık kimliğini buradan güncelleyebilirsin.",
        "display_name": "Görünen Adın",
        "email_address_no_change": "E-posta Adresi (Değiştirilemez)",
        "btn_update_info": "Bilgileri Güncelle",
        "saved_success": "Değişiklikler başarıyla kaydedildi!",

        // Read Mode
        "read_mode": "Okuma Modu",
        "btn_back_library": "← Kütüphaneye Dön",
        "book_from_shelf": "Kitap Raftan İniyor...",
        "loading": "Yükleniyor...",
        "author_name": "Yazar Adı",
        "views": "İzlenme",
        "writing_soon": "Burası yakında kelimelerle dolacak...",

        // Categories
        "cat_romance": "Romantik",
        "cat_drama": "Dram",
        "cat_sci_fi": "Bilim Kurgu",
        "cat_fantasy": "Fantastik",
        "cat_mystery": "Gizem / Gerilim",
        "cat_action": "Aksiyon / Macera",
        "cat_personal": "Kişisel Gelişim",
        "cat_horror": "Korku",
        "cat_poetry": "Şiir",

        "cat_map": {
            "Romantik": "Romantik",
            "Dram": "Dram",
            "Bilim Kurgu": "Bilim Kurgu",
            "Fantastik": "Fantastik",
            "Gizem / Gerilim": "Gizem / Gerilim",
            "Aksiyon / Macera": "Aksiyon / Macera",
            "Kişisel Gelişim": "Kişisel Gelişim",
            "Korku": "Korku",
            "Şiir": "Şiir"
        },

        // Dashboard specific
        "last_chapter_continue": "Son Bölümden Devam Et",
        "start_first_chapter": "Yazmaya Başla (İlk Bölüm)",
        "no_chapters_found": "Bölüm bulunamadı.",
        "chapters_written": "Bölüm Yazıldı",
        "publish_success": "Kitabınız başarıyla ana sayfaya ve keşfet sekmesine uçtu! 🚀",
        "unpublish_confirm": "Kitabınızı yayından kaldırmak istediğinize emin misiniz? Ana sayfada görünmeyecek.",
        "delete_book_confirm": "başlıklı kitabınızı ve tüm bölümlerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
        "update_success": "Kitap başarıyla güncellendi.",
        "delete_success": "Kitap başarıyla silindi.",
        "published_badge": "Yayınlandı",
        "unpublish_btn": "Yayından Kaldır",
        "publish_btn": "Yayınla 🌍"
    },
    en: {
        // Navbar
        "nav_home": "🏠 Home",
        "nav_discover": "🌍 Discover",
        "nav_library": "📚 My Library",
        "nav_login_register": "Login / Register",
        "nav_profile": "👤 My Profile",
        "nav_logout": "🚪 Logout",
        "nav_guest": "Guest Author",

        // Home (Index)
        "hero_title": "Write Stories That <br><span class=\"italic\">Defy Time</span>",
        "hero_subtitle": "The most advanced digital writing studio with an infinite page structure, blending the traditional feel of paper with modern technology.",
        "btn_start_writing": "Start Writing",
        "btn_discover": "Discover",
        "stat_infinite_pages": "Infinite Pages",
        "featured_books": "Featured Books",
        "loading_works": "Loading published works...",
        "why_title": "Why Noctis Kitap Dünyası?",
        "feature_infinite_title": "Infinite Page Structure",
        "feature_infinite_desc": "Don't break your flow with a dynamic page system that expands as you write, growing letter by letter.",
        "feature_sync_title": "Folder Sync",
        "feature_sync_desc": "Don't let your files get lost in the cloud. Sync instantly to a folder directly on your own computer.",
        "feature_design_title": "Distraction-Free Design",
        "feature_design_desc": "Just you and your words. A premium experience that doesn't tire your eyes with night mode and paper texture.",
        "cta_title": "Start Writing Your Legacy Today",
        "cta_subtitle": "Free, fast, and infinite. Take a step to create the book of your dreams.",
        "btn_start_now": "Start Writing Now",
        "footer_copyright": "© 2026 Noctis Kitap Dünyası. All rights reserved.",

        // Auth Modal
        "login": "Login",
        "register": "Register",
        "email": "Email",
        "password": "Password",
        "full_name": "Full Name",
        "create_account": "Create Account",
        "logout_confirm": "Are you sure you want to log out?",
        "login_success": "Successfully logged in!",
        "register_success": "Successfully registered!",

        // Dashboard
        "welcome": "Welcome,",
        "dashboard_subtitle": "Your writing journey is hidden here. A summary of the universe you built letter by letter.",
        "total_books": "Total Books",
        "total_chapters": "Total Chapters",
        "my_books": "My Books",
        "btn_new_book": "+ Create New Book",
        "loading_books": "Loading your books...",
        "modal_new_book": "Create New Book",
        "book_name_req": "Book Name (Required)",
        "book_cover_opt": "Book Cover (Recommended: 400x600 px)",
        "btn_select_image": "📁 Select Image",
        "no_image_selected": "No image selected yet",
        "btn_create": "Create Book",
        "modal_edit_book": "Edit Book",
        "btn_save_changes": "Save Changes",
        "btn_delete_book": "🗑 Delete Book",
        "btn_edit": "✏️ Edit",
        "btn_publish": "🌍 Publish",
        "modal_publish_title": "Publish Your Book",
        "modal_publish_desc": "You are about to present your book for discovery by hundreds of readers on the main page. Choose a category suitable for your book's content.",
        "category_req": "Category (Required)",
        "select_category": "Select a category...",
        "btn_publish_now": "Publish Now 🌍",

        // Discover
        "discover_title": "Discover",
        "discover_subtitle": "Check out the unique legacy of other readers and set sail for new universes.",
        "loading_all": "Loading works...",

        // Editor
        "chapters": "Chapters",
        "word_count": "Words",
        "char_count": "Characters",
        "page_count": "Pages",
        "btn_sync_pc": "Sync to Computer",
        "sync_not_selected": "Folder Not Selected",
        "btn_prev": "Previous",
        "btn_next": "Next",
        "page_label": "Page",
        "chapter_name_prompt": "Chapter Name:",
        "delete_chapter_confirm": "Delete chapter?",
        "last_chapter_alert": "Last chapter cannot be deleted.",
        "id_not_found": "Book ID not found. Redirecting to library.",

        // Profile
        "profile_settings": "Profile Settings",
        "profile_subtitle": "You can update your author identity here.",
        "display_name": "Your Display Name",
        "email_address_no_change": "Email Address (Cannot be changed)",
        "btn_update_info": "Update Info",
        "saved_success": "Changes saved successfully!",

        // Read Mode
        "read_mode": "Reading Mode",
        "btn_back_library": "← Back to Library",
        "book_from_shelf": "Book is Coming Off the Shelf...",
        "loading": "Loading...",
        "author_name": "Author Name",
        "views": "Views",
        "writing_soon": "This place will soon be filled with words...",

        // Categories
        "cat_romance": "Romance",
        "cat_drama": "Drama",
        "cat_sci_fi": "Sci-Fi",
        "cat_fantasy": "Fantasy",
        "cat_mystery": "Mystery / Thriller",
        "cat_action": "Action / Adventure",
        "cat_personal": "Personal Development",
        "cat_horror": "Horror",
        "cat_poetry": "Poetry",

        "cat_map": {
            "Romantik": "Romance",
            "Dram": "Drama",
            "Bilim Kurgu": "Sci-Fi",
            "Fantastik": "Fantasy",
            "Gizem / Gerilim": "Mystery / Thriller",
            "Aksiyon / Macera": "Action / Adventure",
            "Kişisel Gelişim": "Personal Development",
            "Korku": "Horror",
            "Şiir": "Poetry"
        },

        // Dashboard specific
        "last_chapter_continue": "Continue from Last Chapter",
        "start_first_chapter": "Start Writing (First Chapter)",
        "no_chapters_found": "No chapters found.",
        "chapters_written": "Chapters Written",
        "publish_success": "Your book has successfully flown to the main page and discover tab! 🚀",
        "unpublish_confirm": "Are you sure you want to unpublish your book? It will no longer appear on the main page.",
        "delete_book_confirm": "Are you sure you want to delete the book titled and all its chapters? This action cannot be undone.",
        "update_success": "Book updated successfully.",
        "delete_success": "Book deleted successfully.",
        "published_badge": "Published",
        "unpublish_btn": "Unpublish",
        "publish_btn": "Publish 🌍"
    }
};

// Language Handling Logic
let currentLang = localStorage.getItem('noctis_lang') || 'tr';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('noctis_lang', lang);
    applyTranslations();
    
    // Update active state in language selector if it exists
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Special case for editor prompt and alerts
    window.currentLang = lang;

    // Dispatch event for other scripts to re-render dynamic content
    window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
}

function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'email' || el.type === 'password' || el.tagName === 'TEXTAREA')) {
                el.placeholder = translations[currentLang][key];
            } else if (el.tagName === 'SELECT') {
                 // handle select placeholders if needed
            } else {
                el.innerHTML = translations[currentLang][key];
            }
        }
    });

    // Update document title if page-specific title exists
    const pageTitleKey = document.body.getAttribute('data-page-title');
    if (pageTitleKey && translations[currentLang][pageTitleKey]) {
        let suffix = currentLang === 'tr' ? " | Noctis Kitap Dünyası" : " | Noctis Book World";
        document.title = translations[currentLang][pageTitleKey] + suffix;
    }
}

// Initial apply
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    
    // Setup language switcher listeners if any
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            setLanguage(btn.getAttribute('data-lang'));
        };
        // Initial active state
        if (btn.getAttribute('data-lang') === currentLang) {
            btn.classList.add('active');
        }
    });
});
