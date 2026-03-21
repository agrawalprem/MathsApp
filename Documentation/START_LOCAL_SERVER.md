# How to Run the Application Locally

## Option 1: Firebase Hosting (Recommended)

1. Open PowerShell/Terminal in project directory:
   ```powershell
   cd "C:\Users\agraw\Documents\Prem\NGMF\MathsInBabySteps"
   ```

2. Start Firebase local server:
   ```powershell
   firebase serve
   ```

3. Open browser:
   ```
   http://localhost:5000
   ```

4. Stop server: Press `Ctrl+C`

## Option 2: Python HTTP Server

1. Open PowerShell/Terminal in project directory:
   ```powershell
   cd "C:\Users\agraw\Documents\Prem\NGMF\MathsInBabySteps"
   ```

2. Start Python server:
   ```powershell
   python -m http.server 8000
   ```
   (or `python3 -m http.server 8000` if you have Python 3)

3. Open browser:
   ```
   http://localhost:8000
   ```

4. Stop server: Press `Ctrl+C`

## Option 3: Node.js http-server

1. Install http-server (one-time):
   ```powershell
   npm install -g http-server
   ```

2. Start server:
   ```powershell
   http-server -p 8000
   ```

3. Open browser:
   ```
   http://localhost:8000
   ```

4. Stop server: Press `Ctrl+C`

## Important Notes

- **Always use a local server** - Don't open HTML files directly in browser (file://) as ES modules and Firebase SDK won't work
- **Firebase serve is recommended** - It matches production environment best
- **Port may vary** - Check terminal output for actual port number
