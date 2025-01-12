# XMRig Miner Setup with PM2

This repository contains a script to set up and run an XMRig miner using PM2 for process management.

## Requirements

- Node.js and npm installed
- PM2 installed globally (`npm install -g pm2`)
- XMRig binary in the root directory of this project

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/miner-setup.git
    cd XMRMINNER
    ```

2. Run the installation script:
    ```bash
    ./install.sh
    ```

3. Update the `miner.js` file with your XMR wallet address.

## Managing the Miner with PM2

1. Start the miner:
    ```bash
    pm2 start miner.js --name xmrig-miner
    ```

2. Check the status of the miner:
    ```bash
    pm2 status
    ```

3. Stop the miner:
    ```bash
    pm2 stop xmrig-miner
    ```

4. Restart the miner:
    ```bash
    pm2 restart xmrig-miner
    ```

5. View logs:
    ```bash
    pm2 logs xmrig-miner
    ```

6. Save the PM2 process list to restart on reboot:
    ```bash
    pm2 save
    ```

7. To enable PM2 startup script on system reboot:
    ```bash
    pm2 startup
    ```

## License

[Your License Here]
