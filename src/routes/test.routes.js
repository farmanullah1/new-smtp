const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const emailPreviewController = require('../controllers/emailPreview.controller');

// Health & Diagnostics
router.get('/health', healthController.checkHealth);
router.post('/test-email', healthController.sendTestEmail);

// Email Template Previews
router.get('/previews', emailPreviewController.listTemplates);
router.get('/previews/:templateName', emailPreviewController.renderPreview);

module.exports = router;
