const express = require('express');
const router = express.Router();
const path = require('path');

// पाथ को पूरी तरह सुरक्षित बनाने के लिए path.resolve का उपयोग
const hrController = require(path.join(__dirname, '../controllers/hr.controller.js'));

// ऑनबोर्डिंग रूट
router.post('/onboard', hrController.upload, hrController.onboardStaff);

module.exports = router;