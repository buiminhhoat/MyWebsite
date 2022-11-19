const express = require('express');
const app = express();
const path = require('path');
const publicDircetory = path.join(__dirname,'./public');
app.listen(8888,()=>console.log('Localhost is on!'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(express.static(publicDircetory));
app.set('view engine','hbs');
app.set('view engine', 'ejs');
const session = require('express-session');
app.use(session({
    secret: 'padv',
    cookie: {maxAge:60000000}
}));
app.use('/',require('./routes/pages.js'));
app.use('/',require('./routes/myHomePage'));
router.use('/authentication', require('./authentication'));