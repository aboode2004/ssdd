:root {
    --primary: #fea621;
    --primary-dark: #e09217;
    --dark: #1a1a1a;
    --light: #f9f9f9;
    --gray: #666;
    --gray-light: #e5e5e5;
    --red: #dc3545;
    --green: #28a745;
    --blue: #007bff;
    --border: #ddd;
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
body { background: var(--light); color: var(--dark); direction: rtl; }
.hidden { display: none !important; }

/* شريط التنقل العلوي وتقارب الأزرار */
header { background: var(--dark); color: white; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; gap: 8px; flex-wrap: wrap; }
.logo { font-size: 1.3rem; font-weight: bold; color: var(--primary); cursor: pointer; display: flex; align-items: center; gap: 5px; }

.nav-actions { display: flex; gap: 5px; align-items: center; justify-content: flex-end; flex-wrap: nowrap; }
.nav-btn { background: transparent; border: 1px solid var(--primary); color: white; padding: 5px 10px; border-radius: 20px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
.nav-btn:hover { background: var(--primary); color: var(--dark); }
.nav-btn-login { background: var(--primary); color: var(--dark); font-weight: bold; }
.nav-btn-cart { position: relative; }
.cart-count { background: var(--red); color: white; border-radius: 50%; padding: 1px 5px; font-size: 0.65rem; position: absolute; top: -5px; right: -5px; }

/* زر الداعم الفني المنسق للواتساب */
.support-float-btn { display: inline-flex; align-items: center; gap: 4px; background: #25d366; color: white; padding: 5px 9px; border-radius: 20px; text-decoration: none; font-size: 0.78rem; font-weight: bold; white-space: nowrap; }

/* زر الرجوع بين الصفحات */
.back-btn-container { padding: 15px 20px 0 20px; }
.back-btn { background: var(--dark); color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; transition: 0.3s; }
.back-btn:hover { background: var(--primary); color: var(--dark); }

/* الأقسام (Categories Chips) */
.categories-container { display: flex; gap: 10px; padding: 15px 20px; overflow-x: auto; background: white; border-bottom: 1px solid var(--border); }
.category-chip { background: var(--gray-light); border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; white-space: nowrap; transition: 0.3s; }
.category-chip.active { background: var(--primary); color: var(--dark); }

/* المحتوى الرئيسي */
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }

/* شريط البحث والفلترة (ترتيب الفلاتر بجانب بعضها على سطر واحد) */
.search-filter-bar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
.search-input { flex: 1; min-width: 180px; padding: 10px; border: 1px solid var(--border); border-radius: 8px; outline: none; background: white; }

.filters-group { display: flex; gap: 8px; flex-wrap: nowrap; width: 100%; justify-content: space-between; }
@media (min-width: 600px) {
    .filters-group { width: auto; }
}
.filter-select { flex: 1; padding: 10px 8px; border: 1px solid var(--border); border-radius: 8px; outline: none; background: white; cursor: pointer; font-size: 0.85rem; }

/* شبكة المنتجات */
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; }
@media (min-width: 768px) {
    .products-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
}
.product-card { background: white; border-radius: 12px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); position: relative; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; justify-content: space-between; }
.product-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
.product-image { height: 140px; background-size: cover; background-position: center; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 3rem; background-color: var(--gray-light); margin-bottom: 10px; }
.product-title { font-weight: bold; margin-bottom: 5px; font-size: 0.95rem; }
.product-price { color: var(--primary-dark); font-weight: bold; margin-bottom: 10px; font-size: 0.95rem; }
.old-price { text-decoration: line-through; color: var(--gray); font-size: 0.8rem; margin-left: 5px; }
.discount-badge { position: absolute; top: 10px; left: 10px; background: var(--red); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; }
.wishlist-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--gray); }
.wishlist-btn.active { color: var(--red); }
.add-to-cart { background: var(--dark); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; transition: 0.3s; font-size: 0.9rem; }
.add-to-cart:hover { background: var(--primary); color: var(--dark); }

/* سلة المشتريات (Drawer) */
.cart-sidebar { position: fixed; top: 0; left: -350px; width: 320px; height: 100%; background: white; box-shadow: 5px 0 15px rgba(0,0,0,0.1); z-index: 1000; transition: 0.3s; display: flex; flex-direction: column; }
.cart-sidebar.active { left: 0; }
.cart-header { padding: 20px; background: var(--dark); color: white; display: flex; justify-content: space-between; align-items: center; }
.cart-items { flex: 1; overflow-y: auto; padding: 15px; }
.cart-item-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding: 10px 0; }
.cart-footer { padding: 20px; background: var(--light); border-top: 1px solid var(--border); }
.checkout-btn { background: var(--primary); color: var(--dark); border: none; padding: 12px; width: 100%; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1rem; }

/* النوافذ المنبثقة (Modals) */
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; opacity: 0; pointer-events: none; transition: 0.3s; padding: 15px; }
.modal.active { opacity: 1; pointer-events: auto; }
.modal-content { background: white; width: 100%; max-width: 480px; padding: 20px; border-radius: 12px; max-height: 90vh; overflow-y: auto; position: relative; }
.close-modal { position: absolute; top: 15px; left: 15px; background: none; border: none; font-size: 1.2rem; cursor: pointer; }

/* لوحة التحكم والإدارة */
.admin-tabs { display: flex; gap: 5px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px; }
.admin-tab-btn { background: var(--gray-light); border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; white-space: nowrap; font-size: 0.85rem; }
.admin-tab-btn.active { background: var(--dark); color: white; }
.admin-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
@media(min-width: 600px){ .admin-stats { grid-template-columns: repeat(4, 1fr); } }
.stat-card { background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); text-align: center; font-size: 0.85rem; }
.stat-card h3 { font-size: 1.3rem; color: var(--primary-dark); margin-top: 5px; }

/* الأزرار والنمط العام */
.btn-delete { background: var(--red); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.btn-edit { background: var(--blue); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; font-weight: bold; font-size: 0.85rem; }
.form-control { width: 100%; padding: 9px; border: 1px solid var(--border); border-radius: 6px; outline: none; font-size: 0.9rem; }
.btn-submit { background: var(--primary); color: var(--dark); border: none; padding: 10px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; }

/* Toast الإشعارات العائمة */
#toast { position: fixed; bottom: 20px; right: 20px; background: var(--green); color: white; padding: 10px 20px; border-radius: 8px; z-index: 9999; transform: translateY(100px); opacity: 0; transition: 0.3s; font-weight: bold; font-size: 0.9rem; }
#toast.show { transform: translateY(0); opacity: 1; }
