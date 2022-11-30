const express = require('express');
const { verify } = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/database');
const nav_bar_file = require('../fs/nav');
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
const getCategoryOfPost = (id) =>
{
    return new Promise((resolve, reject) =>
    {
        db.query(
        `
            SELECT category.title
            FROM category
            WHERE EXISTS
            (
                SELECT post_category.postId
                FROM post_category
                WHERE post_category.postId = ${id} AND category.id = post_category.categoryId
            )
        `
        , (err, data) => {
            if (err)
            {
                reject(err)
            }
            resolve(data)
        });
    })
}
router.get('/', async (req,res) =>
{
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        const isAdmin = verify(tokenKey,'secret').isAdmin;
        const userId = verify(tokenKey,'secret').id;
        const userData = await getUserData(userId);
        const userName = userData.userName;
        let nav_bar = "";
        if (isAdmin)
            nav_bar = nav_bar_file.admin;
        else
            nav_bar = nav_bar_file.user;
        db.query('SELECT * FROM post ORDER BY createdAt DESC', async (err, result) => {
            const getHTMLBlog = async (ob) =>
            {
                const userDataTem = await getUserData(ob.authorId);
                const authorEmail = userDataTem.email;
                let extraButtonHTML = "";
                if (isAdmin || userId == ob.authorId)
                    extraButtonHTML =
                    `
                    <a href="/blog/edit/${ob.titleURL}" class="btn btn-warning" style="font-size: 16px; text-decoration: none"> Edit </a>
                    <button class="btn btn-danger" style="font-size: 16px; text-decoration: none" onclick="confirmDelete('/blog/delete/${ob.titleURL}')"> Delete </button>
                    `;
                else
                    extraButtonHTML = ``;
                var categoryList = [];
                const allCategories = await getCategoryOfPost(ob.id);
                for (var i = 0; i < allCategories.length; i++)
                    categoryList.push(allCategories[i].title)
                return `
                <div class="card" style="margin-bottom: 20px; font-size: 16px">
                    <div class="card-body" style="margin-left: 10px; margin-bottom: 15px; line-height: 25px">
                        <h3 class="card-title"> ${ob.title} - <a href="/users/${ob.authorId}" style="color: #1E7EC8">${authorEmail}</a> </h3>
                        <div class="card-subtitle text-muted mb-2">
                            ${ob.createdAt.toISOString().replace('T', ' ').substr(0, 19)}
                        </div>
                        <div class="card-text">
                            <strong> Summary: </strong> ${ob.summary}
                        </div>
                        <div class="card-text" style="margin-bottom: 10px">
                            <strong> Category: </strong> ${categoryList.join(', ')}
                        </div>
                        <a href="/blog/view/${ob.titleURL}" class="btn btn-primary" style="font-size: 16px; text-decoration: none"> Read More </a>
                `
                + extraButtonHTML
                +
                `
                    </div>
                </div>
                `
            }
            const getAllHTMLBlog = async (data) =>
            {
                var html = "";
                for(var ob of data)
                {
                    const htmlBlog = await getHTMLBlog(ob)
                    html = html + htmlBlog
                }
                return html
            }
            getAllHTMLBlog(result).then(data =>
            {
                return res.render('../views/ejs/homepage.ejs', {
                    nav_bar: nav_bar,
                    userId: userId,
                    userName: userName,
                    listOfBlogs: data
                })
            })
        })
    }
    else res.redirect('/login');
});

router.get('/search', async (req,res) =>
{
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        const isAdmin = verify(tokenKey,'secret').isAdmin;
        const userId = verify(tokenKey,'secret').id;
        const userData = await getUserData(userId);
        const userName = userData.userName;
        const searchString = req.query.searchString;
        const categoryId = req.query.categoryId;
        const searchStringQuery = searchString.trim().split(/[ ,]+/).join('|');
        let nav_bar = "";
        if (isAdmin)
            nav_bar = nav_bar_file.admin;
        else
            nav_bar = nav_bar_file.user;
        var SQL_query = "";
        if (categoryId == 0)
        {
            SQL_query = `SELECT *
                         FROM post
                         WHERE
                            (
                            title REGEXP '${searchStringQuery}'
                            OR summary REGEXP '${searchStringQuery}'
                            OR titleURL REGEXP '${searchStringQuery}'
                            )
                         ORDER BY createdAt DESC`
        } else
        {
            SQL_query = `SELECT *
                         FROM
                         (
                             SELECT p.*
                             FROM post_category AS pc
                             LEFT JOIN post AS p
                             ON pc.postId = p.id
                             WHERE pc.categoryId = ${categoryId}
                         ) AS oth
                         WHERE
                            (
                               oth.title REGEXP '${searchStringQuery}'
                            OR oth.summary REGEXP '${searchStringQuery}'
                            OR oth.titleURL REGEXP '${searchStringQuery}'
                            )
                         ORDER BY oth.createdAt DESC`
        }
        db.query(SQL_query, async (err, result) => {
            if (err)
            {
                console.log(err)
                return
            }
            const getHTMLBlog = async (ob) =>
            {
                const userDataTem = await getUserData(ob.authorId);
                const authorEmail = userDataTem.email;
                let extraButtonHTML = "";
                if (isAdmin || userId == ob.authorId)
                    extraButtonHTML =
                    `
                    <a href="/blog/edit/${ob.titleURL}" class="btn btn-warning" style="font-size: 16px; text-decoration: none"> Edit </a>
                    <button class="btn btn-danger" style="font-size: 16px; text-decoration: none" onclick="confirmDelete('/blog/delete/${ob.titleURL}')"> Delete </button>
                    `;
                else
                    extraButtonHTML = ``;
                var categoryList = [];
                const allCategories = await getCategoryOfPost(ob.id);
                for (var i = 0; i < allCategories.length; i++)
                    categoryList.push(allCategories[i].title)
                return `
                <div class="card" style="margin-bottom: 20px; font-size: 16px">
                    <div class="card-body" style="margin-left: 10px; margin-bottom: 15px; line-height: 25px">
                        <h3 class="card-title"> ${ob.title} - <a href="/users/${ob.authorId}" style="color: #1E7EC8">${authorEmail}</a> </h3>
                        <div class="card-subtitle text-muted mb-2">
                            ${ob.createdAt.toISOString().replace('T', ' ').substr(0, 19)}
                        </div>
                        <div class="card-text">
                            <strong> Summary: </strong> ${ob.summary}
                        </div>
                        <div class="card-text" style="margin-bottom: 10px">
                            <strong> Category: </strong> ${categoryList.join(', ')}
                        </div>
                        <a href="/blog/view/${ob.titleURL}" class="btn btn-primary" style="font-size: 16px; text-decoration: none"> Read More </a>
                `
                    + extraButtonHTML
                    +
                `
                    </div>
                </div>
                `
            }
            const getAllHTMLBlog = async (data) =>
            {
                var html = "";
                for(var ob of data)
                {
                    const htmlBlog = await getHTMLBlog(ob)
                    html = html + htmlBlog
                }
                return html
            }
            getAllHTMLBlog(result).then(data =>
            {
                return res.render('../views/ejs/homepage.ejs', {
                    nav_bar: nav_bar,
                    userId: userId,
                    userName: userName,
                    listOfBlogs: data
                })
            })
        })
    }
    else
        res.redirect('/login');

})

module.exports = router;
