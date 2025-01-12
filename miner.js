const { exec } = require('child_process');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const osUtils = require('os-utils');  // For monitoring system load
const pidusage = require('pidusage');  // To monitor the resource usage of processes

const WALLET_ADDRESS = process.env.WALLET_ADDRESS || 'Your_XMR_Wallet_Address';
const POOL_URL = process.env.POOL_URL || 'pool.supportxmr.com:3333';
const WORKER_NAME = `Worker_${os.hostname()}`;
const XMRIG_PATH = path.resolve(__dirname, 'xmrig');
const CONFIG_PATH = path.resolve(__dirname, 'config.json');

const cpuCount = os.cpus().length;

let threadsPerCpuCore = cpuCount;  // Default to using all cores
const maxCpuLoadThreshold = 80;  // Maximum CPU load percentage before reducing threads
const maxGpuLoadThreshold = 85;  // Maximum GPU load percentage before reducing threads

// Define the initial configuration
let config = {
    api: {
        id: null,
        worker_id: WORKER_NAME,
    },
    autosave: true,
    background: false,
    colors: true,
    health_check: false,
    donate_level: 1,
    log_file: null,
    syslog: false,
    user_agent: null,
    verbose: 0,
    api_id: null,
    pools: [
        {
            url: POOL_URL,
            user: WALLET_ADDRESS,
            pass: 'x',
            keepalive: true,
            tls: false,
            tls_fingerprint: null,
            daemon: false,
            self_select: null,
        },
    ],
    randomx: {
        '1gb_pages': true,
        rdmsr: false,
        wrmsr: false,
        num_threads: threadsPerCpuCore,
        hugepages: true,
    },
    opencl: {
        enabled: true,
        platform_index: 0,
        device_index: 0,
        threads: cpuCount,
        worksize: 8,
        memory: 2048,
    },
    cuda: {
        enabled: true,
        platform_index: 0,
        device_index: 0,
        threads: cpuCount,
        worksize: 8,
        memory: 2048,
    },
};

// Save the configuration file
const saveConfigFile = async () => {
    try {
        await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 4));
        console.log(`Configuration updated and saved at ${CONFIG_PATH}`);
    } catch (err) {
        console.error('Error writing configuration file:', err.message);
    }
};

// Monitor system load and adjust miner threads dynamically
const adjustMiningResources = async () => {
    osUtils.cpuUsage(async (cpuLoad) => {
        // Check GPU load (using pidusage to get the GPU process PID)
        try {
            const processes = await pidusage(process.pid);  // Check the current process
            const cpuUsage = processes.cpu;  // Current CPU usage by miner
            const memoryUsage = processes.memory;  // Memory usage by miner

            console.log(`CPU Load: ${cpuLoad * 100}% | Process CPU Usage: ${cpuUsage}%`);

            if (cpuLoad * 100 > maxCpuLoadThreshold || cpuUsage > maxCpuLoadThreshold) {
                // Reduce threads if CPU load is too high
                threadsPerCpuCore = Math.max(1, Math.floor(cpuCount / 2));
                console.log(`High CPU load detected. Reducing threads to ${threadsPerCpuCore}`);
            } else if (cpuLoad * 100 < maxCpuLoadThreshold && cpuUsage < maxCpuLoadThreshold) {
                // Scale back to full CPU usage when load is low
                threadsPerCpuCore = cpuCount;
                console.log(`CPU load normal. Scaling back to ${threadsPerCpuCore} threads.`);
            }

            config.randomx.num_threads = threadsPerCpuCore;
            await saveConfigFile();

        } catch (error) {
            console.error('Error adjusting mining resources:', error.message);
        }
    });
};

// Check if XMRig binary exists
const checkXmrigExists = async () => {
    try {
        await fs.access(XMRIG_PATH);
    } catch (err) {
        console.error('Error: XMRig binary not found. Ensure it is in the same directory as this script.');
        process.exit(1);
    }
};

// Start the miner process
const startMiner = async () => {
    try {
        await checkXmrigExists();
        exec(`pm2 start ${XMRIG_PATH} --name xmrig -- -c ${CONFIG_PATH}`, (err, stdout, stderr) => {
            if (err) {
                console.error('Error starting the miner:', err.message);
                process.exit(1);
            }
            console.log(stdout);
            if (stderr) {
                console.error(stderr);
            }
        });
    } catch (err) {
        console.error('An error occurred:', err.message);
        process.exit(1);
    }
};

// Periodically monitor and adjust the mining process
const monitorMiner = () => {
    setInterval(adjustMiningResources, 60000); // Monitor every 60 seconds
};

// Run the script with dynamic optimization
(async () => {
    await saveConfigFile();
    await startMiner();
    monitorMiner();  // Start monitoring and adjusting the miner
})();
