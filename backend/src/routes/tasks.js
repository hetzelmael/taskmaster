const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/TaskController');

const router = express.Router();

router.use(auth);

router.get('/', ctrl.list);
router.post('/', ctrl.createValidators, ctrl.create);
router.put('/:id', ctrl.updateValidators, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
