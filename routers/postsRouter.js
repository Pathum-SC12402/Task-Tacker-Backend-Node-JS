const express = require('express');
const router = express.Router();
const postsController = require('../controllers/PostsController.js');
const { identifier } = require('../middlewares/Identification.js');

router.get('/all-posts', postsController.getPosts);
// router.post('/single-post', authController.signin);
// router.post('/create-post', identifier, authController.signout);

// router.put('/update-post', identifier, authController.sendVerificationCode);
// router.delete('/delete-post', identifier, authController.verifyVerificationCode);

module.exports = router;