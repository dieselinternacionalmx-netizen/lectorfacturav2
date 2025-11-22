const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

console.log("--- SYSTEM DIAGNOSTIC ---");

// 1. Check Database File
const dbPath = path.join(__dirname, 'database.sqlite');
if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`[OK] Database exists (${(stats.size / 1024).toFixed(2)} KB)`);
} else {
    console.error("[FAIL] Database file NOT found!");
}

// 2. Check Server Connectivity
console.log(`Testing connectivity to http://localhost:${PORT}/api/bank-transactions...`);

const req = http.get(`http://localhost:${PORT}/api/bank-transactions`, (res) => {
    console.log(`[OK] Server responded with status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`[OK] Response length: ${data.length} chars`);
        try {
            const json = JSON.parse(data);
            console.log(`[OK] Valid JSON received. Items: ${json.length}`);
        } catch (e) {
            console.error(`[FAIL] Invalid JSON: ${e.message}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`[FAIL] Connection error: ${e.message}`);
    console.log("POSSIBLE CAUSES:");
    console.log("1. Server is not running (Window closed?)");
    console.log("2. Server hung/crashed");
    console.log("3. Port 3000 blocked");
});

req.end();
