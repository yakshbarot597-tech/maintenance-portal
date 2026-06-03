const { Pool } = require('pg');
const config = require('../config');

async function main() {
    const pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database
    });

    const socs = await pool.query("SELECT id, society_name, property_type, total_blocks FROM societies");
    console.log("--- Societies ---");
    console.log(socs.rows);

    const users = await pool.query("SELECT id, society_id, username, role, full_name, phone FROM users");
    console.log("--- Users ---");
    console.log(users.rows);

    const units = await pool.query("SELECT id, society_id, block_id, unit_number FROM units");
    console.log("--- Units ---");
    console.log(units.rows);

    const residents = await pool.query("SELECT id, unit_id, user_id, resident_type, is_active FROM unit_residents");
    console.log("--- Unit Residents ---");
    console.log(residents.rows);

    await pool.end();
}

main().catch(console.error);
