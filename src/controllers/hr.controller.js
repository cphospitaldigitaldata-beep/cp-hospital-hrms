const db = require('../config/db');
const multer = require('multer'); // <-- यह लाइन जोड़ें
const path = require('path');     // <-- यह लाइन जोड़ें

// Multer स्टोरेज सेटिंग्स
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage }).any();

// (बाकी आपका पूरा कोड वैसे ही रहेगा...)
// Add New Staff Member with Separate Documents
async function onboardStaff(req, res) {
  try {
    const { full_name, designation, department, email, phone, license_number, pan, council_reg, bank_details } = req.body;
    
     // req.files एक Array के रूप में मिलेगा जब आप upload.any() का इस्तेमाल करेंगे
    const files = req.files || [];
    const fileMap = {};
    files.forEach(file => {
      fileMap[file.fieldname] = file.path;
    });

    // अब सुरक्षित तरीके से पाथ निकालें
    const rmc_nc_cert_path = fileMap['rmc_nc_cert'] || null;
    const degree_diploma_path = fileMap['degree_diploma'] || null;
    const experience_cert_path = fileMap['experience_cert'] || null;
    const photo_id_path = fileMap['photo_id'] || null;
    const pan_photo_path = fileMap['pan_photo'] || null;
    const bank_proof_path = fileMap['bank_proof'] || null;

    const metadata = JSON.stringify({ license_number: license_number || 'N/A', verified_at: new Date().toISOString() });

    // डेजिग्नेशन के हिसाब से एम्प्लॉय कोड
    const prefix = designation === 'DOCTOR' ? 'CP-DOC' : designation === 'NURSE' ? 'CP-NURSE' : 'CP-EMP';
    const employee_code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const query = `
      INSERT INTO staff_directory (
        employee_code, full_name, designation, department, email, phone, 
        pan, council_reg, bank_details, rmc_nc_cert_path, degree_diploma_path, 
        experience_cert_path, photo_id_path, pan_photo_path, bank_proof_path, metadata, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      employee_code, full_name, designation, department, email, phone, 
      pan || null, council_reg || null, bank_details || null,
      rmc_nc_cert_path, degree_diploma_path, experience_cert_path, 
      photo_id_path, pan_photo_path, bank_proof_path, metadata, 'ACTIVE'
    ];

    db.run(query, values, function(err) {
      if (err) {
        console.error('❌ Error onboarding staff:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }

      res.status(201).json({
        success: true,
        message: 'Staff successfully onboarded with all compliance documents!',
        data: {
          id: this.lastID,
          employee_code,
          full_name,
          designation,
          department
        }
      });
    });
  } catch (error) {
    console.error('❌ Error in onboardStaff:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

module.exports = { onboardStaff, upload };