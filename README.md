# Tic Tac Toe Online

Real-time, two-player tic-tac-toe you can play with a friend from separate devices, built with Node.js, Express, and Socket.io.

Play it live: https://tictactoe-online-szdw.onrender.com

## How to play

1. One player clicks **Create a Room** and gets a 4-letter room code.
2. Share the code (or the copied invite link) with your friend.
3. Your friend enters the code and clicks **Join Room**.
4. Take turns — moves sync instantly for both players, with win/draw detection and a rematch button.

## Running locally

```bash
npm install
npm start
```

The server starts on `http://localhost:3000` (or the port set in `PORT`).

## Deployment

This app is deployed on [Render](https://render.com) as a free Web Service:

- **Build command**: `npm install`
- **Start command**: `node server.js`

Note: on Render's free tier, the server spins down after ~15 minutes of inactivity, so the first connection after idling can take 30–50 seconds to wake up.
