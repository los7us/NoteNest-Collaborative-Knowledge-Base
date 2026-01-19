# NoteNest – Local Setup Guide

This document explains how to set up **NoteNest** locally for development.
You do NOT need to understand the entire codebase to get started.

Follow the steps carefully and reach out if you get stuck.

---

## 🧩 Project Structure Overview

notenest/
├── frontend/ # User interface (Next.js)
├── backend/ # APIs and business logic
├── docs/ # Project documentation


You can work on **frontend, backend, or documentation independently**.

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or later)
- **npm** or **yarn**
- **Git**
- **MongoDB**
  - Local installation OR
  - MongoDB Atlas (cloud)

Check versions:
```bash
node -v
npm -v
git --version

Step 1: Clone the Repository

git clone https://github.com//R3ACTR/NoteNest-Collaborative-Knowledge-Base.git
cd NoteNest-Collaborative-Knowledge-Base

### Frontend Setup


Navigate to frontend:
cd frontend

Install dependencies:
npm install

Create environment file:
cp .env.example .env

Start frontend server:
npm run dev

Frontend will run at:
http://localhost:3000


