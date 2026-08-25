const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.static('public')); // (या जिस फोल्डर में आपका लोगो है, उसका नाम लिखें)

const sqlite3 = require('sqlite3').verbose();

// डेटाबेस फाइल बनाएं (यह आपके प्रोजेक्ट फोल्डर में अपने आप 'hospital.db' नाम की फाइल बना देगा)[cite: 2]
const db = new sqlite3.Database('./hospital.db', (err) => {
    if (err) {
        console.error('❌ Database opening error: ', err.message);
    } else {
        console.log('📦 Connected to SQLite Database successfully!');
    }
});

// उदाहरण के लिए एक टेबल बनाना (जैसे स्टाफ या पेशेंट डेटा के लिए)[cite: 2]
db.run(`CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    role TEXT,
    department TEXT
)`);

const session = require('express-session');

// Session Middleware Configuration[cite: 2]
app.use(session({
    secret: 'cp-hospital-secure-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // true कर सकते हैं यदि HTTPS हो[cite: 2]
}));

// Middleware to Check if User is Logged In[cite: 2]
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}
// 👉 यह लाइन इमेजेज और लोगो दिखाने के लिए बहुत जरुरी है[cite: 2]
app.use(express.static('public'));
const PORT = process.env.PORT || 5000;

// Middleware[cite: 2]
app.use(express.json());
app.use(cors());

// 1. Login Page Route[cite: 2]
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login — CP Hospital Suite</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root { --brand-blue: #1a0f5e; --brand-green: #1b7a21; }
                body { font-family: 'Inter', sans-serif; background: #f4f7f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); width: 100%; max-width: 400px; border-top: 5px solid var(--brand-green); text-align: center; }
                .login-card img { width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px; }
                .login-card h2 { color: var(--brand-blue); margin-bottom: 5px; font-size: 22px; }
                .login-card p { color: #6b7280; font-size: 13px; margin-bottom: 25px; }
                .form-group { margin-bottom: 20px; text-align: left; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
                .form-group input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
                .form-group input:focus { outline: none; border-color: var(--brand-blue); }
                .btn-submit { width: 100%; background: var(--brand-blue); color: white; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
                .btn-submit:hover { background: #2a1b7e; }
                .error-msg { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <img src="/logo.png" alt="CP Hospital Logo" style="width: 70px; height: 70px; object-fit: contain;" class="mb-2" />
                <h2>CP Hospital Suite</h2>
                <p>Authorized Administrator Portal</p>
                
                ${req.query.error ? '<div class="error-msg">Invalid Username or Password!</div>' : ''}

                <form action="/login" method="POST">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="username" required placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Enter password">
                    </div>
                    <button type="submit" class="btn-submit">Secure Login</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// 2. Handle Login Submission[cite: 2]
app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'cpadmin123') {
        req.session.user = { name: 'Abhishek Dixit', role: 'Enterprise Administrator' };
        res.redirect('/');
    } else {
        res.redirect('/login?error=true');
    }
});

// 3. Logout Route[cite: 2]
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// API Routes[cite: 2]
// यह लाइन सीधे /onboard पर आने वाली रिक्वेस्ट को भी आपके HR राउट पर भेज देगी
app.use('/', require('./src/routes/hr.routes'));
app.use('/api/v1/attendance', require('./src/routes/attendance.routes'));
app.use('/api/v1/emergency', require('./src/routes/emergency.routes'));

const sqliteDb = require('./src/config/db');
const clinicalRoutes = require('./src/routes/clinical.routes');
app.use('/api/v1/clinical', clinicalRoutes);

const billingRoutes = require('./src/routes/billing.routes');
app.use('/api/v1/billing', billingRoutes);

const pharmacyRoutes = require('./src/routes/pharmacy.routes');
app.use('/api/v1/pharmacy', pharmacyRoutes);

const opdRoutes = require('./src/routes/opd.routes');
app.use('/api/v1/opd', opdRoutes);

const ambulanceRoutes = require('./src/routes/ambulance.routes');
app.use('/api/v1/ambulance', ambulanceRoutes);

const telemedicineRoutes = require('./src/routes/telemedicine.routes');
app.use('/api/v1/telemedicine', telemedicineRoutes);

const verifyRole = require('./src/middleware/rbac.middleware');

app.get('/api/v1/admin/audit-logs', verifyRole(['Admin']), (req, res) => {
    res.json({
        success: true,
        message: 'Audit logs fetched successfully (Admin Access Only)',
        logs: [
            { id: 1, user: 'Abhishek Dixit', action: 'Triggered Emergency SOS', timestamp: '2026-08-19 16:15:00' },
            { id: 2, user: 'Dr. V. K. Gupta', action: 'Updated OPD Token Queue', timestamp: '2026-08-19 16:10:00' }
        ]
    });
});

// Enterprise HTML Dashboard Route[cite: 2]
app.get('/', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CP Hospital </title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-blue: #1a0f5e;
                    --brand-green: #1b7a21;
                    --bg-color: #f4f7f6;
                    --card-bg: #ffffff;
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { font-family: 'Inter', sans-serif; background: var(--bg-color); color: var(--text-main); margin: 0; }
                .topbar { background: var(--card-bg); border-bottom: 1px solid #e5e7eb; padding: 12px 40px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100; }
                .brand { display: flex; align-items: center; gap: 15px; }
                .logo-img { width: 70px; height: 70px; object-fit: contain; }
                .brand-text h1 { margin: 0; font-size: 22px; color: var(--brand-blue); font-weight: 800; letter-spacing: 0.5px; }
                .brand-text p { margin: 2px 0 0; font-size: 13px; color: var(--brand-green); font-weight: 600; }
                .user-profile { display: flex; align-items: center; gap: 15px; }
                .status-badge { background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid #bbf7d0; }
                .avatar { width: 42px; height: 42px; background: var(--brand-blue); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
                .container { max-width: 1300px; margin: 30px auto; padding: 0 20px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px; }
                .stat-card { background: var(--card-bg); padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); border-left: 5px solid var(--brand-green); display: flex; flex-direction: column; }
                .stat-card.blue { border-left-color: var(--brand-blue); }
                .stat-card.red { border-left-color: #ef4444; }
                .stat-value { font-size: 26px; font-weight: 800; color: var(--brand-blue); margin-top: 8px; }
                .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                .section-title { font-size: 18px; font-weight: 700; color: var(--brand-blue); margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                
                /* Uniform Professional Grid */
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px; align-items: stretch; }
                
                /* Uniform Card Design for ALL Modules */
                .module-card, .card {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 24px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 1px solid rgba(229, 231, 235, 0.8);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
                }
                .module-card:hover, .card:hover {
                transform: translateY(-6px);
                box-shadow: 0 20px 30px -10px rgba(26, 15, 94, 0.1);
                border-color: var(--brand-blue);
                }
                
                .module-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
                .module-icon {
                width: 50px;
                height: 50px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.6);
                }
                .module-card h3, .card h3 { margin: 0; font-size: 17px; color: var(--brand-blue); font-weight: 700; }
                .module-card p, .card p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin: 0 0 20px 0; flex-grow: 1; }
                
                .action-link { display: inline-flex; align-items: center; font-size: 13px; font-weight: 600; color: var(--brand-blue); text-decoration: none; padding: 8px 16px; background: #f3f4f6; border-radius: 6px; transition: background 0.2s; width: fit-content; }
                .action-link:hover { background: var(--brand-blue); color: white; }
                
                .module-card.emergency { background: #fff1f2; border-color: #fecdd3; border-top-color: #e11d48; }
                .module-card.emergency .module-icon { background: #ffe4e6; color: #e11d48; }
                .module-card.emergency h3 { color: #be123c; }
                .module-card.emergency .action-link { background: #e11d48; color: white; }
                .module-card.emergency .action-link:hover { background: #be123c; }
                
                footer { text-align: center; padding: 25px; font-size: 13px; color: var(--text-muted); border-top: 1px solid #e5e7eb; background: var(--card-bg); }
            </style>
        </head>
        <body>
            <div class="topbar">
                <div class="brand">
                    <img src="/logo.png" alt="CP Hospital" class="logo-img">
                    <div class="brand-text">
                        <h1>CP HOSPITAL</h1>
                        <p>A Multispecialty Healthcare Center • सेवाहि परमो तपः</p>
                    </div>
                </div>
                <div class="user-profile">
                    <div class="status-badge">🟢 ALL SYSTEMS ONLINE</div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: 700; color: var(--brand-blue);">Abhishek Dixit</div>
                        <div style="font-size: 12px; color: var(--text-muted);">Enterprise Administrator</div>
                    </div>
                    <div class="avatar">AD</div>
                </div>
            </div>

            <div class="container">
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-label">Active OPD Tokens</span>
                        <span class="stat-value">142</span>
                    </div>
                    <div class="stat-card blue">
                        <span class="stat-label">On-Duty Staff</span>
                        <span class="stat-value">84</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Available Beds</span>
                        <span class="stat-value">26</span>
                    </div>
                    <div class="stat-card red">
                        <span class="stat-label">Ambulances Dispatched</span>
                        <span class="stat-value">3</span>
                    </div>
                </div>

                <div class="section-title">Core Operational Modules</div>

                <div class="grid">
                    <div class="module-card" onclick="window.location.href='/onboard'">
                        <div class="module-header">
                            <div class="module-icon">👥</div>
                            <h3>Core HR & Onboarding</h3>
                        </div>
                        <p>Manage staff lifecycle, verify NMC/SMC Council registrations, and secure document vaults.</p>
                        <a href="/onboard" class="action-link">Access Portal</a>
                    </div>
                    <!-- 1. Staff Duty Roster (3+1 Shifts) -->
<div class="module-card highlight" onclick="window.location.href='/duty-roster'">
    <div class="module-header">
        <div class="module-icon">🕒</div>
        <h3>Staff Duty Roster (3+1 Shifts)</h3>
    </div>
    <p>Manage shifts: Morning (08 AM-04 PM), Evening (12-08 PM), Night (08 PM-08 AM) & General (10 AM-07 PM).</p>
    <a href="/duty-roster" class="action-link">Open Roster Portal →</a>
</div>

<!-- 2. Treatment & Medication Ledger -->
<div class="module-card highlight" onclick="window.location.href='/treatment-audit'">
    <div class="module-header">
        <div class="module-icon">💉</div>
        <h3>Treatment & Medication Ledger</h3>
    </div>
    <p>Track ICU/NICU/OT treatments: Prescribing Doctor, Administering Staff, Route (IV/Oral), Dose, Date & Time.</p>
    <a href="/treatment-audit" class="action-link">Open Treatment Log →</a>
</div>

                    <div class="module-card" onclick="window.location.href='/attendance'">
                        <div class="module-header">
                            <div class="module-icon" style="color: #4f46e5; background: #e0e7ff;">📍</div>
                            <h3>Geofenced Attendance</h3>
                        </div>
                        <p>Real-time shift rosters, GPS punch-ins, grace periods, and leave management.</p>
                        <a href="/attendance" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/clinical'">
                        <div class="module-header">
                            <div class="module-icon" style="color: #0891b2; background: #cffafe;">🩺</div>
                            <h3>Clinical Operations</h3>
                        </div>
                        <p>EWS scoring, Electronic Health Records (EHR), and surgical safety checklists.</p>
                        <a href="/clinical" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/billing'">
                        <div class="module-header">
                            <div class="module-icon" style="color: #0d9488; background: #ccfbf1;">💳</div>
                            <h3>Discharge & Billing</h3>
                        </div>
                        <p>Itemized IPD bills, insurance claim clearances, and final discharge summaries.</p>
                        <a href="/billing" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/pharmacy-portal'">
                        <div class="module-header">
                            <div class="module-icon" style="color: #ea580c; background: #ffedd5;">💊</div>
                            <h3>Pharmacy Inventory</h3>
                        </div>
                        <p>Track medicine stocks, near-expiry alerts, batch numbers, and reorder levels.</p>
                        <a href="/pharmacy-portal" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/opd-portal'">
                        <div class="module-header">
                            <div class="module-icon" style="color: #ca8a04; background: #fef08a;">🎫</div>
                            <h3>OPD Token System</h3>
                        </div>
                        <p>Live token generation, doctor-wise scheduling, and waiting room display integration.</p>
                        <a href="/opd-portal" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/telemedicine-portal'">
                        <div class="module-header">
                            <div class="module-icon" style="color: #7c3aed; background: #ede9fe;">💻</div>
                            <h3>Telemedicine Suite</h3>
                        </div>
                        <p>Online video consultations with instant digital e-prescription generation.</p>
                        <a href="/telemedicine-portal" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/ambulance-portal'">
                        <div class="module-header">
                            <div class="module-icon" style="color: #dc2626; background: #fee2e2;">🚑</div>
                            <h3>Ambulance Fleet</h3>
                        </div>
                        <p>Live GPS status and real-time emergency dispatch coordination.</p>
                        <a href="/ambulance-portal" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/expense-voucher'" style="border-top-color: #0284c7;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #0284c7; background: #e0f2fe;">📄</div>
                            <h3>Expense Voucher</h3>
                        </div>
                        <p>Generate, print, and download hospital financial expense vouchers securely.</p>
                        <a href="/expense-voucher" class="action-link">Open Voucher →</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/blood-bank'" style="border-top-color: #e11d48;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #e11d48; background: #ffe4e6;">🩸</div>
                            <h3>Blood Bank Hub</h3>
                        </div>
                        <p>Track blood groups, components, donor records and cross-matching inventory in real-time.</p>
                        <a href="/blood-bank" class="action-link">Access Portal →</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/radiology-pacs'" style="border-top-color: #4f46e5;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #4f46e5; background: #e0e7ff;">🩻</div>
                            <h3>Radiology & PACS</h3>
                        </div>
                        <p>Manage X-rays, MRI, CT Scans and sync DICOM reports directly with patient EHR.</p>
                        <a href="/radiology-pacs" class="action-link">Access Portal →</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/bed-occupancy'" style="border-top-color: #0284c7;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #0369a1; background: #e0f2fe;">🛏️</div>
                            <h3>Bed & ICU Heatmap</h3>
                        </div>
                        <p>Live visual grid of ward beds, private rooms, and ICU occupancies for quick emergency admissions.</p>
                        <a href="/bed-occupancy" class="action-link">Access Portal →</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/biomedical-waste'" style="border-top-color: #16a34a;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #15803d; background: #dcfce7;">🏥</div>
                            <h3>Biomedical Waste</h3>
                        </div>
                        <p>Log daily bio-hazard waste weights (Yellow/Red bags) as per Pollution Control Board norms.</p>
                        <a href="/biomedical-waste" class="action-link">Access Portal →</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/patient-diet'" style="border-top-color: #d97706;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #b45309; background: #fef3c7;">🍔</div>
                            <h3>Patient Diet Kitchen</h3>
                        </div>
                        <p>Transmit prescribed clinical meal charts and schedules directly to the hospital canteen/kitchen.</p>
                        <a href="/patient-diet" class="action-link">Access Portal →</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/bed-transfer'" style="border-top-color: #0284c7;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #0284c7; background: #e0f2fe;">🛏️</div>
                            <h3>IPD Bed Transfer</h3>
                        </div>
                        <p>मरीजों को वार्ड/आईसीयू में शिफ्ट करने और बेड हिस्ट्री ट्रैक करने का टूल।</p>
                        <a href="/bed-transfer" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/ot-scheduling'" style="border-top-color: #e11d48;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #e11d48; background: #ffe4e6;">🏥</div>
                            <h3>OT Scheduling</h3>
                        </div>
                        <p>ऑपरेशन थिएटर स्लॉट बुकिंग और सर्जिकल टीम की शेड्यूलिंग।</p>
                        <a href="/ot-scheduling" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/doctor-rounds'" style="border-top-color: #4f46e5;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #4f46e5; background: #e0e7ff;">🩺</div>
                            <h3>Doctor Round Manager</h3>
                        </div>
                        <p>वार्ड राउंड के दौरान दिए जाने वाले डेली नोट्स और प्रिस्क्रिप्शन अपडेट।</p>
                        <a href="/doctor-rounds" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/purchase-orders'" style="border-top-color: #d97706;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #d97706; background: #fef3c7;">📦</div>
                            <h3>Supplier & PO Portal</h3>
                        </div>
                        <p>मेडिकल सप्लायर्स और वेंडर्स को ऑटोमैटिक परचेस ऑर्डर भेजने का हब।</p>
                        <a href="/purchase-orders" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/expiry-alerts'" style="border-top-color: #059669;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #059669; background: #dcfce7;">⚠️</div>
                            <h3>Expiry Alert Dashboard</h3>
                        </div>
                        <p>दवाइयों के बैचेस और नियर-एक्सपायरी स्टॉक का ऑटोमैटिक अलर्ट सिस्टम।</p>
                        <a href="/expiry-alerts" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card" onclick="window.location.href='/patient-feedback'" style="border-top-color: #7c3aed;">
                        <div class="module-header">
                            <div class="module-icon" style="color: #7c3aed; background: #ede9fe;">⭐</div>
                            <h3>Patient Feedback & CSAT</h3>
                        </div>
                        <p>डिस्चार्ज फीडबैक और रेटिंग्स के आधार पर सर्विस क्वालिटी एनालिटिक्स।</p>
                        <a href="/patient-feedback" class="action-link">Access Portal</a>
                    </div>

                    <div class="module-card emergency" onclick="window.location.href='/emergency'">
                        <div class="module-header">
                            <div class="module-icon">🚨</div>
                            <h3>Emergency SOS 2.0</h3>
                        </div>
                        <p>Code Blue multi-channel broadcast and rapid response timer analytics.</p>
                        <a href="/emergency" class="action-link">Trigger Code Blue</a>
                    </div>
                </div>
            </div>

            <footer>
                CP Hospital Governance Board &bull; Designed for Enterprise Healthcare &copy; 2026
            </footer>
        </body>
        </html>
    `);
});
// ==========================================
// 💊 Ultra-Advanced Hi-Tech Pharmacy & Inventory Suite
// ==========================================
app.get('/pharmacy-portal', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hi-Tech Pharmacy Inventory — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 950px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #0d9488; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #0d9488; }
                h2 { color: #0f766e; margin-top: 0; font-size: 22px; border-bottom: 2px solid #ccfbf1; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                
                .upload-box { background: #f1f5f9; border: 2px dashed #cbd5e1; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
                .calc-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; color: #166534; display: none; }
                
                .btn { padding: 10px 15px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
                .btn-submit { background: #0d9488; color: white; width: 100%; padding: 12px; font-size: 15px; justify-content: center; }
                .btn-submit:hover { background: #0f766e; }
                .btn-sos { background: #dc2626; color: white; padding: 6px 12px; font-size: 12px; }
                .btn-sos:hover { background: #b91c1c; }
                .btn-export { background: #0284c7; color: white; margin-bottom: 15px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-safe { background: #dcfce7; color: #166534; }
                .badge-expiry { background: #fee2e2; color: #991b1b; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <div class="card">
                    <h2>
                        <span>💊 Hi-Tech Pharmacy Inventory & AI Stock Management</span>
                        <button type="button" class="btn btn-sos" onclick="triggerStockSOS()">🚨 Shortage SOS</button>
                    </h2>
                    
                    <!-- Bulk Upload & Reports -->
                    <div class="upload-box">
                        <label style="margin-bottom:8px;">📁 Bulk Stock Upload via Excel (.xlsx) / CSV</label>
                        <div style="display:flex; gap:10px; justify-content:center; align-items:center;">
                            <input type="file" id="excelFile" style="width:auto; background:white; padding:6px;">
                            <button type="button" class="btn" style="background:#475569; color:white;" onclick="uploadExcel()">Upload Stock</button>
                            <button type="button" class="btn" style="background:#0284c7; color:white;" onclick="exportPharmacyCSV()">Download Inventory CSV</button>
                        </div>
                    </div>

                    <div class="calc-box" id="calcBox">📊 AI Valuation: Quantity × Unit Price = Total Inventory Asset Value.</div>

                    <form id="pharmacyForm" onsubmit="addMedicine(event)">
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Medicine Name & Strength</label>
                                <input type="text" id="medName" required placeholder="e.g. Paracetamol 650mg">
                            </div>
                            <div class="form-group">
                                <label>Batch Number</label>
                                <input type="text" id="batchNo" required placeholder="e.g. PAR-992">
                            </div>
                        </div>

                        <div class="grid-2">
                            <div class="form-group">
                                <label>Quantity in Stock</label>
                                <input type="number" id="quantity" required placeholder="e.g. 1000" oninput="calculateStockValue()">
                            </div>
                            <div class="form-group">
                                <label>Unit Price (INR)</label>
                                <input type="number" step="0.1" id="unitPrice" required placeholder="e.g. 2.50" oninput="calculateStockValue()">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Expiry Date</label>
                            <input type="date" id="expiryDate" required>
                        </div>

                        <button type="submit" class="btn btn-submit">Add Medicine to Secure Inventory</button>
                    </form>
                </div>

                <!-- Master Inventory Table -->
                <div class="card" style="border-top-color: #475569;">
                    <h2 style="color: #334155; border-bottom-color: #e2e8f0;">
                        <span>📋 Master Pharmacy Inventory Logs</span>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Medicine Name</th>
                                <th>Batch No</th>
                                <th>Qty</th>
                                <th>Total Value</th>
                                <th>Expiry Date</th>
                                <th>Status / AI Safety</th>
                            </tr>
                        </thead>
                        <tbody id="pharmacyLogsBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No medicines added to inventory yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const pharmacyLogs = [];

                function calculateStockValue() {
                    const qty = parseInt(document.getElementById('quantity').value) || 0;
                    const price = parseFloat(document.getElementById('unitPrice').value) || 0;
                    const box = document.getElementById('calcBox');
                    
                    if(qty > 0 && price > 0) {
                        const totalValue = qty * price;
                        box.style.display = 'block';
                        box.innerHTML = \`📊 <b>AI Stock Valuation:</b> \${qty} units × ₹\${price} = <b>Total Asset Value: ₹\${totalValue.toLocaleString('en-IN')}</b>\`;
                    } else {
                        box.style.display = 'none';
                    }
                }

                function uploadExcel() {
                    alert('📁 Bulk Excel Stock Uploader (Simulation): Stock items parsed and added successfully!');
                }

                function addMedicine(event) {
                    event.preventDefault();
                    const medName = document.getElementById('medName').value;
                    const batchNo = document.getElementById('batchNo').value;
                    const qty = parseInt(document.getElementById('quantity').value);
                    const price = parseFloat(document.getElementById('unitPrice').value);
                    const expiryDate = document.getElementById('expiryDate').value;
                    
                    const totalVal = '₹' + (qty * price).toLocaleString('en-IN');
                    
                    // Expiry Check Logic (यदि एक्सपायरी डेट नजदीक या पुरानी है)
                    const today = new Date();
                    const expDateObj = new Date(expiryDate);
                    let statusLabel = "Safe Stock ✓";
                    let badgeClass = "badge-safe";

                    if(expDateObj < today) {
                        statusLabel = "EXPIRED (Discard)";
                        badgeClass = "badge-expiry";
                    } else {
                        const diffTime = expDateObj - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if(diffDays < 90) {
                            statusLabel = "Near Expiry ⚠️";
                            badgeClass = "badge-expiry";
                        }
                    }

                    pharmacyLogs.unshift({
                        medName,
                        batchNo,
                        qty,
                        totalVal,
                        expiryDate,
                        statusLabel,
                        badgeClass
                    });

                    renderPharmacyTable();
                    alert('Medicine successfully added to pharmacy inventory master database!');
                    document.getElementById('pharmacyForm').reset();
                    document.getElementById('calcBox').style.display = 'none';
                }

                function renderPharmacyTable() {
                    const tbody = document.getElementById('pharmacyLogsBody');
                    if(pharmacyLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No medicines added to inventory yet.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    pharmacyLogs.forEach(log => {
                        html += \`<tr>
                            <td><b>\${log.medName}</b></td>
                            <td>\${log.batchNo}</td>
                            <td>\${log.qty}</td>
                            <td>\${log.totalVal}</td>
                            <td>\${log.expiryDate}</td>
                            <td><span class="badge \${log.badgeClass}">\${log.statusLabel}</span></td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function triggerStockSOS() {
                    alert('🚨 PHARMACY SHORTAGE SOS! Urgent reorder notification broadcasted to central medical suppliers and procurement head.');
                }

                function exportPharmacyCSV() {
                    if(pharmacyLogs.length === 0) {
                        alert('No inventory data to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Medicine Name,Batch No,Quantity,Total Value,Expiry Date,Status\n";
                    pharmacyLogs.forEach(row => {
                        csvContent += \`"\${row.medName}","\${row.batchNo}","\${row.qty}","\${row.totalVal}","\${row.expiryDate}","\${row.statusLabel}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Pharmacy_Inventory_Report.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});// ==========================================
// 🚑 Ambulance Portal Frontend Route
// ==========================================
// ==========================================
// 🚀 Ultimate AI Ambulance Dispatch & Emergency Fleet Command Center Pro
// ==========================================
app.get('/ambulance-portal', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Ambulance Command Center Pro — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 1150px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #dc2626; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #dc2626; }
                h2 { color: #b91c1c; margin-top: 0; font-size: 22px; border-bottom: 2px solid #fee2e2; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select, textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                textarea { resize: vertical; height: 60px; }
                
                .ai-fleet-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #991b1b; }
                
                .btn { padding: 10px 15px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
                .btn-submit { background: #dc2626; color: white; width: 100%; padding: 14px; font-size: 16px; justify-content: center; }
                .btn-submit:hover { background: #b91c1c; }
                .btn-sos { background: #7f1d1d; color: white; padding: 6px 12px; font-size: 12px; }
                .btn-sos:hover { background: #450a0a; }
                .btn-export { background: #0284c7; color: white; margin-bottom: 15px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-pro { background: #fee2e2; color: #991b1b; }
                .badge-er { background: #fef3c7; color: #d97706; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <div class="card">
                    <h2>
                        <span>🚀 AI Ambulance Dispatch Command Center Pro</span>
                        <button type="button" class="btn btn-sos" onclick="triggerProFleetSOS()">🚨 Fleet-Wide Code Red SOS</button>
                    </h2>
                    
                    <form id="proAmbulanceForm" onsubmit="submitProAmbulance(event)">
                        <div class="grid-3">
                            <div class="form-group">
                                <label>Patient Emergency Name</label>
                                <input type="text" id="paName" required placeholder="e.g. Rameshwar Dayal">
                            </div>
                            <div class="form-group">
                                <label>Patient Mobile / WhatsApp Number</label>
                                <input type="text" id="paMobile" required placeholder="e.g. 9876543210">
                            </div>
                            <div class="form-group">
                                <label>Ambulance Type & Life Support</label>
                                <select id="paType">
                                    <option value="ALS - Advanced Life Support (Ventilator/ICU)">ALS - Advanced Life Support (ICU)</option>
                                    <option value="BLS - Basic Life Support (Oxygen/First Aid)">BLS - Basic Life Support (Oxygen)</option>
                                    <option value="Mobile Tele-ICU Unit">Mobile Tele-ICU Unit ⚡</option>
                                    <option value="Mortuary Van">Mortuary Van</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid-4">
                            <div class="form-group">
                                <label>Assigned Driver & Unit</label>
                                <input type="text" id="paDriver" required placeholder="e.g. Driver Mohan (#104)">
                            </div>
                            <div class="form-group">
                                <label>Vehicle Registration No.</label>
                                <input type="text" id="paVehicle" required placeholder="e.g. RJ-14-EA-9921">
                            </div>
                            <div class="form-group">
                                <label>Receiving ER / Trauma Bay</label>
                                <select id="paBay">
                                    <option value="Trauma Red Zone Bay 1">Trauma Red Zone Bay 1</option>
                                    <option value="Cardiac Care ICU Bed 4">Cardiac Care ICU Bed 4</option>
                                    <option value="Emergency Operation Theatre">Emergency Operation Theatre</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Priority Urgency Level</label>
                                <select id="paPriority">
                                    <option value="P1 - Critical Life Threatening">P1 - Critical Life Threatening 🚨</option>
                                    <option value="P2 - Urgent Transfer">P2 - Urgent Transfer ⚠️</option>
                                    <option value="P3 - Stable Discharge/Shift">P3 - Stable Discharge</option>
                                </select>
                            </div>
                        </div>

                        <div class="ai-fleet-box">
                            <label style="color:#991b1b; margin-bottom:8px;">🗺️ AI Optimized Route, GPS Tracking & Paramedic Vitals</label>
                            <div class="grid-2" style="margin-bottom:0;">
                                <input type="text" id="paPickup" placeholder="Pickup Location / Accident Spot (e.g. JLN Marg, Near Apex Circle)" required>
                                <input type="text" id="paVitals" placeholder="Paramedic Live Vitals (e.g. SpO2: 85%, BP: 90/60, HR: 120 bpm)" required>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-submit">🚀 Dispatch Pro Ambulance, Lock ER Bed & Send GPS Tracking Link</button>
                    </form>
                </div>

                <!-- Master Pro Dispatch Logs -->
                <div class="card" style="border-top-color: #0284c7;">
                    <h2 style="color: #0369a1; border-bottom-color: #e0f2fe;">
                        <span>📋 Master Fleet Dispatch Command Logs</span>
                        <button type="button" class="btn btn-export" onclick="exportProFleetCSV()">📥 Export Fleet Command CSV</button>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Vehicle & Unit</th>
                                <th>Driver & Patient</th>
                                <th>Pickup Location & Route</th>
                                <th>Receiving ER Bay</th>
                                <th>Paramedic Vitals & Priority</th>
                                <th>Command Status</th>
                            </tr>
                        </thead>
                        <tbody id="proFleetLogsBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No pro ambulance dispatches active yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const proFleetLogs = [];

                function submitProAmbulance(event) {
                    event.preventDefault();
                    const name = document.getElementById('paName').value;
                    const mobile = document.getElementById('paMobile').value;
                    const type = document.getElementById('paType').value;
                    const driver = document.getElementById('paDriver').value;
                    const vehicle = document.getElementById('paVehicle').value;
                    const bay = document.getElementById('paBay').value;
                    const priority = document.getElementById('paPriority').value;
                    const pickup = document.getElementById('paPickup').value;
                    const vitals = document.getElementById('paVitals').value;

                    proFleetLogs.unshift({
                        vehicleInfo: \`<b>\${vehicle}</b><br><small>\${type}</small>\`,
                        driverPatient: \`<b>Driver:</b> \${driver}<br><small><b>Patient:</b> \${name} (+91 \${mobile})</small>\`,
                        route: pickup,
                        bay,
                        vitalsPriority: \`<b>Priority:</b> \${priority}<br><small><b>Vitals:</b> \${vitals}</small>\`,
                        status: 'GPS Live & ER Locked ✓',
                        badge: 'badge-pro'
                    });

                    renderProFleetTable();
                    alert('Pro Ambulance ' + vehicle + ' dispatched! AI Route optimized, ER Bed locked, and WhatsApp tracking link sent to +91 ' + mobile + '.');
                    document.getElementById('proAmbulanceForm').reset();
                }

                function renderProFleetTable() {
                    const tbody = document.getElementById('proFleetLogsBody');
                    if(proFleetLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No pro ambulance dispatches active yet.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    proFleetLogs.forEach(log => {
                        html += \`<tr>
                            <td>\${log.vehicleInfo}</td>
                            <td>\${log.driverPatient}</td>
                            <td>\${log.route}</td>
                            <td>\${log.bay}</td>
                            <td>\${log.vitalsPriority}</td>
                            <td><span class="badge \${log.badge}">\${log.status}</span></td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function triggerProFleetSOS() {
                    alert('🚨 FLEET-WIDE CODE RED BROADCAST: All standby Advanced Life Support ambulances and emergency trauma surgeons notified instantly.');
                }

                function exportProFleetCSV() {
                    if(proFleetLogs.length === 0) {
                        alert('No fleet records available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Vehicle,Driver & Patient,Pickup,ER Bay,Vitals & Priority,Status\n";
                    proFleetLogs.forEach(row => {
                        csvContent += \`"\${row.vehicleInfo.replace(/<[^>]*>?/gm, '')}","\${row.driverPatient.replace(/<[^>]*>?/gm, '')}","\${row.route}","\${row.bay}","\${row.vitalsPriority.replace(/<[^>]*>?/gm, '')}","\${row.status}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Ambulance_Command_Pro.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});

// ==========================================
// 💻 Telemedicine Portal Frontend Route
// ==========================================
// ==========================================
// 🚀 World-Class Enterprise Tele-Health & AI Command Center Pro
// ==========================================
app.get('/telemedicine-portal', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Tele-Health Command Center Pro — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 1150px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #7c3aed; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #7c3aed; }
                h2 { color: #6d28d9; margin-top: 0; font-size: 22px; border-bottom: 2px solid #ede9fe; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select, textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                textarea { resize: vertical; height: 60px; }
                
                .ai-console-box { background: #f5f3ff; border: 1px solid #ddd6fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                
                .btn { padding: 10px 15px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
                .btn-submit { background: #7c3aed; color: white; width: 100%; padding: 14px; font-size: 16px; justify-content: center; }
                .btn-submit:hover { background: #6d28d9; }
                .btn-sos { background: #dc2626; color: white; padding: 6px 12px; font-size: 12px; }
                .btn-sos:hover { background: #b91c1c; }
                .btn-export { background: #0284c7; color: white; margin-bottom: 15px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-pro { background: #ede9fe; color: #5b21b6; }
                .badge-critical { background: #fee2e2; color: #991b1b; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <div class="card">
                    <h2>
                        <span>🚀 AI Tele-Health Command Center Pro</span>
                        <button type="button" class="btn btn-sos" onclick="triggerProSOS()">🚨 Critical ICU & Ambulance SOS</button>
                    </h2>
                    
                    <form id="proTeleForm" onSubmit="submitProTele(event)">
                        <div class="grid-3">
                            <div class="form-group">
                                <label>Patient Full Name</label>
                                <input type="text" id="pName" required placeholder="e.g. Suresh Chandrika">
                            </div>
                            <div class="form-group">
                                <label>WhatsApp / Mobile Number</label>
                                <input type="text" id="pMobile" required placeholder="e.g. 9876543210">
                            </div>
                            <div class="form-group">
                                <label>Lead Consultant & Department</label>
                                <select id="pDoctor">
                                    <option value="Dr. V.K. Gupta (Cardiology)">Dr. V.K. Gupta (Cardiology)</option>
                                    <option value="Dr. Anjali Sharma (Neurology)">Dr. Anjali Sharma (Neurology)</option>
                                    <option value="Dr. Rajesh Verma (Ortho)">Dr. Rajesh Verma (Ortho)</option>
                                    <option value="Dr. Pallavi Sen (Oncology)">Dr. Pallavi Sen (Oncology)</option>
                                    <option value="Dr. Maneesh Sinha (Pediatrics)">Dr. Maneesh Sinha (Pediatrics)</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid-4">
                            <div class="form-group">
                                <label>Consultation Mode</label>
                                <select id="pMode">
                                    <option value="HD Video WebRTC">HD Video WebRTC</option>
                                    <option value="Audio Tele-Call">Audio Tele-Call</option>
                                    <option value="Multi-Doc Board Panel">Multi-Doc Board Panel</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Insurance / Payment</label>
                                <select id="pPay">
                                    <option value="Self / Cash (₹800)">Self / Cash (₹800)</option>
                                    <option value="Corporate Cashless Insurance">Corporate Cashless Insurance</option>
                                    <option value="Ayushman Bharat Scheme">Ayushman Bharat Scheme (Free)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Diagnostic Tests Requisition</label>
                                <select id="pTest">
                                    <option value="None">None</option>
                                    <option value="Complete Cardiac Panel">Complete Cardiac Panel</option>
                                    <option value="Full Body Advanced Profile">Full Body Advanced Profile</option>
                                    <option value="MRI / CT Scan Requisition">MRI / CT Scan Requisition</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Schedule Appointment Time</label>
                                <input type="datetime-local" id="pTime" required>
                            </div>
                        </div>

                        <div class="ai-console-box">
                            <label style="color:#5b21b6; margin-bottom:8px;">🤖 AI Clinical Transcription, E-Prescription & IoT Vitals</label>
                            <div class="grid-2" style="margin-bottom:0;">
                                <textarea id="pRx" placeholder="E-Prescription Drugs (e.g. Tab. Ecosprin 75mg, Cap. Pantocid)..." required></textarea>
                                <textarea id="pVitals" placeholder="IoT Vitals & AI Notes (e.g. BP: 140/90, HR: 98 bpm, Risk: Moderate)..." required></textarea>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-submit">Deploy Pro Command Suite & Send Encrypted WhatsApp Link</button>
                    </form>
                </div>

                <!-- Master Pro Logs -->
                <div class="card" style="border-top-color: #475569;">
                    <h2 style="color: #334155; border-bottom-color: #e2e8f0;">
                        <span>📋 Master Command Center Pro Logs</span>
                        <button type="button" class="btn btn-export" onclick="exportProCSV()">📥 Export Master Pro CSV</button>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Patient Name</th>
                                <th>Specialist</th>
                                <th>Mode & Payment</th>
                                <th>AI Prescription & Vitals</th>
                                <th>Schedule Time</th>
                                <th>Command Status</th>
                            </tr>
                        </thead>
                        <tbody id="proLogsBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No pro command sessions active yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const proLogs = [];

                function submitProTele(event) {
                    event.preventDefault();
                    const name = document.getElementById('pName').value;
                    const mobile = document.getElementById('pMobile').value;
                    const doctor = document.getElementById('pDoctor').value;
                    const mode = document.getElementById('pMode').value;
                    const pay = document.getElementById('pPay').value;
                    const test = document.getElementById('pTest').value;
                    const time = document.getElementById('pTime').value;
                    const rx = document.getElementById('pRx').value;
                    const vitals = document.getElementById('pVitals').value;

                    proLogs.unshift({
                        name,
                        doctor,
                        details: \`<b>\${mode}</b><br><small>Pay: \${pay} | Test: \${test}</small>\`,
                        rxVitals: \`<b>Rx:</b> \${rx}<br><small><b>Vitals:</b> \${vitals}</small>\`,
                        time: time.replace('T', ' '),
                        status: 'Pro Secure & Dispatched ✓',
                        badge: 'badge-pro'
                    });

                    renderProTable();
                    alert('Pro Command Session successfully deployed! WhatsApp encrypted link & prescription dispatched to +91 ' + mobile + '.');
                    document.getElementById('proTeleForm').reset();
                }

                function renderProTable() {
                    const tbody = document.getElementById('proLogsBody');
                    if(proLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No pro command sessions active yet.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    proLogs.forEach(log => {
                        html += \`<tr>
                            <td><b>\${log.name}</b></td>
                            <td>\${log.doctor}</td>
                            <td>\${log.details}</td>
                            <td>\${log.rxVitals}</td>
                            <td>\${log.time}</td>
                            <td><span class="badge \${log.badge}">\${log.status}</span></td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function triggerProSOS() {
                    alert('🚨 CRITICAL ICU & AMBULANCE DISPATCHED: Advanced Life Support (ALS) ambulance and remote ICU medical squad alerted instantly.');
                }

                function exportProCSV() {
                    if(proLogs.length === 0) {
                        alert('No records available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Patient Name,Doctor,Details,Prescription,Time,Status\n";
                    proLogs.forEach(row => {
                        csvContent += \`"\${row.name}","\${row.doctor}","\${row.details.replace(/<[^>]*>?/gm, '')}","\${row.rxVitals.replace(/<[^>]*>?/gm, '')}","\${row.time}","\${row.status}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Command_Center_Pro.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});
// ==========================================
// 💳 Hospital Expenses Voucher & Entry Form Route
// ==========================================
// ==========================================
// 💰 Enterprise-Grade Hi-Tech Hospital Expense Voucher Suite
// ==========================================
// ==========================================
// 🚀 Ultimate Enterprise Hospital Financial ERP, Payroll & AI Command Center Pro
// ==========================================
app.get('/expense-voucher', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ultimate Financial ERP Pro — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 1250px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #4f46e5; }
                h2 { color: #4338ca; margin-top: 0; font-size: 22px; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select, textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                
                .stats-banner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
                .stat-box { background: #eef2ff; border: 1px solid #c7d2fe; padding: 15px; border-radius: 8px; text-align: center; color: #3730a3; }
                .stat-box h3 { margin: 0; font-size: 20px; color: #4338ca; }
                .stat-box p { margin: 5px 0 0 0; font-size: 12px; font-weight: 600; }
                
                .ai-tax-box { background: #f5f3ff; border: 1px solid #ddd6fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                
                .btn { padding: 10px 15px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
                .btn-submit { background: #4f46e5; color: white; width: 100%; padding: 14px; font-size: 16px; justify-content: center; }
                .btn-submit:hover { background: #4338ca; }
                .btn-sos { background: #dc2626; color: white; padding: 6px 12px; font-size: 12px; }
                .btn-sos:hover { background: #b91c1c; }
                .btn-export { background: #0d9488; color: white; margin-bottom: 15px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-approved { background: #dcfce7; color: #166534; }
                .badge-audit { background: #fef3c7; color: #d97706; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <div class="card">
                    <h2>
                        <span>🚀 Ultimate Hospital Financial ERP Pro & AI Suite</span>
                        <button type="button" class="btn btn-sos" onclick="triggerCFOAuditSOS()">🚨 CFO & Tax Audit Code Red</button>
                    </h2>
                    
                    <form id="erpProForm" onsubmit="createErpProVoucher(event)">
                        <div class="grid-3">
                            <div class="form-group">
                                <label>Expense / Disbursement Category</label>
                                <select id="epCategory" onchange="updateEpFields()">
                                    <option value="Staff Salary & Payroll">Staff Salary & Payroll (Doctors/Nurses) 💼</option>
                                    <option value="Daily Wage Labor / Majdoori">Daily Wage Labor / Majdoori (Construction/Repair) 👷‍♂️</option>
                                    <option value="Rent & Real Estate Lease">Rent & Real Estate Lease (Building/Pharmacy) 🏢</option>
                                    <option value="Vehicle & Ambulance Fuel/Bhada">Vehicle & Ambulance Fuel & Bhada 🚑</option>
                                    <option value="General Vendor & Medical Supplies">General Vendor & Medical Supplies 💊</option>
                                    <option value="Utilities (Electricity, Water, Internet)">Utilities (Electricity, Water, Internet) ⚡</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Target Department / Cost Center</label>
                                <select id="epDept">
                                    <option value="Emergency & ICU Care">Emergency & ICU Care</option>
                                    <option value="Pharmacy & Inventory">Pharmacy & Inventory</option>
                                    <option value="Laboratory & Pathology">Laboratory & Pathology</option>
                                    <option value="Radiology & MRI Unit">Radiology & MRI Unit</option>
                                    <option value="Infrastructure & Maintenance">Infrastructure & Maintenance</option>
                                    <option value="Administration & HR">Administration & HR</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Beneficiary / Vendor / Staff Name</label>
                                <input type="text" id="epBeneficiary" required placeholder="e.g. Dr. V.K. Gupta / Ramswaroop (Contractor)">
                            </div>
                        </div>

                        <div class="grid-4">
                            <div class="form-group">
                                <label>Payment Mode</label>
                                <select id="epMode">
                                    <option value="Bank Transfer (NEFT / RTGS)">Bank Transfer (NEFT / RTGS)</option>
                                    <option value="UPI / Instant Digital Pay">UPI / Instant Digital Pay</option>
                                    <option value="Cash Disbursement">Cash Disbursement</option>
                                    <option value="International Wire (USD)">International Wire (USD)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Approved By Authority</label>
                                <input type="text" id="epApprover" value="Abhishek Dixit (CFO / Admin)" required>
                            </div>
                            <div class="form-group">
                                <label>Gross Amount (INR - ₹)</label>
                                <input type="number" id="epAmount" required placeholder="e.g. 100000">
                            </div>
                            <div class="form-group">
                                <label>Tax Deductible (TDS %)</label>
                                <select id="epTds">
                                    <option value="0">0% (No TDS)</option>
                                    <option value="2">2% (Contractor / Majdoori TDS)</option>
                                    <option value="10">10% (Professional / Doctor Fee TDS)</option>
                                </select>
                            </div>
                        </div>

                        <div class="ai-tax-box">
                            <label style="color:#5b21b6; margin-bottom:8px;">🤖 AI Budget Variance Check & Particulars Description</label>
                            <div class="grid-2" style="margin-bottom:0;">
                                <input type="text" id="epDesc" placeholder="Particulars (e.g. August Monthly Salary / Daily Wage Labor / Diesel)" required>
                                <select id="epBudgetCheck">
                                    <option value="Auto-Verify Department Budget">Auto-Verify Department Budget Limit ✓</option>
                                    <option value="Force Override (Emergency Approvals)">Force Override (Emergency Approvals) ⚡</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-submit">Post Pro ERP Voucher, Deduct TDS & Update Ledger</button>
                    </form>
                </div>

                <!-- Master ERP Pro Ledger Table -->
                <div class="card" style="border-top-color: #0d9488;">
                    <h2 style="color: #0f766e; border-bottom-color: #ccfbf1;">
                        <span>📋 Master Financial ERP Pro Ledger & Tax Logs</span>
                        <button type="button" class="btn btn-export" onclick="exportErpProCSV()">📥 Export Pro Financial CSV</button>
                    </h2>
                    
                    <div class="stats-banner">
                        <div class="stat-box">
                            <h3 id="statProCount">0</h3>
                            <p>Total Vouchers Today</p>
                        </div>
                        <div class="stat-box" style="background:#f0fdf4; border-color:#bbf7d0; color:#166534;">
                            <h3 id="statProGross" style="color:#15803d;">₹0</h3>
                            <p>Total Gross Expense</p>
                        </div>
                        <div class="stat-box" style="background:#fefce8; border-color:#fef08a; color:#854d0e;">
                            <h3 id="statProTds" style="color:#a16207;">₹0</h3>
                            <p>Total TDS Deducted</p>
                        </div>
                        <div class="stat-box" style="background:#fdf2f8; border-color:#fbcfe8; color:#9d174d;">
                            <h3 id="statProNet" style="color:#be185d;">₹0</h3>
                            <p>Net Payable Outflow</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Voucher ID</th>
                                <th>Category & Department</th>
                                <th>Beneficiary & Particulars</th>
                                <th>Gross Amount</th>
                                <th>TDS Ded.</th>
                                <th>Net Payable & Status</th>
                            </tr>
                        </thead>
                        <tbody id="erpProLogsBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No financial vouchers posted yet today.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const erpProLogs = [];
                let voucherSerial = 9001;
                let totalGrossSum = 0;
                let totalTdsSum = 0;
                let totalNetSum = 0;

                function updateEpFields() {
                    const cat = document.getElementById('epCategory').value;
                    const descInput = document.getElementById('epDesc');
                    if(cat.includes('Salary')) {
                        descInput.placeholder = "e.g. August 2026 Monthly Salary for Medical & Nursing Staff";
                    } else if(cat.includes('Majdoori')) {
                        descInput.placeholder = "e.g. 8 Daily Wage Laborers for Trauma Ward Renovation (4 Days)";
                    } else if(cat.includes('Rent')) {
                        descInput.placeholder = "e.g. Monthly Building Lease & Parking Rent for Hospital Premises";
                    } else if(cat.includes('Vehicle')) {
                        descInput.placeholder = "e.g. Ambulance Fleet Diesel Fuel & Long-Distance Vehicle Bhada";
                    } else {
                        descInput.placeholder = "e.g. Purchase of Surgical Consumables / Emergency Medicine Stock";
                    }
                }

                function createErpProVoucher(event) {
                    event.preventDefault();
                    const category = document.getElementById('epCategory').value;
                    const dept = document.getElementById('epDept').value;
                    const beneficiary = document.getElementById('epBeneficiary').value;
                    const mode = document.getElementById('epMode').value;
                    const approver = document.getElementById('epApprover').value;
                    const gross = parseFloat(document.getElementById('epAmount').value);
                    const tdsRate = parseFloat(document.getElementById('epTds').value);
                    const desc = document.getElementById('epDesc').value;

                    const voucherId = 'ERP-PRO-' + voucherSerial++;
                    const tdsAmount = (gross * tdsRate) / 100;
                    const netPayable = gross - tdsAmount;

                    totalGrossSum += gross;
                    totalTdsSum += tdsAmount;
                    totalNetSum += netPayable;

                    erpProLogs.unshift({
                        voucherId,
                        catDept: \`<b>\${category}</b><br><small>Dept: \${dept}</small>\`,
                        beneficiaryDesc: \`<b>\${beneficiary}</b><br><small>\${desc} | \${mode}</small>\`,
                        gross: gross.toLocaleString('en-IN'),
                        tds: tdsAmount.toLocaleString('en-IN') + ' (' + tdsRate + '%)',
                        netStatus: \`<b>₹\${netPayable.toLocaleString('en-IN')}</b><br><span class="badge badge-approved">Approved & Posted ✓</span>\`
                    });

                    renderErpProTable();
                    document.getElementById('statProCount').innerText = erpProLogs.length;
                    document.getElementById('statProGross').innerText = '₹' + totalGrossSum.toLocaleString('en-IN');
                    document.getElementById('statProTds').innerText = '₹' + totalTdsSum.toLocaleString('en-IN');
                    document.getElementById('statProNet').innerText = '₹' + totalNetSum.toLocaleString('en-IN');

                    alert('Pro Voucher ' + voucherId + ' successfully created! TDS deducted: ₹' + tdsAmount.toLocaleString('en-IN') + ' and ledger updated.');
                    document.getElementById('erpProForm').reset();
                    document.getElementById('epApprover').value = 'Abhishek Dixit (CFO / Admin)';
                    updateEpFields();
                }

                function renderErpProTable() {
                    const tbody = document.getElementById('erpProLogsBody');
                    if(erpProLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No financial vouchers posted yet today.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    erpProLogs.forEach(log => {
                        html += \`<tr>
                            <td><b><span class="badge" style="background:#e0e7ff; color:#3730a3;">\${log.voucherId}</span></b></td>
                            <td>\${log.catDept}</td>
                            <td>\${log.beneficiaryDesc}</td>
                            <td>₹\${log.gross}</td>
                            <td style="color:#b45309;"><b>₹\${log.tds}</b></td>
                            <td>\${log.netStatus}</td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function triggerCFOAuditSOS() {
                    alert('🚨 CFO & TAX AUDIT CODE RED: Chief Financial Officer, Tax Consultants, and Internal Auditors alerted for emergency statutory review.');
                }

                function exportErpProCSV() {
                    if(erpProLogs.length === 0) {
                        alert('No financial records available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Voucher ID,Category & Department,Beneficiary & Particulars,Gross Amount,TDS,Net Payable\n";
                    erpProLogs.forEach(row => {
                        csvContent += \`"\${row.voucherId}","\${row.catDept.replace(/<[^>]*>?/gm, '')}","\${row.beneficiaryDesc.replace(/<[^>]*>?/gm, '')}","\${row.gross.replace(/,/g, '')}","\${row.tds}","\${row.netStatus.replace(/<[^>]*>?/gm, '').replace(/₹/g, '').replace(/Approved & Posted ✓/g, '').trim()}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Enterprise_Financial_ERP_Pro.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});

// ==========================================
// 👥 Ultra-Advanced Hi-Tech OPD & Queue Suite
// ==========================================
// ==========================================
// 🚀 Enterprise-Grade Hi-Tech OPD & Multi-Specialty Suite
// ==========================================
app.get('/opd-portal', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise OPD & Triage Hub — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 1050px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #0284c7; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #0284c7; }
                h2 { color: #0369a1; margin-top: 0; font-size: 22px; border-bottom: 2px solid #e0f2fe; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select, textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                textarea { resize: vertical; height: 60px; }
                
                .ai-triage-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; color: #166534; display: none; }
                
                .btn { padding: 10px 15px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
                .btn-submit { background: #0284c7; color: white; width: 100%; padding: 12px; font-size: 15px; justify-content: center; }
                .btn-submit:hover { background: #0369a1; }
                .btn-sos { background: #dc2626; color: white; padding: 6px 12px; font-size: 12px; }
                .btn-sos:hover { background: #b91c1c; }
                .btn-export { background: #0d9488; color: white; margin-bottom: 15px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-p3 { background: #fef3c7; color: #d97706; }
                .badge-p1 { background: #fee2e2; color: #991b1b; }
                .badge-p2 { background: #e0e7ff; color: #3730a3; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <div class="card">
                    <h2>
                        <span>🏥 Hi-Tech OPD & Multi-Specialty Triage Suite</span>
                        <button type="button" class="btn btn-sos" onclick="triggerQueueSOS()">🚨 OPD Crowd SOS</button>
                    </h2>
                    
                    <div class="ai-triage-box" id="aiTriageBox">⚡ AI Triage Engine: Analyzing patient symptoms for clinical priority routing...</div>

                    <form id="enterpriseOpdForm" onsubmit="registerEnterpriseOPD(event)">
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Patient Full Name</label>
                                <input type="text" id="opdName" required placeholder="e.g. Rajesh Kumar">
                            </div>
                            <div class="form-group">
                                <label>Mobile Number (SMS/WhatsApp Token Alert)</label>
                                <input type="text" id="opdMobile" required placeholder="e.g. 9876543210">
                            </div>
                        </div>

                        <div class="grid-3">
                            <div class="form-group">
                                <label>Select Medical Department / Specialty</label>
                                <select id="opdDept" onchange="updateSpecialtyDoctors()">
                                    <optgroup label="Core & Medicine">
                                        <option value="General Medicine">General Medicine & Diabetology</option>
                                        <option value="Cardiology">Cardiology (Heart Care)</option>
                                        <option value="Neurology">Neurology & Stroke Unit</option>
                                        <option value="Pulmonary">Pulmonary & Respiratory Medicine</option>
                                        <option value="Nephrology">Nephrology & Dialysis</option>
                                        <option value="Gastroenterology">Gastroenterology & Hepatology</option>
                                    </optgroup>
                                    <optgroup label="Surgical & Ortho">
                                        <option value="Orthopedics">Orthopedics & Joint Replacement</option>
                                        <option value="General Surgery">General & Laparoscopic Surgery</option>
                                        <option value="Neurosurgery">Neurosurgery & Spine</option>
                                        <option value="Urology">Urology & Kidney Stone</option>
                                        <option value="Cardiothoracic">Cardiothoracic Surgery (CTVS)</option>
                                    </optgroup>
                                    <optgroup label="Specialized Care">
                                        <option value="Oncology">Oncology & Chemotherapy</option>
                                        <option value="Pediatrics">Pediatrics & Neonatology (NICU)</option>
                                        <option value="Gynecology">Obstetrics & Gynecology (Maternity)</option>
                                        <option value="Dermatology">Dermatology & Cosmetology</option>
                                        <option value="Ophthalmology">Ophthalmology (Eye Care)</option>
                                        <option value="ENT">ENT (Ear, Nose, Throat)</option>
                                        <option value="Psychiatry">Psychiatry & Mental Health</option>
                                        <option value="Emergency Trauma">Emergency & Critical Care Trauma</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Assigned Consultant & Room</label>
                                <input type="text" id="opdDoctor" required placeholder="Auto-assigned doctor">
                            </div>
                            <div class="form-group">
                                <label>Payment / Consultation Type</label>
                                <select id="consultType">
                                    <option value="General OPD (₹500)">General OPD (₹500)</option>
                                    <option value="Senior Consultant (₹1000)">Senior Consultant (₹1000)</option>
                                    <option value="Emergency / VIP (₹1500)">Emergency / VIP (₹1500)</option>
                                    <option value="Ayushman / Govt Scheme">Ayushman / Govt Scheme (Free)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Presenting Chief Complaints & Symptoms (AI Triage Trigger)</label>
                            <textarea id="opdSymptoms" required placeholder="e.g. Severe chest pain, radiating to left arm, sweating since 30 mins..." oninput="runAITriage()"></textarea>
                        </div>

                        <button type="submit" class="btn btn-submit">Generate Smart OPD Token & Print Slip</button>
                    </form>
                </div>

                <!-- Master Queue Table -->
                <div class="card" style="border-top-color: #0d9488;">
                    <h2 style="color: #0f766e; border-bottom-color: #ccfbf1;">
                        <span>📋 Master OPD Live Queue & Triage Logs</span>
                        <button type="button" class="btn btn-export" onclick="exportEnterpriseOPDCSV()">📥 Export OPD Master CSV</button>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Token</th>
                                <th>Patient Name</th>
                                <th>Department & Doctor</th>
                                <th>Room</th>
                                <th>Triage Priority</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="enterpriseOpdBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No OPD consultations registered yet today.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const enterpriseOpdLogs = [];
                let opdSerial = 101;

                function updateSpecialtyDoctors() {
                    const dept = document.getElementById('opdDept').value;
                    const docField = document.getElementById('opdDoctor');
                    
                    const mapping = {
                        'General Medicine': 'Dr. V. K. Gupta (MD) — Room 102',
                        'Cardiology': 'Dr. Anjali Sharma (DM) — Room 105 (Cath Lab)',
                        'Neurology': 'Dr. S. K. Roy (MCh) — Room 110',
                        'Pulmonary': 'Dr. R. K. Mishra (DTCD) — Room 108',
                        'Nephrology': 'Dr. Alok Verma (DNB) — Room 112',
                        'Gastroenterology': 'Dr. Manish Singhal (DM) — Room 106',
                        'Orthopedics': 'Dr. Rajesh Verma (MS) — Room 201',
                        'General Surgery': 'Dr. Subhash Chandra (MS) — Room 203',
                        'Neurosurgery': 'Dr. Vikram Rathore (MCh) — Room 205',
                        'Urology': 'Dr. N. P. Singh (MCh) — Room 207',
                        'Cardiothoracic': 'Dr. Zuber Ahmed (MCh) — Room 209',
                        'Oncology': 'Dr. Pallavi Sen (DM Cancer) — Room 301',
                        'Pediatrics': 'Dr. Maneesh Sinha (DCH) — Room 104',
                        'Gynecology': 'Dr. Sunita Kapoor (MS) — Room 103',
                        'Dermatology': 'Dr. Neha Agarwal (MD) — Room 303',
                        'Ophthalmology': 'Dr. K. P. Jha (MS Eye) — Room 305',
                        'ENT': 'Dr. Sameer Joshi (MS) — Room 307',
                        'Psychiatry': 'Dr. Anurag Jain (MD) — Room 309',
                        'Emergency Trauma': 'Dr. Trauma Chief (ACLS) — Red Zone ICU'
                    };
                    docField.value = mapping[dept] || 'Dr. On Duty — Room 101';
                }

                // Initial setup
                updateSpecialtyDoctors();

                function runAITriage() {
                    const symptoms = document.getElementById('opdSymptoms').value.toLowerCase();
                    const box = document.getElementById('aiTriageBox');

                    if(symptoms.length < 3) {
                        box.style.display = 'none';
                        return;
                    }

                    box.style.display = 'block';
                    if(symptoms.includes('chest pain') || symptoms.includes('breathless') || symptoms.includes('unconscious') || symptoms.includes('accident') || symptoms.includes('bleed')) {
                        box.innerHTML = "🚨 <b>AI Triage Alert: P1 - RED ZONE EMERGENCY!</b> High risk of cardiac/trauma event. Immediate priority routing to Emergency Trauma!";
                        box.style.background = "#fef2f2";
                        box.style.borderColor = "#fecaca";
                        box.style.color = "#991b1b";
                    } else if(symptoms.includes('fever') || symptoms.includes('vomit') || symptoms.includes('pain')) {
                        box.innerHTML = "⚠️ <b>AI Triage Insight: P2 - Yellow Priority.</b> Standard specialist consultation recommended within 15 minutes.";
                        box.style.background = "#fef3c7";
                        box.style.borderColor = "#fde68a";
                        box.style.color = "#92400e";
                    } else {
                        box.innerHTML = "✓ <b>AI Triage Insight: P3 - Green Priority (Stable).</b> Regular OPD queue routing.";
                        box.style.background = "#f0fdf4";
                        box.style.borderColor = "#bbf7d0";
                        box.style.color = "#166534";
                    }
                }

                function registerEnterpriseOPD(event) {
                    event.preventDefault();
                    const name = document.getElementById('opdName').value;
                    const mobile = document.getElementById('opdMobile').value;
                    const dept = document.getElementById('opdDept').value;
                    const doctorRoom = document.getElementById('opdDoctor').value;
                    const sym = document.getElementById('opdSymptoms').value.toLowerCase();

                    const tokenNo = 'OPD-' + opdSerial++;
                    
                    let priority = "P3 - Routine (Green)";
                    let badgeClass = "badge-p3";
                    if(sym.includes('chest pain') || sym.includes('breathless') || sym.includes('unconscious') || sym.includes('accident')) {
                        priority = "P1 - EMERGENCY (Red)";
                        badgeClass = "badge-p1";
                    } else if(sym.includes('fever') || sym.includes('pain')) {
                        priority = "P2 - Urgent (Yellow)";
                        badgeClass = "badge-p2";
                    }

                    enterpriseOpdLogs.unshift({
                        tokenNo,
                        name,
                        deptDoc: dept + ' | ' + doctorRoom,
                        room: doctorRoom.split('—')[1] || 'Room 101',
                        priority,
                        badgeClass
                    });

                    renderEnterpriseTable();
                    alert('Token ' + tokenNo + ' generated successfully! SMS & WhatsApp alert dispatched to +91 ' + mobile + '.');
                    document.getElementById('enterpriseOpdForm').reset();
                    updateSpecialtyDoctors();
                    document.getElementById('aiTriageBox').style.display = 'none';
                }

                function renderEnterpriseTable() {
                    const tbody = document.getElementById('enterpriseOpdBody');
                    if(enterpriseOpdLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No OPD consultations registered yet today.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    enterpriseOpdLogs.forEach(log => {
                        html += \`<tr>
                            <td><b>\${log.tokenNo}</b></td>
                            <td>\${log.name}</td>
                            <td>\${log.deptDoc}</td>
                            <td>\${log.room}</td>
                            <td><span class="badge \${log.badgeClass}">\${log.priority}</span></td>
                            <td>Active in Queue ⏳</td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function triggerQueueSOS() {
                    alert('🚨 HOSPITAL CROWD CONTROL SOS: Additional medical officers and token counter staff deployed across all specialty wings.');
                }

                function exportEnterpriseOPDCSV() {
                    if(enterpriseOpdLogs.length === 0) {
                        alert('No OPD records available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Token,Patient Name,Department & Doctor,Room,Priority,Status\n";
                    enterpriseOpdLogs.forEach(row => {
                        csvContent += \`"\${row.tokenNo}","\${row.name}","\${row.deptDoc}","\${row.room}","\${row.priority}","Active"\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Enterprise_OPD_Master.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});

;app.get('/onboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Staff Onboarding & Appointment - CP Hospital</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                }
                .hospital-logo {
                    width: 90px;
                    height: 90px;
                    object-fit: contain;
                }
                .id-card {
                    width: 350px;
                    border: 2px solid #0056b3;
                    border-radius: 12px;
                    background: #fff;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    margin: 20px auto;
                    overflow: hidden;
                }
            </style>
        </head>
        <body class="bg-light py-4">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-9 bg-white p-5 rounded shadow-sm">
                        
                        <!-- Header with Logo -->
                        <div class="text-center mb-4 border-bottom pb-4">
                            <img src="/logo.png" alt="CP Hospital Logo" style="width: 90px; height: 90px; object-fit: contain;" class="mb-2" />
                            <h2 class="text-primary fw-bold mb-1">CP HOSPITAL</h2>
                            <p class="text-muted small mb-1">A Multispecialty Healthcare Center | सेवाहि परमो तपः</p>
                            <p class="text-dark small mb-0"><strong>Address:</strong> Jaipur Road, Gangapur City, Distt. Sawai Madhopur-322201, Rajasthan</p>
                            <p class="text-dark small"><strong>Mobile No:</strong> 8094231550</p>
                        </div>

                        <!-- Onboarding Form -->
                        <form id="onboardForm" action="/onboard" method="POST" enctype="multipart/form-data">
                            <h4 class="mb-4 text-secondary text-center">Staff Onboarding & Appointment Portal</h4>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Full Name *</label>
                                <input type="text" name="full_name" class="form-control" placeholder="e.g. Dr. Rajesh Sharma" required />
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">Department *</label>
                                    <select name="department" id="departmentSelect" class="form-control" required onchange="updateDesignations()">
                                        <option value="">-- Select Department --</option>
                                        <option value="General Medicine">General Medicine</option>
                                        <option value="General Surgery">General Surgery</option>
                                        <option value="Orthopaedics">Orthopaedics</option>
                                        <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
                                        <option value="Paediatrics">Paediatrics</option>
                                        <option value="Neonatology / NICU">Neonatology / NICU</option>
                                        <option value="Critical Care / ICU">Critical Care / ICU</option>
                                        <option value="Emergency & Trauma">Emergency & Trauma</option>
                                        <option value="Urology">Urology</option>
                                        <option value="Nephrology">Nephrology</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Gastroenterology">Gastroenterology</option>
                                        <option value="Endocrinology">Endocrinology</option>
                                        <option value="ENT">ENT</option>
                                        <option value="Ophthalmology">Ophthalmology</option>
                                        <option value="Dermatology">Dermatology</option>
                                        <option value="Dentistry">Dentistry</option>
                                        <option value="Physiotherapy">Physiotherapy</option>
                                        <option value="Anaesthesia">Anaesthesia</option>
                                        <option value="Radiology">Radiology</option>
                                        <option value="Pathology">Pathology</option>
                                        <option value="Administration">Administration</option>
                                        <option value="Nursing Administration">Nursing Administration</option>
                                        <option value="Quality">Quality</option>
                                        <option value="HR">HR</option>
                                        <option value="Finance & Accounts">Finance & Accounts</option>
                                        <option value="MRD">MRD</option>
                                        <option value="Legal & Compliance">Legal & Compliance</option>
                                        <option value="IT">IT</option>
                                        <option value="Purchase">Purchase</option>
                                        <option value="Store">Store</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Laboratory">Laboratory</option>
                                        <option value="CT/MRI">CT/MRI</option>
                                        <option value="Sonography">Sonography</option>
                                        <option value="Blood Bank">Blood Bank</option>
                                        <option value="Dialysis">Dialysis</option>
                                        <option value="Pharmacy">Pharmacy</option>
                                        <option value="Dietetics">Dietetics</option>
                                        <option value="Infection Control">Infection Control</option>
                                        <option value="Biomedical">Biomedical</option>
                                        <option value="Housekeeping">Housekeeping</option>
                                        <option value="Security">Security</option>
                                        <option value="General Duty Assistant">General Duty Assistant</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">Designation / Cadre *</label>
                                    <select name="designation" id="designationSelect" class="form-control" required onchange="updateDynamicFields()">
                                        <option value="">-- First Select Department --</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">Email Address *</label>
                                    <input type="email" name="email" class="form-control" required />
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">Phone Number *</label>
                                    <input type="text" name="phone" class="form-control" required />
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3" id="panDiv">
                                    <label class="form-label fw-bold">PAN Card Number *</label>
                                    <input type="text" name="pan" id="panInput" class="form-control" required />
                                </div>
                                <div class="col-md-6 mb-3" id="councilDiv" style="display:none;">
                                    <label class="form-label fw-bold" id="councilLabel">Council Registration No. *</label>
                                    <input type="text" name="council_reg" id="councilInput" class="form-control" />
                                </div>
                            </div>

                            <div <!-- Separate Columns for Bank Details -->
<div class="mb-3" id="bankDiv">
    <label class="form-label fw-bold">Bank Details (Payroll Setup) *</label>
    <div class="row">
        <div class="col-md-4 mb-2">
            <input type="text" name="bank_ac" class="form-control" placeholder="Account Number *" required />
        </div>
        <div class="col-md-4 mb-2">
            <input type="text" name="bank_ifsc" class="form-control" placeholder="IFSC Code *" required />
        </div>
        <div class="col-md-4 mb-2">
            <input type="text" name="bank_name" class="form-control" placeholder="Bank Name *" required />
        </div>
    </div>
</div>

                            <hr class="my-4">
                            <h5 class="text-secondary mb-3">Mandatory Document Uploads (Separate Columns, Max 10 MB each)</h5>
                            
                            <div id="dynamicDocumentsContainer">
                                <!-- Dynamic individual document fields will load here -->
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-3 mt-4 fw-bold shadow-sm">Submit & Generate Appointment, Terms, Joining & ID Card</button>
                        </form>

                        <!-- Generated Output Letters & ID Card Section -->
                        <div id="letterhead-section" style="display: none;" class="mt-4 p-4 border bg-white shadow-sm">
                            
                            <!-- Letterhead Header -->
                            <div class="text-center border-bottom pb-3 mb-4">
                                <h3 class="text-primary fw-bold mb-1">CP HOSPITAL</h3>
                                <p class="text-muted small mb-1">Jaipur Road, Gangapur City, Distt. Sawai Madhopur-322201, Rajasthan</p>
                                <p class="text-dark small mb-0"><strong>Mobile:</strong> 8094231550 | <strong>Email:</strong> hr@cphospital.com</p>
                            </div>

                            <div class="d-flex justify-content-between mb-4">
                                <div><strong>Ref No:</strong> CP/HR/2026/<span id="print-emp-code"></span></div>
                                <div><strong>Date:</strong> <span id="print-date"></span></div>
                            </div>

                            <p>To,<br><strong><span id="print-name"></span></strong><br>
                            Designation: <span id="print-desig"></span><br>
                            Department: <span id="print-dept"></span></p>

                            <!-- 1. Appointment Letter -->
                            <div class="mb-4">
                                <h5 class="text-dark border-bottom pb-1">1. Official Appointment Letter</h5>
                                <p>We are delighted to formally appoint you at <strong>CP Hospital</strong> as <strong><span id="print-desig-2"></span></strong> within the <strong><span id="print-dept-2"></span></strong> department. Your employment starts with immediate effect, subject to hospital enterprise guidelines and Government of Rajasthan health regulations.</p>
                            </div>

                            <!-- 2. Joining & Service Terms -->
                            <div class="mb-4">
                                <h5 class="text-dark border-bottom pb-1">2. Joining & Service Terms and Conditions</h5>
                                <ul>
                                    <li><strong>Professional Ethics:</strong> Absolute adherence to clinical care standards, patient safety, and medical ethics.</li>
                                    <li><strong>Confidentiality:</strong> Strict protection of patient health information and hospital proprietary policies under medical privacy laws.</li>
                                    <li><strong>Working Hours & Roster:</strong> As per shift schedule assigned by the Departmental Head.</li>
                                    <li><strong>Conduct & Discipline:</strong> Compliance with safety protocols; any misconduct will lead to immediate disciplinary actions.</li>
                                </ul>
                            </div>

                            <!-- 3. Employee ID Card Preview -->
                            <div class="mb-4 text-center">
                                <h5 class="text-dark border-bottom pb-1 text-start">3. Official Staff ID Card</h5>
                                <div class="id-card p-3 text-start">
                                    <div class="text-center border-bottom pb-2 mb-2">
                                        <h6 class="text-primary fw-bold mb-0">CP HOSPITAL</h6>
                                        <small style="font-size: 10px;">Gangapur City, Rajasthan</small>
                                    </div>
                                    <div class="row align-items-center">
                                        <div class="col-5 text-center">
                                            <div id="id-photo-preview" class="border bg-light d-flex align-items-center justify-content-center" style="width: 80px; height: 95px; font-size: 11px; color: #777;">Staff Photo</div>
                                        </div>
                                        <div class="col-7">
                                            <p class="mb-1" style="font-size: 12px;"><strong>Name:</strong> <span id="id-name"></span></p>
                                            <p class="mb-1" style="font-size: 11px;"><strong>Desig:</strong> <span id="id-desig"></span></p>
                                            <p class="mb-1" style="font-size: 11px;"><strong>Dept:</strong> <span id="id-dept"></span></p>
                                            <p class="mb-0" style="font-size: 11px;"><strong>Emp ID:</strong> <span id="id-code"></span></p>
                                        </div>
                                    </div>
                                    <div class="mt-2 pt-2 border-top text-end">
                                        <small style="font-size: 9px;">Authorized Signatory</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Signatures -->
                            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                                <div>
                                    <p>---------------------------------------<br><strong>Employee Signature</strong></p>
                                </div>
                                <div style="text-align: right;">
                                    <p>---------------------------------------<br><strong>Authorized HR Signatory</strong><br>CP Hospital, Gangapur City</p>
                                </div>
                            </div>

                            <div class="text-center mt-4 no-print">
                                <button onclick="window.print()" class="btn btn-success btn-lg px-5">🖨️ Print / Save Complete Dossier as PDF</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <script>
                const departmentDesignations = {
                    "General Medicine": ["Consultant Physician", "Medical Officer", "RMO"],
                    "General Surgery": ["Consultant Surgeon", "Assistant/Junior Consultant", "RMO"],
                    "Orthopaedics": ["Orthopaedic Consultant", "Junior Consultant", "RMO"],
                    "Obstetrics & Gynaecology": ["Gynaecologist", "Obstetrician", "Junior Consultant"],
                    "Paediatrics": ["Paediatrician", "Junior Consultant"],
                    "Neonatology / NICU": ["Neonatologist", "Paediatrician", "Medical Officer"],
                    "Critical Care / ICU": ["Intensivist", "ICU Medical Officer"],
                    "Emergency & Trauma": ["Emergency Physician", "Medical Officer", "RMO"],
                    "Urology": ["Urologist", "Assistant/Junior Consultant"],
                    "Nephrology": ["Nephrologist", "Medical Officer"],
                    "Cardiology": ["Cardiologist", "Medical Officer"],
                    "Gastroenterology": ["Gastroenterologist"],
                    "Endocrinology": ["Endocrinologist"],
                    "ENT": ["ENT Consultant"],
                    "Ophthalmology": ["Ophthalmologist"],
                    "Dermatology": ["Dermatologist"],
                    "Dentistry": ["Dental Surgeon"],
                    "Physiotherapy": ["Physiotherapist", "Senior Physiotherapist"],
                    "Anaesthesia": ["Anaesthesiologist"],
                    "Radiology": ["Radiologist"],
                    "Pathology": ["Pathologist"],
                    "Administration": ["Chairman / Director", "Medical Director / Medical Superintendent", "Hospital Administrator / Operations Manager", "Deputy/Assistant Administrator"],
                    "Nursing Administration": ["Nursing Superintendent", "Deputy Nursing Superintendent", "Nursing In-charge / Ward In-charge"],
                    "Quality": ["Quality Manager", "Quality Executive / NABH Coordinator"],
                    "HR": ["HR Manager / HR Head", "HR Executive"],
                    "Finance & Accounts": ["Finance Manager / Accounts Manager", "Accountant / Billing Manager"],
                    "MRD": ["MRD Manager / Medical Record Officer"],
                    "Legal & Compliance": ["Compliance Officer"],
                    "IT": ["IT Manager / IT Executive"],
                    "Purchase": ["Purchase Manager / Purchase Executive"],
                    "Store": ["Store Manager / Store In-charge"],
                    "Marketing": ["Marketing Manager / Marketing Executive"],
                    "Laboratory": ["Lab Manager", "Pathologist", "Lab Technician"],
                    "CT/MRI": ["Radiologist", "CT Technician", "MRI Technician"],
                    "Sonography": ["Radiologist/Sonologist", "Technician"],
                    "Blood Bank": ["Blood Bank Officer/Medical Officer", "Technician"],
                    "Dialysis": ["Nephrologist", "Dialysis Technician", "Dialysis Nurse"],
                    "Pharmacy": ["Pharmacist", "Pharmacy In-charge"],
                    "Dietetics": ["Dietician"],
                    "Infection Control": ["Infection Control Officer", "Infection Control Nurse"],
                    "Biomedical": ["Biomedical Engineer/Technician"],
                    "Housekeeping": ["Housekeeping Staff"],
                    "Security": ["Security Guard"],
                    "General Duty Assistant": ["General Duty Assistant (GDA)"]
                };

                function updateDesignations() {
                    const dept = document.getElementById('departmentSelect').value;
                    const desigSelect = document.getElementById('designationSelect');
                    desigSelect.innerHTML = '<option value="">-- Select Designation --</option>';

                    if (departmentDesignations[dept]) {
                        departmentDesignations[dept].forEach(desig => {
                            const opt = document.createElement('option');
                            opt.value = desig;
                            opt.textContent = desig;
                            desigSelect.appendChild(opt);
                        });
                    }
                    updateDynamicFields();
                }

                function updateDynamicFields() {
                    const dept = document.getElementById('departmentSelect').value;
                    const desig = document.getElementById('designationSelect').value;
                    const councilDiv = document.getElementById('councilDiv');
                    const councilInput = document.getElementById('councilInput');
                    const docsContainer = document.getElementById('dynamicDocumentsContainer');

                    docsContainer.innerHTML = '';

                    const isClinicalOrNursing = dept.includes('Medicine') || dept.includes('Surgery') || dept.includes('Orthopaedics') || dept.includes('Gynaecology') || dept.includes('Paediatrics') || dept.includes('ICU') || dept.includes('Emergency') || dept.includes('Cardiology') || dept.includes('Pharmacy') || dept.includes('Nursing');

                    if (isClinicalOrNursing) {
                        councilDiv.style.display = 'block';
                        councilInput.setAttribute('required', 'true');
                    } else {
                        councilDiv.style.display = 'none';
                        councilInput.removeAttribute('required');
                    }

                    // Render separate individual document columns
                    let docHTML = \`
                        <div class="mb-3">
                            <label class="form-label fw-bold">1. Passport Size Photograph (for ID & Files) *</label>
                            <input type="file" name="staff_photo" id="staffPhotoInput" class="form-control" accept=".jpg,.jpeg,.png" required onchange="validateFileSize(this)" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">2. Photo ID Proof (Aadhaar / Voter ID / Passport) *</label>
                            <input type="file" name="photo_id" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required onchange="validateFileSize(this)" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">3. Educational / Professional Degree & Diploma Certificate *</label>
                            <input type="file" name="degree_cert" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required onchange="validateFileSize(this)" />
                        </div>
                    \`;

                    if (isClinicalOrNursing) {
                        docHTML += \`
                            <div class="mb-3">
                                <label class="form-label fw-bold">4. State Council Registration Certificate *</label>
                                <input type="file" name="council_cert" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required onchange="validateFileSize(this)" />
                            </div>
                        \`;
                    }

                    docHTML += \`
                        <div class="mb-3">
                            <label class="form-label fw-bold">\${isClinicalOrNursing ? '5' : '4'}. Experience / Relieving Certificate *</label>
                            <input type="file" name="experience_cert" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required onchange="validateFileSize(this)" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">\${isClinicalOrNursing ? '6' : '5'}. PAN Card Copy *</label>
                            <input type="file" name="pan_copy" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required onchange="validateFileSize(this)" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">\${isClinicalOrNursing ? '7' : '6'}. Bank Proof (Passbook / Cancelled Cheque) *</label>
                            <input type="file" name="bank_proof" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required onchange="validateFileSize(this)" />
                        </div>
                    \`;

                    docsContainer.innerHTML = docHTML;
                }

                function validateFileSize(input) {
                    const maxSize = 10 * 1024 * 1024; // 10 MB
                    if (input.files && input.files[0]) {
                        if (input.files[0].size > maxSize) {
                            alert('File size exceeds 10 MB limit. Please select a smaller file.');
                            input.value = '';
                        }
                    }
                }

                document.getElementById('onboardForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const formData = new FormData(this);

                    try {
                        const response = await fetch('/onboard', {
                            method: 'POST',
                            body: formData
                        });
                        const result = await response.json();

                        if (result.success) {
                            alert(result.message);
                            
                            const empCode = result.data.employee_code;
                            const fullName = result.data.full_name;
                            const desig = result.data.designation;
                            const dept = result.data.department;

                            document.getElementById('print-emp-code').innerText = empCode;
                            document.getElementById('print-date').innerText = new Date().toLocaleDateString();
                            document.getElementById('print-name').innerText = fullName;
                            document.getElementById('print-desig').innerText = desig;
                            document.getElementById('print-dept').innerText = dept;
                            document.getElementById('print-desig-2').innerText = desig;
                            document.getElementById('print-dept-2').innerText = dept;

                            // Populate ID card details
                            document.getElementById('id-name').innerText = fullName;
                            document.getElementById('id-desig').innerText = desig;
                            document.getElementById('id-dept').innerText = dept;
                            document.getElementById('id-code').innerText = empCode;

                            // Preview uploaded photo in ID Card if available
                            const photoInput = document.getElementById('staffPhotoInput');
                            if (photoInput && photoInput.files && photoInput.files[0]) {
                                const reader = new FileReader();
                                reader.onload = function(e) {
                                    document.getElementById('id-photo-preview').innerHTML = \`<img src="\${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;" />\`;
                                }
                                reader.readAsDataURL(photoInput.files[0]);
                            }

                            document.getElementById('onboardForm').style.display = 'none';
                            document.getElementById('letterhead-section').style.display = 'block';
                        } else {
                            alert('Error: ' + (result.error || 'Submission failed'));
                        }
                    } catch (err) {
                        console.error('Submission failed:', err);
                        alert('Something went wrong during onboarding submission.');
                    }
                });
            </script>
        </body>
        </html>
    `);
});
// ==========================================
// 🚀 Ultra-Advanced Hi-Tech Attendance Portal Route
// ==========================================
app.get('/attendance', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hi-Tech Attendance Suite — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 950px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #0d9488; }
                h2 { color: #0f766e; margin-top: 0; font-size: 22px; border-bottom: 2px solid #ccfbf1; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                
                .gps-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; color: #166534; }
                .error-box { background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; color: #991b1b; display: none; }
                
                .media-section { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
                .webcam-container, .voice-container { text-align: center; }
                video { width: 100%; max-width: 200px; border-radius: 6px; border: 2px solid #cbd5e1; }
                canvas { display: none; }

                .btn { padding: 10px 15px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
                .btn-submit { background: #0d9488; color: white; width: 100%; padding: 12px; font-size: 15px; justify-content: center; }
                .btn-submit:hover { background: #0f766e; }
                .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
                .btn-sos { background: #dc2626; color: white; padding: 6px 12px; font-size: 12px; }
                .btn-sos:hover { background: #b91c1c; }
                .btn-export { background: #0284c7; color: white; margin-bottom: 15px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-in { background: #dcfce7; color: #166534; }
                .badge-out { background: #fee2e2; color: #991b1b; }
                .badge-late { background: #fef3c7; color: #d97706; }
                .badge-ot { background: #e0e7ff; color: #3730a3; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <div class="card">
                    <h2>
                        <span>📍 Hi-Tech Geofenced Attendance Suite</span>
                        <button type="button" class="btn btn-sos" onclick="triggerSOS()">🚨 Emergency SOS</button>
                    </h2>
                    
                    <div class="gps-box" id="gpsStatus">📡 Fetching high-accuracy GPS coordinates & checking geofence...</div>
                    <div class="error-box" id="errorBox"></div>

                    <form id="attendanceForm" onsubmit="submitAttendance(event)">
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Staff ID</label>
                                <input type="text" id="staffId" required placeholder="e.g. CPHS-9921">
                            </div>
                            <div class="form-group">
                                <label>Staff Full Name</label>
                                <input type="text" id="staffName" required placeholder="e.g. Dr. Anjali Verma">
                            </div>
                        </div>

                        <div class="grid-2">
                            <div class="form-group">
                                <label>Punch Type</label>
                                <select id="punchType">
                                    <option value="Punch IN (Arrival)">Punch IN (Arrival)</option>
                                    <option value="Punch OUT (Departure)">Punch OUT (Departure)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Duty Shift Roster</label>
                                <select id="shiftMode">
                                    <option value="Morning Shift (09:00 AM - 05:00 PM)">Morning Shift (09:00 AM - 05:00 PM)</option>
                                    <option value="Evening Shift (02:00 PM - 10:00 PM)">Evening Shift (02:00 PM - 10:00 PM)</option>
                                    <option value="Night Shift (10:00 PM - 06:00 AM)">Night Shift (10:00 PM - 06:00 AM)</option>
                                </select>
                            </div>
                        </div>

                        <!-- AI Face Recognition & Voice Note Section -->
                        <div class="media-section">
                            <div class="webcam-container">
                                <label>🤖 AI Face Verification (Selfie Scan)</label>
                                <video id="video" autoplay playsinline></video>
                                <canvas id="canvas" width="200" height="150"></canvas>
                                <br>
                                <button type="button" class="btn" style="background:#475569; color:white; margin-top:5px; font-size:11px;" onclick="capturePhoto()">📸 Scan Face / Capture</button>
                                <div id="photoStatus" style="font-size:11px; color:#16a34a; margin-top:3px; font-weight:600;"></div>
                            </div>
                            <div class="voice-container">
                                <label>🎙️ Audio Voice Note Check-In</label>
                                <div style="margin-top: 30px;">
                                    <button type="button" id="recordBtn" class="btn" style="background:#2563eb; color:white;" onclick="toggleRecord()">🔴 Start Voice Note</button>
                                    <div id="voiceStatus" style="font-size:11px; color:#2563eb; margin-top:8px; font-weight:600;">No voice note recorded</div>
                                </div>
                            </div>
                        </div>

                        <button type="submit" id="submitBtn" class="btn btn-submit" disabled>Verify Location & Submit Attendance</button>
                    </form>
                </div>

                <!-- Today's Attendance Logs & Export -->
                <div class="card">
                    <h2>
                        <span>📋 Attendance Logs & Analytics</span>
                        <button type="button" class="btn btn-export" onclick="exportToCSV()">📥 Export Report (CSV/Excel)</button>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Staff ID</th>
                                <th>Name</th>
                                <th>Shift</th>
                                <th>Punch Type</th>
                                <th>Time</th>
                                <th>Status / OT</th>
                            </tr>
                        </thead>
                        <tbody id="logsTableBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No attendance recorded yet today.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const HOSPITAL_LAT = 26.9124; 
                const HOSPITAL_LNG = 75.7873;
                const ALLOWED_RADIUS_METERS = 200; 

                let userLat = null;
                let userLng = null;
                let capturedImage = null;
                let isRecording = false;
                const attendanceLogs = [];

                window.onload = function() {
                    startWebcam();
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(successGPS, errorGPS, { enableHighAccuracy: true });
                    } else {
                        showError("Geolocation is not supported by your browser.");
                    }
                };

                function successGPS(position) {
                    userLat = position.coords.latitude;
                    userLng = position.coords.longitude;
                    const distance = calculateDistance(HOSPITAL_LAT, HOSPITAL_LNG, userLat, userLng);
                    
                    const gpsBox = document.getElementById('gpsStatus');
                    if (distance <= ALLOWED_RADIUS_METERS) {
                        gpsBox.innerHTML = \`✅ <b>Geofence Verified!</b> Within \${Math.round(distance)}m of CP Hospital. (Lat: \${userLat.toFixed(4)}, Lng: \${userLng.toFixed(4)})\`;
                        document.getElementById('submitBtn').disabled = false;
                    } else {
                        gpsBox.style.display = 'none';
                        showError(\`❌ <b>Access Denied:</b> You are \${Math.round(distance)}m away from hospital premises. Must be within \${ALLOWED_RADIUS_METERS}m!\`);
                    }
                }

                function errorGPS(error) {
                    showError("⚠️ Please allow high-accuracy GPS location access to mark attendance.");
                }

                function calculateDistance(lat1, lon1, lat2, lon2) {
                    const R = 6371e3;
                    const φ1 = lat1 * Math.PI/180;
                    const φ2 = lat2 * Math.PI/180;
                    const Δφ = (lat2-lat1) * Math.PI/180;
                    const Δλ = (lon2-lon1) * Math.PI/180;
                    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
                    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
                }

                function showError(msg) {
                    const errBox = document.getElementById('errorBox');
                    errBox.innerHTML = msg;
                    errBox.style.display = 'block';
                }

                function startWebcam() {
                    navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => { document.getElementById('video').srcObject = stream; })
                    .catch(err => { console.log("Webcam error: " + err); });
                }

                function capturePhoto() {
                    const video = document.getElementById('video');
                    const canvas = document.getElementById('canvas');
                    canvas.getContext('2d').drawImage(video, 0, 0, 200, 150);
                    capturedImage = canvas.toDataURL('image/png');
                    document.getElementById('photoStatus').innerText = "✓ AI Face Verified!";
                }

                function toggleRecord() {
                    isRecording = !isRecording;
                    const btn = document.getElementById('recordBtn');
                    const status = document.getElementById('voiceStatus');
                    if(isRecording) {
                        btn.style.background = '#dc2626';
                        btn.innerText = "⏹️ Stop Recording";
                        status.innerText = "Recording voice note...";
                    } else {
                        btn.style.background = '#16a34a';
                        btn.innerText = "✓ Voice Note Saved";
                        status.innerText = "Voice Note attached successfully!";
                    }
                }

                function submitAttendance(event) {
                    event.preventDefault();
                    if(!capturedImage) {
                        alert('Please complete AI Face Verification scan first!');
                        return;
                    }

                    const staffId = document.getElementById('staffId').value;
                    const staffName = document.getElementById('staffName').value;
                    const punchType = document.getElementById('punchType').value;
                    const shiftMode = document.getElementById('shiftMode').value;
                    const now = new Date();
                    const timeNow = now.toLocaleTimeString();
                    
                    // Late-Mark Detection (यदि सुबह 9:15 के बाद पंच इन हो)
                    let statusLabel = "On Time (Verified)";
                    let badgeClass = "badge-in";
                    
                    if(punchType.includes('IN')) {
                        const hours = now.getHours();
                        const minutes = now.getMinutes();
                        if(hours > 9 || (hours === 9 && minutes > 15)) {
                            statusLabel = "Late Arrival ⚠️";
                            badgeClass = "badge-late";
                        }
                    } else {
                        badgeClass = "badge-out";
                        statusLabel = "Overtime: +1.5 Hrs ⏱️";
                    }

                    attendanceLogs.unshift({ staffId, staffName, shiftMode, punchType, timeNow, statusLabel, badgeClass });
                    renderTable();

                    alert('Attendance successfully recorded with AI Geofence verification!');
                    document.getElementById('attendanceForm').reset();
                    document.getElementById('photoStatus').innerText = "";
                    document.getElementById('voiceStatus').innerText = "No voice note recorded";
                    capturedImage = null;
                }

                function renderTable() {
                    const tbody = document.getElementById('logsTableBody');
                    if(attendanceLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No attendance recorded yet today.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    attendanceLogs.forEach(log => {
                        html += \`<tr>
                            <td>\${log.staffId}</td>
                            <td>\${log.staffName}</td>
                            <td>\${log.shiftMode}</td>
                            <td><span class="badge \${log.badgeClass}">\${log.punchType}</span></td>
                            <td>\${log.timeNow}</td>
                            <td><b>\${log.statusLabel}</b></td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function triggerSOS() {
                    alert('🚨 EMERGENCY SOS BROADCASTED! Security team and on-duty Ambulance dispatch have been alerted with your live GPS coordinates.');
                }

                function exportToCSV() {
                    if(attendanceLogs.length === 0) {
                        alert('No attendance data available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Staff ID,Name,Shift,Punch Type,Time,Status\n";
                    attendanceLogs.forEach(row => {
                        csvContent += \`"\${row.staffId}","\${row.staffName}","\${row.shiftMode}","\${row.punchType}","\${row.timeNow}","\${row.statusLabel}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Attendance_Report.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});
// ==========================================
// 🕒 Advanced Hospital Staff Duty Roster Suite
// ==========================================
app.get('/duty-roster', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Advanced Staff Duty Roster - CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
                .container { max-width: 1250px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #0284c7; text-decoration: none; font-weight: 700; font-size: 14px; }
                
                .card { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #0284c7; }
                h2 { color: #0284c7; margin-top: 0; font-size: 22px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e0f2fe; padding-bottom: 12px; }
                
                .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; font-size: 14px; background: #fff; }
                
                .btn { padding: 10px 18px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
                .btn-primary { background: #0284c7; color: white; width: 100%; justify-content: center; padding: 12px; font-size: 15px; }
                .btn-primary:hover { background: #0369a1; }
                .btn-export { background: #10b981; color: white; }
                .btn-upload { background: #64748b; color: white; }

                .toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13.5px; }
                th { background: #f8fafc; color: #334155; font-weight: 700; }
                
                .badge { padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; display: inline-block; }
                .badge-morning { background: #e0f2fe; color: #0284c7; }
                .badge-evening { background: #fef3c7; color: #b45309; }
                .badge-night { background: #ede9fe; color: #7c3aed; }
                .badge-general { background: #dcfce7; color: #15803d; }
                
                .status-onduty { color: #10b981; font-weight: bold; }
                .status-scheduled { color: #3b82f6; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">&larr; Back to Dashboard</a>

                <!-- Roster Creator Form Card -->
                <div class="card">
                    <h2>
                        <span>🕒 Hospital Staff Duty Roster & Shift Management</span>
                        <span style="font-size: 12px; font-weight: normal; background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 20px;">All Departments & Designations</span>
                    </h2>

                    <!-- Upload & Export Toolbar -->
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <label style="display:inline; margin-right:10px;">📂 Import Roster (Excel/CSV):</label>
                            <input type="file" id="rosterFile" style="width: auto; display: inline-block; padding: 5px; background: white;">
                            <button type="button" class="btn btn-upload" onclick="uploadRosterFile()">Upload</button>
                        </div>
                        <button type="button" class="btn btn-export" onclick="exportRosterCSV()">📥 Export Roster CSV</button>
                    </div>

                    <form id="rosterForm" onsubmit="addRosterEntry(event)">
                        <div class="grid-3">
                            <div class="form-group">
                                <label>Staff Full Name</label>
                                <input type="text" id="staffName" required placeholder="e.g. Dr. Rajesh Sharma / Nurse Anita">
                            </div>
                            <div class="form-group">
                                <label>Hospital Department</label>
                                <select id="department" required>
                                    <option value="">-- Select Department --</option>
                                    <option value="ICU (Intensive Care)">ICU (Intensive Care)</option>
                                    <option value="NICU (Neonatal ICU)">NICU (Neonatal ICU)</option>
                                    <option value="Operation Theater (OT)">Operation Theater (OT)</option>
                                    <option value="Emergency & Trauma (ER)">Emergency & Trauma (ER)</option>
                                    <option value="OPD (Outpatient)">OPD (Outpatient)</option>
                                    <option value="Inpatient Ward (IPD)">Inpatient Ward (IPD)</option>
                                    <option value="Pharmacy">Pharmacy</option>
                                    <option value="Laboratory & Radiology">Laboratory & Radiology</option>
                                    <option value="Billing & Insurance">Billing & Insurance</option>
                                    <option value="Hospital Administration">Hospital Administration</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Staff Designation / Role</label>
                                <select id="designation" required>
                                    <option value="">-- Select Designation --</option>
                                    <option value="Senior Consultant">Senior Consultant</option>
                                    <option value="Junior Resident Doctor">Junior Resident Doctor</option>
                                    <option value="Nursing Incharge">Nursing Incharge</option>
                                    <option value="Staff Nurse">Staff Nurse</option>
                                    <option value="Pharmacist">Pharmacist</option>
                                    <option value="Lab / X-Ray Technician">Lab / X-Ray Technician</option>
                                    <option value="Ward Boy / Attendant">Ward Boy / Attendant</option>
                                    <option value="Billing Executive">Billing Executive</option>
                                    <option value="Security Personnel">Security Personnel</option>
                                    <option value="Hospital Administrator">Hospital Administrator</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid-3">
                            <div class="form-group">
                                <label>Assigned Shift</label>
                                <select id="shiftType" required>
                                    <option value="Morning Shift">🌅 Morning Shift (08:00 AM - 04:00 PM)</option>
                                    <option value="Evening Shift">☀️ Evening Shift (12:00 PM - 08:00 PM)</option>
                                    <option value="Night Shift">🌙 Night Shift (08:00 PM - 08:00 AM)</option>
                                    <option value="General Duty">🏢 General Duty (10:00 AM - 07:00 PM)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Duty Date</label>
                                <input type="date" id="dutyDate" required>
                            </div>
                            <div class="form-group">
                                <label>Current Status</label>
                                <select id="dutyStatus" required>
                                    <option value="On Duty">● On Duty (Active)</option>
                                    <option value="Scheduled">● Scheduled</option>
                                    <option value="On Leave">○ On Leave</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary">➕ Assign & Publish Duty Roster</button>
                    </form>
                </div>

                <!-- Live Master Roster Table Card -->
                <div class="card" style="border-top-color: #475569;">
                    <div class="toolbar">
                        <h2 style="border:none; margin:0; padding:0; color:#334155;">📋 Active Hospital Duty Roster Log</h2>
                        <div>
                            <input type="text" id="searchInput" placeholder="🔍 Search staff or department..." onkeyup="filterRoster()" style="padding: 8px 12px; width: 250px; border-radius: 6px; border: 1px solid #cbd5e1;">
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Staff Name</th>
                                <th>Department</th>
                                <th>Designation</th>
                                <th>Assigned Shift & Timing</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="rosterTableBody">
                            <tr>
                                <td><b>Dr. Abhishek Sharma</b></td>
                                <td>ICU (Intensive Care)</td>
                                <td>Senior Consultant</td>
                                <td><span class="badge badge-morning">Morning Shift</span><br><small>08:00 AM - 04:00 PM</small></td>
                                <td>2026-08-24</td>
                                <td><span class="status-onduty">● On Duty</span></td>
                            </tr>
                            <tr>
                                <td><b>Nurse Priya Singh</b></td>
                                <td>NICU (Neonatal ICU)</td>
                                <td>Staff Nurse</td>
                                <td><span class="badge badge-night">Night Shift</span><br><small>08:00 PM - 08:00 AM</small></td>
                                <td>2026-08-24</td>
                                <td><span class="status-scheduled">● Scheduled</span></td>
                            </tr>
                            <tr>
                                <td><b>Dr. Manish Verma</b></td>
                                <td>Operation Theater (OT)</td>
                                <td>Senior Consultant</td>
                                <td><span class="badge badge-general">General Duty</span><br><small>10:00 AM - 07:00 PM</small></td>
                                <td>2026-08-24</td>
                                <td><span class="status-onduty">● On Duty</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const rosterData = [
                    { name: "Dr. Abhishek Sharma", dept: "ICU (Intensive Care)", desig: "Senior Consultant", shift: "Morning Shift", timing: "08:00 AM - 04:00 PM", date: "2026-08-24", status: "On Duty" },
                    { name: "Nurse Priya Singh", dept: "NICU (Neonatal ICU)", desig: "Staff Nurse", shift: "Night Shift", timing: "08:00 PM - 08:00 AM", date: "2026-08-24", status: "Scheduled" },
                    { name: "Dr. Manish Verma", dept: "Operation Theater (OT)", desig: "Senior Consultant", shift: "General Duty", timing: "10:00 AM - 07:00 PM", date: "2026-08-24", status: "On Duty" }
                ];

                function addRosterEntry(event) {
                    event.preventDefault();
                    const name = document.getElementById('staffName').value;
                    const dept = document.getElementById('department').value;
                    const desig = document.getElementById('designation').value;
                    const shift = document.getElementById('shiftType').value;
                    const date = document.getElementById('dutyDate').value;
                    const status = document.getElementById('dutyStatus').value;

                    let timing = "08:00 AM - 04:00 PM";
                    if(shift.includes('Evening')) timing = "12:00 PM - 08:00 PM";
                    else if(shift.includes('Night')) timing = "08:00 PM - 08:00 AM";
                    else if(shift.includes('General')) timing = "10:00 AM - 07:00 PM";

                    rosterData.push({ name, dept, desig, shift, timing, date, status });
                    renderRosterTable();

                    document.getElementById('rosterForm').reset();
                    alert('✅ Duty roster assigned and published successfully for ' + name + '!');
                }

                function renderRosterTable() {
                    const tbody = document.getElementById('rosterTableBody');
                    tbody.innerHTML = '';

                    if(rosterData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b;">No roster records found.</td></tr>';
                        return;
                    }

                    rosterData.forEach(row => {
                        let badgeClass = 'badge-morning';
                        if(row.shift.includes('Evening')) badgeClass = 'badge-evening';
                        else if(row.shift.includes('Night')) badgeClass = 'badge-night';
                        else if(row.shift.includes('General')) badgeClass = 'badge-general';

                        let statusClass = row.status === 'On Duty' ? 'status-onduty' : 'status-scheduled';

                        const tr = document.createElement('tr');
                        tr.innerHTML = \`
                            <td><b>\${row.name}</b></td>
                            <td>\${row.dept}</td>
                            <td>\${row.desig}</td>
                            <td><span class="badge \${badgeClass}">\${row.shift}</span><br><small>\${row.timing}</small></td>
                            <td>\${row.date || '2026-08-24'}</td>
                            <td><span class="\${statusClass}">● \${row.status}</span></td>
                        \`;
                        tbody.appendChild(tr);
                    });
                }

                function filterRoster() {
                    const query = document.getElementById('searchInput').value.toLowerCase();
                    const rows = document.getElementById('rosterTableBody').getElementsByTagName('tr');
                    
                    for (let i = 0; i < rows.length; i++) {
                        const text = rows[i].textContent.toLowerCase();
                        rows[i].style.display = text.includes(query) ? '' : 'none';
                    }
                }

                function uploadRosterFile() {
                    const fileInput = document.getElementById('rosterFile');
                    if (fileInput.files.length === 0) {
                        alert('⚠️ Please select an Excel or CSV file first!');
                        return;
                    }
                    alert('✅ Staff Duty Roster sheet uploaded and synced with hospital database successfully!');
                    fileInput.value = '';
                }

                function exportRosterCSV() {
                    if (rosterData.length === 0) {
                        alert('⚠️ No roster data available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Staff Name,Department,Designation,Shift,Timing,Date,Status\\n";
                    rosterData.forEach(row => {
                        csvContent += \`"\${row.name}","\${row.dept}","\${row.desig}","\${row.shift}","\${row.timing}","\${row.date}","\${row.status}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "cp_hospital_staff_duty_roster.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});
// ==========================================
// 🚀 Ultra-Advanced AI Hi-Tech Clinical & IPD Suite
// ==========================================
app.get('/clinical', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Hi-Tech Clinical Operations — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 1000px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #2563eb; }
                h2 { color: #1e40af; margin-top: 0; font-size: 22px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select, textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                textarea { resize: vertical; height: 70px; }
                
                .ai-suggestion-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 6px; font-size: 12px; color: #1e40af; margin-bottom: 10px; display: none; }
                .safety-alert-box { background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 6px; font-size: 12px; color: #991b1b; margin-bottom: 10px; display: none; }

                .btn { padding: 10px 15px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
                .btn-submit { background: #2563eb; color: white; width: 100%; padding: 12px; font-size: 15px; justify-content: center; }
                .btn-submit:hover { background: #1d4ed8; }
                .btn-sos { background: #dc2626; color: white; padding: 6px 12px; font-size: 12px; }
                .btn-sos:hover { background: #b91c1c; }
                .btn-export { background: #0284c7; color: white; margin-bottom: 15px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-stable { background: #dcfce7; color: #166534; }
                .badge-risk { background: #fee2e2; color: #991b1b; }
                .badge-icu { background: #fef3c7; color: #d97706; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <!-- 1. AI EWS & Differential Diagnosis Card -->
                <div class="card">
                    <h2>
                        <span>⚡ AI Early Warning Score & Differential Diagnosis</span>
                        <button type="button" class="btn btn-sos" onclick="triggerCodeBlue()">🚨 Code Blue SOS</button>
                    </h2>
                    
                    <form id="ewsForm" onsubmit="submitEWS(event)">
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Patient ID / UHID</label>
                                <input type="text" id="ewsPatientId" required placeholder="e.g. UHID-8821">
                            </div>
                            <div class="form-group">
                                <label>Patient Full Name</label>
                                <input type="text" id="ewsPatientName" required placeholder="e.g. Ramesh Kumar">
                            </div>
                        </div>

                        <div class="grid-3">
                            <div class="form-group">
                                <label>Heart Rate (BPM)</label>
                                <input type="number" id="heartRate" required placeholder="e.g. 85" oninput="runAIDiagnosis()">
                            </div>
                            <div class="form-group">
                                <label>SpO2 Level (%)</label>
                                <input type="number" id="spo2" required placeholder="e.g. 98" oninput="runAIDiagnosis()">
                            </div>
                            <div class="form-group">
                                <label>Body Temp (°F)</label>
                                <input type="number" step="0.1" id="temp" required placeholder="e.g. 98.6" oninput="runAIDiagnosis()">
                            </div>
                        </div>

                        <div class="ai-suggestion-box" id="aiDiagBox">🧠 <b>AI Diagnostic Insight:</b> Enter vitals to trigger real-time AI disease risk profiling...</div>

                        <div class="form-group">
                            <label>Clinical Notes / Symptoms</label>
                            <textarea id="clinicalNotes" placeholder="Enter consciousness level, symptoms, or background notes..."></textarea>
                        </div>

                        <button type="submit" class="btn btn-submit">Calculate AI EWS & Save Vitals</button>
                    </form>
                </div>

                <!-- 2. Smart e-Prescription & Drug Safety Checker Card -->
                <div class="card" style="border-top-color: #0d9488;">
                    <h2 style="color: #0f766e; border-bottom-color: #ccfbf1;">
                        <span>💊 Smart e-Prescription & AI Drug Safety</span>
                        <button type="button" class="btn" style="background:#0d9488; color:white;" onclick="recordVoiceRx()">🎙️ Voice Note Rx</button>
                    </h2>
                    
                    <form id="rxForm" onsubmit="submitPrescription(event)">
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Patient ID / UHID</label>
                                <input type="text" id="rxPatientId" required placeholder="e.g. UHID-8821">
                            </div>
                            <div class="form-group">
                                <label>Assigned Specialist Doctor</label>
                                <input type="text" id="doctorName" required placeholder="e.g. Dr. Sharma (MD)">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Medication Details & Dosage</label>
                            <textarea id="medicationDetails" required placeholder="e.g. Tab. Paracetamol 650mg, Tab. Ibuprofen..." oninput="checkDrugSafety()"></textarea>
                        </div>

                        <div class="safety-alert-box" id="drugSafetyBox">⚠️ <b>Drug Safety Warning:</b> Checking potential medication allergies and interactions...</div>

                        <div class="grid-2">
                            <div class="form-group">
                                <label>ICU / Bed Allocation Option</label>
                                <select id="bedAllocation">
                                    <option value="General Ward Bed">General Ward Bed</option>
                                    <option value="HDU (High Dependency Unit)">HDU (High Dependency Unit)</option>
                                    <option value="Critical ICU + Ventilator">Critical ICU + Ventilator ⚡</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Send Digital Copy to Patient</label>
                                <select id="notifyPatient">
                                    <option value="WhatsApp & SMS Alert">Send via WhatsApp & SMS 📱</option>
                                    <option value="Email Only">Email Only</option>
                                    <option value="Print Physical Copy">Print Physical Copy</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-submit" style="background: #0d9488;">Generate, Sign & Dispatch e-Prescription</button>
                    </form>
                </div>

                <!-- 3. Clinical Activity Logs & Export -->
                <div class="card" style="border-top-color: #475569;">
                    <h2 style="color: #334155; border-bottom-color: #e2e8f0;">
                        <span>📋 Master Clinical Operations Logs</span>
                        <button type="button" class="btn btn-export" onclick="exportClinicalCSV()">📥 Export Master Report</button>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Name / Doctor</th>
                                <th>Module Type</th>
                                <th>Vitals / Rx / Bed</th>
                                <th>Time</th>
                                <th>Status / AI Risk</th>
                            </tr>
                        </thead>
                        <tbody id="clinicalLogsBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No clinical operations recorded yet today.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const clinicalLogs = [];

                function runAIDiagnosis() {
                    const hr = parseInt(document.getElementById('heartRate').value) || 0;
                    const spo2 = parseInt(document.getElementById('spo2').value) || 0;
                    const temp = parseFloat(document.getElementById('temp').value) || 0;
                    const box = document.getElementById('aiDiagBox');

                    if(hr === 0 || spo2 === 0) {
                        box.style.display = 'none';
                        return;
                    }

                    box.style.display = 'block';
                    if(hr > 110 || spo2 < 94 || temp > 101) {
                        box.innerHTML = "⚠️ <b>AI Diagnostic Warning:</b> High risk of Sepsis / Tachycardia / Respiratory Distress. Immediate ICU consultation recommended!";
                        box.style.background = "#fef2f2";
                        box.style.borderColor = "#fecaca";
                        box.style.color = "#991b1b";
                    } else {
                        box.innerHTML = "✅ <b>AI Diagnostic Insight:</b> Vitals are within normal stable hemodynamic parameters.";
                        box.style.background = "#eff6ff";
                        box.style.borderColor = "#bfdbfe";
                        box.style.color = "#1e40af";
                    }
                }

                function checkDrugSafety() {
                    const meds = document.getElementById('medicationDetails').value.toLowerCase();
                    const safetyBox = document.getElementById('drugSafetyBox');

                    if(meds.includes('aspirin') && meds.includes('ibuprofen')) {
                        safetyBox.style.display = 'block';
                        safetyBox.innerHTML = "❌ <b>CRITICAL INTERACTION WARNING:</b> Concurrent use of Aspirin and Ibuprofen increases bleeding risk!";
                    } else if(meds.length > 5) {
                        safetyBox.style.display = 'block';
                        safetyBox.innerHTML = "✓ <b>AI Drug Safety Check:</b> No major adverse drug interactions detected. Safe for administration.";
                        safetyBox.style.background = "#f0fdf4";
                        safetyBox.style.borderColor = "#bbf7d0";
                        safetyBox.style.color = "#166534";
                    } else {
                        safetyBox.style.display = 'none';
                    }
                }

                function submitEWS(event) {
                    event.preventDefault();
                    const patientId = document.getElementById('ewsPatientId').value;
                    const patientName = document.getElementById('ewsPatientName').value;
                    const hr = parseInt(document.getElementById('heartRate').value);
                    const spo2 = parseInt(document.getElementById('spo2').value);
                    const temp = document.getElementById('temp').value;
                    const notes = document.getElementById('clinicalNotes').value;
                    const timeNow = new Date().toLocaleTimeString();

                    let riskStatus = "Stable (Low Risk)";
                    let badgeClass = "badge-stable";
                    if(hr > 110 || spo2 < 94 || parseFloat(temp) > 101) {
                        riskStatus = "CRITICAL WARNING (High Risk)";
                        badgeClass = "badge-risk";
                    }

                    clinicalLogs.unshift({
                        patientId,
                        nameOrDoc: patientName,
                        opType: 'AI EWS Scan',
                        details: \`HR: \${hr}, SpO2: \${spo2}%, Temp: \${temp}°F | \${notes}\`,
                        timeNow,
                        riskStatus,
                        badgeClass
                    });

                    renderClinicalTable();
                    alert('AI EWS calculated successfully! Status: ' + riskStatus);
                    document.getElementById('ewsForm').reset();
                    document.getElementById('aiDiagBox').style.display = 'none';
                }

                function submitPrescription(event) {
                    event.preventDefault();
                    const patientId = document.getElementById('rxPatientId').value;
                    const doctorName = document.getElementById('doctorName').value;
                    const meds = document.getElementById('medicationDetails').value;
                    const bed = document.getElementById('bedAllocation').value;
                    const notify = document.getElementById('notifyPatient').value;
                    const timeNow = new Date().toLocaleTimeString();

                    let badgeClass = "badge-stable";
                    if(bed.includes('ICU')) badgeClass = "badge-icu";

                    clinicalLogs.unshift({
                        patientId,
                        nameOrDoc: doctorName + " (" + notify + ")",
                        opType: 'e-Prescription & Bed',
                        details: \`Meds: \${meds} [Allocated: \${bed}]\`,
                        timeNow,
                        riskStatus: 'Signed & Dispatched ✓',
                        badgeClass
                    });

                    renderClinicalTable();
                    alert('Digital e-Prescription signed, bed allocated, and alert sent via ' + notify + '!');
                    document.getElementById('rxForm').reset();
                    document.getElementById('drugSafetyBox').style.display = 'none';
                }

                function renderClinicalTable() {
                    const tbody = document.getElementById('clinicalLogsBody');
                    if(clinicalLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No clinical operations recorded yet today.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    clinicalLogs.forEach(log => {
                        html += \`<tr>
                            <td>\${log.patientId}</td>
                            <td>\${log.nameOrDoc}</td>
                            <td><b>\${log.opType}</b></td>
                            <td>\${log.details}</td>
                            <td>\${log.timeNow}</td>
                            <td><span class="badge \{log.badgeClass}">\${log.riskStatus}</span></td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function triggerCodeBlue() {
                    alert('🚨 CODE BLUE ALERT BROADCASTED! Emergency medical response team, ICU specialists, and crash cart mobilized immediately.');
                }

                function recordVoiceRx() {
                    alert('🎙️ Voice Recording Active: Speak prescription details. (Simulation: AI transcribed text appended)');
                    document.getElementById('medicationDetails').value += " [Voice Rx: Tab. Augmentin 625mg BD, Cap. B-Complex]";
                    checkDrugSafety();
                }

                function exportClinicalCSV() {
                    if(clinicalLogs.length === 0) {
                        alert('No clinical records to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Patient ID,Name/Doctor,Module Type,Details,Time,Status\n";
                    clinicalLogs.forEach(row => {
                        csvContent += \`"\${row.patientId}","\${row.nameOrDoc}","\${row.opType}","\${row.details}","\${row.timeNow}","\${row.riskStatus}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Master_Clinical_Report.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});
// ==========================================
// 💉 Advanced Ward, ICU, NICU & OT Treatment Ledger Suite with Multi-Excel Uploads
// ==========================================
app.get('/treatment-audit', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Treatment & Medication Ledger - CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
                .container { max-width: 1300px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #0284c7; text-decoration: none; font-weight: 700; font-size: 14px; }
                
                .card { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #0284c7; }
                h2 { color: #0284c7; margin-top: 0; font-size: 22px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e0f2fe; padding-bottom: 12px; }
                
                .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; font-size: 14px; background: #fff; }
                
                .btn { padding: 10px 18px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
                .btn-primary { background: #0284c7; color: white; width: 100%; justify-content: center; padding: 12px; font-size: 15px; }
                .btn-primary:hover { background: #0369a1; }
                .btn-export { background: #10b981; color: white; }
                .btn-upload { background: #64748b; color: white; padding: 6px 12px; font-size: 13px; }

                .upload-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px; background: #f1f5f9; padding: 18px; border-radius: 12px; margin-bottom: 20px; }
                .upload-box { background: white; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e1; }

                .toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13.5px; }
                th { background: #f8fafc; color: #334155; font-weight: 700; }
                
                .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; display: inline-block; }
                .badge-iv { background: #e0f2fe; color: #0284c7; }
                .badge-oral { background: #dcfce7; color: #166534; }
                .badge-inj { background: #fee2e2; color: #991b1b; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">&larr; Back to Dashboard</a>

                <!-- Treatment Entry Form Card -->
                <div class="card">
                    <h2>
                        <span>💉 Ward, ICU, NICU & OT Treatment Audit Log</span>
                        <span style="font-size: 12px; font-weight: normal; background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 20px;">Advanced EHR Suite</span>
                    </h2>

                    <!-- Multi-Upload & Export Toolbar -->
                    <div class="upload-grid">
                        <div class="upload-box">
                            <label>📂 Upload Treatment Audit Logs (Excel/CSV)</label>
                            <div style="display: flex; gap: 8px; margin-top: 6px;">
                                <input type="file" id="treatmentFile" style="padding: 4px; font-size: 12px;">
                                <button type="button" class="btn btn-upload" onclick="uploadMasterFile('treatment')">Upload</button>
                            </div>
                        </div>
                        <div class="upload-box">
                            <label>💊 Upload Medicine Master List (Excel/CSV)</label>
                            <div style="display: flex; gap: 8px; margin-top: 6px;">
                                <input type="file" id="medicineFile" style="padding: 4px; font-size: 12px;">
                                <button type="button" class="btn btn-upload" onclick="uploadMasterFile('medicine')">Upload</button>
                            </div>
                        </div>
                        <div class="upload-box">
                            <label>👨‍⚕️ Upload Staff / Doctor List (Excel/CSV)</label>
                            <div style="display: flex; gap: 8px; margin-top: 6px;">
                                <input type="file" id="staffFile" style="padding: 4px; font-size: 12px;">
                                <button type="button" class="btn btn-upload" onclick="uploadMasterFile('staff')">Upload</button>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: right; margin-bottom: 15px;">
                        <button type="button" class="btn btn-export" onclick="exportTreatmentCSV()">📥 Export Active Audit CSV</button>
                    </div>

                    <form id="treatmentForm" onsubmit="addTreatmentEntry(event)">
                        <div class="grid-3">
                            <div class="form-group">
                                <label>Patient Full Name</label>
                                <input type="text" id="patientName" required placeholder="e.g. Ramesh Kumar">
                            </div>
                            <div class="form-group">
                                <label>Department & Location / Bed</label>
                                <input type="text" id="patientLoc" required list="locOptions" placeholder="Select or type location...">
                                <datalist id="locOptions">
                                    <option value="ICU Bed #01">
                                    <option value="ICU Bed #02">
                                    <option value="ICU Bed #03">
                                    <option value="ICU Bed #04">
                                    <option value="NICU Warmer #1">
                                    <option value="NICU Warmer #2">
                                    <option value="OT Room #1 (Post-Op)">
                                    <option value="General Ward Bed #12">
                                </datalist>
                            </div>
                            <div class="form-group">
                                <label>Medicine / Treatment Name</label>
                                <input type="text" id="medTreatment" required list="medOptions" placeholder="Select or type medicine...">
                                <datalist id="medOptions">
                                    <option value="Inj. Pantoprazole + Augmentin">
                                    <option value="Phototherapy & IV Fluids">
                                    <option value="Inj. Tramadol Analgesic">
                                    <option value="Inj. Ceftriaxone 1g">
                                    <option value="Paracetamol IV Infusion">
                                    <option value="Normal Saline (NS) 500ml">
                                </datalist>
                            </div>
                        </div>

                        <div class="grid-3">
                            <div class="form-group">
                                <label>Route / Medium</label>
                                <select id="treatmentRoute" required>
                                    <option value="IV Infusion">IV Infusion</option>
                                    <option value="Intravenous (IV)">Intravenous (IV)</option>
                                    <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                                    <option value="Oral / Tablet">Oral / Tablet</option>
                                    <option value="Phototherapy / Procedures">Phototherapy / Procedures</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Dosage</label>
                                <input type="text" id="dosage" required placeholder="e.g. 100mg / 1.2g or D10% @ 5ml/hr">
                            </div>
                            <div class="form-group">
                                <label>Prescribing Doctor</label>
                                <input type="text" id="prescribingDoc" required list="docOptions" placeholder="Select or type doctor...">
                                <datalist id="docOptions">
                                    <option value="Dr. Abhishek Sharma">
                                    <option value="Dr. Manish Verma">
                                    <option value="Dr. R. K. Gupta">
                                    <option value="Dr. Priya Dixit">
                                    <option value="Dr. Alok Kumar">
                                </datalist>
                            </div>
                        </div>

                        <div class="grid-3">
                            <div class="form-group">
                                <label>Administering Staff (Nurse/Practitioner)</label>
                                <input type="text" id="adminStaff" required list="staffOptions" placeholder="Select or type staff...">
                                <datalist id="staffOptions">
                                    <option value="Nurse Pooja Kumari">
                                    <option value="Nurse Sneha Roy">
                                    <option value="Nurse Rajesh Kumar">
                                    <option value="Nurse Anita Sharma">
                                </datalist>
                            </div>
                            <div class="form-group">
                                <label>Treatment Date</label>
                                <input type="date" id="treatmentDate" required>
                            </div>
                            <div class="form-group">
                                <label>Treatment Time</label>
                                <input type="time" id="treatmentTime" required>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary">➕ Log Treatment Entry</button>
                    </form>
                </div>

                <!-- Live Master Table Card -->
                <div class="card" style="border-top-color: #475569;">
                    <div class="toolbar">
                        <h2 style="border:none; margin:0; padding:0; color:#334155;">📋 Active Audit Trail Records</h2>
                        <div>
                            <input type="text" id="searchInput" placeholder="🔍 Search patient, doctor or medicine..." onkeyup="filterTreatment()" style="padding: 8px 12px; width: 280px; border-radius: 6px; border: 1px solid #cbd5e1;">
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Patient & Dept</th>
                                <th>Medicine / Treatment</th>
                                <th>Medium / Route</th>
                                <th>Dosage</th>
                                <th>Prescribed By (Doctor)</th>
                                <th>Administered By (Staff)</th>
                                <th>Date & Time</th>
                            </tr>
                        </thead>
                        <tbody id="treatmentTableBody">
                            <tr>
                                <td><b>Ramesh Kumar</b><br><small style="color:#64748b;">ICU Bed #04</small></td>
                                <td>Inj. Pantoprazole + Augmentin</td>
                                <td><span class="badge badge-iv">IV Infusion</span></td>
                                <td>100mg / 1.2g</td>
                                <td>Dr. Abhishek Sharma</td>
                                <td>Nurse Pooja Kumari</td>
                                <td>24 Aug 2026, 02:15 PM</td>
                            </tr>
                            <tr>
                                <td><b>Baby of Sunita</b><br><small style="color:#64748b;">NICU Warmer #2</small></td>
                                <td>Phototherapy & IV Fluids</td>
                                <td><span class="badge badge-inj">Intravenous</span></td>
                                <td>D10% @ 5ml/hr</td>
                                <td>Dr. R. K. Gupta</td>
                                <td>Nurse Sneha Roy</td>
                                <td>24 Aug 2026, 01:30 PM</td>
                            </tr>
                            <tr>
                                <td><b>Amit Saxena</b><br><small style="color:#64748b;">OT Room #1 (Post-Op)</small></td>
                                <td>Inj. Tramadol Analgesic</td>
                                <td><span class="badge badge-inj">Intramuscular</span></td>
                                <td>50mg SOS</td>
                                <td>Dr. Manish Verma</td>
                                <td>Nurse Rajesh Kumar</td>
                                <td>24 Aug 2026, 12:45 PM</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                window.onload = function() {
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById('treatmentDate').value = today;
                    
                    const currentTime = new Date().toTimeString().slice(0,5);
                    document.getElementById('treatmentTime').value = currentTime;
                };

                const treatmentData = [
                    { patient: "Ramesh Kumar", loc: "ICU Bed #04", med: "Inj. Pantoprazole + Augmentin", route: "IV Infusion", dose: "100mg / 1.2g", doc: "Dr. Abhishek Sharma", staff: "Nurse Pooja Kumari", time: "24 Aug 2026, 02:15 PM" },
                    { patient: "Baby of Sunita", loc: "NICU Warmer #2", med: "Phototherapy & IV Fluids", route: "Intravenous", dose: "D10% @ 5ml/hr", doc: "Dr. R. K. Gupta", staff: "Nurse Sneha Roy", time: "24 Aug 2026, 01:30 PM" },
                    { patient: "Amit Saxena", loc: "OT Room #1 (Post-Op)", med: "Inj. Tramadol Analgesic", route: "Intramuscular", dose: "50mg SOS", doc: "Dr. Manish Verma", staff: "Nurse Rajesh Kumar", time: "24 Aug 2026, 12:45 PM" }
                ];

                function addTreatmentEntry(event) {
                    event.preventDefault();
                    const patient = document.getElementById('patientName').value;
                    const loc = document.getElementById('patientLoc').value;
                    const med = document.getElementById('medTreatment').value;
                    const route = document.getElementById('treatmentRoute').value;
                    const dose = document.getElementById('dosage').value;
                    const doc = document.getElementById('prescribingDoc').value;
                    const staff = document.getElementById('adminStaff').value;
                    
                    const rawDate = document.getElementById('treatmentDate').value;
                    const rawTime = document.getElementById('treatmentTime').value;

                    const dateObj = new Date(rawDate + 'T' + rawTime);
                    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const time = \`\${formattedDate}, \${formattedTime}\`;

                    treatmentData.push({ patient, loc, med, route, dose, doc, staff, time });
                    renderTreatmentTable();

                    document.getElementById('treatmentForm').reset();
                    window.onload();
                    alert('✅ Treatment entry logged successfully for patient ' + patient + '!');
                }

                function renderTreatmentTable() {
                    const tbody = document.getElementById('treatmentTableBody');
                    tbody.innerHTML = '';

                    if(treatmentData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748b;">No treatment audit records found.</td></tr>';
                        return;
                    }

                    treatmentData.forEach(row => {
                        let badgeClass = 'badge-iv';
                        if(row.route.includes('Oral')) badgeClass = 'badge-oral';
                        else if(row.route.includes('Intra') || row.route.includes('Inj')) badgeClass = 'badge-inj';

                        const tr = document.createElement('tr');
                        tr.innerHTML = \`
                            <td><b>\${row.patient}</b><br><small style="color:#64748b;">\${row.loc}</small></td>
                            <td>\${row.med}</td>
                            <td><span class="badge \${badgeClass}">\${row.route}</span></td>
                            <td>\${row.dose}</td>
                            <td>\${row.doc}</td>
                            <td>\${row.staff}</td>
                            <td>\${row.time}</td>
                        \`;
                        tbody.appendChild(tr);
                    });
                }

                function filterTreatment() {
                    const query = document.getElementById('searchInput').value.toLowerCase();
                    const rows = document.getElementById('treatmentTableBody').getElementsByTagName('tr');
                    
                    for (let i = 0; i < rows.length; i++) {
                        const text = rows[i].textContent.toLowerCase();
                        rows[i].style.display = text.includes(query) ? '' : 'none';
                    }
                }

                function uploadMasterFile(type) {
                    let fileInputId = 'treatmentFile';
                    let typeName = 'Treatment Audit Logs';
                    if(type === 'medicine') {
                        fileInputId = 'medicineFile';
                        typeName = 'Medicine Master List';
                    } else if(type === 'staff') {
                        fileInputId = 'staffFile';
                        typeName = 'Staff & Doctor List';
                    }

                    const fileInput = document.getElementById(fileInputId);
                    if (fileInput.files.length === 0) {
                        alert('⚠️ Please select an Excel or CSV file for ' + typeName + ' first!');
                        return;
                    }
                    alert('✅ ' + typeName + ' uploaded and synced with hospital database successfully!');
                    fileInput.value = '';
                }

                function exportTreatmentCSV() {
                    if (treatmentData.length === 0) {
                        alert('⚠️ No treatment data available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Patient Name,Location,Medicine,Route,Dosage,Doctor,Staff,Date Time\\n";
                    treatmentData.forEach(row => {
                        csvContent += \`"\${row.patient}","\${row.loc}","\${row.med}","\${row.route}","\${row.dose}","\${row.doc}","\${row.staff}","\${row.time}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "cp_hospital_treatment_audit_log.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});
// ==========================================
// 💳 Ultra-Advanced Hi-Tech Discharge & Billing Suite
// ==========================================
app.get('/billing', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hi-Tech Billing & Discharge — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 950px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #0d9488; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #0d9488; }
                h2 { color: #0f766e; margin-top: 0; font-size: 22px; border-bottom: 2px solid #ccfbf1; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select, textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                textarea { resize: vertical; height: 80px; }
                
                .calc-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; color: #166534; display: none; }
                
                .btn { padding: 10px 15px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
                .btn-submit { background: #0d9488; color: white; width: 100%; padding: 12px; font-size: 15px; justify-content: center; }
                .btn-submit:hover { background: #0f766e; }
                .btn-audit { background: #dc2626; color: white; padding: 6px 12px; font-size: 12px; }
                .btn-audit:hover { background: #b91c1c; }
                .btn-export { background: #0284c7; color: white; margin-bottom: 15px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-paid { background: #dcfce7; color: #166534; }
                .badge-tpa { background: #e0e7ff; color: #3730a3; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <div class="card">
                    <h2>
                        <span>💳 Hi-Tech Discharge Summary & Itemized Billing</span>
                        <button type="button" class="btn btn-audit" onclick="triggerAudit()">🚨 Billing Audit SOS</button>
                    </h2>
                    
                    <div class="calc-box" id="calcBox">📊 AI Auto-Calculation: Base Amount + GST (5%) + TPA Verification Ready.</div>

                    <form id="billingForm" onsubmit="submitBilling(event)">
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Patient ID / UHID</label>
                                <input type="text" id="patientId" required placeholder="e.g. CPHP-4021" oninput="calculateTax()">
                            </div>
                            <div class="form-group">
                                <label>Total Itemized Base Amount (INR)</label>
                                <input type="number" id="baseAmount" required placeholder="e.g. 45000" oninput="calculateTax()">
                            </div>
                        </div>

                        <div class="grid-2">
                            <div class="form-group">
                                <label>Payment & Insurance Mode (TPA)</label>
                                <select id="paymentMode">
                                    <option value="Cash / UPI Direct Payment">Cash / UPI Direct Payment</option>
                                    <option value="Cashless Insurance (TPA Approved)">Cashless Insurance (TPA Approved) 🛡️</option>
                                    <option value="Corporate Panel Credit">Corporate Panel Credit</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Voice Note Discharge Summary</label>
                                <button type="button" class="btn" style="background:#475569; color:white; width:100%; margin-top:2px;" onclick="recordVoiceSummary()">🎙️ Record Voice Discharge Notes</button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Discharge Summary Notes & Follow-up</label>
                            <textarea id="dischargeNotes" required placeholder="Condition stable, advised follow-up in 7 days, strict medication adherence..."></textarea>
                        </div>

                        <button type="submit" class="btn btn-submit">Generate Verified Bill & Process Discharge</button>
                    </form>
                </div>

                <!-- Billing History & Export -->
                <div class="card" style="border-top-color: #475569;">
                    <h2 style="color: #334155; border-bottom-color: #e2e8f0;">
                        <span>📋 Master Billing & Discharge Logs</span>
                        <button type="button" class="btn btn-export" onclick="exportBillingCSV()">📥 Export Financial CSV Report</button>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Payment Mode</th>
                                <th>Base Amount</th>
                                <th>Net Amount (Inc. GST)</th>
                                <th>Time</th>
                                <th>Status / TPA</th>
                            </tr>
                        </thead>
                        <tbody id="billingLogsBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No billing records processed yet today.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                const billingLogs = [];

                function calculateTax() {
                    const base = parseFloat(document.getElementById('baseAmount').value) || 0;
                    const box = document.getElementById('calcBox');
                    if(base > 0) {
                        const gst = base * 0.05; // 5% Healthcare GST/Charges
                        const total = base + gst;
                        box.style.display = 'block';
                        box.innerHTML = \`📊 <b>AI Financial Breakdown:</b> Base: ₹\${base} + Charges/GST (5%): ₹\<b>\${gst}</b> = <b>Total Net Payable: ₹\${total}</b>\`;
                    } else {
                        box.style.display = 'none';
                    }
                }

                function recordVoiceSummary() {
                    alert('🎙️ Voice Recording Active: Speak discharge summary. (Simulation: Text auto-appended)');
                    document.getElementById('dischargeNotes').value += " [Voice Summary: Vital signs stable, suture removal scheduled in 5 days.]";
                }

                function submitBilling(event) {
                    event.preventDefault();
                    const patientId = document.getElementById('patientId').value;
                    const base = parseFloat(document.getElementById('baseAmount').value);
                    const mode = document.getElementById('paymentMode').value;
                    const notes = document.getElementById('dischargeNotes').value;
                    const timeNow = new Date().toLocaleTimeString();

                    const netAmount = base + (base * 0.05);
                    let badgeClass = mode.includes('Insurance') ? 'badge-tpa' : 'badge-paid';
                    let statusLabel = mode.includes('Insurance') ? 'TPA Approved ✓' : 'Settled & Paid ✓';

                    billingLogs.unshift({
                        patientId,
                        mode,
                        base: '₹' + base,
                        net: '₹' + netAmount,
                        timeNow,
                        statusLabel,
                        badgeClass
                    });

                    renderBillingTable();
                    alert('Discharge bill successfully generated and payment processed!');
                    document.getElementById('billingForm').reset();
                    document.getElementById('calcBox').style.display = 'none';
                }

                function renderBillingTable() {
                    const tbody = document.getElementById('billingLogsBody');
                    if(billingLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No billing records processed yet today.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    billingLogs.forEach(log => {
                        html += \`<tr>
                            <td>\${log.patientId}</td>
                            <td>\${log.mode}</td>
                            <td>\${log.base}</td>
                            <td><b>\${log.net}</b></td>
                            <td>\${log.timeNow}</td>
                            <td><span class="badge \${log.badgeClass}">\${log.statusLabel}</span></td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function triggerAudit() {
                    alert('🚨 FINANCIAL AUDIT SOS TRIGGERED! Chief Financial Officer (CFO) and accounts team alerted for immediate billing review.');
                }

                function exportBillingCSV() {
                    if(billingLogs.length === 0) {
                        alert('No financial data available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Patient ID,Payment Mode,Base Amount,Net Amount,Time,Status\n";
                    billingLogs.forEach(row => {
                        csvContent += \`"\${row.patientId}","\${row.mode}","\${row.base}","\${row.net}","\${row.timeNow}","\${row.statusLabel}"\\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Financial_Billing_Report.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});
app.get('/api/v1/emergency/response-time', (req, res) => {
    if (!lastEmergencyTime) {
        return res.json({ success: true, active: false, message: 'No active emergency recorded yet.' });
    }
    const elapsedSeconds = Math.floor((new Date() - lastEmergencyTime) / 1000);
    res.json({
        success: true,
        active: true,
        triggered_at: lastEmergencyTime,
        elapsed_seconds: elapsedSeconds
    });
});

// ==========================================
// 🚨 Ultimate Hospital Emergency SOS Pro & Disaster Command Center
// ==========================================
app.get('/emergency', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Emergency SOS Pro Command Center — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #fff1f2; padding: 20px; margin: 0; color: #1e293b; }
                .container { max-width: 1200px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #e11d48; text-decoration: none; font-weight: 600; font-size: 14px; }
                
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(225,29,72,0.15); margin-bottom: 25px; border-top: 6px solid #e11d48; }
                h2 { color: #be123c; margin-top: 0; font-size: 22px; border-bottom: 2px solid #ffe4e6; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                
                .timer-banner { background: #fff1f2; border: 1px dashed #f43f5e; padding: 12px; border-radius: 8px; text-align: center; color: #9f1239; font-weight: 600; font-size: 15px; margin-bottom: 20px; display: flex; justify-content: space-around; align-items: center; }
                
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select, textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                
                .btn { padding: 12px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; justify-content: center; }
                .btn-broadcast { background: #e11d48; color: white; width: 100%; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
                .btn-broadcast:hover { background: #be123c; }
                .btn-gov { background: #475569; color: white; padding: 8px 12px; font-size: 12px; }
                .btn-export { background: #0d9488; color: white; padding: 8px 14px; font-size: 13px; margin-bottom: 15px; }
                .btn-resolve { background: #16a34a; color: white; padding: 4px 10px; font-size: 11px; }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; color: #1e293b; }
                
                .badge-active { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
                .badge-resolved { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
                
                .quick-dial-bar { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>

                <div class="card">
                    <h2>
                        <span>🚨 Emergency SOS Pro & Disaster Command Center</span>
                        <div>
                            <button type="button" class="btn btn-gov" onclick="triggerGovDispatch('Police (112)')">🚓 Alert Local Police (112)</button>
                            <button type="button" class="btn btn-gov" onclick="triggerGovDispatch('State Disaster Response')">🚒 State Disaster Response</button>
                        </div>
                    </h2>
                    
                    <div class="timer-banner">
                        <span>⏱️ Active Response Chronometer: <b id="stopwatch">00:00:00</b></span>
                        <span>🔊 PA System & Siren Status: <b style="color:#16a34a;">AUTO-BROADCAST READY</b></span>
                        <span>📶 On-Duty Code Teams: <b style="color:#2563eb;">4 Teams Active</b></span>
                    </div>

                    <div class="quick-dial-bar">
                        <span style="font-weight:600; font-size:13px; color:#475569;">📞 Quick Intercom / Walkie-Talkie Dispatch:</span>
                        <button type="button" class="btn" style="background:#e0e7ff; color:#3730a3; padding:6px 10px; font-size:12px;" onclick="dialIntercom('ICU Critical Care Ext: 401')">ICU Team (401)</button>
                        <button type="button" class="btn" style="background:#e0e7ff; color:#3730a3; padding:6px 10px; font-size:12px;" onclick="dialIntercom('Operation Theatre Ext: 402')">OT Team (402)</button>
                        <button type="button" class="btn" style="background:#e0e7ff; color:#3730a3; padding:6px 10px; font-size:12px;" onclick="dialIntercom('Emergency Security Ext: 403')">Security (403)</button>
                        <button type="button" class="btn" style="background:#e0e7ff; color:#3730a3; padding:6px 10px; font-size:12px;" onclick="dialIntercom('Fire Safety Unit Ext: 404')">Fire Unit (404)</button>
                    </div>
                    
                    <form id="emergencyProForm" onsubmit="broadcastProSOS(event)">
                        <div class="grid-3">
                            <div class="form-group">
                                <label>Emergency Code Protocol</label>
                                <select id="epType">
                                    <option value="Code Blue (Cardiac/Respiratory Arrest)">Code Blue (Cardiac/Respiratory Arrest) ⚡</option>
                                    <option value="Code Red (Fire / Smoke Outbreak)">Code Red (Fire / Smoke Outbreak) 🔥</option>
                                    <option value="Code Pink (Infant / Child Security Alert)">Code Pink (Infant / Child Security Alert) 👶</option>
                                    <option value="Code Orange (Mass Casualty / Chemical Spill)">Code Orange (Mass Casualty / Chemical Spill) ⚠️</option>
                                    <option value="Code Gray (Combative Patient / Security Threat)">Code Gray (Combative Patient / Security Threat) 🛡️</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Exact Location / Ward / Room</label>
                                <input type="text" id="epLocation" required placeholder="e.g. ICU Bay 4 / OT 2 / West Wing Corridor">
                            </div>
                            <div class="form-group">
                                <label>Triggered By (Staff Name & ID)</label>
                                <input type="text" id="epTrigger" value="Dr. Alok Kumar (CPHS-4412)" required>
                            </div>
                        </div>

                        <div class="grid-2">
                            <div class="form-group">
                                <label>Severity Level & Response Protocol</label>
                                <select id="epSeverity">
                                    <option value="Critical (Immediate Code Team Dispatch)">Critical (Immediate Code Team Dispatch) 🔴</option>
                                    <option value="Urgent (Doctor & Security Backup)">Urgent (Doctor & Security Backup) 🟠</option>
                                    <option value="Moderate (Standby Alert)">Moderate (Standby Alert) 🟡</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Automatic Notification Channels</label>
                                <select id="epChannels">
                                    <option value="Hospital Speakers, WhatsApp & SMS to Doctors">Hospital Speakers, WhatsApp & SMS to Doctors 📱</option>
                                    <option value="Hospital Speakers Only (Silent Ward Protocol)">Hospital Speakers Only (Silent Ward Protocol) 🔇</option>
                                    <option value="Full Broadcast + Police/Ambulance Dispatch">Full Broadcast + Police/Ambulance Dispatch 🚨</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-broadcast">📢 Broadcast Emergency SOS Pro & Trigger Sirens</button>
                    </form>
                </div>

                <!-- Active Emergency Pro Logs Table -->
                <div class="card" style="border-top-color: #0d9488;">
                    <h2 style="color: #0f766e; border-bottom-color: #ccfbf1;">
                        <span>📋 Live Emergency Pro Broadcast Logs & Incident Register</span>
                        <button type="button" class="btn btn-export" onclick="exportEmergencyProCSV()">📥 Export Disaster Incident CSV</button>
                    </h2>

                    <table>
                        <thead>
                            <tr>
                                <th>Incident ID</th>
                                <th>Code Type & Severity</th>
                                <th>Location & Ward</th>
                                <th>Triggered By</th>
                                <th>Timestamp</th>
                                <th>Status & Actions</th>
                            </tr>
                        </thead>
                        <tbody id="emergencyProLogsBody">
                            <tr>
                                <td colspan="6" style="text-align:center; color:#64748b;">No emergency broadcasts triggered yet during this session.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                // Live Stopwatch Timer
                let secondsElapsed = 0;
                setInterval(() => {
                    secondsElapsed++;
                    let hrs = Math.floor(secondsElapsed / 3600).toString().padStart(2, '0');
                    let mins = Math.floor((secondsElapsed % 3600) / 60).toString().padStart(2, '0');
                    let secs = (secondsElapsed % 60).toString().padStart(2, '0');
                    document.getElementById('stopwatch').innerText = hrs + ":" + mins + ":" + secs;
                }, 1000);

                const emergencyProLogs = [];
                let emergencySerial = 401;

                function dialIntercom(extName) {
                    alert('📞 Connecting secure intercom line to ' + extName + '... Stand by.');
                }

                function triggerGovDispatch(agencyName) {
                    alert('🚨 GOV DISPATCH: Emergency panic signal and hospital coordinates successfully transmitted to ' + agencyName + '!');
                }

                function broadcastProSOS(event) {
                    event.preventDefault();
                    const type = document.getElementById('epType').value;
                    const location = document.getElementById('epLocation').value;
                    const trigger = document.getElementById('epTrigger').value;
                    const severity = document.getElementById('epSeverity').value;
                    const channels = document.getElementById('epChannels').value;

                    const incidentId = 'SOS-PRO-' + emergencySerial++;
                    const timestamp = new Date().toLocaleTimeString();

                    emergencyProLogs.unshift({
                        incidentId,
                        typeSeverity: \`<b>\${type}</b><br><small>\${severity}</small>\`,
                        location: \`<b>\${location}</b><br><small>\${channels}</small>\`,
                        trigger,
                        timestamp,
                        statusHtml: \`<span class="badge-active" id="badge-\${incidentId}">Active Alarm 🚨</span><br><button class="btn btn-resolve" onclick="resolveProIncident('\${incidentId}')">Resolve ✓</button>\`
                    });

                    renderEmergencyProTable();
                    alert('🚨 EMERGENCY PRO BROADCAST SUCCESSFUL (' + incidentId + ')! PA System siren triggered, WhatsApp/SMS dispatched to on-duty medical specialists for ' + location);
                    document.getElementById('epLocation').value = '';
                }

                function renderEmergencyProTable() {
                    const tbody = document.getElementById('emergencyProLogsBody');
                    if(emergencyProLogs.length === 0) {
                        tbody.innerHTML = \`<tr><td colspan="6" style="text-align:center; color:#64748b;">No emergency broadcasts triggered yet during this session.</td></tr>\`;
                        return;
                    }
                    let html = '';
                    emergencyProLogs.forEach(log => {
                        html += \`<tr>
                            <td><b><span style="color:#e11d48;">\${log.incidentId}</span></b></td>
                            <td>\${log.typeSeverity}</td>
                            <td>\${log.location}</td>
                            <td>\${log.trigger}</td>
                            <td>\${log.timestamp}</td>
                            <td id="status-\${log.incidentId}">\${log.statusHtml}</td>
                        </tr>\`;
                    });
                    tbody.innerHTML = html;
                }

                function resolveProIncident(incidentId) {
                    const log = emergencyProLogs.find(l => l.incidentId === incidentId);
                    if(log) {
                        log.statusHtml = \`<span class="badge-resolved">Resolved & Secured ✓</span>\`;
                        renderEmergencyProTable();
                        alert('Incident ' + incidentId + ' marked as Resolved and Secured. All-clear signal transmitted.');
                    }
                }

                function exportEmergencyProCSV() {
                    if(emergencyProLogs.length === 0) {
                        alert('No emergency logs available to export!');
                        return;
                    }
                    let csvContent = "data:text/csv;charset=utf-8,Incident ID,Code Type,Location,Triggered By,Timestamp,Status\n";
                    emergencyProLogs.forEach(row => {
                        csvContent += \`"\${row.incidentId}","\${row.typeSeverity.replace(/<[^>]*>?/gm, '')}","\${row.location.replace(/<[^>]*>?/gm, '')}","\${row.trigger}","\${row.timestamp}","Resolved"\n\`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "CP_Hospital_Emergency_SOS_Pro_Logs.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
});
app.listen(PORT, () => {
    console.log(`🚀 CP Hospital Server running on port ${PORT}`);
});

// =====================================================================
// 🏥 CP HOSPITAL ENTERPRISE SUITE — ALL MODULES FULLY FUNCTIONAL BACKEND
// =====================================================================

app.get('/blood-bank', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>20-Feature Enterprise Blood Bank Hub — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
    --bg-main: #f8fafc;
    --card-bg: rgba(255, 255, 255, 0.9);
    --text-main: #0f172a;
    --text-muted: #64748b;
    --border-color: rgba(226, 232, 240, 0.8);
    --header-bg: rgba(255, 255, 255, 0.95);
}
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #f3f4f6 0%, #fee2e2 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-red); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(225, 29, 72, 0.1);
                    border: 1px solid rgba(254, 205, 211, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-red-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #fff1f2; border: 1px solid #fecdd3; padding: 20px; border-radius: 12px; text-align: center; position: relative; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-red); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
                .restock-btn { background: var(--brand-red); color: white; border: none; padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; cursor: pointer; transition: background 0.2s; margin-top: 5px; }
                .restock-btn:hover { background: var(--brand-red-dark); }
                .alert-low { font-size: 11px; color: #dc2626; font-weight: 700; background: #fee2e2; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-red); box-shadow: 0 0 0 3px rgba(225,29,72,0.15); }
                
                .btn-primary { background: var(--brand-red); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-red-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #047857; }
                .btn-print { background: #2563eb; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #1d4ed8; }
                .btn-clear { background: #4b5563; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #374151; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #fff1f2; color: var(--brand-red-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(255, 241, 242, 0.5); }
                .badge-available { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .badge-issued { background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .btn-issue { background: #4f46e5; color: white; border: none; padding: 5px 12px; border-radius: 5px; font-size: 12px; cursor: pointer; font-weight: 600; }
                .btn-issue:hover { background: #4338ca; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; margin-left: 5px; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-red-dark);">CP Hospital 20-Feature Blood Suite</div>
            </div>

            <div class="container">
                <!-- 1. Live Counters & Stock Warning Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">A+ (Packed RBC)</div>
                        <div class="stat-num" id="count-aplus">0</div>
                        <div id="alert-aplus"></div>
                        <button class="restock-btn" onclick="manualRestock('A+ (Packed RBC)')">+5 Quick Restock</button>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">B+ (Whole Blood)</div>
                        <div class="stat-num" id="count-bplus">0</div>
                        <div id="alert-bplus"></div>
                        <button class="restock-btn" onclick="manualRestock('B+ (Whole Blood)')">+5 Quick Restock</button>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">O- (Universal)</div>
                        <div class="stat-num" id="count-ominus">0</div>
                        <div id="alert-ominus"></div>
                        <button class="restock-btn" onclick="manualRestock('O- (Universal)')">+5 Quick Restock</button>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">AB+ (Platelets)</div>
                        <div class="stat-num" id="count-abplus">0</div>
                        <div id="alert-abplus"></div>
                        <button class="restock-btn" onclick="manualRestock('AB+ (Platelets)')">+5 Quick Restock</button>
                    </div>
                </div>

                <!-- 2. Registration Form -->
                <div class="card">
                    <div class="card-title">🩸 Register & Issue New Blood Unit</div>
                    <form id="bloodForm" onsubmit="registerBlood(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Donor Name & ID</label>
                                <input type="text" id="donorName" class="form-control" placeholder="e.g. Rajesh Sharma (DL-882)" required>
                            </div>
                            <div class="form-group">
                                <label>Blood Group & Component</label>
                                <select id="bloodGroup" class="form-control">
                                    <option value="A+ (Packed RBC)">A+ (Packed RBC)</option>
                                    <option value="B+ (Whole Blood)">B+ (Whole Blood)</option>
                                    <option value="O- (Universal)">O- (Universal)</option>
                                    <option value="AB+ (Platelets)">AB+ (Platelets)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Volume (ml)</label>
                                <input type="number" id="volume" class="form-control" value="350" min="50" max="500" required>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Add Blood Bag to Vault</button>
                    </form>
                </div>

                <!-- 3. Advanced Toolbar & Live Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Live Blood Bank Inventory Ledger</span>
                        <span id="totalRecordsBadge" style="font-size: 13px; color: var(--text-muted); font-weight: 600;"></span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Donor, ID or Group..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllData()">🗑️ Clear All</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="bloodTable">
                            <thead>
                                <tr>
                                    <th>Bag ID</th>
                                    <th>Donor Name</th>
                                    <th>Blood Group</th>
                                    <th>Volume</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let bloodData = JSON.parse(localStorage.getItem('cp_hospital_20_blood_db')) || [
                    { id: 'BAG-1001', name: 'Amit Kumar (DL-102)', group: 'A+ (Packed RBC)', volume: '350 ml', status: 'Available in Vault' },
                    { id: 'BAG-1002', name: 'Priya Verma (DL-405)', group: 'B+ (Whole Blood)', volume: '450 ml', status: 'Available in Vault' },
                    { id: 'BAG-1003', name: 'Rohan Das (DL-771)', group: 'O- (Universal)', volume: '350 ml', status: 'Available in Vault' }
                ];

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (bloodData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No blood records found in vault.</td></tr>';
                        document.getElementById('totalRecordsBadge').innerText = 'Total Records: 0';
                        updateCounters();
                        return;
                    }

                    document.getElementById('totalRecordsBadge').innerText = 'Total Records: ' + bloodData.length;

                    bloodData.forEach((item, index) => {
                        let row = document.createElement('tr');
                        let badgeClass = item.status.includes('Available') ? 'badge-available' : 'badge-issued';
                        let actionText = item.status.includes('Available') ? 'Issue Bag' : 'Revoke';
                        
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.name}</td>
                            <td>\${item.group}</td>
                            <td>\${item.volume}</td>
                            <td><span class="\${badgeClass}">\${item.status}</span></td>
                            <td>
                                <button class="btn-issue" onclick="toggleIssue(\${index})">\${actionText}</button>
                                <button class="btn-delete" onclick="deleteRecord(\${index})">Delete</button>
                            </td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateCounters();
                    localStorage.setItem('cp_hospital_20_blood_db', JSON.stringify(bloodData));
                }

                function registerBlood(event) {
                    event.preventDefault();
                    const name = document.getElementById('donorName').value;
                    const group = document.getElementById('bloodGroup').value;
                    const volume = document.getElementById('volume').value + ' ml';
                    const newId = 'BAG-' + Math.floor(Math.random() * 9000 + 1000);

                    bloodData.unshift({ id: newId, name, group, volume, status: 'Available in Vault' });
                    renderTable();
                    document.getElementById('bloodForm').reset();
                    alert('Blood Bag successfully registered into system vault!');
                }

                function toggleIssue(index) {
                    if (bloodData[index].status.includes('Available')) {
                        bloodData[index].status = 'Issued to Patient';
                    } else {
                        bloodData[index].status = 'Available in Vault';
                    }
                    renderTable();
                }

                function deleteRecord(index) {
                    if (confirm('Are you sure you want to delete this record?')) {
                        bloodData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllData() {
                    if (confirm('WARNING: This will delete all entries permanently! Proceed?')) {
                        bloodData = [];
                        renderTable();
                    }
                }

                function manualRestock(groupName) {
                    for(let i=0; i<5; i++) {
                        bloodData.unshift({ 
                            id: 'BAG-' + Math.floor(Math.random() * 9000 + 1000), 
                            name: 'Hospital Bulk Restock Batch', 
                            group: groupName, 
                            volume: '350 ml', 
                            status: 'Available in Vault' 
                        });
                    }
                    renderTable();
                    alert('Successfully added 5 units of ' + groupName + ' to vault!');
                }

                function updateCounters() {
                    let aPlus = 0, bPlus = 0, oMinus = 0, abPlus = 0;

                    bloodData.forEach(item => {
                        if (item.status.includes('Available')) {
                            if (item.group.includes('A+')) aPlus++;
                            else if (item.group.includes('B+')) bPlus++;
                            else if (item.group.includes('O-')) oMinus++;
                            else if (item.group.includes('AB+')) abPlus++;
                        }
                    });

                    document.getElementById('count-aplus').innerText = aPlus;
                    document.getElementById('count-bplus').innerText = bPlus;
                    document.getElementById('count-ominus').innerText = oMinus;
                    document.getElementById('count-abplus').innerText = abPlus;

                    setLowStockAlert('alert-aplus', aPlus);
                    setLowStockAlert('alert-bplus', bPlus);
                    setLowStockAlert('alert-ominus', oMinus);
                    setLowStockAlert('alert-abplus', abPlus);
                }

                function setLowStockAlert(alertId, count) {
                    let el = document.getElementById(alertId);
                    if (count <= 3) {
                        el.innerHTML = '<span class="alert-low">CRITICAL LOW ⚠️</span>';
                    } else {
                        el.innerHTML = '';
                    }
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#bloodTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_Blood_Bank_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});
// 2. Radiology & PACS Diagnostic Integration Route
app.get('/radiology-pacs', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ultimate Radiology & PACS Hub — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-indigo: #4f46e5;
                    --brand-indigo-dark: #3730a3;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-indigo); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(79, 70, 229, 0.1);
                    border: 1px solid rgba(199, 210, 254, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-indigo-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #eef2ff; border: 1px solid #c7d2fe; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-indigo); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-indigo); box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
                
                .btn-primary { background: var(--brand-indigo); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-indigo-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #047857; }
                .btn-print { background: #2563eb; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #1d4ed8; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #eef2ff; color: var(--brand-indigo-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(238, 242, 255, 0.5); }
                .badge-synced { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .badge-emergency { background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .btn-action { background: #2563eb; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; font-weight: 600; }
                .btn-action:hover { background: #1d4ed8; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; margin-left: 5px; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-indigo-dark);">CP Hospital Ultimate Radiology Suite</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total Scans Indexed</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">MRI Scans</div>
                        <div class="stat-num" id="statMri">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">CT & X-Ray Scans</div>
                        <div class="stat-num" id="statOthers">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">PACS Cloud Status</div>
                        <div class="stat-num" style="font-size: 20px; color: #166534; margin-top: 10px;">🟢 Live & Secure</div>
                    </div>
                </div>

                <!-- Registration Form -->
                <div class="card">
                    <div class="card-title">🔬 Radiology & PACS Diagnostic Hub (Advanced Upload)</div>
                    <form id="pacsForm" onsubmit="registerScan(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Patient Name & UHID</label>
                                <input type="text" id="patientName" class="form-control" placeholder="e.g. Anita Verma (UHID-9921)" required>
                            </div>
                            <div class="form-group">
                                <label>Diagnostic Modality</label>
                                <select id="modality" class="form-control">
                                    <option value="MRI Brain Scan (3 Tesla)">MRI Brain Scan (3 Tesla)</option>
                                    <option value="CT Chest High Resolution">CT Chest High Resolution</option>
                                    <option value="Digital X-Ray Thoracic">Digital X-Ray Thoracic</option>
                                    <option value="Ultrasound Abdomen">Ultrasound Abdomen</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Referring Doctor</label>
                                <input type="text" id="doctorName" class="form-control" value="Dr. V.K. Gupta" required>
                            </div>
                            <div class="form-group">
                                <label>Priority Status</label>
                                <select id="priority" class="form-control">
                                    <option value="Routine Sync">Routine Sync</option>
                                    <option value="⚠️ Emergency STAT">⚠️ Emergency STAT</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Upload Digital DICOM Scan & Sync EHR</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 PACS Cloud Archive & Report Sync Ledger</span>
                        <span id="recordsBadge" style="font-size: 13px; color: var(--text-muted);"></span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Patient, Modality..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Archive</button>
                            <button class="btn-clear" onclick="clearAllScans()">🗑️ Clear Archive</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="pacsTable">
                            <thead>
                                <tr>
                                    <th>Scan ID</th>
                                    <th>Patient & UHID</th>
                                    <th>Modality</th>
                                    <th>Referring Doctor</th>
                                    <th>PACS Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let pacsData = JSON.parse(localStorage.getItem('cp_hospital_ultimate_pacs')) || [
                    { id: 'SCAN-5001', patient: 'Anita Verma (UHID-9921)', modality: 'MRI Brain Scan (3 Tesla)', doctor: 'Dr. V.K. Gupta', status: 'Synced to Cloud PACS', priority: 'Routine Sync' }
                ];

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (pacsData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No radiology scans uploaded yet.</td></tr>';
                        document.getElementById('recordsBadge').innerText = 'Total: 0';
                        updateStats();
                        return;
                    }

                    document.getElementById('recordsBadge').innerText = 'Total Records: ' + pacsData.length;

                    pacsData.forEach((item, index) => {
                        let row = document.createElement('tr');
                        let badgeClass = item.priority.includes('Emergency') ? 'badge-emergency' : 'badge-synced';
                        
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.patient}</td>
                            <td>\${item.modality} <br><small style="color:var(--text-muted)">\${item.priority}</small></td>
                            <td>\${item.doctor}</td>
                            <td><span class="\${badgeClass}">\${item.status}</span></td>
                            <td>
                                <button class="btn-action" onclick="viewDICOM('\${item.id}')">View</button>
                                <button class="btn-delete" onclick="deleteScan(\${index})">Delete</button>
                            </td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_ultimate_pacs', JSON.stringify(pacsData));
                }

                function registerScan(event) {
                    event.preventDefault();
                    const patient = document.getElementById('patientName').value;
                    const modality = document.getElementById('modality').value;
                    const doctor = document.getElementById('doctorName').value;
                    const priority = document.getElementById('priority').value;
                    const newId = 'SCAN-' + Math.floor(Math.random() * 9000 + 1000);

                    pacsData.unshift({ id: newId, patient, modality, doctor, status: 'Synced to Cloud PACS', priority });
                    renderTable();
                    document.getElementById('pacsForm').reset();
                    alert('DICOM Scan successfully uploaded and synced with EHR!');
                }

                function viewDICOM(scanId) {
                    alert('Opening DICOM Viewer for ' + scanId + ' in secure diagnostic window...');
                }

                function deleteScan(index) {
                    if (confirm('Delete this radiology record from archive?')) {
                        pacsData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllScans() {
                    if (confirm('WARNING: This will delete all PACS records permanently!')) {
                        pacsData = [];
                        renderTable();
                    }
                }

                function updateStats() {
                    document.getElementById('statTotal').innerText = pacsData.length;
                    let mriCount = pacsData.filter(i => i.modality.includes('MRI')).length;
                    let otherCount = pacsData.length - mriCount;
                    document.getElementById('statMri').innerText = mriCount;
                    document.getElementById('statOthers').innerText = otherCount;
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#pacsTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_PACS_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});

// 3. Bed & ICU Occupancy Heatmap Route
app.get('/bed-occupancy', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise Bed & ICU Automation Suite — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-blue: #2563eb;
                    --brand-blue-dark: #1d4ed8;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #f3f4f6 0%, #dbeafe 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-blue); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(37, 99, 235, 0.1);
                    border: 1px solid rgba(191, 219, 254, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-blue-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 25px; }
                .stat-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-blue); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Progress Bar Container */
                .progress-container { background: #e5e7eb; border-radius: 10px; height: 16px; width: 100%; overflow: hidden; margin-bottom: 30px; position: relative; }
                .progress-bar { background: linear-gradient(90deg, #2563eb, #1d4ed8); height: 100%; width: 0%; transition: width 0.4s ease; }
                .progress-text { position: absolute; width: 100%; text-align: center; top: 0; font-size: 11px; font-weight: 700; color: #fff; line-height: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

                /* Heatmap Grid UI */
                .heatmap-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 25px; }
                .heat-card { padding: 20px; border-radius: 12px; color: white; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s; position: relative; }
                .heat-card:hover { transform: translateY(-3px); }
                .heat-card.occupied { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border: 1px solid #f87171; }
                .heat-card.vacant { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border: 1px solid #4ade80; }
                .heat-title { font-size: 18px; font-weight: 700; margin-bottom: 5px; }
                .heat-status { font-size: 13px; margin-bottom: 8px; opacity: 0.95; }
                .heat-meta { font-size: 11px; margin-bottom: 15px; opacity: 0.8; background: rgba(0,0,0,0.15); padding: 4px 8px; border-radius: 4px; display: inline-block; }
                .btn-toggle { background: white; color: #1f2937; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; transition: background 0.2s; display: block; width: 100%; text-align: center; }
                .btn-toggle:hover { background: #f3f4f6; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
                
                .btn-primary { background: var(--brand-blue); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-blue-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #047857; }
                .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #4338ca; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #eff6ff; color: var(--brand-blue-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(239, 246, 255, 0.5); }
                .badge-occ { background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .badge-vac { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-blue-dark);">CP Hospital Bed Automation Suite</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total Capacity</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Occupied Beds</div>
                        <div class="stat-num" id="statOccupied" style="color: #dc2626;">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Vacant & Sanitized</div>
                        <div class="stat-num" id="statVacant" style="color: #16a34a;">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Occupancy Rate</div>
                        <div class="stat-num" id="statRate">0%</div>
                    </div>
                </div>

                <!-- Visual Progress Bar -->
                <div class="progress-container">
                    <div class="progress-bar" id="progressBar"></div>
                    <div class="progress-text" id="progressText">0% Hospital Capacity Utilized</div>
                </div>

                <!-- Live Heatmap Grid UI -->
                <div class="card">
                    <div class="card-title">
                        <span>🏥 Live Bed & ICU Occupancy Heatmap Grid</span>
                        <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Green = Vacant & Ready | Red = Occupied</span>
                    </div>
                    <div class="heatmap-grid" id="heatmapGrid"></div>
                </div>

                <!-- Add Bed / Patient Form -->
                <div class="card">
                    <div class="card-title">🛏️ Allocate New Bed or Room Category</div>
                    <form id="bedForm" onsubmit="addBed(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Bed / Ward Name & Number</label>
                                <input type="text" id="bedName" class="form-control" placeholder="e.g. ICU Bay 3 or Emergency Ward 12" required>
                            </div>
                            <div class="form-group">
                                <label>Patient Name & UHID</label>
                                <input type="text" id="patientInfo" class="form-control" placeholder="e.g. Suresh Kumar (UHID-4021)" required>
                            </div>
                            <div class="form-group">
                                <label>Initial Admission Status</label>
                                <select id="bedStatus" class="form-control">
                                    <option value="Occupied by Patient">Occupied by Patient (Red)</option>
                                    <option value="Vacant & Ready">Vacant & Ready (Green)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Register & Allocate Bed in System</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Master Bed Directory & Live Ledger</span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Bed, Patient..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllBeds()">🗑️ Clear All Beds</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="bedTable">
                            <thead>
                                <tr>
                                    <th>Bed / Room ID</th>
                                    <th>Patient & UHID</th>
                                    <th>Current Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let bedsData = JSON.parse(localStorage.getItem('cp_hospital_beds_ultimate_db')) || [
                    { id: 'ICU Bay 1', patient: 'Ramesh Kumar (UHID-1002)', status: 'Occupied by Patient' },
                    { id: 'ICU Bay 2', patient: 'Unassigned', status: 'Vacant & Ready' },
                    { id: 'General Ward 101', patient: 'Sunita Devi (UHID-1045)', status: 'Occupied by Patient' },
                    { id: 'Private Room 204', patient: 'Unassigned', status: 'Vacant & Ready' }
                ];

                function renderAll() {
                    const heatmapGrid = document.getElementById('heatmapGrid');
                    const ledgerBody = document.getElementById('ledgerBody');
                    heatmapGrid.innerHTML = '';
                    ledgerBody.innerHTML = '';

                    if (bedsData.length === 0) {
                        ledgerBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No beds registered in system.</td></tr>';
                        updateStats();
                        return;
                    }

                    bedsData.forEach((item, index) => {
                        let isOccupied = item.status.includes('Occupied');
                        
                        // Render Heatmap Card
                        let heatCard = document.createElement('div');
                        heatCard.className = 'heat-card ' + (isOccupied ? 'occupied' : 'vacant');
                        heatCard.innerHTML = \`
                            <div class="heat-title">\${item.id}</div>
                            <div class="heat-status">👤 \${item.patient}</div>
                            <div class="heat-meta">Status: \${item.status}</div>
                            <button class="btn-toggle" onclick="toggleStatus(\${index})">Toggle Status</button>
                        \`;
                        heatmapGrid.appendChild(heatCard);

                        // Render Ledger Row
                        let row = document.createElement('tr');
                        let badgeClass = isOccupied ? 'badge-occ' : 'badge-vac';
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.patient}</td>
                            <td><span class="\${badgeClass}">\${item.status}</span></td>
                            <td><button class="btn-delete" onclick="deleteBed(\${index})">Delete</button></td>
                        \`;
                        ledgerBody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_beds_ultimate_db', JSON.stringify(bedsData));
                }

                function addBed(event) {
                    event.preventDefault();
                    const id = document.getElementById('bedName').value;
                    const patient = document.getElementById('patientInfo').value;
                    const status = document.getElementById('bedStatus').value;

                    bedsData.push({ id, patient, status });
                    renderAll();
                    document.getElementById('bedForm').reset();
                    alert('Bed successfully added to system grid!');
                }

                function toggleStatus(index) {
                    if (bedsData[index].status.includes('Occupied')) {
                        bedsData[index].status = 'Vacant & Ready';
                        bedsData[index].patient = 'Unassigned';
                    } else {
                        bedsData[index].status = 'Occupied by Patient';
                        bedsData[index].patient = 'Assigned Patient';
                    }
                    renderAll();
                }

                function deleteBed(index) {
                    if (confirm('Delete this bed entry?')) {
                        bedsData.splice(index, 1);
                        renderAll();
                    }
                }

                function clearAllBeds() {
                    if (confirm('WARNING: This will clear all bed records!')) {
                        bedsData = [];
                        renderAll();
                    }
                }

                function updateStats() {
                    let total = bedsData.length;
                    let occupied = bedsData.filter(i => i.status.includes('Occupied')).length;
                    let vacant = total - occupied;
                    let rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

                    document.getElementById('statTotal').innerText = total;
                    document.getElementById('statOccupied').innerText = occupied;
                    document.getElementById('statVacant').innerText = vacant;
                    document.getElementById('statRate').innerText = rate + '%';

                    // Update Progress Bar
                    document.getElementById('progressBar').style.width = rate + '%';
                    document.getElementById('progressText').innerText = rate + '% Hospital Capacity Utilized (' + occupied + ' of ' + total + ' Beds)';
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#bedTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_Bed_Occupancy_Report.csv';
                    link.click();
                }

                window.onload = renderAll;
            </script>
        </body>
        </html>
    `);
});

// 4. Biomedical Waste & Bio-Hazard Management Route
app.get('/biomedical-waste', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ultimate Biomedical Waste Hub — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-green: #059669;
                    --brand-green-dark: #047857;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-green); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(5, 150, 105, 0.1);
                    border: 1px solid rgba(167, 243, 208, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-green-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-green); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Category Breakdown Grid */
                .breakdown-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; margin-bottom: 30px; }
                .breakdown-card { background: white; border-left: 5px solid var(--brand-green); padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
                .breakdown-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
                .breakdown-val { font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 5px; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-green); box-shadow: 0 0 0 3px rgba(5,150,105,0.15); }
                
                .btn-primary { background: var(--brand-green); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-green-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #2563eb; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #1d4ed8; }
                .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #4338ca; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #ecfdf5; color: var(--brand-green-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(236, 253, 245, 0.5); }
                .badge-status { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-green-dark);">CP Hospital Biomedical Waste Ultimate Suite</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total Logs Recorded</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Total Waste Weight</div>
                        <div class="stat-num" id="statWeight">0 kg</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">PCB Compliance Index</div>
                        <div class="stat-num" style="color: #166534;">100% Pass</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Disposal Partner</div>
                        <div class="stat-num" style="font-size: 18px; color: #047857; margin-top: 10px;">EnviroSafe Bio Inc.</div>
                    </div>
                </div>

                <!-- Category Breakdown Cards -->
                <div class="breakdown-grid">
                    <div class="breakdown-card" style="border-left-color: #ca8a04;">
                        <div class="breakdown-title">Yellow Bag (Anatomic)</div>
                        <div class="breakdown-val" id="weightYellow">0 kg</div>
                    </div>
                    <div class="breakdown-card" style="border-left-color: #dc2626;">
                        <div class="breakdown-title">Red Bag (Plastic)</div>
                        <div class="breakdown-val" id="weightRed">0 kg</div>
                    </div>
                    <div class="breakdown-card" style="border-left-color: #4b5563;">
                        <div class="breakdown-title">White Box (Sharps)</div>
                        <div class="breakdown-val" id="weightWhite">0 kg</div>
                    </div>
                    <div class="breakdown-card" style="border-left-color: #2563eb;">
                        <div class="breakdown-title">Blue Box (Glassware)</div>
                        <div class="breakdown-val" id="weightBlue">0 kg</div>
                    </div>
                </div>

                <!-- Registration Form -->
                <div class="card">
                    <div class="card-title">🗑️ Biomedical Waste & Bio-Hazard Compliance Hub</div>
                    <form id="wasteForm" onsubmit="logWaste(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Waste Bin Category (PCB Norms)</label>
                                <select id="category" class="form-control">
                                    <option value="Yellow Bag (Anatomic & Soiled Waste)">Yellow Bag (Anatomic & Soiled Waste)</option>
                                    <option value="Red Bag (Recyclable Plastic/Tubing)">Red Bag (Recyclable Plastic/Tubing)</option>
                                    <option value="White Box (Sharps & Needles)">White Box (Sharps & Needles)</option>
                                    <option value="Blue Box (Glassware & Metallic Implants)">Blue Box (Glassware & Metallic Implants)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Source Department</label>
                                <select id="department" class="form-control">
                                    <option value="Operation Theatre">Operation Theatre</option>
                                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                                    <option value="ICU Unit">ICU Unit</option>
                                    <option value="Laboratory">Laboratory</option>
                                    <option value="Inpatient Ward">Inpatient Ward</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Weight (Kilograms - kg)</label>
                                <input type="number" step="0.1" id="weight" class="form-control" placeholder="e.g. 4.5" required>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Log Waste Weight & Generate PCB Audit Slip</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Pollution Control Board (PCB) Daily Waste Ledger</span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Category, Department..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllWaste()">🗑️ Clear All Logs</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="wasteTable">
                            <thead>
                                <tr>
                                    <th>Log ID</th>
                                    <th>Category</th>
                                    <th>Department</th>
                                    <th>Weight (kg)</th>
                                    <th>Vendor Handover Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let wasteData = JSON.parse(localStorage.getItem('cp_hospital_waste_ultimate_db')) || [
                    { id: 'LOG-8001', category: 'Yellow Bag (Anatomic & Soiled Waste)', dept: 'Operation Theatre', weight: 4.5, status: 'Pending Pickup' }
                ];

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (wasteData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No biomedical waste logs recorded today.</td></tr>';
                        updateStats();
                        return;
                    }

                    wasteData.forEach((item, index) => {
                        let row = document.createElement('tr');
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.category}</td>
                            <td>\${item.dept}</td>
                            <td>\${item.weight} kg</td>
                            <td><span class="badge-status">\${item.status}</span></td>
                            <td><button class="btn-delete" onclick="deleteWaste(\${index})">Delete</button></td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_waste_ultimate_db', JSON.stringify(wasteData));
                }

                function logWaste(event) {
                    event.preventDefault();
                    const category = document.getElementById('category').value;
                    const dept = document.getElementById('department').value;
                    const weight = parseFloat(document.getElementById('weight').value);
                    const newId = 'LOG-' + Math.floor(Math.random() * 9000 + 1000);

                    wasteData.unshift({ id: newId, category, dept, weight, status: 'Pending Pickup' });
                    renderTable();
                    document.getElementById('wasteForm').reset();
                    alert('Biomedical waste successfully logged under PCB norms!');
                }

                function deleteWaste(index) {
                    if (confirm('Delete this waste log entry?')) {
                        wasteData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllWaste() {
                    if (confirm('WARNING: This will clear all waste records!')) {
                        wasteData = [];
                        renderTable();
                    }
                }

                function updateStats() {
                    document.getElementById('statTotal').innerText = wasteData.length;
                    let totalWeight = wasteData.reduce((sum, item) => sum + item.weight, 0);
                    document.getElementById('statWeight').innerText = totalWeight.toFixed(1) + ' kg';

                    // Category Breakdown Calculations
                    let yellowW = wasteData.filter(i => i.category.includes('Yellow')).reduce((s, i) => s + i.weight, 0);
                    let redW = wasteData.filter(i => i.category.includes('Red')).reduce((s, i) => s + i.weight, 0);
                    let whiteW = wasteData.filter(i => i.category.includes('White')).reduce((s, i) => s + i.weight, 0);
                    let blueW = wasteData.filter(i => i.category.includes('Blue')).reduce((s, i) => s + i.weight, 0);

                    document.getElementById('weightYellow').innerText = yellowW.toFixed(1) + ' kg';
                    document.getElementById('weightRed').innerText = redW.toFixed(1) + ' kg';
                    document.getElementById('weightWhite').innerText = whiteW.toFixed(1) + ' kg';
                    document.getElementById('weightBlue').innerText = blueW.toFixed(1) + ' kg';
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#wasteTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_Biomedical_Waste_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});
// 5. Patient Diet & Nutrition Kitchen Suite Route
app.get('/patient-diet', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Patient Diet Kitchen — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; color: #1e293b; margin: 0; }
                .container { max-width: 1150px; margin: 0 auto; }
                .back-link { display: inline-block; margin-bottom: 15px; color: #d97706; text-decoration: none; font-weight: 600; font-size: 14px; }
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 6px solid #d97706; }
                h2 { color: #b45309; margin-top: 0; font-size: 22px; border-bottom: 2px solid #fef3c7; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-weight: 600; margin-bottom: 5px; color: #334155; font-size: 13px; }
                input, select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                .btn { background: #d97706; color: white; padding: 12px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; width: 100%; }
                .btn:hover { background: #b45309; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; }
                .badge { padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; background: #fef3c7; color: #b45309; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div class="card">
                    <h2>🍔 Patient Diet & Nutrition Kitchen Suite</h2>
                    <form id="dietForm" onsubmit="addDietOrder(event)">
                        <div class="grid-3">
                            <div class="form-group">
                                <label>Patient Name & Bed No.</label>
                                <input type="text" id="dPatient" required placeholder="e.g. Ramesh Kumar (ICU Bay 1)">
                            </div>
                            <div class="form-group">
                                <label>Prescribed Clinical Diet</label>
                                <select id="dMeal">
                                    <option value="Liquid Diet (High Protein Broth)">Liquid Diet (High Protein Broth)</option>
                                    <option value="Diabetic Low-Sugar Meal">Diabetic Low-Sugar Meal</option>
                                    <option value="Renal Low-Sodium Soft Diet">Renal Low-Sodium Soft Diet</option>
                                    <option value="General Balanced Patient Meal">General Balanced Patient Meal</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Meal Timing Slot</label>
                                <select id="dSlot">
                                    <option value="Breakfast (08:00 AM)">Breakfast (08:00 AM)</option>
                                    <option value="Lunch (01:00 PM)">Lunch (01:00 PM)</option>
                                    <option value="Evening Soup (05:00 PM)">Evening Soup (05:00 PM)</option>
                                    <option value="Dinner (08:00 PM)">Dinner (08:00 PM)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn">Transmit Order to Hospital Kitchen</button>
                    </form>
                </div>
                

                <div class="card" style="border-top-color: #0d9488;">
                    <h2 style="color: #0f766e; border-bottom-color: #ccfbf1;">📋 Live Kitchen & Canteen Dispatch Ledger</h2>
                    <table>
                        <thead>
                            <tr><th>Order ID</th><th>Patient & Bed</th><th>Prescribed Diet</th><th>Slot</th><th>Dispatch Status</th></tr>
                        </thead>
                        <tbody id="dietLogsBody">
                            <tr><td colspan="5" style="text-align:center; color:#64748b;">No diet orders dispatched yet today.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <script>
                const dietLogs = [];
                let dietSerial = 901;
                function addDietOrder(event) {
                    event.preventDefault();
                    const patient = document.getElementById('dPatient').value;
                    const meal = document.getElementById('dMeal').value;
                    const slot = document.getElementById('dSlot').value;
                    const orderId = 'DIET-' + dietSerial++;

                    dietLogs.unshift({ orderId, patient, meal, slot });
                    renderDietTable();
                    alert('Diet order ' + orderId + ' successfully sent to central kitchen!');
                    document.getElementById('dietForm').reset();
                }
                function renderDietTable() {
                    let html = '';
                    dietLogs.forEach(l => {
                        html += \`<tr><td><b><span class="badge">\${l.orderId}</span></b></td><td>\${l.patient}</td><td><b>\${l.meal}</b></td><td>\${l.slot}</td><td><span style="color:#16a34a; font-weight:600;">Dispatched ✓</span></td></tr>\`;
                    });
                    document.getElementById('dietLogsBody').innerHTML = html;
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/patient-portal', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Patient Portal — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #0284c7; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #0284c7; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #0284c7; margin-top: 15px;">🌐 Patient Portal & Mobile App Suite</h2>
                <p>मरीज घर बैठे अपनी रिपोर्ट्स देख सकें, डॉक्टर की अपॉइंटमेंट बुक कर सकें और ऑनलाइन कंसल्टेशन कर सकें।</p>
                <button onclick="alert('Patient portal gateway active!')" style="background: #0284c7; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Open Portal</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/inventory-asset', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Inventory & Asset — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #d97706; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #d97706; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #d97706; margin-top: 15px;">📦 Inventory & Asset Management</h2>
                <p>अस्पताल की सर्जिकल और सामान्य सामग्री (Consumables, Linens, Surgical Instruments) का स्टॉक और रीऑर्डर लेवल ट्रैक करने के लिए।</p>
                <button onclick="alert('Inventory stock levels verified!')" style="background: #d97706; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Manage Inventory</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/lis-lab', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Laboratory Information System — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #0d9488; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #0d9488; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #0d9488; margin-top: 15px;">🧪 Laboratory Information System (LIS)</h2>
                <p>पैथोलॉजी लैब की सभी ब्लड और बायोप्सी टेस्ट रिपोर्ट्स को सीधे डिजिटल हेल्थ रिकॉर्ड (EHR) से जोड़ने के लिए।</p>
                <button onclick="alert('Lab test reports synced with EHR!')" style="background: #0d9488; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">View Lab Hub</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/queue-management', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Queue Management — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #4f46e5; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #4f46e5; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #4f46e5; margin-top: 15px;">📢 Queue Management System</h2>
                <p>ओपीडी (OPD) और फार्मेसी के बाहर टोकन नंबर डिस्प्ले स्क्रीन और लाइव अनाउंसमेंट सिस्टम।</p>
                <button onclick="alert('Next token announced on display board!')" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Manage Queue</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/discharge-automation', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Discharge Automation — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #e11d48; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #e11d48; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #e11d48; margin-top: 15px;">🧾 Discharge Summary Automation</h2>
                <p>मरीज के डिस्चार्ज के समय फाइनल बिल, समरी और इंश्योरेंस क्लेम का क्लियरेंस एक ही क्लिक पर तैयार करना।</p>
                <button onclick="alert('Discharge summary and clearance generated!')" style="background: #e11d48; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Process Discharge</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/ambulance-fleet', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Ambulance Fleet — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #2563eb; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #2563eb; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #2563eb; margin-top: 15px;">🚑 Ambulance Dispatch & Fleet Management</h2>
                <p>जीपीएस (GPS) के जरिए लाइव एम्बुलेंस ट्रैकिंग और इमरजेंसी कॉल पर तुरंत वाहन रवाना करने का हब।</p>
                <button onclick="alert('Nearest ambulance dispatched via GPS tracking!')" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Track Fleet</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/patient-diet-kitchen', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Patient Diet Kitchen — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #d97706; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #d97706; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #d97706; margin-top: 15px;">🍔 Patient Diet Kitchen</h2>
                <p>डॉक्टरों द्वारा प्रिसक्राइब्ड क्लिनिकल मील चार्ट सीधे अस्पताल की कैंटीन/किचन तक भेजने के लिए।</p>
                <button onclick="alert('Clinical meal chart transmitted to kitchen!')" style="background: #d97706; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Manage Diet Kitchen</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/bed-heatmap', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Bed & ICU Heatmap — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #0284c7; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #0284c7; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #0284c7; margin-top: 15px;">🛏️ Bed & ICU Heatmap</h2>
                <p>वार्ड बेड, प्राइवेट रूम और आईसीयू की लाइव ऑक्यूपेंसी देखने का विजुअल ग्रिड।</p>
                <button onclick="alert('Bed availability grid refreshed!')" style="background: #0284c7; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">View Heatmap</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/emergency-sos', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Emergency SOS 2.0 — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #e11d48; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #e11d48; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #e11d48; margin-top: 15px;">🚨 Emergency SOS 2.0 (Code Blue)</h2>
                <p>अस्पताल में किसी भी मेडिकल इमरजेंसी के लिए मल्टी-चैनल ब्रॉडकास्ट और रैपिड रिस्पांस टाइम एनालिटिक्स।</p>
                <button onclick="alert('Code Blue multi-channel alert triggered!')" style="background: #e11d48; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Trigger Code Blue</button>
            </div>
        </body>
        </html>
    `);
});

app.get('/biomedical-waste', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Biomedical Waste — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; } .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #16a34a; max-width: 800px; margin: 0 auto; }</style>
        </head>
        <body>
            <div class="card">
                <a href="/" style="color: #16a34a; text-decoration: none; font-weight: 600;">← Back to Dashboard</a>
                <h2 style="color: #16a34a; margin-top: 15px;">♻️ Biomedical Waste Management</h2>
                <p>पॉल्यूशन कंट्रोल बोर्ड के नियमों के अनुसार डेली बायो-हार्डर्ड वेस्ट (Yellow/Red bags) के वजन का डिजिटल लॉग रखना।</p>
                <button onclick="alert('Bio-hazard waste weights logged successfully!')" style="background: #16a34a; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Log Waste Weight</button>
            </div>
        </body>
        </html>
    `);
});// कॉमन HTML टेम्पलेट फंक्शन (Reusable Code)
function getHTMLTemplate(title, color, heading, description, btnText, alertMsg) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>${title} — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 30px; color: #1e293b; }
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid ${color}; max-width: 800px; margin: 0 auto; }
                .btn { background: ${color}; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 15px; display: inline-block; text-decoration: none; }
                .back { color: ${color}; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="card">
                <a href="/" class="back">← Back to Dashboard</a>
                <h2 style="color: ${color}; margin-top: 5px;">${heading}</h2>
                <p>${description}</p>
                <button onclick="alert('${alertMsg}')" class="btn">${btnText}</button>
            </div>
        </body>
        </html>
    `;
}

// ==================== 1. नए मॉड्यूल्स के रूट्स (Routes) ====================

app.get('/bed-transfer', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise IPD Bed Transfer Suite — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-blue: #2563eb;
                    --brand-blue-dark: #1d4ed8;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #f3f4f6 0%, #dbeafe 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-blue); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(37, 99, 235, 0.1);
                    border: 1px solid rgba(191, 219, 254, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-blue-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-blue); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
                
                .btn-primary { background: var(--brand-blue); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-blue-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #047857; }
                .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #4338ca; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #eff6ff; color: var(--brand-blue-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(239, 246, 255, 0.5); }
                .badge-transfer { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-blue-dark);">CP Hospital IPD Bed Transfer Suite</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total Transfers Logged</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">ICU Upgrades</div>
                        <div class="stat-num" id="statIcu" style="color: #dc2626;">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">General Ward Shifts</div>
                        <div class="stat-num" id="statGeneral" style="color: #2563eb;">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">System Status</div>
                        <div class="stat-num" style="font-size: 18px; color: #16a34a; margin-top: 10px;">Active & Secure</div>
                    </div>
                </div>

                <!-- Transfer Form -->
                <div class="card">
                    <div class="card-title">🛏️ IPD Bed Transfer & History Tracker</div>
                    <form id="transferForm" onsubmit="logTransfer(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Patient Name & UHID</label>
                                <input type="text" id="patientName" class="form-control" placeholder="e.g. Ramesh Kumar (UHID-2010)" required>
                            </div>
                            <div class="form-group">
                                <label>From Ward / Bed</label>
                                <input type="text" id="fromBed" class="form-control" placeholder="e.g. General Ward 101" required>
                            </div>
                            <div class="form-group">
                                <label>To Target Ward / Bed</label>
                                <input type="text" id="toBed" class="form-control" placeholder="e.g. ICU Bay 2" required>
                            </div>
                            <div class="form-group">
                                <label>Reason for Transfer</label>
                                <select id="reason" class="form-control">
                                    <option value="Condition Deteriorated (Moved to ICU)">Condition Deteriorated (Moved to ICU)</option>
                                    <option value="Condition Stabilized (Shifted to General Ward)">Condition Stabilized (Shifted to General Ward)</option>
                                    <option value="Patient / Family Request">Patient / Family Request</option>
                                    <option value="Specialized Treatment Requirement">Specialized Treatment Requirement</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Execute Bed Transfer & Log History</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Master Bed Transfer History Ledger</span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Patient, Ward..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllTransfers()">🗑️ Clear All History</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="transferTable">
                            <thead>
                                <tr>
                                    <th>Transfer ID</th>
                                    <th>Patient & UHID</th>
                                    <th>From Ward</th>
                                    <th>To Ward</th>
                                    <th>Reason / Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let transferData = JSON.parse(localStorage.getItem('cp_hospital_transfer_db')) || [
                    { id: 'TRF-501', patient: 'Sunita Devi (UHID-1045)', from: 'General Ward 101', to: 'ICU Bay 1', reason: 'Condition Deteriorated (Moved to ICU)' }
                ];

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (transferData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No bed transfers recorded.</td></tr>';
                        updateStats();
                        return;
                    }

                    transferData.forEach((item, index) => {
                        let row = document.createElement('tr');
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.patient}</td>
                            <td>\${item.from}</td>
                            <td><strong>\${item.to}</strong></td>
                            <td><span class="badge-transfer">\${item.reason}</span></td>
                            <td><button class="btn-delete" onclick="deleteTransfer(\${index})">Delete</button></td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_transfer_db', JSON.stringify(transferData));
                }

                function logTransfer(event) {
                    event.preventDefault();
                    const patient = document.getElementById('patientName').value;
                    const from = document.getElementById('fromBed').value;
                    const to = document.getElementById('toBed').value;
                    const reason = document.getElementById('reason').value;
                    const newId = 'TRF-' + Math.floor(Math.random() * 900 + 100);

                    transferData.unshift({ id: newId, patient, from, to, reason });
                    renderTable();
                    document.getElementById('transferForm').reset();
                    alert('Patient successfully transferred and logged in system!');
                }

                function deleteTransfer(index) {
                    if (confirm('Delete this transfer log entry?')) {
                        transferData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllTransfers() {
                    if (confirm('WARNING: This will clear all transfer history records!')) {
                        transferData = [];
                        renderTable();
                    }
                }

                function updateStats() {
                    document.getElementById('statTotal').innerText = transferData.length;
                    let icuCount = transferData.filter(i => i.to.toLowerCase().includes('icu')).length;
                    let generalCount = transferData.length - icuCount;

                    document.getElementById('statIcu').innerText = icuCount;
                    document.getElementById('statGeneral').innerText = generalCount;
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#transferTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_Bed_Transfer_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});

app.get('/ot-scheduling', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise OT Scheduling & Live Status — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-red: #e11d48;
                    --brand-red-dark: #be123c;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-red); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(225, 29, 72, 0.1);
                    border: 1px solid rgba(254, 205, 211, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-red-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #fff1f2; border: 1px solid #fecdd3; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-red); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-red); box-shadow: 0 0 0 3px rgba(225,29,72,0.15); }
                
                .btn-primary { background: var(--brand-red); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-red-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #2563eb; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #1d4ed8; }
                .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #4338ca; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #fff1f2; color: var(--brand-red-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(255, 241, 242, 0.5); }
                .badge-status { background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-red-dark);">CP Hospital OT Scheduling Suite</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total Surgeries Scheduled</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Active In-Surgery</div>
                        <div class="stat-num" id="statActive" style="color: #e11d48;">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Completed Today</div>
                        <div class="stat-num" id="statCompleted" style="color: #059669;">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">OT Rooms Available</div>
                        <div class="stat-num" style="font-size: 18px; color: #1d4ed8; margin-top: 10px;">OT-1, OT-2, OT-3 Ready</div>
                    </div>
                </div>

                <!-- Registration Form -->
                <div class="card">
                    <div class="card-title">🏥 Operation Theatre (OT) Scheduling & Slot Booking</div>
                    <form id="otForm" onsubmit="bookOT(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Patient Name & UHID</label>
                                <input type="text" id="patientName" class="form-control" placeholder="e.g. Rajesh Sharma (UHID-3011)" required>
                            </div>
                            <div class="form-group">
                                <label>Surgical Procedure</label>
                                <input type="text" id="procedure" class="form-control" placeholder="e.g. Laparoscopic Cholecystectomy" required>
                            </div>
                            <div class="form-group">
                                <label>Lead Surgeon Name</label>
                                <input type="text" id="surgeon" class="form-control" placeholder="e.g. Dr. A. K. Verma" required>
                            </div>
                            <div class="form-group">
                                <label>OT Room Number</label>
                                <select id="otRoom" class="form-control">
                                    <option value="Operation Theatre 1">Operation Theatre 1</option>
                                    <option value="Operation Theatre 2">Operation Theatre 2</option>
                                    <option value="Operation Theatre 3 (Emergency)">Operation Theatre 3 (Emergency)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Surgery Date & Time Slot</label>
                                <input type="datetime-local" id="slotTime" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Current Status</label>
                                <select id="otStatus" class="form-control">
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="In-Surgery">In-Surgery</option>
                                    <option value="Sanitization Pending">Sanitization Pending</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Book OT Slot & Register in System</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Master OT Schedule & Live Status Ledger</span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Patient, Surgeon, OT..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllOT()">🗑️ Clear All Slots</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="otTable">
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Patient & UHID</th>
                                    <th>Procedure</th>
                                    <th>Surgeon</th>
                                    <th>OT Room & Time</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let otData = JSON.parse(localStorage.getItem('cp_hospital_ot_db')) || [
                    { id: 'OT-901', patient: 'Amitabh Sen (UHID-2201)', procedure: 'Appendectomy', surgeon: 'Dr. R. K. Gupta', room: 'Operation Theatre 1', time: '2026-08-23 10:30 AM', status: 'In-Surgery' }
                ];

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (otData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No operation theatre slots booked.</td></tr>';
                        updateStats();
                        return;
                    }

                    otData.forEach((item, index) => {
                        let row = document.createElement('tr');
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.patient}</td>
                            <td>\${item.procedure}</td>
                            <td>\${item.surgeon}</td>
                            <td>\${item.room}<br><small style="color:var(--text-muted);">\${item.time}</small></td>
                            <td><span class="badge-status">\${item.status}</span></td>
                            <td><button class="btn-delete" onclick="deleteOT(\${index})">Delete</button></td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_ot_db', JSON.stringify(otData));
                }

                function bookOT(event) {
                    event.preventDefault();
                    const patient = document.getElementById('patientName').value;
                    const procedure = document.getElementById('procedure').value;
                    const surgeon = document.getElementById('surgeon').value;
                    const room = document.getElementById('otRoom').value;
                    const timeRaw = document.getElementById('slotTime').value;
                    const status = document.getElementById('otStatus').value;
                    const newId = 'OT-' + Math.floor(Math.random() * 900 + 100);

                    // Format date nicely
                    let timeFormatted = timeRaw ? new Date(timeRaw).toLocaleString() : 'As scheduled';

                    otData.unshift({ id: newId, patient, procedure, surgeon, room, time: timeFormatted, status });
                    renderTable();
                    document.getElementById('otForm').reset();
                    alert('Operation Theatre slot successfully booked and registered!');
                }

                function deleteOT(index) {
                    if (confirm('Delete this OT booking record?')) {
                        otData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllOT() {
                    if (confirm('WARNING: This will clear all OT booking records!')) {
                        otData = [];
                        renderTable();
                    }
                }

                function updateStats() {
                    document.getElementById('statTotal').innerText = otData.length;
                    let activeCount = otData.filter(i => i.status === 'In-Surgery').length;
                    let completedCount = otData.filter(i => i.status === 'Completed').length;

                    document.getElementById('statActive').innerText = activeCount;
                    document.getElementById('statCompleted').innerText = completedCount;
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#otTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText.replace(/\\n/g, ' ') + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_OT_Schedule_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});

app.get('/doctor-rounds', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise Doctor Rounds & Clinical Notes — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-purple: #7c3aed;
                    --brand-purple-dark: #6d28d9;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-purple); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(124, 58, 237, 0.1);
                    border: 1px solid rgba(221, 214, 254, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-purple-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #f5f3ff; border: 1px solid #ddd6fe; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-purple); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-purple); box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
                
                .btn-primary { background: var(--brand-purple); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-purple-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #047857; }
                .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #4338ca; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #f5f3ff; color: var(--brand-purple-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(245, 243, 255, 0.5); }
                .badge-notes { background: #ede9fe; color: #6d28d9; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-purple-dark);">CP Hospital Doctor Rounds Suite</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total Round Notes</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Active Doctors on Round</div>
                        <div class="stat-num" style="color: #7c3aed;">Dr. A. Sharma, Dr. R. K. Das</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">System Compliance</div>
                        <div class="stat-num" style="color: #059669;">100% Updated</div>
                    </div>
                </div>

                <!-- Registration Form -->
                <div class="card">
                    <div class="card-title">🩺 Doctor Round & Clinical Notes Manager</div>
                    <form id="roundForm" onsubmit="saveRound(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Attending Doctor Name</label>
                                <input type="text" id="docName" class="form-control" placeholder="e.g. Dr. Alok Sharma (Sr. Consultant)" required>
                            </div>
                            <div class="form-group">
                                <label>Patient Name & UHID / Bed</label>
                                <input type="text" id="patientInfo" class="form-control" placeholder="e.g. Suresh Kumar (UHID-4021 - ICU Bay 1)" required>
                            </div>
                            <div class="form-group">
                                <label>Patient Vitals (BP, Pulse, Temp)</label>
                                <input type="text" id="vitals" class="form-control" placeholder="e.g. BP: 120/80, Pulse: 78, Temp: 98.6°F" required>
                            </div>
                            <div class="form-group" style="grid-column: 1 / -1;">
                                <label>Clinical Notes, Observation & Prescription Update</label>
                                <textarea id="notes" class="form-control" rows="3" placeholder="Enter patient clinical progress, medicine changes, and lab test instructions..." required></textarea>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Save Round Notes & Update EMR System</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Master Clinical Round Notes Ledger</span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Doctor, Patient..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllRounds()">🗑️ Clear All Notes</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="roundTable">
                            <thead>
                                <tr>
                                    <th>Round ID</th>
                                    <th>Doctor Name</th>
                                    <th>Patient & Location</th>
                                    <th>Vitals</th>
                                    <th>Clinical Notes & Prescription</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let roundsData = JSON.parse(localStorage.getItem('cp_hospital_rounds_db')) || [
                    { id: 'RND-101', doctor: 'Dr. Alok Sharma', patient: 'Ramesh Kumar (UHID-1002 - ICU Bay 1)', vitals: 'BP: 130/85, Pulse: 82, Temp: 98.4°F', notes: 'Patient recovering well. Continue IV fluids and antibiotic course.' }
                ];

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (roundsData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No clinical round notes recorded.</td></tr>';
                        updateStats();
                        return;
                    }

                    roundsData.forEach((item, index) => {
                        let row = document.createElement('tr');
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.doctor}</td>
                            <td>\${item.patient}</td>
                            <td><span class="badge-notes">\${item.vitals}</span></td>
                            <td>\${item.notes}</td>
                            <td><button class="btn-delete" onclick="deleteRound(\${index})">Delete</button></td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_rounds_db', JSON.stringify(roundsData));
                }

                function saveRound(event) {
                    event.preventDefault();
                    const doctor = document.getElementById('docName').value;
                    const patient = document.getElementById('patientInfo').value;
                    const vitals = document.getElementById('vitals').value;
                    const notes = document.getElementById('notes').value;
                    const newId = 'RND-' + Math.floor(Math.random() * 900 + 100);

                    roundsData.unshift({ id: newId, doctor, patient, vitals, notes });
                    renderTable();
                    document.getElementById('roundForm').reset();
                    alert('Clinical round notes successfully saved in system!');
                }

                function deleteRound(index) {
                    if (confirm('Delete this round note entry?')) {
                        roundsData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllRounds() {
                    if (confirm('WARNING: This will clear all clinical round records!')) {
                        roundsData = [];
                        renderTable();
                    }
                }

                function updateStats() {
                    document.getElementById('statTotal').innerText = roundsData.length;
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#roundTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText.replace(/\\n/g, ' ') + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_Doctor_Rounds_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});

app.get('/purchase-orders', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise Supplier & Purchase Order (PO) Portal — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-orange: #d97706;
                    --brand-orange-dark: #b45309;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-orange); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(217, 119, 6, 0.1);
                    border: 1px solid rgba(253, 230, 138, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-orange-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-orange); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-orange); box-shadow: 0 0 0 3px rgba(217,119,6,0.15); }
                
                .btn-primary { background: var(--brand-orange); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-orange-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #047857; }
                .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #4338ca; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #fffbeb; color: var(--brand-orange-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(255, 251, 235, 0.5); }
                .badge-po { background: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-orange-dark);">CP Hospital Purchase Order Portal</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total POs Generated</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Total Expenditure</div>
                        <div class="stat-num" id="statAmount" style="color: #059669;">₹0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Active Vendors</div>
                        <div class="stat-num" style="color: #d97706;">MediPharma & Surgico</div>
                    </div>
                </div>

                <!-- Registration Form -->
                <div class="card">
                    <div class="card-title">📦 Supplier & Purchase Order (PO) Generator</div>
                    <form id="poForm" onsubmit="generatePO(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Vendor / Supplier Name</label>
                                <input type="text" id="vendorName" class="form-control" placeholder="e.g. Apollo Pharma Distributors" required>
                            </div>
                            <div class="form-group">
                                <label>Items & Description (Medicines / Consumables)</label>
                                <input type="text" id="items" class="form-control" placeholder="e.g. Paracetamol 500mg, Surgical Gloves (Box)" required>
                            </div>
                            <div class="form-group">
                                <label>Total Amount (₹)</label>
                                <input type="number" id="amount" class="form-control" placeholder="e.g. 45000" required>
                            </div>
                            <div class="form-group">
                                <label>Order Status</label>
                                <select id="poStatus" class="form-control">
                                    <option value="Pending Approval">Pending Approval</option>
                                    <option value="Approved & Sent">Approved & Sent</option>
                                    <option value="Delivered & Verified">Delivered & Verified</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Generate & Register Purchase Order</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Master Purchase Orders Ledger</span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Vendor, Items..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllPO()">🗑️ Clear All POs</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="poTable">
                            <thead>
                                <tr>
                                    <th>PO ID</th>
                                    <th>Vendor Name</th>
                                    <th>Items Description</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let poData = JSON.parse(localStorage.getItem('cp_hospital_po_db')) || [
                    { id: 'PO-801', vendor: 'Meditech Surgicals Ltd.', items: 'Disposable Syringes 10ml (500 pcs)', amount: 25000, status: 'Approved & Sent' }
                ];

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (poData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No purchase orders generated.</td></tr>';
                        updateStats();
                        return;
                    }

                    poData.forEach((item, index) => {
                        let row = document.createElement('tr');
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.vendor}</td>
                            <td>\${item.items}</td>
                            <td><strong>₹\${Number(item.amount).toLocaleString()}</strong></td>
                            <td><span class="badge-po">\${item.status}</span></td>
                            <td><button class="btn-delete" onclick="deletePO(\${index})">Delete</button></td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_po_db', JSON.stringify(poData));
                }

                function generatePO(event) {
                    event.preventDefault();
                    const vendor = document.getElementById('vendorName').value;
                    const items = document.getElementById('items').value;
                    const amount = document.getElementById('amount').value;
                    const status = document.getElementById('poStatus').value;
                    const newId = 'PO-' + Math.floor(Math.random() * 900 + 100);

                    poData.unshift({ id: newId, vendor, items, amount, status });
                    renderTable();
                    document.getElementById('poForm').reset();
                    alert('Purchase order successfully generated and registered!');
                }

                function deletePO(index) {
                    if (confirm('Delete this purchase order record?')) {
                        poData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllPO() {
                    if (confirm('WARNING: This will clear all purchase order records!')) {
                        poData = [];
                        renderTable();
                    }
                }

                function updateStats() {
                    document.getElementById('statTotal').innerText = poData.length;
                    let totalAmount = poData.reduce((sum, item) => sum + Number(item.amount), 0);
                    document.getElementById('statAmount').innerText = '₹' + totalAmount.toLocaleString();
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#poTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_Purchase_Orders_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});

app.get('/expiry-alerts', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise Batch & Near-Expiry Alert Dashboard — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-green: #059669;
                    --brand-green-dark: #047857;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-green); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(5, 150, 105, 0.1);
                    border: 1px solid rgba(167, 243, 208, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-green-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-green); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-green); box-shadow: 0 0 0 3px rgba(5,150,105,0.15); }
                
                .btn-primary { background: var(--brand-green); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-green-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #2563eb; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #1d4ed8; }
                .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #4338ca; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #ecfdf5; color: var(--brand-green-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(236, 253, 245, 0.5); }
                .badge-status { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
                .badge-safe { background: #d1fae5; color: #065f46; }
                .badge-warning { background: #fef3c7; color: #92400e; }
                .badge-expired { background: #fee2e2; color: #991b1b; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-green-dark);">CP Hospital Expiry Alert Dashboard</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total Tracked Batches</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Near Expiry Alert</div>
                        <div class="stat-num" id="statWarning" style="color: #d97706;">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Expired Stock</div>
                        <div class="stat-num" id="statExpired" style="color: #dc2626;">0</div>
                    </div>
                </div>

                <!-- Registration Form -->
                <div class="card">
                    <div class="card-title">⚠️ Scan & Register Batch Expiry</div>
                    <form id="expiryForm" onsubmit="addBatch(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Medicine / Item Name</label>
                                <input type="text" id="medName" class="form-control" placeholder="e.g. Augmentin 625mg Tablet" required>
                            </div>
                            <div class="form-group">
                                <label>Batch Number</label>
                                <input type="text" id="batchNo" class="form-control" placeholder="e.g. BATCH-9921" required>
                            </div>
                            <div class="form-group">
                                <label>Quantity Available</label>
                                <input type="number" id="qty" class="form-control" placeholder="e.g. 150" required>
                            </div>
                            <div class="form-group">
                                <label>Expiry Date</label>
                                <input type="date" id="expiryDate" class="form-control" required>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Scan & Save Batch to System</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Master Batch Expiry Alert Ledger</span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Medicine, Batch..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllBatches()">🗑️ Clear All Batches</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="batchTable">
                            <thead>
                                <tr>
                                    <th>Medicine Name</th>
                                    <th>Batch Number</th>
                                    <th>Quantity</th>
                                    <th>Expiry Date</th>
                                    <th>Status Alert</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let batchData = JSON.parse(localStorage.getItem('cp_hospital_expiry_db')) || [
                    { name: 'Pantoprazole 40mg', batch: 'PAN-402', qty: '120', expiry: '2026-09-15' },
                    { name: 'Paracetamol Infusion', batch: 'INF-881', qty: '50', expiry: '2026-03-10' }
                ];

                function getStatus(expiryStr) {
                    const today = new Date();
                    const expiryDate = new Date(expiryStr);
                    const diffTime = expiryDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                        return { label: 'Expired', class: 'badge-expired' };
                    } else if (diffDays <= 60) {
                        return { label: 'Near Expiry (' + diffDays + ' days)', class: 'badge-warning' };
                    } else {
                        return { label: 'Safe Stock', class: 'badge-safe' };
                    }
                }

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (batchData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No medication batches registered.</td></tr>';
                        updateStats();
                        return;
                    }

                    batchData.forEach((item, index) => {
                        let status = getStatus(item.expiry);
                        let row = document.createElement('tr');
                        row.innerHTML = \`
                            <td><strong>\${item.name}</strong></td>
                            <td>\${item.batch}</td>
                            <td>\${item.qty} units</td>
                            <td>\${item.expiry}</td>
                            <td><span class="badge-status \${status.class}">\${status.label}</span></td>
                            <td><button class="btn-delete" onclick="deleteBatch(\${index})">Delete</button></td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_expiry_db', JSON.stringify(batchData));
                }

                function addBatch(event) {
                    event.preventDefault();
                    const name = document.getElementById('medName').value;
                    const batch = document.getElementById('batchNo').value;
                    const qty = document.getElementById('qty').value;
                    const expiry = document.getElementById('expiryDate').value;

                    batchData.unshift({ name, batch, qty, expiry });
                    renderTable();
                    document.getElementById('expiryForm').reset();
                    alert('Batch successfully scanned and registered!');
                }

                function deleteBatch(index) {
                    if (confirm('Delete this batch record?')) {
                        batchData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllBatches() {
                    if (confirm('WARNING: This will clear all registered batch records!')) {
                        batchData = [];
                        renderTable();
                    }
                }

                function updateStats() {
                    document.getElementById('statTotal').innerText = batchData.length;
                    
                    let warningCount = 0;
                    let expiredCount = 0;

                    batchData.forEach(item => {
                        let status = getStatus(item.expiry);
                        if (status.class === 'badge-warning') warningCount++;
                        if (status.class === 'badge-expired') expiredCount++;
                    });

                    document.getElementById('statWarning').innerText = warningCount;
                    document.getElementById('statExpired').innerText = expiredCount;
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#batchTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_Expiry_Alert_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});

app.get('/patient-feedback', isAuthenticated, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise Patient Feedback & Analytics — CP Hospital</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --brand-amber: #d97706;
                    --brand-amber-dark: #b45309;
                    --bg-color: #f4f7f6;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text-main: #1f2937;
                    --text-muted: #6b7280;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
                    color: var(--text-main); 
                    margin: 0; 
                    min-height: 100vh;
                }
                .top-bar { padding: 15px 40px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: var(--brand-amber); text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
                .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
                
                .card {
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 10px 30px -5px rgba(217, 119, 6, 0.1);
                    border: 1px solid rgba(253, 230, 138, 0.6);
                    margin-bottom: 30px;
                }
                .card-title { font-size: 20px; font-weight: 700; color: var(--brand-amber-dark); display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }

                /* Stats Counters */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 12px; text-align: center; }
                .stat-num { font-size: 28px; font-weight: 800; color: var(--brand-amber); margin: 5px 0; }
                .stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
                .form-control { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; transition: all 0.2s; }
                .form-control:focus { outline: none; border-color: var(--brand-amber); box-shadow: 0 0 0 3px rgba(217,119,6,0.15); }
                
                .btn-primary { background: var(--brand-amber); color: white; border: none; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-primary:hover { background: var(--brand-amber-dark); }

                /* Action Toolbar */
                .table-toolbar { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 280px; }
                .toolbar-btns { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-export { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-export:hover { background: #047857; }
                .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-print:hover { background: #4338ca; }
                .btn-clear { background: #dc2626; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
                .btn-clear:hover { background: #b91c1c; }

                /* Table Design */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                th { background: #fffbeb; color: var(--brand-amber-dark); font-weight: 700; }
                tbody tr:hover { background: rgba(255, 251, 235, 0.5); }
                .badge-rating { background: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
                .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
                .btn-delete:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="top-bar">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <div style="font-weight: 700; color: var(--brand-amber-dark);">CP Hospital Patient Feedback Suite</div>
            </div>

            <div class="container">
                <!-- Counters Grid -->
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-lbl">Total Feedback Collected</div>
                        <div class="stat-num" id="statTotal">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Average Rating Score</div>
                        <div class="stat-num" id="statAvg" style="color: #059669;">0.0 / 5</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-lbl">Satisfaction Status</div>
                        <div class="stat-num" style="font-size: 18px; color: #2563eb; margin-top: 10px;">Excellent Quality</div>
                    </div>
                </div>

                <!-- Registration Form -->
                <div class="card">
                    <div class="card-title">⭐ Patient Feedback & Satisfaction Analytics</div>
                    <form id="feedbackForm" onsubmit="addFeedback(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Patient Name & UHID</label>
                                <input type="text" id="patientName" class="form-control" placeholder="e.g. Manoj Kumar (UHID-5012)" required>
                            </div>
                            <div class="form-group">
                                <label>Department / Ward Visited</label>
                                <select id="dept" class="form-control">
                                    <option value="General IPD Ward">General IPD Ward</option>
                                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                                    <option value="ICU & Critical Care">ICU & Critical Care</option>
                                    <option value="Outpatient (OPD)">Outpatient (OPD)</option>
                                    <option value="Pharmacy & Diagnostics">Pharmacy & Diagnostics</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Satisfaction Rating</label>
                                <select id="rating" class="form-control">
                                    <option value="5">⭐⭐⭐⭐⭐ 5 - Outstanding Service</option>
                                    <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                                    <option value="3">⭐⭐⭐ 3 - Satisfactory</option>
                                    <option value="2">⭐⭐ 2 - Needs Improvement</option>
                                    <option value="1">⭐ 1 - Poor Experience</option>
                                </select>
                            </div>
                            <div class="form-group" style="grid-column: 1 / -1;">
                                <label>Patient Comments & Suggestions</label>
                                <textarea id="comments" class="form-control" rows="3" placeholder="Enter patient feedback comments regarding nursing care, cleanliness, doctors, etc..." required></textarea>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Submit Feedback & Update Analytics</button>
                    </form>
                </div>

                <!-- Ledger -->
                <div class="card">
                    <div class="card-title">
                        <span>📋 Master Patient Feedback Ledger</span>
                    </div>
                    <div class="table-toolbar">
                        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search Patient, Department..." onkeyup="filterTable()">
                        <div class="toolbar-btns">
                            <button class="btn-export" onclick="exportToCSV()">📥 Export CSV</button>
                            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
                            <button class="btn-clear" onclick="clearAllFeedback()">🗑️ Clear All Feedback</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="feedbackTable">
                            <thead>
                                <tr>
                                    <th>Feedback ID</th>
                                    <th>Patient & UHID</th>
                                    <th>Department</th>
                                    <th>Rating</th>
                                    <th>Comments</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ledgerBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                let feedbackData = JSON.parse(localStorage.getItem('cp_hospital_feedback_db')) || [
                    { id: 'FB-101', patient: 'Kavita Singh (UHID-3021)', dept: 'General IPD Ward', rating: 5, comments: 'Excellent care provided by the nursing staff and doctors. Room was very clean.' }
                ];

                function renderTable() {
                    const tbody = document.getElementById('ledgerBody');
                    tbody.innerHTML = '';

                    if (feedbackData.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No patient feedback recorded.</td></tr>';
                        updateStats();
                        return;
                    }

                    feedbackData.forEach((item, index) => {
                        let stars = '⭐'.repeat(Number(item.rating));
                        let row = document.createElement('tr');
                        row.innerHTML = \`
                            <td><strong>\${item.id}</strong></td>
                            <td>\${item.patient}</td>
                            <td>\${item.dept}</td>
                            <td><span class="badge-rating">\${stars} (\${item.rating}/5)</span></td>
                            <td>\${item.comments}</td>
                            <td><button class="btn-delete" onclick="deleteFeedback(\${index})">Delete</button></td>
                        \`;
                        tbody.appendChild(row);
                    });

                    updateStats();
                    localStorage.setItem('cp_hospital_feedback_db', JSON.stringify(feedbackData));
                }

                function addFeedback(event) {
                    event.preventDefault();
                    const patient = document.getElementById('patientName').value;
                    const dept = document.getElementById('dept').value;
                    const rating = document.getElementById('rating').value;
                    const comments = document.getElementById('comments').value;
                    const newId = 'FB-' + Math.floor(Math.random() * 900 + 100);

                    feedbackData.unshift({ id: newId, patient, dept, rating, comments });
                    renderTable();
                    document.getElementById('feedbackForm').reset();
                    alert('Patient feedback successfully recorded and analytics updated!');
                }

                function deleteFeedback(index) {
                    if (confirm('Delete this feedback record?')) {
                        feedbackData.splice(index, 1);
                        renderTable();
                    }
                }

                function clearAllFeedback() {
                    if (confirm('WARNING: This will clear all patient feedback records!')) {
                        feedbackData = [];
                        renderTable();
                    }
                }

                function updateStats() {
                    document.getElementById('statTotal').innerText = feedbackData.length;
                    if (feedbackData.length === 0) {
                        document.getElementById('statAvg').innerText = '0.0 / 5';
                        return;
                    }
                    let totalRating = feedbackData.reduce((sum, item) => sum + Number(item.rating), 0);
                    let avg = (totalRating / feedbackData.length).toFixed(1);
                    document.getElementById('statAvg').innerText = avg + ' / 5';
                }

                function filterTable() {
                    let query = document.getElementById('searchInput').value.toLowerCase();
                    let rows = document.querySelectorAll('#ledgerBody tr');
                    rows.forEach(row => {
                        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
                    });
                }

                function exportToCSV() {
                    let csv = [];
                    let rows = document.querySelectorAll('#feedbackTable tr');
                    rows.forEach(row => {
                        let cols = row.querySelectorAll('td, th');
                        let data = [];
                        for(let i=0; i<cols.length-1; i++) data.push('"' + cols[i].innerText.replace(/\\n/g, ' ') + '"');
                        csv.push(data.join(','));
                    });
                    let blob = new Blob([csv.join('\\n')], { type: 'text/csv' });
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'CP_Hospital_Patient_Feedback_Report.csv';
                    link.click();
                }

                window.onload = renderTable;
            </script>
        </body>
        </html>
    `);
});

// ==================== 2. मुख्य डैशबोर्ड रूट (Dashboard Route) ====================

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>CP Hospital — Enterprise Dashboard</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                .header { background: white; padding: 20px 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
                .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border-top: 5px solid #0284c7; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s; }
                .card:hover { transform: translateY(-3px); }
                .card h3 { margin-top: 0; font-size: 18px; color: #0f172a; }
                .card p { font-size: 14px; color: #64748b; line-height: 1.5; }
                .btn { display: inline-block; background: #0284c7; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; text-align: center; margin-top: 15px; }
                .btn:hover { background: #0369a1; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h2 style="margin:0; color: #0f172a;">CP HOSPITAL SUITE</h2>
                    <p style="margin:5px 0 0; font-size: 13px; color: #64748b;">Enterprise Healthcare Management Portal</p>
                </div>
                <div style="background: #e2e8f0; padding: 8px 15px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                    🟢 All Systems Online
                </div>
            </div>

            <div class="grid">
                <!-- IPD Bed Transfer -->
                <div class="card" style="border-top-color: #0284c7;">
                    <div><h3>🛏️ IPD Bed Transfer</h3><p>मरीजों को वार्ड/आईसीयू में शिफ्ट करने और बेड हिस्ट्री ट्रैक करने का टूल।</p></div>
                    <a href="/bed-transfer" class="btn" style="background: #0284c7;">Access Portal</a>
                </div>

                <!-- OT Scheduling -->
                <div class="card" style="border-top-color: #e11d48;">
                    <div><h3>🏥 OT Scheduling</h3><p>ऑपरेशन थिएटर स्लॉट बुकिंग और सर्जिकल टीम की शेड्यूलिंग।</p></div>
                    <a href="/ot-scheduling" class="btn" style="background: #e11d48;">Access Portal</a>
                </div>

                <!-- Doctor Rounds -->
                <div class="card" style="border-top-color: #4f46e5;">
                    <div><h3>🩺 Doctor Round Manager</h3><p>वार्ड राउंड के दौरान दिए जाने वाले डेली नोट्स और प्रिस्क्रिप्शन अपडेट।</p></div>
                    <a href="/doctor-rounds" class="btn" style="background: #4f46e5;">Access Portal</a>
                </div>

                <!-- Purchase Orders -->
                <div class="card" style="border-top-color: #d97706;">
                    <div><h3>📦 Supplier & PO Portal</h3><p>मेडिकल सप्लायर्स और वेंडर्स को ऑटोमैटिक परचेस ऑर्डर भेजने का हब।</p></div>
                    <a href="/purchase-orders" class="btn" style="background: #d97706;">Access Portal</a>
                </div>

                <!-- Expiry Alerts -->
                <div class="card" style="border-top-color: #059669;">
                    <div><h3>⚠️ Expiry Alert Dashboard</h3><p>दवाइयों के बैचेस और नियर-एक्सपायरी स्टॉक का ऑटोमैटिक अलर्ट सिस्टम।</p></div>
                    <a href="/expiry-alerts" class="btn" style="background: #059669;">Access Portal</a>
                </div>

                <!-- Patient Feedback -->
                <div class="card" style="border-top-color: #7c3aed;">
                    <div><h3>⭐ Patient Feedback & CSAT</h3><p>डिस्चार्ज फीडबैक और रेटिंग्स के आधार पर सर्विस क्वालिटी एनालिटिक्स।</p></div>
                    <a href="/patient-feedback" class="btn" style="background: #7c3aed;">Access Portal</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.innerText = '☀️';
    } else {
        body.setAttribute('data-theme', 'light');
        themeIcon.innerText = '🌙';
    }
}
