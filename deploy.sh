#!/bin/bash

# Deploy script for Firebase hosting
# Checks Firebase login, builds the project, and deploys to Firebase

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged into Firebase
echo "🔍 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  Not logged into Firebase. Logging in..."
    firebase login --reauth
else
    echo "✅ Already logged into Firebase"
fi

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Firebase hosting
echo "🌐 Deploying to Firebase hosting..."
firebase deploy --only hosting

echo "✅ Deployment complete!"


