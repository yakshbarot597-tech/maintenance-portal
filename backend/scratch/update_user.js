const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('../config');

async function main() {
    const pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database
    });

    const hash = await bcrypt.hash('Alice@123', 10);
    console.log("Setting password to Alice@123, hash:", hash);

    const updateRes = await pool.query(
        "UPDATE users SET password_hash = $1 WHERE LOWER(username) = 'mmsy@123'",
        [hash]
    );
    console.log("Updated rows:", updateRes.rowCount);

    const userRes = await pool.query(
        `SELECT u.id, u.username, u.role, u.password_hash, ur.is_active, s.society_name, s.property_type
         FROM users u
         LEFT JOIN unit_residents ur ON u.id = ur.user_id
         LEFT JOIN societies s ON u.society_id = s.id
         WHERE LOWER(u.username) = 'mmsy@123'`
    );
    console.log("User details:", userRes.rows);

    await pool.end();
}

main().catch(console.error);
