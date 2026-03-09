const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);

module.exports = router;
