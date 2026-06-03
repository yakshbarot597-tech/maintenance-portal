const http = require('http');

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

async function test() {
    console.log("--- Testing Resident Login & Auth ---");
    // Let's use the resident details for Yaksh: username MMSY@123, password was generated or we can check or create a resident login test
    // Let's try MMSY@123 with password (wait, does MMSY@123 have a password? The test setup has Alice Smith username and password Alice@123)
    // In society Test Commercial Plaza 1780317845255, the resident was alice_resident_1780317845608 with password Alice@123.
    // Let's query the database to find one valid resident username and password hash or just reset it.
    // Wait, let's look at the query_db output from before:
    // Society: yakshbarot597-tech/maintenance-portal has unit A-101 with username MMSY@123, password_hash: we don't know yet.
    // Let's see what is the username of resident for society 12 (Test Commercial Plaza 1780317236742): 'alice_resident_1780317237095' and password was 'Alice@123'.
    // Let's perform resident login for 'alice_resident_1780317237095'
    
    // First, let's get the active residents usernames from database
    const { Pool } = require('pg');
    const config = require('../backend/config');
    const pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database
    });
    
    const usersRes = await pool.query("SELECT username, role FROM users WHERE role='resident'");
    console.log("Resident Users:", usersRes.rows);
    await pool.end();
    
    if (usersRes.rows.length === 0) {
        console.error("No resident users found in database.");
        return;
    }
    
    // Let's try login for the last created resident, let's say username is alice_resident_1780317845608
    const testUsername = "MMSY@123";
    console.log(`Trying resident login for: ${testUsername}`);
    
    const loginRes = await postJson('/api/resident-login', {
        username: testUsername,
        password: "Alice@123",
        property_type: "commercial"
    });
    
    console.log("Login Result status:", loginRes.statusCode);
    console.log("Login Result data:", loginRes.data);
    
    if (!loginRes.data || !loginRes.data.success) {
        console.error("Resident login failed.");
        return;
    }
    
    const token = loginRes.data.token;
    const socName = loginRes.data.society;
    const propType = loginRes.data.property_type;
    
    console.log(`Accessing getSociety for: ${socName} / ${propType}`);
    const getSocRes = await getJson(`/api/society/${encodeURIComponent(socName)}/${encodeURIComponent(propType)}`, token);
    
    console.log("getSociety Result status:", getSocRes.statusCode);
    console.log("getSociety Result data:", getSocRes.data || getSocRes.raw);
}

test().catch(console.error);
