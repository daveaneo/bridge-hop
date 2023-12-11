#!/bin/bash

# Deploy on ethereumSepolia
echo "Deploying on ethereumSepolia..."
npx hardhat deploy-terrain --terrain 1 --network ethereumSepolia

# Deploy on avalancheFuji
echo "Deploying on polygonMumbai..."
npx hardhat deploy-terrain --network polygonMumbai

echo "Deployment completed."
