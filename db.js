const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);
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

module.exports.getUsersByCity = (city) => {
    return db.query(
        `SELECT first, last, age, city, homepage FROM users
        JOIN signatures ON users.id = signatures.user_id
        LEFT JOIN profiles ON users.id = profiles.user_id
        WHERE LOWER(city) = LOWER($1)
        `,
        [city]
    );
};

module.exports.addProfile = (age, city, homepage, user_id) => {
    return db.query(
        `INSERT INTO profiles(age, city, homepage, user_id)
         VALUES ($1, $2, $3, $4) RETURNING id
        `,
        [age || null, city || null, homepage || null, user_id]
    );
};

module.exports.getUser = (userId) => {
    return db.query(
        `SELECT first, last, email, age, city, homepage
        FROM users 
        LEFT JOIN 
        profiles 
        ON users.id = profiles.user_id
        WHERE users.id = $1;
        `,
        [userId]
    );
};

module.exports.edit_usersTable = (
    first,
    last,
    email,
    hashed_password,
    userId
) => {
    return db.query(
        `UPDATE users 
        SET first=$1, last=$2, email=$3, hashed_password=$4
        WHERE id=$5;
        `,
        [first, last, email, hashed_password, userId]
    );
};

module.exports.edit_profilesTable = (age, city, homepage, user_id) => {
    return db.query(
        `INSERT INTO users_profile(age, city, homepage, user_id)
        VALUES ($1, $2, $3, $4)  
        ON CONFLICT (user_id)
        DO UPDATE SET age=$1, city=$2, url=$3, user_id=$4;
        `,
        [age || null, city || null, homepage || null, user_id]
    );
};
