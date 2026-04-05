/** * Deoni System Core Engine - v3.1 (Official Edition)
 * Optimized for Salman - 2026
 */

const CONFIG = {
    BASEROW_TOKEN: 'Exx9zzoioDqyj80it9QEipug3PiZ3rQ2',
    TABLES: {
        STORES: '917557',
        CUSTOMERS: '917558',
        DEBTS: '917559',
        SUPPLIERS: '917560',
        HISTORY: '917562'
    },
    EMAILJS: {
        SERVICE: 'service_tc2llzm',
        TEMPLATE: 'template_n5erf85',
        PUBLIC_KEY: 'sxMi097ghCsVDvefP'
    }
};

// تهيئة EmailJS
emailjs.init(CONFIG.EMAILJS.PUBLIC_KEY);

let state = {
    user: null,
    currentModule: 'customers',
    otpCode: null,
    tempData: {}
};

// --- المحرك الرسومي ---
const ui = {
    navigateTo(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const target = document.getElementById(viewId);
        if (target) target.classList.remove('hidden');
        window.scrollTo(0, 0);
    },
    toggleAuth(mode) {
        document.getElementById('form-login').classList.toggle('hidden', mode !== 'login');
        document.getElementById('form-reg').classList.toggle('hidden', mode !== 'reg');
        document.getElementById('tab-login').classList.toggle('active', mode === 'login');
        document.getElementById('tab-reg').classList.toggle('active', mode === 'reg');
    },
    showLoader() { document.getElementById('global-loader').classList.remove('hidden'); },
    hideLoader() { document.getElementById('global-loader').classList.add('hidden'); }
};

// --- محرك العمليات ---
const app = {
    // 1. إرسال الكود
    async startRegistration() {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;

        if (!name || !email || !phone) return alert("يا سلمان، فضلاً أكمل جميع الخانات");

        ui.showLoader();
        state.otpCode = Math.floor(1000 + Math.random() * 9000);
        state.tempData = { name, email, phone };

        try {
            await emailjs.send(CONFIG.EMAILJS.SERVICE, CONFIG.EMAILJS.TEMPLATE, {
                email: email,
                passcode: state.otpCode,
                to_name: name
            });
            document.getElementById('form-reg').classList.add('hidden');
            document.getElementById('form-otp').classList.remove('hidden');
            alert("تم إرسال كود التحقق بنجاح");
        } catch (err) {
            alert("فشل إرسال البريد، تأكد من إعدادات EmailJS");
        } finally { ui.hideLoader(); }
    },

    // 2. تأكيد الحساب والحفظ في Baserow
    async verifyAndCreate() {
        const inputOtp = document.getElementById('otp-input').value;
        if (inputOtp != state.otpCode) return alert("الكود غير صحيح!");

        ui.showLoader();
        // الربط باستخدام أسماء الحقول لضمان الدقة
        const storeData = {
            "اسم المتجر": state.tempData.name,
            "رقم الهاتف": state.tempData.phone,
            "رقم المتجر": "D" + Math.floor(Math.random()*1000),
            "الحالة": true
        };

        try {
            const res = await fetch(`https://api.baserow.io/api/database/rows/table/${CONFIG.TABLES.STORES}/?user_field_names=true`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${CONFIG.BASEROW_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(storeData)
            });

            if (res.ok) {
                state.user = await res.json();
                this.enterDashboard();
            } else {
                alert("حدث خطأ في قاعدة البيانات، تأكد من أسماء الحقول في Baserow");
            }
        } catch (err) { alert("فشل الاتصال بالخادم"); }
        finally { ui.hideLoader(); }
    },

    // 3. تسجيل الدخول
    async login() {
        const phone = document.getElementById('login-phone').value;
        if (!phone) return alert("أدخل رقم الهاتف المسجل");

        ui.showLoader();
        try {
            const res = await fetch(`https://api.baserow.io/api/database/rows/table/${CONFIG.TABLES.STORES}/?user_field_names=true&filter__field_7960939__equal=${phone}`, {
                headers: { 'Authorization': `Token ${CONFIG.BASEROW_TOKEN}` }
            });
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                state.user = data.results[0];
                this.enterDashboard();
            } else { alert("عذراً، هذا الرقم غير مسجل كمتجر"); }
        } catch (err) { alert("خطأ في جلب البيانات"); }
        finally { ui.hideLoader(); }
    },

    enterDashboard() {
        // نستخدم الحقل البرمجي أو الاسم الظاهر
        document.getElementById('store-display-name').innerText = state.user["اسم المتجر"] || "متجر جديد";
        document.getElementById('store-display-id').innerText = "ID: " + (state.user["رقم المتجر"] || "--");
        ui.navigateTo('view-dash');
    }
};
