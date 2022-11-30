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

const getPostData = async (url) =>
{
    return new Promise((resolve, reject) =>
    {
        db.query('SELECT * FROM post WHERE titleUrl = ?', [url], (err, data) => {
            if (err)
            {
                reject(err)
            }
            resolve(data[0])
        });
    })
}

const getAllComments = async (postId) =>
{
    return new Promise((resolve, reject) =>
    {
        db.query("SELECT * FROM post_comment WHERE postId = ? ORDER BY createdAt", [postId], async (err, res) => {
            if (err)
                reject(err)
            resolve(res)
        });
    })
}

const buildCommentSection = async (postId, postUrl) =>
{
    const commentsRaw = await getAllComments(postId);
    const commentList = {}
    const comments = {}
    for (let i = 0; i < commentsRaw.length; i++)
        comments[commentsRaw[i].id] = commentsRaw[i];
    for (let i = 0; i < commentsRaw.length; i++)
        commentList[commentsRaw[i].id] = []
    let rootComments = [];
    for (let i = 0; i < commentsRaw.length; i++)
    {
        if (commentsRaw[i].parentId)
            commentList[commentsRaw[i].parentId].push(commentsRaw[i].id);
        else
            rootComments.push(commentsRaw[i].id);
    }
    let html = "";
    for (var id in rootComments)
    {
        html += await dfsComment(rootComments[id], commentList, comments, 0, postUrl);
    }
    return html;
}

const dfsComment = async (id, commentList, comments, height, postUrl) =>
{
    const userData = await getUserData(comments[id].userId);
    const userName = userData.userName;
    const userEmail = userData.email;
    let html =
        `
    <div class="card" style="margin-left:${30 + height * 50}px; margin-right:30px; margin-bottom:10px">
        <form method="POST" action="${postUrl}/comment/${comments[id].id}">
            <div class="card-body">
                <div class="username"> ${userName} - <a href="/users/${comments[id].userId}" style="color: #1E7EC8"> ${userEmail} </a> </div>
                <div class="time"> ${comments[id].createdAt.toISOString().replace('T', ' ').substr(0, 19)} </div>
                <div class="user-comment" style="margin-bottom: 10px"> ${comments[id].content} </div>
                <div class="reply"> <a href="javascript:void(0)" onclick="reply(this)" style="color: #1E7EC8; font-size: 15px; text-decoration: none"> REPLY </a> </div>
            </div>
        </form>
    </div>
    `
    for (var i in commentList[id])
    {
        html += await dfsComment(comments[commentList[id][i]].id, commentList, comments, height + 1, postUrl);
    }
    return html;
}

const getLastPostId = async () =>
{
    return new Promise((resolve, reject) =>
    {
        db.query(`SELECT AUTO_INCREMENT
                  FROM  INFORMATION_SCHEMA.TABLES
                  WHERE TABLE_SCHEMA = 'blog'
                  AND   TABLE_NAME   = 'post';`, async (err, res) => {
            if (err)
                reject(err)
            resolve(res[0].AUTO_INCREMENT)
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

const countNumberComments = (postId) =>
{
    return new Promise((resolve, reject) =>
    {
        db.query('SELECT * FROM post_comment WHERE postId = ?', [postId], (err, data) => {
            if (err)
            {
                reject(err)
            }
            resolve(data.length)
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

router.post('/saveblog', async (req,res) => {
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

        var categoryList = [];
        for (var key in req.body)
            if (key != "title" && key != "summary" && key != "content")
            {
                categoryList.push(req.body[key])
            }
        if (categoryList.length == 0)
            categoryList.push(11);
        const {title, summary, content} = req.body;
        const titleURL = slugify(title,
            {
                locale: 'vi',
                lower: true,
                strict: true
            });
        db.query("SELECT * FROM post WHERE titleURL = ?", [titleURL], (error, result) => {
            if(result.length > 0)
            {
                return res.render('../views/ejs/blog_write.ejs',
                    {
                        nav_bar: nav_bar,
                        lastTitle: title,
                        lastSummary: summary,
                        lastContent: content,
                        userId: userId,
                        userName: userName,
                        category_column_1: category_column_1,
                        category_column_2: category_column_2,
                        category_column_3: category_column_3,
                        category_column_4: category_column_4,
                        message : 'Tiêu đề này đã được thêm vào trước đây mới bạn đặt lại tiêu đề'
                    })
            }
            var dt = dateTime.create();
            dt.offsetInHours(7);
            dt = dt.format('Y-m-d H:M:S');
            db.query("INSERT INTO post SET ?", {authorID:userId, title:title, titleURL:titleURL, summary:summary, content:content, createdAt:dt}, async (error,result)=>
            {
                if (error)
                {
                    console.log(error)
                }
                const currentPostId = await getLastPostId();
                for (var i = 0; i < categoryList.length; i++)
                {
                    db.query("INSERT INTO post_category SET ?", {postId: currentPostId - 1, categoryId: categoryList[i]}, (e, r) =>
                    {
                        if (e)
                        {
                            console.log(e)
                        }
                    })

                }
                return res.redirect('/homepage/');
            })
        })
    } else res.redirect('/login');
});

router.get('/view/:titleURL', async (req, res) =>
{
    const tokenKey = req.session.tokenKey;
    let nav_bar = nav_bar_html.oth;
    let userName = "";
    if (tokenKey)
    {
        const isAdmin = verify(tokenKey,'secret').isAdmin;
        const userId = verify(tokenKey,'secret').id;
        const userData = await getUserData(userId);
        if (isAdmin)
            nav_bar = nav_bar_html.admin;
        else
            nav_bar = nav_bar_html.user;
        userName = `
            <li style= "display: inline-flex">
                <a href="/users/${userId}" class="color_animation" style="color: white">
                    <i class="fa-solid fa-user"></i>
                    ${userData.userName}
                </a>
            <li>
        `
    }
    const {titleURL} = req.params;
    db.query("SELECT * FROM post WHERE titleURL = ?", [titleURL], async (error, result) => {
        if (result.length <= 0)
        {
            return res.status(404).redirect('/homepage')
        }

        const user = await getUserData(result[0].authorId);
        const commentSection = await buildCommentSection(result[0].id, titleURL);
        var categoryList = [];
        const allCategories = await getCategoryOfPost(result[0].id);
        for (var i = 0; i < allCategories.length; i++)
            categoryList.push(allCategories[i].title)
        const numComments = await countNumberComments(result[0].id);
        return res.render('../views/ejs/blog.ejs', {
            nav_bar: nav_bar,
            userName: userName,
            title: result[0].title,
            category: categoryList.join(', '),
            summary: result[0].summary,
            content: DOMPurify.sanitize(marked.parse(result[0].content)),
            authorId: result[0].authorId,
            authorEmail: user.email,
            createdAt: result[0].createdAt.toISOString().replace('T', ' ').substr(0, 19),
            numComments: numComments,
            commentSection: commentSection,
            postUrl: titleURL
        })
    })
})

router.post('/view/:postUrl/comment', async (req, res) =>
{
    const {commentContent} = req.body;
    const {postUrl} = req.params;
    const postData = await getPostData(postUrl);
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        var userId = verify(tokenKey,'secret').id;
        var dt = dateTime.create();
        dt.offsetInHours(7);
        dt = dt.format('Y-m-d H:M:S');
        db.query('INSERT INTO post_comment SET ?', {postId:postData.id, userId:userId, content:commentContent, createdAt:dt}, (error, result) =>
        {
            if (error)
            {
                console.log(error);
            }
            return res.redirect(`/blog/view/${postUrl}`);
        })
    } else
        res.redirect('/login');
})

router.post('/view/:postUrl/comment/:parentId', async (req, res) =>
{
    const {commentContent} = req.body;
    const {postUrl, parentId} = req.params;
    const postData = await getPostData(postUrl);
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        const userId = verify(tokenKey,'secret').id;
        var dt = dateTime.create();
        dt.offsetInHours(7);
        dt = dt.format('Y-m-d H:M:S');
        db.query('INSERT INTO post_comment SET ?', {postId:postData.id, userId:userId, parentId:parentId, content:commentContent, createdAt:dt}, (error, result) =>
        {
            if (error)
            {
                console.log(error);
            }
            return res.redirect(`/blog/view/${postUrl}`);
        })
    } else
        res.redirect('/login');
})

router.get('/delete/:postUrl', async (req, res) =>
{
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        const isAdmin = verify(tokenKey,'secret').isAdmin;
        const userId = verify(tokenKey,'secret').id;
        const {postUrl} = req.params;
        const postData = await getPostData(postUrl);
        if (!isAdmin && userId != postData.authorId)
            res.redirect('/homepage/');
        db.query('DELETE FROM post WHERE titleURL = ?', [postUrl], (err,result)=>{
            if(err) console.log(err);
        });
        const type = req.query.type;
        if (type == 0)
            res.redirect('/homepage/');
        else
            res.redirect(`/users/${type}`);
    } else
        res.redirect('/login');
})

router.post('/update/:postUrl', async (req, res) =>
{
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        const isAdmin = verify(tokenKey,'secret').isAdmin;
        const userId = verify(tokenKey,'secret').id;
        const {postUrl} = req.params;
        const postData = await getPostData(postUrl);
        if (!isAdmin && userId != postData.authorId)
            res.redirect('/homepage/');
        const {summary, content} = req.body;
        db.query(`UPDATE post SET ? WHERE titleURL = '${postUrl}'`, {summary:summary, content:content}, (err,result) => {
            if(err) console.log(err);
        });
        res.redirect(`/blog/view/${postUrl}`);
    } else
        res.redirect('/login');
})

router.get('/edit/:postUrl', async (req, res) =>
{
    const tokenKey = req.session.tokenKey;
    if (tokenKey)
    {
        const isAdmin = verify(tokenKey,'secret').isAdmin;
        const userId = verify(tokenKey,'secret').id;
        const {postUrl} = req.params;
        const postData = await getPostData(postUrl);
        if (!isAdmin && userId != postData.authorId)
            res.redirect('/homepage/');
        const userData = await getUserData(userId);
        return res.render('../views/ejs/blog_edit.ejs',
            {
                userId: userId,
                userName: userData.userName,
                postUrl: postUrl,
                postTitle: postData.title,
                oriSummary: postData.summary,
                oriContent: postData.content
            })
    } else
        res.redirect('/login');
})

module.exports = router;
