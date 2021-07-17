const spicedPg = require("spiced-pg");
var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition"); //return an object has query method that allowed us to talk to the database

module.exports.getSigners = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.addSigner = (first, last, sig) => {
    return db.query(
        `INSERT TO signatures (first, last, signature)
        VLAUES ($1, $2, $3)`, //this two lines will protect us from un wanted user input...
        [first, last, sig] ///
    );
};
