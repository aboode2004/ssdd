// --- إعدادات Supabase ---
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const supabaseClient = window.supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// المتغيرات العامة
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('store_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('store_wishlist')) || [];
let currentUser = null;

// تهيئة التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadMockData();
    renderCategories();
    renderProducts();
    updateCartBadge();
    checkAuthStatus();
    loadAnnouncement();
}

function loadMockData() {
    categories = ['إلكترونيات', 'منزلية', 'ملابس', 'أكسسوارات'];
    products = [
        { id: 1, name: 'سماعات لاسلكية حديثة', price: 25000, discount: 10, stock: 15, category: 'إلكترونيات', icon: 'fa-headphones', rating: 4.8 },
        { id: 2, name: 'ساعة ذكية عصرية', price: 45000, discount: 0, stock: 8, category: 'إلكترونيات', icon: 'fa-clock', rating: 4.5 },
        { id: 3, name: 'مصباح إضاءة مكتبي ذكي', price: 15000, discount: 20, stock: 20, category: 'منزلية', icon: 'fa-lightbulb', rating: 4.9 }
    ];
}

function loadAnnouncement() {
    const bar = document.getElementById('announcementBar');
    if (bar) {
        bar.innerHTML = `<div style="background:var(--primary); color:var(--dark); padding:7px; text-align:center; font-weight:bold; font-size:0.85rem;">
            🔥 أهلاً بك في متجر يساعدكم - تسوق أفضل المنتجات بأفضل الأسعار!
        </div>`;
    }
}

function showPage(pageId) {
    document.querySelectorAll('.container, #page-auth, #page-profile, #page-admin').forEach(el => {
        if(el.id !== 'announcementBar') el.classList.add('hidden');
    });
    
    if (pageId === 'home') {
        document.getElementById('page-home').classList.remove('hidden');
    } else if (pageId === 'auth') {
        document.getElementById('page-auth').classList.remove('hidden');
    } else if (pageId === 'profile') {
        document.getElementById('page-profile').classList.remove('hidden');
    } else if (pageId === 'admin') {
        document.getElementById('page-admin').classList.remove('hidden');
        renderAdminDashboard();
    }
}

function goBackToHome() {
    showPage('home');
}

function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if(!container) return;
    
    let html = `<button class="category-chip active" onclick="filterByCategory('')">الكل</button>`;
    categories.forEach(cat => {
        html += `<button class="category-chip" onclick="filterByCategory('${cat}')">${cat}</button>`;
    });
    container.innerHTML = html;
}

function renderProducts(list = products) {
    const grid = document.getElementById('productsGrid');
    if(!grid) return;
    
    if(list.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--gray);">لا توجد منتجات متاحة حالياً.</p>';
        return;
    }
    
    let html = '';
    list.forEach(p => {
        let finalPrice = p.price - (p.price * (p.discount || 0) / 100);
        let isWishlisted = wishlist.includes(p.id);
        
        html += `
            <div class="product-card" onclick="openProductModal(${p.id})">
                ${p.discount > 0 ? `<span class="discount-badge">خصم ${p.discount}%</span>` : ''}
                <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${p.id})">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <div class="product-image"><i class="fa-solid ${p.icon || 'fa-box'}"></i></div>
                <div class="product-title">${p.name}</div>
                <div class="product-price">
                    ${finalPrice} د.ع
                    ${p.discount > 0 ? `<span class="old-price">${p.price} د.ع</span>` : ''}
                </div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})">أضف للسلة</button>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function filterProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
}

function filterByCategory(cat) {
    document.querySelectorAll('.category-chip').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if(cat === '') {
        renderProducts(products);
    } else {
        const filtered = products.filter(p => p.category === cat);
        renderProducts(filtered);
    }
}

function filterByPrice(order) {
    let sorted = [...products];
    if(order === 'low') {
        sorted.sort((a, b) => a.price - b.price);
    } else if(order === 'high') {
        sorted.sort((a, b) => b.price - a.price);
    }
    renderProducts(sorted);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if(!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if(existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    
    saveCart();
    showToast('تمت إضافة المنتج إلى السلة بنجاح!');
}

function saveCart() {
    localStorage.setItem('store_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartBtn = document.getElementById('cartBtnCount');
    if(cartBtn) cartBtn.innerText = count;
}

function toggleCart() {
    // سيتم إظهار سلة المشتريات الجانبية
    showToast('فتح السلة...');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function checkAuthStatus() {
    const navActions = document.getElementById('navActions');
    if(!navActions) return;
    
    let supportBtn = `<a href="https://wa.me/9647725372995" target="_blank" class="support-float-btn"><i class="fa-brands fa-whatsapp"></i> الدعم</a>`;
    let cartBtn = `<button class="nav-btn nav-btn-cart" onclick="toggleCart()"><i class="fa-solid fa-cart-shopping"></i> <span class="cart-count" id="cartBtnCount">0</span></button>`;
    
    if(currentUser) {
        let adminBtn = currentUser.isAdmin ? `<button class="nav-btn" onclick="showPage('admin')"><i class="fa-solid fa-gears"></i></button>` : '';
        navActions.innerHTML = `
            ${supportBtn}
            ${cartBtn}
            ${adminBtn}
            <button class="nav-btn nav-btn-login" onclick="showPage('profile')"><i class="fa-solid fa-user"></i></button>
        `;
    } else {
        navActions.innerHTML = `
            ${supportBtn}
            ${cartBtn}
            <button class="nav-btn nav-btn-login" onclick="showPage('auth')"><i class="fa-solid fa-right-to-bracket"></i> دخول</button>
        `;
    }
    updateCartBadge();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function openProductModal(id) {
    const p = products.find(item => item.id === id);
    if(!p) return;
    document.getElementById('modalTitle').innerText = p.name;
    document.getElementById('modalPrice').innerText = (p.price - (p.price * (p.discount || 0) / 100)) + ' د.ع';
    document.getElementById('modalIcon').innerHTML = `<i class="fa-solid ${p.icon || 'fa-box'}"></i>`;
    document.getElementById('productModal').classList.add('active');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    currentUser = { name: email.split('@')[0], email: email, isAdmin: email.includes('admin') };
    checkAuthStatus();
    showPage('home');
    showToast('مرحباً بك مجدداً!');
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    currentUser = { name: name, email: email, isAdmin: false };
    checkAuthStatus();
    showPage('home');
    showToast('تم إنشاء الحساب بنجاح!');
}

function handleLogout() {
    currentUser = null;
    checkAuthStatus();
    showPage('home');
    showToast('تم تسجيل الخروج بنجاح.');
}

function switchAdminTab(tabName) {
    ['adminProductsSection', 'adminCategoriesSection', 'adminCouponsSection', 'adminAnnouncementsSection', 'adminOrdersSection', 'adminLotterySection', 'adminSettingsSection', 'adminReportsSection'].forEach(sec => {
        const el = document.getElementById(sec);
        if(el) el.classList.add('hidden');
    });
    const activeSec = document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Section');
    if(activeSec) activeSec.classList.remove('hidden');
}

function renderAdminDashboard() {
    document.getElementById('statProductsCount').innerText = products.length;
    document.getElementById('statOrders').innerText = '0';
    document.getElementById('statSales').innerText = '0 د.ع';
}
