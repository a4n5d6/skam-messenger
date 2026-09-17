const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');


async function getDatabase() {
    const db = await open({
        filename: path.join(__dirname, '../ex.db'), 
        driver: sqlite3.Database
    });
    // включить поддержку каскадного удаления
    // await db.run("PRAGMA foreign_keys = ON;");
    return db;
}


module.exports = { getDatabase };
