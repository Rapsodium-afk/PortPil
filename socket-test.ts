import net from 'net';

const host = '88.2.196.170';
const ports = [3306, 5432, 5450];

async function testPorts() {
    for (const port of ports) {
        console.log(`Testing TCP ${host}:${port}...`);
        const socket = new net.Socket();
        const start = Date.now();
        
        const promise = new Promise((resolve) => {
            socket.setTimeout(10000);
            socket.on('connect', () => {
                const duration = Date.now() - start;
                console.log(`  SUCCESS: Port ${port} is OPEN (${duration}ms)`);
                socket.destroy();
                resolve(true);
            });
            socket.on('timeout', () => {
                console.log(`  FAILED: Port ${port} TIMEOUT (10s)`);
                socket.destroy();
                resolve(false);
            });
            socket.on('error', (err) => {
                console.log(`  FAILED: Port ${port} ERROR: ${err.message}`);
                socket.destroy();
                resolve(false);
            });
            socket.connect(port, host);
        });
        await promise;
    }
}

testPorts();
