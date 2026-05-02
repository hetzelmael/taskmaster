const express = require('express');
const ctrl = require('../controllers/AuthController');

const router = express.Router();

router.post('/register', ctrl.registerValidators, ctrl.register);
router.post('/login', ctrl.loginValidators, ctrl.login);

module.exports = router;
