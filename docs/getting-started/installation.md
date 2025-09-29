# Installation Guide

This guide provides detailed installation instructions for the Sunsteel Frontend project across different operating systems and development environments.

## Table of Contents

- [System Requirements](#system-requirements)
- [Windows Installation](#windows-installation)
- [macOS Installation](#macos-installation)
- [Linux Installation](#linux-installation)
- [Docker Installation](#docker-installation)
- [IDE Setup](#ide-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for package downloads

### Software Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Latest stable version

## Windows Installation

### 1. Install Node.js

#### Option A: Official Installer (Recommended)

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version for Windows
3. Run the installer with administrator privileges
4. Follow the installation wizard
5. Ensure "Add to PATH" is checked

#### Option B: Using Chocolatey

```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs
```

#### Option C: Using Winget

```powershell
winget install OpenJS.NodeJS
```

### 2. Install Git

#### Option A: Official Installer

1. Visit [git-scm.com](https://git-scm.com/)
2. Download Git for Windows
3. Run the installer
4. Use recommended settings

#### Option B: Using Package Manager

```powershell
# Using Chocolatey
choco install git

# Using Winget
winget install Git.Git
```

### 3. Verify Installation

```powershell
node --version
npm --version
git --version
```

### 4. Clone and Setup Project

```powershell
# Clone the repository
git clone <repository-url>
cd sunnsteel-frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env.local
```

## macOS Installation

### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js

#### Option A: Using Homebrew (Recommended)

```bash
brew install node
```

#### Option B: Official Installer

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the macOS installer
3. Run the installer

#### Option C: Using Node Version Manager (nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or source profile
source ~/.bashrc

# Install and use Node.js
nvm install 18
nvm use 18
```

### 3. Install Git

```bash
# Git is usually pre-installed on macOS
# If not, install via Homebrew
brew install git
```

### 4. Verify Installation

```bash
node --version
npm --version
git --version
```

### 5. Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd sunnsteel-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

## Linux Installation

### Ubuntu/Debian

#### 1. Update Package Manager

```bash
sudo apt update
sudo apt upgrade -y
```

#### 2. Install Node.js

#### Option A: Using NodeSource Repository (Recommended)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs
```

#### Option B: Using Package Manager

```bash
sudo apt install nodejs npm
```

#### Option C: Using Snap

```bash
sudo snap install node --classic
```

#### 3. Install Git

```bash
sudo apt install git
```

### CentOS/RHEL/Fedora

#### 1. Install Node.js

```bash
# CentOS/RHEL
sudo yum install nodejs npm

# Fedora
sudo dnf install nodejs npm
```

#### 2. Install Git

```bash
# CentOS/RHEL
sudo yum install git

# Fedora
sudo dnf install git
```

### Arch Linux

```bash
# Install Node.js and npm
sudo pacman -S nodejs npm

# Install Git
sudo pacman -S git
```

### 4. Verify Installation

```bash
node --version
npm --version
git --version
```

### 5. Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd sunnsteel-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

## Docker Installation

### Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: sunsteel
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 3. Run with Docker

```bash
# Build and start services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

## IDE Setup

### Visual Studio Code (Recommended)

#### 1. Install VS Code

- Download from [code.visualstudio.com](https://code.visualstudio.com/)

#### 2. Install Recommended Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

#### 3. Configure Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### WebStorm/IntelliJ IDEA

#### 1. Install IDE

- Download from [jetbrains.com](https://www.jetbrains.com/)

#### 2. Configure TypeScript

- Enable TypeScript service
- Set Node.js interpreter
- Configure ESLint and Prettier

### Other IDEs

The project works with any IDE that supports:
- TypeScript
- ESLint
- Prettier
- Node.js debugging

## Verification

### 1. Check Installation

```bash
# Verify Node.js and npm
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Verify Git
git --version

# Check project dependencies
npm list --depth=0
```

### 2. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to verify the application is running.

### 3. Run Tests

```bash
npm test
```

### 4. Build for Production

```bash
npm run build
```

## Troubleshooting

### Node.js Issues

#### Version Conflicts

```bash
# Check current version
node --version

# If using nvm, switch versions
nvm use 18

# If multiple Node.js installations exist
which node
```

#### Permission Issues (Linux/macOS)

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Windows Path Issues

1. Add Node.js to PATH manually:
   - Open System Properties → Environment Variables
   - Add Node.js installation directory to PATH
   - Restart terminal

### Git Issues

#### Authentication

```bash
# Configure Git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# For HTTPS repositories
git config --global credential.helper store
```

#### SSL Certificate Issues

```bash
# Disable SSL verification (not recommended for production)
git config --global http.sslVerify false
```

### npm Issues

#### Network/Proxy Issues

```bash
# Configure npm registry
npm config set registry https://registry.npmjs.org/

# Configure proxy (if needed)
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

#### Cache Issues

```bash
# Clear npm cache
npm cache clean --force

# Verify cache
npm cache verify
```

#### Package Installation Failures

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use different package manager
npx yarn install
# or
npx pnpm install
```

### Environment Issues

#### Missing Environment Variables

1. Ensure `.env.local` exists in project root
2. Check variable names (must start with `NEXT_PUBLIC_` for client-side)
3. Restart development server after changes

#### Port Conflicts

```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# Kill process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux

# Use different port
npm run dev -- -p 3001
```

### Build Issues

#### TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update TypeScript
npm install typescript@latest
```

#### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Getting Additional Help

- **Documentation**: Check other guides in the [docs](../README.md) directory
- **Community**: Join our Discord/Slack community
- **Issues**: Report bugs in the GitHub repository
- **Stack Overflow**: Tag questions with `sunsteel-frontend`

---

**Installation complete!** 🎉 

Continue with the [Getting Started Guide](README.md) to begin development.