#!/bin/bash

# Monad Transfer Script - Bun Installation Script

echo "🚀 Installing Bun and dependencies for Monad Transfer Script"
echo "=========================================================="
echo ""

# Check if Bun is already installed
if command -v bun &> /dev/null; then
    echo "✅ Bun is already installed"
    bun --version
else
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    
    # Add Bun to PATH for current session
    export PATH="$HOME/.bun/bin:$PATH"
    
    echo "✅ Bun installed successfully"
    bun --version
fi

echo ""
echo "📦 Installing project dependencies..."
bun install

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Copy env.example to .env: cp env.example .env"
echo "2. Edit .env with your private key and wallet addresses"
echo "3. Run the script: bun start"
echo ""
echo "For development with auto-reload: bun dev"
