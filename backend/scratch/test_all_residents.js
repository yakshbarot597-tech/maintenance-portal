const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const http = require('http');
const config = require('../config');

const API_KEY = 'hms-api-key-2024-secure';

function postJson(urlPath, data) {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: urlPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'x-api-key': API_KEY
            }
        }, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

function getJson(urlPath, token) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: urlPath,
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
                'Authorization': `Bearer ${token}`
            }
        }, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    const pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database
    });

    const usersRes = await pool.query(
        `SELECT u.username, u.role, u.password_hash, s.society_name, s.property_type
         FROM users u
         JOIN societies s ON u.society_id = s.id
         WHERE u.role='resident'`
    );
    console.log(`Found ${usersRes.rows.length} resident users.`);

    const passwordHash = await bcrypt.hash('Alice@123', 10);

    for (const r of usersRes.rows) {
        console.log(`\nTesting user: ${r.username} (Society: ${r.society_name}, PropType: ${r.property_type})`);
        
        // Update password temporarily to Alice@123 to test login
        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE username = $2",
            [passwordHash, r.username]
        );

        const propTypeClient = r.property_type === 'shop' ? 'commercial' : r.property_type === 'villa' ? 'bungalow' : 'flat';

        const loginRes = await postJson('/api/resident-login', {
            username: r.username,
            password: "Alice@123",
            property_type: propTypeClient
        });

        console.log("  Login status:", loginRes.statusCode, "success:", loginRes.data?.success);
        if (loginRes.data?.success) {
            const getSocRes = await getJson(
                `/api/society/${encodeURIComponent(loginRes.data.society)}/${encodeURIComponent(loginRes.data.property_type)}`,
                loginRes.data.token
            );
            console.log("  getSociety status:", getSocRes.statusCode);
            if (getSocRes.statusCode !== 200) {
                console.log("  getSociety error response:", getSocRes.data || getSocRes.raw);
            }
        } else {
            console.log("  Login failed message:", loginRes.data?.message);
        }

        // Restore original password hash
        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE username = $2",
            [r.password_hash, r.username]
        );
    }

    await pool.end();
}

main().catch(console.error);
