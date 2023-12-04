#!/bin/bash

# Deploy on ethereumSepolia
echo "Deploying on ethereumSepolia..."
npx hardhat deploy-mountain --terrain 1 --network ethereumSepolia

# Deploy on avalancheFuji
echo "Deploying on avalancheFuji..."
npx hardhat deploy-mountain --network avalancheFuji

echo "Deployment completed."
