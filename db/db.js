const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');


async function getDatabase() {
    const db = await open({
        filename: path.join(__dirname, '../ex.db'), 
        driver: sqlite3.Database
    });
    return db;
}


module.exports = { getDatabase };

