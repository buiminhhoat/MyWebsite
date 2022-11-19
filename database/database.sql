DROP
DATABASE IF EXISTS blog;
CREATE
DATABASE IF NOT EXISTS blog;

USE
blog;

CREATE TABLE post
(
    id          bigint(20) AUTO_INCREMENT,
    authorId    bigint(20),
    title       varchar(200),
    titleURL    varchar(200),
    isPublic    tinyint(1),
    createdAt   datetime,
    updatedAt   datetime,
    publishedAt datetime,
    content     text,
    summary     tinytext,
    PRIMARY KEY (id, titleURL)
);

CREATE TABLE post_category
(
    postId     bigint(20),
    categoryId bigint(20),
    PRIMARY KEY (postId, categoryId)
);

CREATE TABLE category
(
    id       bigint(20) PRIMARY KEY,
    title    varchar(75),
    titleURL varchar(100),
    content  text
);

CREATE TABLE post_comment
(
    id          bigint(20) PRIMARY KEY AUTO_INCREMENT,
    postId      bigint(20),
    parentId    bigint(20),
    userId      bigint(20),
    createdAt   datetime,
    publishedAt datetime,
    content     text
);

CREATE TABLE `user`
(
    id           bigint(20) AUTO_INCREMENT,
    userName     varchar(50),
    email        varchar(100),
    passwordHash varchar(100),
    registeredAt datetime,
    lastLogin    datetime,
    profile      text,
    isBan        tinyint(1),
    isAdmin      tinyint(1),
    PRIMARY KEY (id, email)
);

ALTER TABLE post_category
    ADD CONSTRAINT post_category_post_fk FOREIGN KEY IF NOT EXISTS (postId) REFERENCES post(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE post_category
    ADD CONSTRAINT post_category_category_fk FOREIGN KEY IF NOT EXISTS (categoryId) REFERENCES category(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE post
    ADD CONSTRAINT post_user_fk FOREIGN KEY IF NOT EXISTS (authorId) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE post_comment
    ADD CONSTRAINT post_comment_user_fk FOREIGN KEY IF NOT EXISTS (userId) REFERENCES `user`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE post_comment
    ADD CONSTRAINT post_comment_post_fk FOREIGN KEY IF NOT EXISTS (postId) REFERENCES post(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE post_comment
    ADD CONSTRAINT post_comment_post_comment_fk FOREIGN KEY IF NOT EXISTS (parentId) REFERENCES post_comment(id) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO category
VALUES (1, 'Food', 'food', NULL);
INSERT INTO category
VALUES (2, 'Travel', 'travel', NULL);
INSERT INTO category
VALUES (3, 'Health and fitness', 'health-and-fitness', NULL);
INSERT INTO category
VALUES (4, 'Lifestyle', 'lifestyle', NULL);
INSERT INTO category
VALUES (5, 'Fashion and Beauty', 'fashion-and-beauty', NULL);
INSERT INTO category
VALUES (6, 'Personal', 'personal', NULL);
INSERT INTO category
VALUES (7, 'Sports', 'sports', NULL);
INSERT INTO category
VALUES (8, 'Business', 'business', NULL);
INSERT INTO category
VALUES (9, 'News', 'news', NULL);
INSERT INTO category
VALUES (10, 'Book and writing', 'book-and-writing', NULL);