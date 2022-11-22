const express = require('express');
const { verify } = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/database');
const dateTime = require('node-datetime');
const slugify = require('slugify')

router.post('/lock', (req,res) => {
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        var isAdmin = verify(tokenKey,'secret').isAdmin;
        var emailAdmin = verify(tokenKey,'secret').email;
        if (isAdmin)
        {
            var {email} = req.body;
            db.query('SELECT * FROM user WHERE email = ?', [email], (err,result) => {
                if (result.length <= 0)
                {
                    return res.render('../views/hbs/admin_manage.hbs', {message : 'Không tồn tại email này'});
                }

                if (result[0].email == emailAdmin)
                {
                    return res.render('../views/hbs/admin_manage.hbs', {message : 'Bạn không thể hủy tài khoản này'});
                }

                db.query(`UPDATE user SET isBan = 1 WHERE email = '${email}'`, (err,result) => {
                    if(err) console.log(err);
                });
                return res.render('../views/hbs/admin_manage.hbs', {message : `Bạn đã khóa user ${email}!`});
            })

        } else res.redirect('/login');
    } else res.redirect('/login');
});

router.post('/unlock', (req,res) => {
    const tokenKey = req.session.tokenKey;
    if(tokenKey)
    {
        var isAdmin = verify(tokenKey,'secret').isAdmin;
        if(isAdmin)
        {
            var {email} = req.body;

            db.query('SELECT * FROM user WHERE email = ?', [email], (err, result) => {
                if(result.length <= 0)
                {
                    return res.render('../views/hbs/admin_manage.hbs',{message : 'Không tồn tại email này'});
                }

                db.query(`UPDATE user SET isBan = 0 WHERE email = '${email}'`,(err,result)=>{
                    if(err) console.log(err);
                });
                return res.render('../views/hbs/admin_manage.hbs',{message : `Bạn đã mở khóa user ${email}!`});
            })

        } else res.redirect('/login');
    } else res.redirect('/login');
});

router.get('/manageuser', (req,res) => {
    const tokenKey = req.session.tokenKey;
    if(tokenKey)
    {
        var isAdmin = verify(tokenKey,'secret').isAdmin;
        if(isAdmin)
        {
            return res.render('../views/hbs/admin_manage.hbs');
        }else res.redirect('/login');
    }else res.redirect('/login');
})

module.exports = router;