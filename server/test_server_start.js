const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'index.js');
console.log(`Testing server start: ${serverPath}`);

const server = spawn('node', [serverPath], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
    output += data.toString();
    console.log(`STDOUT: ${data}`);
    if (data.toString().includes('Server running')) {
        console.log('SUCCESS: Server started successfully.');
        server.kill();
        process.exit(0);
    }
});

server.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.log(`STDERR: ${data}`);
});

setTimeout(() => {
    console.log('TIMEOUT: Server did not start in time.');
    if (errorOutput) console.log(`Error output: ${errorOutput}`);
    server.kill();
    process.exit(1);
}, 5000);
