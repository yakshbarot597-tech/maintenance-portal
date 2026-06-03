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

async function main() {
    console.log("1. Logging in as Champak123...");
    const loginRes = await postJson('/api/resident-login', {
        username: 'Champak123',
        password: 'Champak@1234',
        property_type: 'commercial'
    });
    
    console.log("Login status:", loginRes.statusCode);
    if (!loginRes.data || !loginRes.data.success) {
        console.log("Login failed:", loginRes.data || loginRes.raw);
        return;
    }
    
    const token = loginRes.data.token;
    console.log("Login success! Token:", token);
    
    console.log("2. Requesting society details...");
    const getSocRes = await getJson(`/api/society/Yaksh/commercial`, token);
    console.log("getSociety status:", getSocRes.statusCode);
    if (getSocRes.statusCode !== 200) {
        console.log("getSociety error response:", getSocRes.data || getSocRes.raw);
    } else {
        console.log("getSociety keys returned:", Object.keys(getSocRes.data));
    }
}

main().catch(console.error);
