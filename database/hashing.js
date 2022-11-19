const bcrypt = require("bcrypt");

exports.hashpassword = (password) => {
    return bcrypt.hashSync(password, 8);
}

exports.compare = (passwordA, passwordB) => {
    return bcrypt.compareSync(passwordA, passwordB);
}