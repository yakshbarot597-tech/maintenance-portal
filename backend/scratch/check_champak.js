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

    const userRes = await pool.query(
        `SELECT u.id, u.username, u.role, u.password_hash, ur.is_active, s.society_name, s.property_type
         FROM users u
         LEFT JOIN unit_residents ur ON u.id = ur.user_id
         LEFT JOIN societies s ON u.society_id = s.id
         WHERE LOWER(u.username) = 'champak123'`
    );
    console.log("User details for Champak123:");
    console.log(userRes.rows);

    if (userRes.rows.length > 0) {
        const row = userRes.rows[0];
        const hash = row.password_hash;
        console.log("Hash:", hash);
        const match = await bcrypt.compare('Champak@1234', hash);
        console.log("bcrypt.compare('Champak@1234', hash) matches?", match);
    } else {
        console.log("Champak123 not found!");
    }

    await pool.end();
}

main().catch(console.error);
