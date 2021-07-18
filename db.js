const spicedPg = require("spiced-pg");
var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition"); //return an object has query method that allowed us to talk to the database
module.exports.getSigners = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.addSigner = (first, last, signature) => {
    return db.query(
        `INSERT INTO signatures (first, last, signature)
        VALUES ($1, $2, $3) RETURNING id`,
        [first, last, signature]
    );
};
