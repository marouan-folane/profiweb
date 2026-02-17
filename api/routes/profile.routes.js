const express = require('express');
const { protect } = require('../middlewares/auth');
const { upload } = require('../middlewares/uploadImage');
const {
    updateProfile,
    updateAvatar,
    requestEmailChange,
    verifyEmailChange,
    changePassword,
    requestPasswordChangeVerification
} = require('../controllers/profileController');

const router = express.Router();

router.use(protect);

router.patch('/update-me', updateProfile);
router.patch('/update-avatar', upload, updateAvatar);
router.post('/request-email-change', requestEmailChange);
router.post('/verify-email-change', verifyEmailChange);
router.post('/request-password-verify', requestPasswordChangeVerification);
router.patch('/update-password', changePassword);

module.exports = router;
