#!/bin/bash

echo "Starting installation on Linux server..."

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed. Please install Node.js and retry."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null
then
    echo "Error: npm is not installed. Please install npm and retry."
    exit 1
fi

# Check for PM2
if ! command -v pm2 &> /dev/null
then
    echo "Installing PM2 globally..."
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install PM2. Please check your npm setup."
        exit 1
    fi
fi

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: npm install failed. Please check your npm setup."
    exit 1
fi

echo "Starting the miner with PM2..."
pm2 start miner.js --name xmrig-miner --no-autorestart
if [ $? -ne 0 ]; then
    echo "Error: PM2 failed to start the miner. Please check the logs for more details."
    exit 1
fi

echo "Saving PM2 process list..."
pm2 save
if [ $? -ne 0 ]; then
    echo "Error: PM2 failed to save the process list. Ensure PM2 is installed correctly."
    exit 1
fi

echo "Installation complete. PM2 is now managing the miner process."
