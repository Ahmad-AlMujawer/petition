const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
); //return an object has query method that allowed us to talk to the database
module.exports.getSigners = () => {
    return db.query(
        `SELECT first, last, age, city, homepage FROM users 
        JOIN signatures 
        ON users.id = signatures.user_id
        LEFT JOIN profiles
        ON users.id = profiles.user_id
        `
    );
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

// module.exports.getUsersByCity = (city) => {
//     return db.query(
//         `SELECT first, last, age, city, homepage FROM users
//         JOIN signatures ON users.id = signatures.user_id
//         LEFT JOIN profiles ON users.id = profiles.user_id
//         WHERE LOWER(city) = LOWER($1)
//         `,
//         [city]
//     );
// };

module.exports.addProfile = (age, city, homepage, user_id) => {
    return db.query(
        `INSERT INTO profiles(age, city, homepage, user_id)
         VALUES ($1, $2, $3, $4) RETURNING id
        `,
        [age, city, homepage, user_id]
    );
};
