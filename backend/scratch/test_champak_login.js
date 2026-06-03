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

async function main() {
    console.log("Testing resident login endpoint for Champak123...");
    const res = await postJson('/api/resident-login', {
        username: 'Champak123',
        password: 'Champak@1234',
        property_type: 'commercial'
    });
    console.log("Response status:", res.statusCode);
    console.log("Response data:", res.data || res.raw);
}

main().catch(console.error);
