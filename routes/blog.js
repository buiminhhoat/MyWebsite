const express = require('express');
const { verify } = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/database');
const dateTime = require('node-datetime');
const marked = require('marked')
const renderer = new marked.Renderer();
renderer.heading = (text, level) => `<h${level}>${text}</h${level}>`;
marked.setOptions({renderer});
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const DOMPurify = createDOMPurify(new JSDOM('').window);
const nav_bar_html = require('../fs/nav')
const blog_category = require('../fs/category')
const slugify = require('slugify')

const getUserData = (id) =>
{
    return new Promise((resolve, reject) =>
    {
        db.query('SELECT * FROM user WHERE id = ?', [id], (err, data) => {
            if (err)
            {
                reject(err)
            }
            resolve(data[0])
        });
    })
}

router.get('/write', async (req,res) => {
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        const isAdmin = verify(tokenKey,'secret').isAdmin;
        let nav_bar = nav_bar_html.user;
        if (isAdmin)
            nav_bar = nav_bar_html.admin;
        const userId = verify(tokenKey,'secret').id;
        const userData = await getUserData(userId);
        const userName = userData.userName;
        let category_column_1 = '', category_column_2 = '', category_column_3 = '', category_column_4 = '';
        for (let i = 0; i <= 1; i++)
        {
            category_column_1 += `
                <input type="checkbox" id="${blog_category[i].titleURL}" name="${blog_category[i].titleURL}" value="${blog_category[i].id}">
                <label for="${blog_category[i].titleURL}"> ${blog_category[i].title} </label><br>
                `
        }
        for (let i = 2; i <= 3; i++)
        {
            category_column_2 += `
                <input type="checkbox" id="${blog_category[i].titleURL}" name="${blog_category[i].titleURL}" value="${blog_category[i].id}">
                <label for="${blog_category[i].titleURL}"> ${blog_category[i].title} </label><br>
                `
        }
        for (let i = 4; i <= 6; i++)
        {
            category_column_3 += `
                <input type="checkbox" id="${blog_category[i].titleURL}" name="${blog_category[i].titleURL}" value="${blog_category[i].id}">
                <label for="${blog_category[i].titleURL}"> ${blog_category[i].title} </label><br>
                `
        }
        for (let i = 7; i <= 9; i++)
        {
            category_column_4 += `
                <input type="checkbox" id="${blog_category[i].titleURL}" name="${blog_category[i].titleURL}" value="${blog_category[i].id}">
                <label for="${blog_category[i].titleURL}"> ${blog_category[i].title} </label><br>
                `
        }
        res.render('../views/ejs/blog_write.ejs',
            {
                nav_bar: nav_bar,
                lastTitle: "",
                lastSummary: "",
                lastContent: "",
                userId: userId,
                userName: userName,
                category_column_1: category_column_1,
                category_column_2: category_column_2,
                category_column_3: category_column_3,
                category_column_4: category_column_4
            });
    } else res.redirect('/login');
})

module.exports = router;
