// التحكم بالقائمة الجانبية
const openMenuBtn = document.getElementById('openMenu');
const closeMenuBtn = document.getElementById('closeMenu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const navItems = document.querySelectorAll('.nav-item');

function openSidebar() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

openMenuBtn.addEventListener('click', openSidebar);
closeMenuBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

navItems.forEach(item => {
    item.addEventListener('click', closeSidebar);
});

// أداة الفحص المبدئي السريع للروابط
const scanBtn = document.getElementById('scanBtn');
const urlInput = document.getElementById('urlInput');
const scanResult = document.getElementById('scanResult');

scanBtn.addEventListener('click', () => {
    let rawUrl = urlInput.value.trim();
    if (!rawUrl) {
        scanResult.innerHTML = '⚠️ يرجى إدخال رابط موقع أولاً.';
        return;
    }

    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'https://' + rawUrl;
    }

    try {
        const parsed = new URL(rawUrl);
        const isHttps = parsed.protocol === 'https:';
        const statusText = isHttps
            ? '✅ يستخدم بروتوكول HTTPS المشفر (جيد للأمان).'
            : '⚠️ لا يستخدم HTTPS — يُنصح بتفعيل شهادة SSL لحماية بيانات المستخدمين.';

        scanResult.innerHTML = `
            <div><strong>النطاق:</strong> ${parsed.hostname}</div>
            <div>${statusText}</div>
            <div style="color:#9ab3b1; margin-top:4px;">للفحص العميق للثغرات والأداء والربط البرمجي، تواصل معي مباشرة.</div>
        `;
    } catch {
        scanResult.innerHTML = '❌ صيغة الرابط غير صحيحة، تأكد من كتابته بشكل سليم.';
    }
});

// نسخ رقم الهاتف أو معرف الإنستقرام بنقرة واحدة
const copyButtons = document.querySelectorAll('.copy-btn');
const toast = document.getElementById('toast');

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2200);
}

copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const textToCopy = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast(`تم نسخ ${textToCopy}`);
        });
    });
});
