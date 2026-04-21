#!/bin/bash

echo "🐍 Installing packages for Python 3.13.9..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /home/kali/hexstrike-ai-platform/backend

# Activate virtual environment
source venv/bin/activate

# Upgrade pip and build tools
echo -e "${GREEN}Upgrading pip...${NC}"
pip install --upgrade pip setuptools wheel

# Uninstall old problematic packages
echo -e "${YELLOW}Removing old packages...${NC}"
pip uninstall pydantic pydantic-core pydantic-settings sqlalchemy -y 2>/dev/null

# Install with --no-cache-dir to avoid conflicts
echo -e "${GREEN}Installing core dependencies...${NC}"
pip install --no-cache-dir fastapi==0.115.6 uvicorn[standard]==0.34.0

echo -e "${GREEN}Installing database...${NC}"
pip install --no-cache-dir sqlalchemy==2.0.36 alembic==1.14.1

echo -e "${GREEN}Installing Pydantic (Python 3.13 compatible)...${NC}"
pip install --no-cache-dir pydantic[email]==2.10.4 pydantic-settings==2.6.1

echo -e "${GREEN}Installing auth and security...${NC}"
pip install --no-cache-dir python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4 python-dotenv==1.0.1

echo -e "${GREEN}Installing API clients...${NC}"
pip install --no-cache-dir openai==1.59.3 httpx==0.28.1 websockets==14.1

echo -e "${GREEN}Installing utilities...${NC}"
pip install --no-cache-dir watchfiles==0.24.0 email-validator==2.2.0

# Verify installation
echo -e "${GREEN}Verifying installation...${NC}"
python -c "
import sys
print(f'Python version: {sys.version}')

try:
    import pydantic
    import sqlalchemy
    import fastapi
    print(f'✅ Pydantic: {pydantic.__version__}')
    print(f'✅ SQLAlchemy: {sqlalchemy.__version__}')
    print(f'✅ FastAPI: {fastapi.__version__}')
    print('\\n🎉 All packages installed successfully!')
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"

echo -e "${GREEN}✅ Setup complete!${NC}"
