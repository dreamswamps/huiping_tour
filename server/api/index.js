const express = require('express');

const router = express.Router();

router.use('/login', require('./login'));
router.use('/user', require('./user'));
router.use(require('./images'));
router.use(require('./spots'));
router.use('/mall', require('./mall'));
router.use('/messages', require('./messages'));
router.use(require('./system'));

module.exports = router;
