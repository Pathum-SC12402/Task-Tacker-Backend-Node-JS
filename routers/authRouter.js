const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController.js');
const { identifier } = require('../middlewares/Identification.js');

router.post('/signup', authController.verifyCodeAndSignup);
router.post('/signin', authController.signin);
router.post('/signout', identifier, authController.signout);
router.patch('/send-verification-code-new-user',authController.sendVerificationCodeForNewUser);
router.patch('/send-verification-code', authController.sendVerificationCode);
router.patch('/verify-verification-code', authController.verifyVerificationCode);
router.patch('/change-password', identifier, authController.changePassword);
// router.patch('/send-forgot-password-code', authController.sendForgotPasswordCode);
router.patch('/change-forgot-password', authController.changeForgotPasswordCode);

module.exports = router;