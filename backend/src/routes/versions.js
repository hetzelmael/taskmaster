const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/VersionController');

const router = express.Router();
router.use(auth);

router.get('/', ctrl.list);
router.post('/', ctrl.createValidators, ctrl.create);
router.delete('/:id', ctrl.removeValidators, ctrl.remove);

module.exports = router;
