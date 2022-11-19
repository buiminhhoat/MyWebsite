const mysql = require('mysql');
const dp = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    pass: '',
    database: 'blog',
})

dp.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + dp.threadId);
});

module.exports = dp;