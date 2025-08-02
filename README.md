# 🎨 Illustrators

> An innovative Pictionary game created for IT 391 at Illinois State University

![GitHub repo size](https://img.shields.io/github/repo-size/tllarr1/Illustrators?color=blue)
![GitHub stars](https://img.shields.io/github/stars/tllarr1/Illustrators?style=social)
![Last Commit](https://img.shields.io/github/last-commit/tllarr1/Illustrators?color=green)
![Vibes Only](https://img.shields.io/badge/made%20with-vibes%20only-%23ff69b4)

---

## 🚀 Overview

**Illustrators** is an innovative, modern day Pictionary game made using Next.js.

This is perfect for:
- 🎭 Competing with family and friends
- 🖌️ Practicing your creativity
- ~~📊 Tracking performance and stats (coming soon!)~~

![Demo](/public/demo.gif)

## ⚙️ Installation

```bash
git clone https://github.com/tllarr1/Illustrators.git
cd Illustrators
npm install
```

### 🔐 Environment Variables

Create a `.env` file in the root directory and add the following variables:

```
MONGODB_URI="...your connection string..."
 
SESSION_SECRET="...random bytes..."

REDIS_HOST="..."
REDIS_PORT="..."
REDIS_USER="..."
REDIS_PASSWORD="..."
```

### Run for testing

```bash
npm run dev
```

### Run for production

```bash
npm run build
npm start
```

Then access the game at: `http://localhost:3000`

## 📦 Tech Stack

- **Next.js** + **TypeScript**
- **Fabric.js** for real-time Canvas drawing
- **MongoDB** for user and profile data
- **Redis** for game session management

## 🛠️ Roadmap

- [x] User authentication
- [x] Lobby creation
- [x] Playable game state
- [x] Game settings
- [x] Working profile pages
- [ ] Player stats & leaderboards
- [ ] AI players? 🤖

---

© 2025 all respective contributors

Made with ☕ by [@tllarr1](https://github.com/tllarr1), [@tyqualters](https://github.com/tyqualters), [@eventuallycoder](https://github.com/eventuallycoder), [@KFletch117](https://github.com/KFletch117), [@NathanCerne](https://github.com/NathanCerne)
