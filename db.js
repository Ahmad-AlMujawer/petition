const spicedPg = require("spiced-pg");
var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition"); //return an object has query method that allowed us to talk to the database
module.exports.getSigners = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.addSigner = (user_id, signature) => {
    return db.query(
        `INSERT INTO signatures (user_id, signature)
        VALUES ($1, $2) RETURNING id`,
        [user_id, signature]
    );
};
module.exports.register = (first, last, email, hashed_password) => {
    return db.query(
        `INSERT INTO users (first, last, email, hashed_password)
        VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, email, hashed_password]
    );
};
module.exports.getUserByEmail = (email) => {
    return db.query(
        `SELECT * FROM users
            WHERE email = $1`,
        [email]
    );
};

module.exports.findSignature = (id) => {
    return db.query(
        `SELECT signature FROM signatures
                WHERE user_id = $1`,
        [id]
    );
};
