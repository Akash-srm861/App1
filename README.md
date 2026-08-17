# CODE THE OUTPUT - College Coding Competition Platform

A full-stack, production-ready college coding competition platform built with React, Node.js, Express, SQLite, and configurable Judge0 code-execution integration.

---

## Features

- **Participant System (15 Default Teams)**:
  - `TEAM01` through `TEAM15` with default passwords (`TEAM01@123` .. `TEAM15@123`).
  - **Single-Use Login Rule**: Logging in starts the competition timer immediately and marks the team status as `ACTIVE`. Subsequent login attempts return `"ACCESS ALREADY USED. CONTACT THE HOST."`
  - Strict question isolation: Each team sees ONLY its assigned question.
- **Server-Authoritative 10-Minute Timer**:
  - Live countdown (`10:00` -> `00:00`).
  - Timer state persists across page refreshes and browser restarts based on server timestamps.
  - Automatically disables code editor, execution, and submissions upon expiration (`TIME UP`).
- **Browser-Side & Server Enforcement Disqualification**:
  - Automatically detects tab switching (`visibilitychange`), window blur (`blur`), or page navigation.
  - Instantly issues server-side disqualification and locks participant interface with `"DISQUALIFIED: Leaving the competition page is not allowed."`
- **Monaco Code Editor & Multi-Language Support**:
  - Supports Python 3, C (GCC), C++ (GCC), Java, and JavaScript (Node.js).
  - RUN CODE button executes code via backend proxy with question `stdin` automatically fed.
  - SUBMIT ANSWER button normalizes stdout (CRLF to LF, trailing whitespace trimming, blank line removal) and evaluates against expected output.
- **Host Admin Control Panel**:
  - Default Admin Credentials: `admin` / `admin123`.
  - Overview cards: Total Teams, Not Started, Active, Finished, Disqualified, Time Up.
  - Live Team Table with real-time timer sync and status monitoring.
  - One-click Team Reset (invalidates session, resets status to `NOT_STARTED`, clears disqualification).
  - Question Management: Add, Edit, Delete, Assign questions.
  - Competition Settings: Configurable event title and timer duration.
  - Audit Logs: Full security audit trailing for logins, submissions, disqualifications, and resets.
- **Configurable Code Execution Engine**:
  - Judge0 CE API integration (never exposes API key to client).
  - Configurable via `.env` environment variables (`JUDGE0_API_URL`, `JUDGE0_API_KEY`, `JUDGE0_HOST`).
  - Includes robust offline fallback runner for seamless local testing out-of-the-box.

---

## Default Credentials

### Host Admin
- **Username**: `admin`
- **Password**: `admin123`

### Teams
- **Team Names**: `TEAM01`, `TEAM02`, `TEAM03`, ..., `TEAM15`
- **Team Passwords**: `TEAM01@123`, `TEAM02@123`, ..., `TEAM15@123`

---

## Prerequisites (Windows)

- **Node.js**: v16.x or later installed.
- **npm**: v8.x or later installed.

---

## Windows Installation & Setup Instructions

### 1. Install Dependencies

Open PowerShell or Command Prompt in the project folder:

```powershell
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment Variables (Optional)

Create a `.env` file in the `server` directory (or use default values):

```env
PORT=5000
JWT_SECRET=code_the_output_secret_key_2026_super_secure_key
DEFAULT_DURATION_SECONDS=600

# Judge0 CE Execution Provider
EXECUTION_PROVIDER=judge0
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key_here
JUDGE0_HOST=judge0-ce.p.rapidapi.com
```

### 3. Build Client & Start Production Server

```powershell
# Build client single page application
npm run build:client

# Start server (Auto-seeds database on first launch)
npm start
```

Open your browser and navigate to:
**`http://localhost:5000`**

---

## Verification & Testing Steps

1. **Host Login Test**:
   - Access `http://localhost:5000`
   - Click "Switch to Host Admin Login"
   - Enter `admin` / `admin123`
   - Verify Host Control Panel displays 15 teams and 15 assigned questions.

2. **Team Login & Timer Test**:
   - Open an Incognito Window or separate browser to `http://localhost:5000`
   - Enter `TEAM01` / `TEAM01@123`
   - Verify 10:00 timer starts immediately.
   - Try logging in as `TEAM01` again in another window -> Verify `"ACCESS ALREADY USED. CONTACT THE HOST."` error message.

3. **Code Execution & Submission Test**:
   - Select Python 3, C, C++, Java, or JavaScript.
   - Click **RUN CODE** -> Verify stdout is displayed under `PROGRAM OUTPUT`.
   - Click **SUBMIT ANSWER** -> Verify normalized answer comparison and `FINISHED` status update.

4. **Disqualification Test**:
   - Log in as `TEAM02` / `TEAM02@123`.
   - Switch tabs or minimize browser -> Verify `"DISQUALIFIED: Leaving the competition page is not allowed."` overlay appears and locks the editor.

5. **Host Reset Test**:
   - Switch to Host Control Panel -> Click **Reset** on `TEAM02`.
   - Confirm Reset -> Verify `TEAM02` status returns to `NOT_STARTED` and can log in again.
