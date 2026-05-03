const express = require('express');
const ctrl = require('../controllers/AuthController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', ctrl.registerValidators, ctrl.register);
router.post('/login', ctrl.loginValidators, ctrl.login);
router.delete('/me', auth, ctrl.deleteAccount);

module.exports = router;
