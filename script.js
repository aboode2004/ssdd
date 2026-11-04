const SUPABASE_URL = 'https://mixtajmjaitfcqsvflgl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-y-8QOaGJ6RzC4UxeG5ATw_LxVZByAo';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null, allProducts = [], allOrders = [], userWishlistIds = [], userAddresses = [], allCategories = [], allCoupons = [], allAnnouncements = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let recentViews = JSON.parse(localStorage.getItem('recentViews') || '[]');
let activeProductId = null, modalQty = 1, appliedDiscountAmount = 0, appliedCouponCode = "";
let previousOrderCount = 0;
let currentCategoryFilter = 'all';

function playOrderSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5 note
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) { console.log('Audio Context Error:', e); }
}

function showPage(pageName) {
    ['home', 'auth', 'profile', 'admin'].forEach(p => {
        const el = document.getElementById('page-' + p);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById('page-' + pageName);
    if(target) target.classList.remove('hidden');

    if(pageName === 'profile') { switchUserTab('orders'); loadProfileData(); }
    if(pageName === 'admin') { switchAdminTab('products'); loadAdminData(); }
    if(pageName === 'home') { window.scrollTo(0,0); renderRecentlyViewed(); }
}

// زر الرجوع الذكي بين الصفحات
function goBackToHome() {
    showPage('home');
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('active'); 
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') { input.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { input.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}

async function initAuth() {
    const { data: { session } } = await db.auth.getSession();
    setUser(session ? session.user : null);
    db.auth.onAuthStateChange((_e, session) => setUser(session ? session.user : null));
}

function setUser(user) {
    currentUser = user;
    const nav = document.getElementById('navActions');
    if(!nav) return;

    // تم تعديل زر الدعم الفني ليظهر بالاسم المطلوب "الداعم الفني" مع رابط الواتساب الرقم 07725372995
    const supportHtml = `<a href="https://wa.me/9647725372995" target="_blank" class="support-float-btn" style="text-decoration:none;"><i class="fab fa-whatsapp"></i> الداعم الفني</a>`;

    if (user) {
        const username = user.user_metadata?.username || 'مستخدم';
        const isAdmin = user.email === '2004oopp202326@gmail.com';
        nav.innerHTML = `${supportHtml}
                         <button class="nav-btn" onclick="showPage('profile')"><i class="fas fa-user"></i> ${username}</button>
                         ${isAdmin ? `<button class="nav-btn nav-btn-login" onclick="showPage('admin')"><i class="fas fa-cog"></i> الإدارة</button>` : ''}
                         <button class="nav-btn nav-btn-cart" onclick="toggleCart()"><i class="fas fa-shopping-cart"></i> <span class="cart-count" id="cartCount">0</span></button>`;
        loadWishlist(); loadAddresses();
    } else {
        userWishlistIds = []; userAddresses = [];
        nav.innerHTML = `${supportHtml}
                         <button class="nav-btn nav-btn-login" onclick="showPage('auth')">دخول</button>
                         <button class="nav-btn nav-btn-cart" onclick="toggleCart()"><i class="fas fa-shopping-cart"></i> <span class="cart-count" id="cartCount">0</span></button>`;
    }
    updateCartUI();
}

function switchAuthTab(t) {
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const formLogin = document.getElementById('formLogin');
    const formSignup = document.getElementById('formSignup');

    if(tabLogin) tabLogin.classList.toggle('active', t === 'login');
    if(tabSignup) tabSignup.classList.toggle('active', t === 'signup');
    if(formLogin) formLogin.classList.toggle('hidden', t !== 'login');
    if(formSignup) formSignup.classList.toggle('hidden', t !== 'signup');
}

async function handleLogin(e) {
    e.preventDefault(); const btn = document.getElementById('btnLogin'); btn.disabled = true; btn.textContent = 'جاري...';
    const { error } = await db.auth.signInWithPassword({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value });
    if (error) { showToast('خطأ: ' + (error.message === 'Invalid login credentials' ? 'البريد أو كلمة المرور غير صحيحة' : error.message), 'error'); btn.disabled = false; btn.textContent = 'دخول'; } 
    else { showToast('مرحباً!'); showPage('home'); }
}

function generateUsername(name) {
    const cleanName = name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return cleanName ? `${cleanName}_${randomNum}` : `user_${randomNum}`;
}

async function handleSignup(e) {
    e.preventDefault(); const btn = document.getElementById('btnSignup'); btn.disabled = true; btn.textContent = 'جاري...';
    const name = document.getElementById('signupName').value;
    const username = generateUsername(name);
    const { error } = await db.auth.signUp({ email: document.getElementById('signupEmail').value, password: document.getElementById('signupPassword').value, options: { data: { full_name: name, username: username } } });
    if (error) { showToast('خطأ: ' + error.message, 'error'); btn.disabled = false; btn.textContent = 'إنشاء حساب'; } 
    else { showToast('تم إنشاء الحساب! اسمك: ' + username); showPage('home'); }
}

async function handleLogout() { await db.auth.signOut(); showPage('home'); showToast('تم الخروج'); }

async function handleChangePassword(e) {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('btnChangePassword');

    if (newPass !== confirmPass) { showToast('كلمتا المرور غير متطابقتين', 'error'); return; }
    btn.disabled = true; btn.textContent = 'جاري التحديث...';
    const { error } = await db.auth.updateUser({ password: newPass });
    if (error) { showToast('خطأ: ' + error.message, 'error'); } 
    else { showToast('تم تغيير كلمة المرور بنجاح! 🔒'); document.getElementById('changePasswordForm').reset(); }
    btn.disabled = false; btn.textContent = 'تحديث كلمة المرور';
}

async function loadAddresses() {
    if(!currentUser) return;
    const { data } = await db.from('addresses').select('*').eq('user_id', currentUser.id);
    userAddresses = data || [];
    const select = document.getElementById('savedAddressSelect');
    if(select) {
        select.innerHTML = '<option value="">-- اختر عنواناً --</option>' + userAddresses.map(a => `<option value="${a.id}">${a.title} - ${a.city}</option>`).join('');
    }
    const addrList = document.getElementById('addressesList');
    if(addrList) {
        addrList.innerHTML = userAddresses.length ? userAddresses.map(a => `
            <div class="address-card">
                <div><b>${a.title}</b><br><small>${a.city} - ${a.details}</small></div>
                <button onclick="deleteAddress(${a.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
            </div>
        `).join('') : '<p>لا توجد عناوين.</p>';
    }
}

async function submitNewAddress(e) {
    e.preventDefault();
    await db.from('addresses').insert([{ user_id: currentUser.id, title: document.getElementById('addrTitle').value, city: document.getElementById('addrCity').value, details: document.getElementById('addrDetails').value }]);
    document.getElementById('addAddressForm').reset(); showToast('تمت الإضافة'); loadAddresses();
}

async function deleteAddress(id) { await db.from('addresses').delete().eq('id', id); showToast('تم الحذف'); loadAddresses(); }

async function loadWishlist() {
    if(!currentUser) return;
    const { data } = await db.from('wishlist').select('product_id').eq('user_id', currentUser.id);
    userWishlistIds = data ? data.map(w => w.product_id) : [];
    renderProducts(allProducts);
}

async function toggleWishlist(id, event) {
    event.stopPropagation();
    if (!currentUser) { showToast('سجل دخول أولاً', 'error'); showPage('auth'); return; }
    if (userWishlistIds.includes(id)) {
        await db.from('wishlist').delete().eq('user_id', currentUser.id).eq('product_id', id);
        userWishlistIds = userWishlistIds.filter(x => x !== id); showToast('تمت الإزالة');
    } else {
        await db.from('wishlist').insert([{ user_id: currentUser.id, product_id: id }]);
        userWishlistIds.push(id); showToast('تمت الإضافة للمفضلة ❤️');
    }
    renderProducts(allProducts);
    const wishSec = document.getElementById('userWishlistSection');
    if(wishSec && !wishSec.classList.contains('hidden')) loadWishlistItems();
}

function switchUserTab(tab) {
    ['orders', 'wishlist', 'addresses', 'security'].forEach(t => {
        const btn = document.getElementById('tabUser' + t.charAt(0).toUpperCase() + t.slice(1));
        const sec = document.getElementById('user' + t.charAt(0).toUpperCase() + t.slice(1) + 'Section');
        if(btn) btn.classList.toggle('active', t === tab);
        if(sec) sec.classList.toggle('hidden', t !== tab);
    });
    if(tab === 'wishlist') loadWishlistItems();
}

async function loadWishlistItems() {
    const grid = document.getElementById('wishlistGrid');
    if(!grid) return;
    if (userWishlistIds.length === 0) { grid.innerHTML = '<p>لا توجد منتجات.</p>'; return; }
    const wishProducts = allProducts.filter(p => userWishlistIds.includes(p.id));
    grid.innerHTML = wishProducts.map(p => `
        <div class="product-card" onclick="openProduct(${p.id})">
            <div class="product-image" style="${p.image_url ? `background-image:url('${p.image_url}');` : ''}">${!p.image_url ? (p.icon || '📦') : ''}</div>
            <div class="product-title">${p.name}</div>
            <div class="product-price">${Number(p.price).toLocaleString()} د.ع</div>
            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})">أضف للسلة</button>
        </div>
    `).join('');
}

async function loadProducts() {
    const { data: prodData } = await db.from('products').select('*');
    allProducts = prodData || []; 
    
    const { data: catData } = await db.from('categories').select('*');
    allCategories = catData || [];
    renderCategoriesUI();

    const { data: annData } = await db.from('announcements').select('*').limit(1);
    allAnnouncements = annData || [];
    renderAnnouncementBar();

    renderProducts(allProducts); 
    renderRecentlyViewed();
}

function renderCategoriesUI() {
    const catContainer = document.getElementById('categoriesContainer');
    if(!catContainer) return;
    
    let html = `<button class="category-chip ${currentCategoryFilter === 'all' ? 'active' : ''}" onclick="filterByCategory('all')">الكل</button>`;
    html += allCategories.map(c => `
        <button class="category-chip ${currentCategoryFilter === c.name ? 'active' : ''}" onclick="filterByCategory('${c.name}')">${c.name}</button>
    `).join('');
    catContainer.innerHTML = html;
}

function filterByCategory(catName) {
    currentCategoryFilter = catName;
    renderCategoriesUI();
    if(catName === 'all') {
        renderProducts(allProducts);
    } else {
        renderProducts(allProducts.filter(p => p.category === catName));
    }
}

function renderAnnouncementBar() {
    let bar = document.getElementById('announcementBar');
    if(!bar) {
        bar = document.createElement('div');
        bar.id = 'announcementBar';
        bar.style.cssText = 'background:#1a1a1a; color:#fea621; padding:8px 0; overflow:hidden; white-space:nowrap; font-weight:bold; font-size:0.9rem;';
        document.body.insertBefore(bar, document.body.firstChild);
    }
    const text = allAnnouncements.length > 0 ? allAnnouncements[0].text : 'أهلاً بك في متجر يساعدكم - تسوق أفضل المنتجات بأفضل الأسعار!';
    bar.innerHTML = `<marquee direction="right" scrollamount="5">🔥 ${text} 🔥</marquee>`;
}

function renderProducts(list) {
    const g = document.getElementById('productsGrid');
    if(!g) return;
    if (!list.length) { g.innerHTML = '<p>لا توجد منتجات</p>'; return; }
    g.innerHTML = list.map(p => {
        let finalPrice = Number(p.price), priceHtml = `${finalPrice.toLocaleString('ar-IQ')} د.ع`, badgeHtml = '';
        if(p.discount > 0) {
            finalPrice = finalPrice - (finalPrice * (p.discount / 100));
            priceHtml = `<span class="old-price">${Number(p.price).toLocaleString('ar-IQ')}</span> ${finalPrice.toLocaleString('ar-IQ')} د.ع`;
            badgeHtml = `<div class="discount-badge">${p.discount}% خصم</div>`;
        }
        const isWish = userWishlistIds.includes(p.id);
        return `
        <div class="product-card" onclick="openProduct(${p.id})">
            ${badgeHtml}
            <button class="wishlist-btn ${isWish ? 'active' : ''}" onclick="toggleWishlist(${p.id}, event)"><i class="${isWish ? 'fas' : 'far'} fa-heart"></i></button>
            <div class="product-image" style="${p.image_url ? `background-image:url('${p.image_url}');` : ''}">${!p.image_url ? (p.icon || '📦') : ''}</div>
            <div class="product-title">${p.name}</div>
            <div style="color:#ffc107; font-size:0.8rem; margin-bottom:5px;">${'⭐'.repeat(Math.round(p.rating || 5))}</div>
            <div class="product-price">${priceHtml}</div>
            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})">أضف للسلة</button>
        </div>`;
    }).join('');
}

function filterProducts() { 
    const searchInput = document.getElementById('searchInput');
    if(!searchInput) return;
    const term = searchInput.value.toLowerCase(); 
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(term))); 
}

function filterByPrice(type) { 
    let s = [...allProducts]; 
    if(type === 'low') s.sort((a, b) => Number(a.price) - Number(b.price)); 
    if(type === 'high') s.sort((a, b) => Number(b.price) - Number(a.price)); 
    renderProducts(s); 
}

function filterByRating() { 
    let s = [...allProducts]; 
    s.sort((a, b) => (b.rating || 0) - (a.rating || 0)); 
    renderProducts(s); 
}

function addToRecentViews(id) {
    recentViews = recentViews.filter(x => x !== id); recentViews.unshift(id);
    if(recentViews.length > 5) recentViews.pop();
    localStorage.setItem('recentViews', JSON.stringify(recentViews));
}

function renderRecentlyViewed() {
    const section = document.getElementById('recentlyViewedSection'), list = document.getElementById('recentlyViewedList');
    if(!section || !list) return;
    if(recentViews.length === 0) { section.classList.add('hidden'); return; }
    const prods = recentViews.map(id => allProducts.find(p => p.id === id)).filter(p => p);
    if(prods.length === 0) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');
    list.innerHTML = prods.map(p => `<div class="product-card" onclick="openProduct(${p.id})"><div class="product-image">${p.icon || '📦'}</div><div class="product-title">${p.name}</div><div class="product-price">${Number(p.price).toLocaleString()}</div></div>`).join('');
}

async function openProduct(id) {
    const p = allProducts.find(x => x.id === id); if (!p) return;
    activeProductId = id; modalQty = 1; 
    const qtyEl = document.getElementById('modalQty');
    if(qtyEl) qtyEl.textContent = modalQty;
    addToRecentViews(id);
    const iconDiv = document.getElementById('modalIcon');
    if (iconDiv) {
        if (p.image_url) { iconDiv.style.backgroundImage = `url('${p.image_url}')`; iconDiv.textContent = ''; }
        else { iconDiv.style.backgroundImage = 'none'; iconDiv.textContent = p.icon || '📦'; }
    }
    const titleEl = document.getElementById('modalTitle');
    if(titleEl) titleEl.textContent = p.name;
    
    let priceText = `${Number(p.price).toLocaleString('ar-IQ')} د.ع`;
    if(p.discount > 0) { let fp = Number(p.price) - (Number(p.price) * (p.discount / 100)); priceText = `<span class="old-price">${Number(p.price).toLocaleString('ar-IQ')}</span> ${fp.toLocaleString('ar-IQ')} د.ع`; }
    const priceEl = document.getElementById('modalPrice');
    if(priceEl) priceEl.innerHTML = priceText;

    const modal = document.getElementById('productModal');
    if(modal) modal.classList.add('active');

    const revForm = document.getElementById('reviewForm');
    if(revForm) revForm.classList.toggle('hidden', !currentUser);

    const revList = document.getElementById('reviewsList');
    if(revList) {
        revList.innerHTML = 'جاري التحميل...';
        const { data: reviews } = await db.from('reviews').select('*').eq('product_id', id);
        revList.innerHTML = reviews && reviews.length ? reviews.map(r => `<div class="review-item"><div style="display:flex;justify-content:space-between;"><b>${r.user_name}</b><span class="stars">${'⭐'.repeat(r.rating)}</span></div><p>${r.comment}</p></div>`).join('') : '<p>لا توجد تقييمات.</p>';
    }

    const simList = document.getElementById('similarProductsList');
    if(simList) {
        const similar = allProducts.filter(x => x.id !== p.id).slice(0, 2);
        simList.innerHTML = similar.map(s => `<div style="background:var(--gray-light); padding:8px; border-radius:8px; cursor:pointer;" onclick="openProduct(${s.id})"><div style="height:60px; font-size:2rem; text-align:center;">${s.icon || '📦'}</div><div style="font-size:0.8rem; font-weight:bold;">${s.name}</div><div style="font-size:0.8rem; color:var(--orange);">${Number(s.price).toLocaleString()}</div></div>`).join('');
    }
}

function changeModalQty(delta) { 
    if (modalQty + delta < 1) return; 
    modalQty += delta; 
    const qtyEl = document.getElementById('modalQty');
    if(qtyEl) qtyEl.textContent = modalQty; 
}

function addToCartFromModal() {
    const p = allProducts.find(x => x.id === activeProductId);
    if(!p || p.stock <= 0) { showToast('عذراً، هذا المنتج غير متوفر حالياً', 'error'); return; }
    const item = cart.find(x => x.id === activeProductId);
    let fp = Number(p.price); if(p.discount > 0) fp -= (fp * (p.discount / 100));
    if (item) item.qty += modalQty; else cart.push({ ...p, price: fp, qty: modalQty });
    saveCart(); updateCartUI(); showToast(`تمت الإضافة`); closeModal('productModal');
}

function buyNowFromModal() { addToCartFromModal(); openCheckout(); }

async function submitReview(e) {
    e.preventDefault();
    await db.from('reviews').insert([{ product_id: activeProductId, user_id: currentUser.id, user_name: currentUser.user_metadata?.full_name || 'مستخدم', rating: parseInt(document.getElementById('reviewRating').value), comment: document.getElementById('reviewComment').value }]);
    showToast('شكراً!'); openProduct(activeProductId); document.getElementById('reviewForm').reset();
}

function toggleCart() { 
    const sidebar = document.getElementById('cartSidebar');
    if(sidebar) sidebar.classList.toggle('active'); 
}

function addToCart(id) {
    const p = allProducts.find(x => x.id === id);
    if(!p || p.stock <= 0) { showToast('نفدت الكمية', 'error'); return; }
    const item = cart.find(x => x.id === id);
    let fp = Number(p.price); if(p.discount > 0) fp -= (fp * (p.discount / 100));
    if (item) item.qty++; else cart.push({ ...p, price: fp, qty: 1 });
    saveCart(); updateCartUI(); showToast('تمت الإضافة');
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }

function updateCartUI() {
    const countEl = document.getElementById('cartCount'); if (countEl) countEl.textContent = cart.reduce((s, i) => s + i.qty, 0);
    const container = document.getElementById('cartItems'), footer = document.getElementById('cartFooter');
    if(!container || !footer) return;
    if (!cart.length) { container.innerHTML = '<p style="text-align:center;">السلة فارغة</p>'; footer.style.display = 'none'; return; }
    container.innerHTML = cart.map(i => `<div class="cart-item-row"><div><b>${i.name}</b><br><span style="color:var(--orange)">${(i.price * i.qty).toLocaleString()} د.ع</span></div><div style="display:flex;align-items:center;gap:5px;"><button onclick="changeQty(${i.id}, -1)">-</button><span>${i.qty}</span><button onclick="changeQty(${i.id}, 1)">+</button></div></div>`).join('');
    const totalEl = document.getElementById('cartTotal');
    if(totalEl) totalEl.textContent = cart.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString() + ' د.ع';
    footer.style.display = 'block';
}

function changeQty(id, delta) { 
    const item = cart.find(x => x.id === id); 
    if (!item) return; 
    item.qty += delta; 
    if (item.qty <= 0) cart = cart.filter(x => x.id !== id); 
    saveCart(); 
    updateCartUI(); 
}

function openCheckout() { 
    if (!currentUser) { showToast('سجل دخول أولاً', 'error'); toggleCart(); showPage('auth'); return; } 
    appliedDiscountAmount = 0; 
    const couponInput = document.getElementById('couponCode');
    if(couponInput) couponInput.value = ""; 
    updateChkTotals(); 
    const chkModal = document.getElementById('checkoutModal');
    if(chkModal) chkModal.classList.add('active'); 
    toggleCart(); 
}

async function applyCoupon() { 
    const couponInput = document.getElementById('couponCode');
    if(!couponInput) return;
    const code = couponInput.value.trim().toUpperCase(); 
    appliedDiscountAmount = 0; 
    
    const { data: couponData } = await db.from('coupons').select('*').eq('code', code).single();
    
    if(couponData) {
        appliedDiscountAmount = couponData.discount_value; 
        appliedCouponCode = code;
        showToast('تم تطبيق كود الخصم بنجاح!');
    } else if(code === "NINEVEH10") { 
        appliedDiscountAmount = 0.10; 
        appliedCouponCode = code; 
        showToast('خصم 10%!'); 
    } else if(code === "FREE5") { 
        appliedDiscountAmount = 5000; 
        appliedCouponCode = code; 
        showToast('خصم 5000 د.ع!'); 
    } else { 
        showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error'); 
    } 
    updateChkTotals(); 
}

function updateChkTotals() {
    const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    let dv = 0; if(appliedDiscountAmount < 1 && appliedDiscountAmount > 0) dv = subtotal * appliedDiscountAmount; else dv = appliedDiscountAmount;
    let total = subtotal - dv; if(total < 0) total = 0;
    
    const subEl = document.getElementById('chkSubtotal');
    const discEl = document.getElementById('chkDiscount');
    const totEl = document.getElementById('chkTotal');

    if(subEl) subEl.textContent = subtotal.toLocaleString() + ' د.ع';
    if(discEl) discEl.textContent = dv > 0 ? `- ${dv.toLocaleString()} د.ع` : '0 د.ع';
    if(totEl) totEl.textContent = total.toLocaleString() + ' د.ع (يضاف التوصيل لاحقاً)';
}

async function submitOrder(e) {
    e.preventDefault(); const btn = document.getElementById('btnSubmitOrder'); if(btn) btn.disabled = true;
    const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    let dv = 0; if(appliedDiscountAmount < 1 && appliedDiscountAmount > 0) dv = subtotal * appliedDiscountAmount; else dv = appliedDiscountAmount;
    let ft = subtotal - dv; if(ft < 0) ft = 0;
    
    const nameEl = document.getElementById('orderName');
    const phoneEl = document.getElementById('orderPhone');
    const addressEl = document.getElementById('orderAddress');

    const { data, error } = await db.from('orders').insert([{ 
        user_id: currentUser.id, 
        total: ft, 
        status: 'pending', 
        customer_name: nameEl ? nameEl.value : '', 
        customer_phone: phoneEl ? phoneEl.value : '', 
        customer_address: addressEl ? addressEl.value : '', 
        coupon_used: appliedCouponCode,
        delivery_cost: 0,
        delivery_time: 'قيد التحديد'
    }]).select();

    if (error) { 
        showToast(error.message, 'error'); 
        if(btn) btn.disabled = false; 
    } else { 
        const invoiceId = document.getElementById('invoiceId');
        if(invoiceId) invoiceId.textContent = '#' + data[0].id; 
        closeModal('checkoutModal'); 
        const invModal = document.getElementById('invoiceModal');
        if(invModal) invModal.classList.add('active'); 
        cart = []; saveCart(); updateCartUI(); 
        if(btn) btn.disabled = false; 
    }
}

async function userCancelOrder(orderId) {
    if(!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    const { error } = await db.from('orders').update({ status: 'rejected' }).eq('id', orderId).eq('user_id', currentUser.id);
    if(error) { showToast('تعذر إلغاء الطلب: ' + error.message, 'error'); }
    else { showToast('تم إلغاء الطلب بنجاح'); loadProfileData(); }
}

async function loadProfileData() {
    if (!currentUser) return;
    const uName = document.getElementById('profileUsername');
    const fName = document.getElementById('profileName');
    const eMail = document.getElementById('profileEmail');
    const avatar = document.getElementById('profileAvatar');

    if(uName) uName.textContent = '@' + (currentUser.user_metadata?.username || 'مستخدم');
    if(fName) fName.textContent = currentUser.user_metadata?.full_name || 'غير محدد';
    if(eMail) eMail.textContent = currentUser.email;
    if(avatar) avatar.textContent = (currentUser.user_metadata?.username || 'U').charAt(0).toUpperCase();

    const { data } = await db.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    const ordersList = document.getElementById('ordersList');
    if(ordersList) {
        ordersList.innerHTML = data && data.length ? data.map(o => {
            let s1 = 'active', s2 = '', s3 = '', isRejected = o.status === 'rejected';
            if(isRejected) { s1 = ''; s2 = ''; s3 = ''; }
            else { if(o.status === 'shipped') s2 = 'active'; if(o.status === 'delivered') { s2 = 'active'; s3 = 'active'; } }
            
            let trackHtml = isRejected 
                ? '<div style="color:var(--red); font-weight:bold; text-align:center; margin-top:10px;">❌ تم إلغاء الطلب</div>' 
                : `<div class="status-track"><div class="status-step ${s1}"><div class="status-dot"></div>انتظار</div><div class="status-step ${s2}"><div class="status-dot"></div>توصيل (${o.delivery_time || 'قيد التحديد'})</div><div class="status-step ${s3}"><div class="status-dot"></div>تم</div></div>`;

            let cancelBtnHtml = (o.status === 'pending') ? `<button onclick="userCancelOrder(${o.id})" class="btn-delete" style="margin-top:10px; width:100%;"><i class="fas fa-times-circle"></i> إلغاء الطلب الآن</button>` : '';
            let deliveryInfo = o.delivery_cost > 0 ? `<div style="margin-top:5px; color:var(--blue);">تكلفة التوصيل: ${Number(o.delivery_cost).toLocaleString()} د.ع (${o.delivery_time})</div>` : '';
            
            return `<div style="background:white; padding:15px; border-radius:10px; margin-bottom:15px;"><div style="display:flex; justify-content:space-between; border-bottom:1px solid #ddd; padding-bottom:10px;"><b>طلب #${o.id}</b><b style="color:var(--orange)">الإجمالي: ${(o.total + (o.delivery_cost || 0)).toLocaleString()} د.ع</b></div>${deliveryInfo}${trackHtml}${cancelBtnHtml}</div>`;
        }).join('') : '<p>لا توجد طلبات.</p>';
    }
}

function switchAdminTab(tab) {
    ['products', 'categories', 'coupons', 'announcements', 'orders', 'lottery', 'settings', 'reports'].forEach(t => {
        const btn = document.getElementById('tabAdmin' + t.charAt(0).toUpperCase() + t.slice(1));
        const sec = document.getElementById('admin' + t.charAt(0).toUpperCase() + t.slice(1) + 'Section');
        if(btn) btn.classList.toggle('active', t === tab);
        if(sec) sec.classList.toggle('hidden', t !== tab);
    });
}

async function quickUpdateStock(productId, delta) {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return;
    const newStock = Math.max(0, (p.stock || 0) + delta);
    const { error } = await db.from('products').update({ stock: newStock }).eq('id', productId);
    if (error) { showToast('خطأ: ' + error.message, 'error'); }
    else { p.stock = newStock; renderAdminProducts(); renderLowStock(); showToast(`تم تحديث المخزون إلى ${newStock}`); }
}

async function loadAdminData() {
    const { data: p } = await db.from('products').select('*'); 
    const { data: o } = await db.from('orders').select('*').order('created_at', { ascending: false });
    const { data: c } = await db.from('categories').select('*');
    const { data: cp } = await db.from('coupons').select('*');
    
    allProducts = p || []; allOrders = o || []; allCategories = c || []; allCoupons = cp || [];
    
    if (previousOrderCount > 0 && allOrders.length > previousOrderCount) {
        playOrderSound();
        showToast('🔔 هناك طلب جديد ورد إلى المتجر الآن!', 'success');
    }
    previousOrderCount = allOrders.length;

    let ts = 0, totalStockCount = 0; 
    allOrders.forEach(x => { if(x.status !== 'rejected') ts += (x.total + (x.delivery_cost || 0)); });
    allProducts.forEach(prod => { totalStockCount += (prod.stock || 0); });

    const statOrders = document.getElementById('statOrders');
    const statSales = document.getElementById('statSales');
    const statProd = document.getElementById('statProductsCount');
    const statStock = document.getElementById('statTotalStock');

    if(statOrders) statOrders.textContent = allOrders.length; 
    if(statSales) statSales.textContent = ts.toLocaleString();
    if(statProd) statProd.textContent = allProducts.length;
    if(statStock) statStock.textContent = totalStockCount;

    renderAdminProducts(); 
    renderAdminOrders();
    renderAdminCategories();
    renderAdminCoupons();
    renderLowStock();
}

async function addNewCategory(e) {
    e.preventDefault();
    const catInput = document.getElementById('newCategoryName');
    if(!catInput) return;
    const name = catInput.value.trim();
    if(!name) return;
    const { error } = await db.from('categories').insert([{ name }]);
    if(error) { showToast('خطأ: ' + error.message, 'error'); } 
    else { showToast('تمت إضافة القسم بنجاح'); document.getElementById('addCategoryForm').reset(); loadAdminData(); }
}

async function deleteCategory(id) {
    if(!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    const { error } = await db.from('categories').delete().eq('id', id);
    if(error) { showToast('خطأ: ' + error.message, 'error'); } 
    else { showToast('تم حذف القسم'); loadAdminData(); }
}

function renderAdminCategories() {
    const list = document.getElementById('adminCategoriesList');
    if(!list) return;
    list.innerHTML = allCategories.length ? allCategories.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:10px 0;">
            <b>${c.name}</b>
            <button onclick="deleteCategory(${c.id})" class="btn-delete"><i class="fas fa-trash"></i> حذف</button>
        </div>
    `).join('') : '<p>لا توجد أقسام مضافة بعد.</p>';
}

async function addNewCoupon(e) {
    e.preventDefault();
    const cInput = document.getElementById('newCouponCode');
    const dInput = document.getElementById('newCouponDiscount');
    if(!cInput || !dInput) return;

    const code = cInput.value.trim().toUpperCase();
    const discountVal = parseFloat(dInput.value);
    
    if(!code || isNaN(discountVal)) return;
    const { error } = await db.from('coupons').insert([{ code, discount_value: discountVal }]);
    if(error) { showToast('خطأ: ' + error.message, 'error'); } 
    else { showToast('تم إنشاء كود الخصم بنجاح! 🎟️'); document.getElementById('addCouponForm').reset(); loadAdminData(); }
}

async function deleteCoupon(id) {
    const { error } = await db.from('coupons').delete().eq('id', id);
    if(error) { showToast('خطأ: ' + error.message, 'error'); } 
    else { showToast('تم حذف الكود'); loadAdminData(); }
}

function renderAdminCoupons() {
    const list = document.getElementById('adminCouponsList');
    if(!list) return;
    list.innerHTML = allCoupons.length ? allCoupons.map(cp => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:10px 0;">
            <div><b>كود: ${cp.code}</b><br><small>قيمة الخصم: ${cp.discount_value}</small></div>
            <button onclick="deleteCoupon(${cp.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
        </div>
    `).join('') : '<p>لا توجد أكواد خصم نشطة.</p>';
}

async function saveAnnouncement(e) {
    e.preventDefault();
    const annInput = document.getElementById('announcementTextInput');
    if(!annInput) return;
    const text = annInput.value.trim();
    await db.from('announcements').delete().neq('id', 0);
    const { error } = await db.from('announcements').insert([{ text }]);
    if(error) { showToast('خطأ: ' + error.message, 'error'); }
    else { showToast('تم تحديث شريط الإعلانات بنجاح!'); loadProducts(); }
}

function renderAdminProducts() {
    const searchInput = document.getElementById('adminProductSearch');
    const adminProdList = document.getElementById('adminProductsList');
    if(!adminProdList) return;

    const t = searchInput ? searchInput.value.toLowerCase() : '';
    adminProdList.innerHTML = allProducts.filter(p => p.name.toLowerCase().includes(t)).map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:10px 0;">
            <div>
                <b>${p.name}</b> - ${Number(p.price).toLocaleString()} د.ع 
                <br>
                <small>المخزون الحالي: <strong style="color:var(--orange)">${p.stock || 0}</strong> قطعة</small>
            </div>
            <div style="display:flex; gap:5px; align-items:center;">
                <button onclick="quickUpdateStock(${p.id}, -1)" class="btn-stock">-</button>
                <button onclick="quickUpdateStock(${p.id}, 1)" class="btn-stock">+</button>
                <button onclick="openEditProduct(${p.id})" class="btn-edit" style="margin-right:8px;"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProduct(${p.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function printShippingLabel(orderId) {
    const o = allOrders.find(x => x.id === orderId);
    if (!o) return;
    const printArea = document.getElementById('printSection');
    if(!printArea) return;

    printArea.innerHTML = `
        <div style="border:3px dashed #1a1a1a; padding:25px; border-radius:15px; max-width:450px; margin:0 auto; background:#fff;">
            <h2 style="text-align:center; color:#fea621; margin-bottom:15px;">🛍️ بوليصة شحن - متجر يساعدكم</h2>
            <hr style="margin-bottom:15px;">
            <p style="font-size:1.1rem; margin-bottom:8px;"><b>رقم الطلب:</b> #${o.id}</p>
            <p style="font-size:1.1rem; margin-bottom:8px;"><b>اسم الزبون:</b> ${o.customer_name}</p>
            <p style="font-size:1.1rem; margin-bottom:8px;"><b>رقم الهاتف:</b> ${o.customer_phone}</p>
            <p style="font-size:1.1rem; margin-bottom:8px;"><b>عنوان التوصيل:</b> ${o.customer_address}</p>
            <p style="font-size:1.1rem; margin-bottom:8px;"><b>وقت التوصيل:</b> ${o.delivery_time || 'غير محدد'}</p>
            <hr style="margin:15px 0;">
            <h3 style="text-align:center; color:#28a745;">المبلغ المطلوب عند الاستلام: ${(o.total + (o.delivery_cost || 0)).toLocaleString()} د.ع</h3>
        </div>
    `;
    printArea.style.display = 'block';
    window.print();
    printArea.style.display = 'none';
}

function renderAdminOrders() {
    const searchInput = document.getElementById('adminOrderSearch');
    const adminOrdersList = document.getElementById('adminOrdersList');
    if(!adminOrdersList) return;

    const t = searchInput ? searchInput.value.toLowerCase() : '';
    adminOrdersList.innerHTML = allOrders.filter(o => o.customer_name.toLowerCase().includes(t) || o.customer_phone.includes(t)).map(o => {
        let actions = '';
        if(o.status === 'pending') {
            actions = `<button onclick="openDeliveryModal(${o.id})" class="btn-accept"><i class="fas fa-check"></i> قبول وتحديد التوصيل</button>
                       <button onclick="updateOrderStatus(${o.id}, 'rejected')" class="btn-reject"><i class="fas fa-times"></i> إلغاء الطلب</button>`;
        } else if(o.status === 'shipped') {
            actions = `<button onclick="updateOrderStatus(${o.id}, 'delivered')" class="btn-accept"><i class="fas fa-check-double"></i> تم التوصيل</button>
                       <button onclick="printShippingLabel(${o.id})" class="btn-edit" style="background:var(--purple-dark);"><i class="fas fa-print"></i> طباعة البوليصة</button>
                       <button onclick="updateOrderStatus(${o.id}, 'rejected')" class="btn-reject"><i class="fas fa-times"></i> إلغاء الطلب</button>`;
        } else if(o.status === 'rejected') {
            actions = `<span style="color:var(--red); font-size:0.8rem;">تم إلغاء الطلب</span>`;
        } else {
            actions = `<button onclick="printShippingLabel(${o.id})" class="btn-edit" style="background:var(--purple-dark);"><i class="fas fa-print"></i> طباعة البوليصة</button>
                       <span style="color:var(--green); font-size:0.8rem; margin-right:5px;">مكتمل</span>`;
        }
        return `<div class="order-card"><div class="order-header"><span>#${o.id}</span><span>المجموع: ${(o.total + (o.delivery_cost || 0)).toLocaleString()} د.ع</span></div><div class="order-details"><div><b>الزبون:</b> ${o.customer_name} - ${o.customer_phone}</div><div><b>العنوان:</b> ${o.customer_address}</div><div><b>التوصيل:</b> ${o.delivery_cost ? o.delivery_cost + ' د.ع (' + o.delivery_time + ')' : 'لم يحدد بعد'}</div></div><div class="order-actions">${actions}</div></div>`;
    }).join('');
}

function openDeliveryModal(orderId) {
    const orderIdInput = document.getElementById('deliveryOrderId');
    const timeInput = document.getElementById('deliveryTimeInput');
    const costInput = document.getElementById('deliveryCostInput');
    const modal = document.getElementById('deliveryDetailsModal');

    if(orderIdInput) orderIdInput.value = orderId;
    if(timeInput) timeInput.value = 'يومين';
    if(costInput) costInput.value = '2000';
    if(modal) modal.classList.add('active');
}

async function saveDeliveryDetails(e) {
    e.preventDefault();
    const orderId = document.getElementById('deliveryOrderId').value;
    const time = document.getElementById('deliveryTimeInput').value;
    const cost = Number(document.getElementById('deliveryCostInput').value);

    const { error } = await db.from('orders').update({ status: 'shipped', delivery_time: time, delivery_cost: cost }).eq('id', orderId);
    if(error) { showToast('خطأ: ' + error.message, 'error'); } 
    else { showToast('تم قبول الطلب وتحديد التوصيل بنجاح'); closeModal('deliveryDetailsModal'); loadAdminData(); }
}

async function updateOrderStatus(id, s) { 
    await db.from('orders').update({ status: s }).eq('id', id); 
    showToast('تم تحديث حالة الطلب'); 
    loadAdminData(); 
}

function runLotteryDraw() {
    const startTimeStr = document.getElementById('lotteryStartTime').value;
    const endTimeStr = document.getElementById('lotteryEndTime').value;
    
    if(!startTimeStr || !endTimeStr) { showToast('يرجى تحديد وقت البداية والنهاية للقرعة', 'error'); return; }

    const validOrders = allOrders.filter(o => {
        if(!o.created_at) return false;
        const orderTime = new Date(o.created_at).toTimeString().slice(0,5);
        return orderTime >= startTimeStr && orderTime <= endTimeStr && o.status !== 'rejected';
    });

    const resultContainer = document.getElementById('lotteryResultContainer');
    const winnerDetails = document.getElementById('lotteryWinnerDetails');

    if(validOrders.length === 0) {
        if(resultContainer) resultContainer.style.display = 'block';
        if(winnerDetails) winnerDetails.innerHTML = '<span style="color:var(--red);">لا توجد طلبات مسجلة ضمن هذا الوقت المحدد للقرعة!</span>';
        return;
    }

    const randomIndex = Math.floor(Math.random() * validOrders.length);
    const winner = validOrders[randomIndex];

    if(resultContainer) resultContainer.style.display = 'block';
    if(winnerDetails) winnerDetails.innerHTML = `رقم الطلب: #${winner.id} <br>اسم الزبون: ${winner.customer_name} <br>هاتف الزبون: ${winner.customer_phone} <br>العنوان: ${winner.customer_address}`;
    showToast('تم إجراء القرعة بنجاح وإعلان الفائز! 🎁');
}

function renderLowStock() {
    const lowStockList = document.getElementById('lowStockList');
    if(!lowStockList) return;
    const items = allProducts.filter(p => (p.stock || 0) < 5);
    if (!items.length) {
        lowStockList.innerHTML = '<p style="color:var(--green);">جميع المنتجات في المخزن متوفرة بجميع الكميات الكافية 👍</p>';
        return;
    }
    lowStockList.innerHTML = items.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding:10px 0;">
            <div><b>${p.name}</b><br><small style="color:var(--red);">الكمية المتبقية: ${p.stock || 0} قطعة فقط</small></div>
            <button onclick="openEditProduct(${p.id})" class="btn-edit">تزويد المخزون</button>
        </div>
    `).join('');
}

async function handleAdminUpdateEmail(e) {
    e.preventDefault();
    const emailInput = document.getElementById('adminNewEmail');
    if(!emailInput) return;
    const newEmail = emailInput.value.trim();
    const btn = document.getElementById('btnAdminEmail');
    if(!newEmail) return;
    if(btn) { btn.disabled = true; btn.textContent = 'جاري التحديث...'; }
    const { error } = await db.auth.updateUser({ email: newEmail });
    if(error) { showToast('خطأ: ' + error.message, 'error'); } 
    else { showToast('تم تحديث البريد الإلكتروني للمدير بنجاح! 📧'); emailInput.value = ''; }
    if(btn) { btn.disabled = false; btn.textContent = 'حفظ البريد الجديد'; }
}

async function handleAdminUpdatePassword(e) {
    e.preventDefault();
    const p1 = document.getElementById('adminNewPass');
    const p2 = document.getElementById('adminConfirmPass');
    if(!p1 || !p2) return;

    const newPass = p1.value;
    const confirmPass = p2.value;
    const btn = document.getElementById('btnAdminPass');
    if (newPass !== confirmPass) { showToast('كلمتا المرور غير متطابقتين', 'error'); return; }
    if(btn) { btn.disabled = true; btn.textContent = 'جاري التحديث...'; }
    const { error } = await db.auth.updateUser({ password: newPass });
    if (error) { showToast('خطأ: ' + error.message, 'error'); } 
    else { showToast('تم تغيير كلمة مرور المدير بنجاح! 🔒'); p1.value = ''; p2.value = ''; }
    if(btn) { btn.disabled = false; btn.textContent = 'تحديث كلمة المرور'; }
}

function exportOrdersCSV() {
    if(!allOrders.length) { showToast('لا توجد طلبات لتصديرها', 'error'); return; }
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "رقم الطلب,اسم الزبون,الهاتف,العنوان,المبلغ الإجمالي,تكلفة التوصيل,الحالة\n";
    allOrders.forEach(o => {
        csvContent += `"${o.id}","${o.customer_name}","${o.customer_phone}","${o.customer_address}","${o.total}","${o.delivery_cost || 0}","${o.status}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف الطلبات بنجاح');
}

function openEditProduct(id) { 
    const p = allProducts.find(x => x.id === id); 
    if(!p) return;
    const idEl = document.getElementById('editPId');
    const nameEl = document.getElementById('editPName');
    const priceEl = document.getElementById('editPPrice');
    const discEl = document.getElementById('editPDiscount');
    const stockEl = document.getElementById('editPStock');
    const modal = document.getElementById('editProductModal');

    if(idEl) idEl.value = p.id; 
    if(nameEl) nameEl.value = p.name; 
    if(priceEl) priceEl.value = p.price; 
    if(discEl) discEl.value = p.discount || 0; 
    if(stockEl) stockEl.value = p.stock || 0; 
    if(modal) modal.classList.add('active'); 
}

async function uploadProductImage(file) {
    if (!file) return null;
    if (!file.type || !file.type.startsWith('image/')) throw new Error('الملف المختار ليس صورة');
    if (file.size > 5 * 1024 * 1024) throw new Error('حجم الصورة أكبر من 5 ميغابايت');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await db.storage.from('products').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;
    const { data } = db.storage.from('products').getPublicUrl(path);
    if (!data || !data.publicUrl) throw new Error('تعذر إنشاء رابط الصورة');
    return data.publicUrl;
}

async function submitEditProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('btnEditProduct');
    const idEl = document.getElementById('editPId');
    if(!idEl) return;
    const id = idEl.value;
    const product = allProducts.find(x => String(x.id) === String(id));
    if (!product) { showToast('المنتج غير موجود', 'error'); return; }
    if(btn) btn.disabled = true;
    try {
        const fileInput = document.getElementById('editPImageFile');
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        const imageUrl = file ? await uploadProductImage(file) : product.image_url;
        
        const nameInput = document.getElementById('editPName');
        const priceInput = document.getElementById('editPPrice');
        const discInput = document.getElementById('editPDiscount');
        const stockInput = document.getElementById('editPStock');

        const updates = {
            name: nameInput ? nameInput.value.trim() : product.name,
            price: priceInput ? Number(priceInput.value) : product.price,
            discount: discInput ? parseInt(discInput.value) || 0 : 0,
            stock: stockInput ? parseInt(stockInput.value) || 0 : 0
        };
        if (imageUrl) updates.image_url = imageUrl;
        const { error } = await db.from('products').update(updates).eq('id', id);
        if (error) throw error;
        showToast('تم تحديث المنتج والصورة');
        const form = document.getElementById('editProductForm');
        if(form) form.reset();
        closeModal('editProductModal');
        await loadProducts(); await loadAdminData();
    } catch (err) {
        showToast('تعذر الحفظ: ' + (err.message || 'خطأ غير معروف'), 'error');
    } finally { if(btn) btn.disabled = false; }
}

async function deleteProduct(id) {
    if (!confirm('هل انت متأكد من حذف هذا المنتج؟')) return;
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) { showToast('تعذر الحذف: ' + error.message, 'error'); return; }
    showToast('تم الحذف'); await loadProducts(); await loadAdminData();
}

async function submitNewProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('btnAddProduct'); 
    if(btn) btn.disabled = true;
    try {
        const fileInput = document.getElementById('pImageFile');
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        const imageUrl = file ? await uploadProductImage(file) : null;
        
        const nameInput = document.getElementById('pName');
        const priceInput = document.getElementById('pPrice');
        const discInput = document.getElementById('pDiscount');
        const stockInput = document.getElementById('pStock');

        const product = {
            name: nameInput ? nameInput.value.trim() : '',
            price: priceInput ? Number(priceInput.value) : 0,
            discount: discInput ? parseInt(discInput.value) || 0 : 0,
            stock: stockInput ? parseInt(stockInput.value) || 0 : 0,
            icon: '📦'
        };
        if (imageUrl) product.image_url = imageUrl;
        const { error } = await db.from('products').insert([product]);
        if (error) throw error;
        showToast(imageUrl ? 'تمت إضافة المنتج والصورة بنجاح' : 'تمت إضافة المنتج بدون صورة');
        const form = document.getElementById('addProductForm');
        if(form) form.reset();
        await loadProducts(); await loadAdminData();
    } catch (err) {
        showToast('تعذرت إضافة المنتج: ' + (err.message || 'خطأ غير معروف'), 'error');
    } finally { if(btn) btn.disabled = false; }
}

function showToast(m, t = 'success') { 
    const el = document.getElementById('toast'); 
    if(!el) return;
    el.textContent = m; 
    el.style.background = t === 'error' ? '#dc3545' : '#28a745'; 
    el.classList.add('show'); 
    setTimeout(() => el.classList.remove('show'), 3000); 
}

document.addEventListener('DOMContentLoaded', () => { 
   
