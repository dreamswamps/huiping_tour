const express = require('express');

const router = express.Router();

router.use(require('./user'));
router.use(require('./images'));
router.use(require('./spots'));
router.use(require('./products'));
router.use(require('./system'));

module.exports = router;
