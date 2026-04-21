# HexStrike AI Educational Platform

### 🚀 HexStrike AI - Cybersecurity Learning Platform

<div align="left">
  
**An AI-Powered Educational Platform for Learning Penetration Testing on Kali Linux**

</div>

---

## Table of Contents

1. [What is HexStrike AI?](#what-is-hexstrike-ai)
2. [System Requirements](#system-requirements)
3. [Complete Installation Guide](#complete-installation-guide)
4. [Project Structure](#project-structure)
5. [How to Use the Platform](#how-to-use-the-platform)
6. [Available Security Tools](#available-security-tools)
7. [Learning Modules](#learning-modules)
8. [Target VM Setup (Metasploitable 2)](#target-vm-setup-metasploitable-2)
9. [Common Commands](#common-commands)
10. [Troubleshooting](#troubleshooting)
11. [API Endpoints](#api-endpoints)
12. [Credits](#credits)

## What is HexStrike AI Education Platform?

HexStrike AI is a **complete cybersecurity learning platform** that combines:
- 🤖 **AI-powered explanations** using OpenAI GPT-4o
- 🛠️ **150+ security tools** via HexStrike integration
- 📚 **Interactive learning modules** with quizzes
- 💻 **Web-based terminal** for hands-on practice
- 🎮 **Gamification** with XP, achievements, and progress tracking

**Perfect for:** Students learning ethical hacking, penetration testers, and cybersecurity enthusiasts.

## System Requirements

### For Kali Linux VM (Your Environment)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU Cores | 2 | 4 |
| RAM | 4GB | 8GB |
| Storage | 20GB | 30GB |
| OS | Kali Linux 2024.1+ | Kali Linux Rolling |

## Complete Installation Guide

### Step 1: Install Prerequisites on Kali Linux

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+
# The correct statement is:
sudo apt install -y python3 python3-venv python3-dev

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential libssl-dev netdiscover
# Verify installations
python3 --version   # Should show 3.11+
node --version         # Should show v20.x
npm --version          # Should show 9.x or higher

### Step 2: Clone the Repository
# Create workspace
mkdir -p ~/hexstrike-workspace
cd ~/hexstrike-workspace

# Clone HexStrike AI Platform
git clone https://github.com/nkalyesubula/hexstrike-ai-platform.git
cd hexstrike-ai-platform

#### tep 3: Setup Backend
cd ~/hexstrike-workspace/hexstrike-ai-platform/backend

# Create virtual environment with Python 3
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt

# Create environment configuration file
cat > .env << 'ENVFILE'
SECRET_KEY=hexstrike-super-secret-key-change-this-2024
DATABASE_URL=sqlite:///./hexstrike.db
HEXSTRIKE_URL=http://127.0.0.1:8888
OPENAI_API_KEY=your-openai-api-key-here
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
ENVFILE

# Initialize database
python -c "from app.database import init_db; init_db()"

### Step 4: Setup Frontend
cd ~/hexstrike-workspace/hexstrike-ai-platform/frontend

# Install dependencies
npm install

# Install terminal packages
npm install xterm xterm-addon-fit xterm-addon-web-links

# Create frontend environment
cat > .env << 'ENVFILE'
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
ENVFILE


### Step 6: Setup Target VM (Metasploitable 2)
cd ~/Downloads

# Download Metasploitable 2
wget https://download.vulnhub.com/metasploitable/metasploitable-linux-2.0.0.zip

# Extract
unzip metasploitable-linux-2.0.0.zip

# Import to VirtualBox
# Option 1: Command line
VBoxManage import metasploitable-linux-2.0.0/Metasploitable.ovf

# Option 2: GUI
# Open VirtualBox → File → Import Appliance → Select the .ovf file

# Configure network for Metasploitable VM
# In VirtualBox GUI:
# 1. Select Metasploitable2 VM → Settings
# 2. Network → Adapter 1
# 3. Attached to: "Host-only Adapter"
# 4. Name: "vboxnet0"
# 5. Click OK

# Start Metasploitable VM
VBoxManage startvm "Metasploitable2" --type headless

# Find Metasploitable IP address
sudo netdiscover -r 192.168.56.0/24
# Metasploitable typically appears at 192.168.56.101

# Test connectivity
ping 192.168.56.101

### Project Structure

hexstrike-ai-platform/
├── backend/
│   ├── app/
│   │   ├── routers/           # API endpoints (auth, tools, learning, analytics)
│   │   ├── services/          # Business logic and external services
│   │   ├── database.py        # SQLAlchemy database models
│   │   ├── config.py          # Configuration management
│   │   └── main.py            # FastAPI application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (API keys, secrets)
│   └── run.py                 # Server startup script
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components (Dashboard, Lab, Learn, Profile)
│   │   ├── hooks/             # Custom React hooks (useAuth, useWebSocket)
│   │   ├── services/          # API service layer
│   │   ├── context/           # React context (AuthContext)
│   │   └── App.jsx            # Main React application
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite build configuration
└── README.md                  # This file

### How to Use the Platform
# Terminal 1: Start HexStrike Server
cd ~/hexstrike-workspace/hexstrike-server
source venv/bin/activate
python hexstrike_server.py
# Server runs on http://127.0.0.1:8888

# Terminal 2: Start Backend API
cd ~/hexstrike-workspace/hexstrike-ai-platform/backend
source venv/bin/activate
python run.py
# API runs on http://localhost:8000

# Terminal 3: Start Frontend
cd ~/hexstrike-workspace/hexstrike-ai-platform/frontend
npm run dev -- --host 0.0.0.0 --port 5173
# Frontend runs on http://localhost:5173

# Terminal 4: Start Metasploitable VM (already running)
# No command needed, ensure it's powered on
