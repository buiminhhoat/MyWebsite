const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('../views/hbs/homepage.hbs'));
router.get('/login', (req, res) => res.render('../views/hbs/login.hbs'));

module.exports = router;
