const express = require('express');
const { verify } = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/database');
const nav_bar_html = require('../fs/nav')
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

router.get('/:userId', async (req, res) =>
{
    const tokenKey = req.session.tokenKey;
    let userSection = "";
    let nav_bar = nav_bar_html.oth;
    let userOriginId = -1;
    let isAdminBool = 0;
    if (tokenKey)
    {
        const isAdmin = verify(tokenKey,'secret').isAdmin;
        const id = verify(tokenKey, 'secret').id;
        userOriginId = id;
        const userData = await getUserData(id);
        if (isAdmin)
        {
            nav_bar = nav_bar_html.admin;
            isAdminBool = 1;
        }
        else
            nav_bar = nav_bar_html.user;
        userSection =
            `
        <i class="fa-solid fa-user"></i>
        <a href="/users/${id}" class="usersection"> ${userData.userName}</a>
        `
    }
    const {userId} = req.params;
    const userDataTem = await getUserData(userId);
    const authorEmail = userDataTem.email;
    const userProfile = (userDataTem.profile ? userDataTem.profile : '')
    const userNumBlogs = 0;
    const userDataSection = `
    <div class="row">
        
        <div class="column left">
            <i class="fa-solid fa-user fa-5x"></i>
        </div>
        <div class="column right">
            <h4> ${userDataTem.userName} </h4> 
            <h5> ${userDataTem.email} </h5> 
            <h6> Giới thiệu: ${userProfile}</h6>
            <h6> Số lượng blog đã viết: ${userNumBlogs}</h6>
        </div>
    </div>
    `
    db.query("SELECT * FROM post WHERE authorId = ? ORDER BY createdAt DESC", [userId], (error,result) => {
        const getHTMLBlog = async (ob) =>
        {
            let extraButtonHTML = "";
            if (isAdminBool || userOriginId == userId)
                extraButtonHTML =
                    `
                <a href="/blog/edit/${ob.titleURL}" class="btn btn-warning"> Edit </a>
                <button class="btn btn-danger" onclick="confirmDelete('/blog/delete/${ob.titleURL}', ${userId})"> Delete </button>
                `;
            else
                extraButtonHTML = ``;
            var categoryList = [];

            return `
            <div class="card mt-4">
                <div class="card-body">
                    <h4 class="card-title"> ${ob.title} - <a href="/users/${userId}">${authorEmail}</a> </h4>
                    <div class="card-subtitle text-muted mb-2">
                        ${ob.createdAt.toISOString().replace('T', ' ').substr(0, 19)}
                    </div>
                    <div class="card-text mb-2"> 
                            <strong> Summary: </strong> ${ob.summary}
                        </div>
                    <div class="card-text mb-2"> 
                        <strong> Category: </strong> ${categoryList.join(', ')}
                    </div>
                    <a href="/blog/view/${ob.titleURL}" class="btn btn-primary"> Read More </a>
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
            return res.render('../views/ejs/users_profile.ejs', {
                userName: userDataTem.userName,
                nav_bar: nav_bar,
                userSection: userSection,
                userDataSection: userDataSection,
                userId: userId,
                listOfBlogs: data
            })
        })
    })
})

module.exports = router;
