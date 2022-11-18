const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('../views/hbs/homepage.hbs'));

module.exports = router;
