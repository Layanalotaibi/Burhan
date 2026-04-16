# Burhan - Setup Guide

## Requirements
- Python 3.10+
- Node.js 18+
- Ollama (for local LLM) — https://ollama.com

---

## Step 1: Clone the project
```
git clone https://github.com/Layanalotaibi/Burhan.git
cd Burhan
```

## Step 2: Setup Backend
```
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Step 3: Setup Frontend
```
cd BurhanUI
npm install
cd ..
```

## Step 4: Setup LLM

### Option A: Local (Ollama)
```
ollama pull llama3.2
```
Create `.env` file:
```
USE_OLLAMA=true
LLM_MODEL=llama3.2
```

### Option B: Cloud (OpenRouter)
Create `.env` file:
```
OPENROUTER_API_KEY=your_key_here
```

## Step 5: Run the system

### Terminal 1 — Backend:
```
source venv/bin/activate
python server.py
```

### Terminal 2 — Frontend:
```
cd BurhanUI
npx vite --port 3000
```

## Step 6: Open in browser
```
http://localhost:3000
```

## Login
- Email: admin@burhan.sa
- Password: admin123

---

## Windows Notes
- Use `venv\Scripts\activate` instead of `source venv/bin/activate`
- Everything else is the same


..... 
python server.py

cd /Users/layanalotaibi/burhan-server/burhanUI
./node_modules/.bin/vite
