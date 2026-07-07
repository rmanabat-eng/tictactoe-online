const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

/** @type {Map<string, { board: (string|null)[], turn: 'X'|'O', players: Record<string, 'X'|'O'>, sockets: string[] }>} */
const rooms = new Map();

function makeRoomCode() {
  let code;
  do {
    code = Math.random().toString(36).slice(2, 6).toUpperCase();
  } while (rooms.has(code));
  return code;
}

function checkResult(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((c) => c)) return { winner: 'draw', line: null };
  return null;
}

io.on('connection', (socket) => {
  socket.on('createRoom', () => {
    const code = makeRoomCode();
    rooms.set(code, {
      board: Array(9).fill(null),
      turn: 'X',
      players: { [socket.id]: 'X' },
      sockets: [socket.id],
    });
    socket.join(code);
    socket.data.room = code;
    socket.emit('roomCreated', { code, mark: 'X' });
  });

  socket.on('joinRoom', (code) => {
    code = (code || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) {
      socket.emit('joinError', 'Room not found.');
      return;
    }
    if (room.sockets.length >= 2) {
      socket.emit('joinError', 'Room is full.');
      return;
    }
    room.players[socket.id] = 'O';
    room.sockets.push(socket.id);
    socket.join(code);
    socket.data.room = code;
    socket.emit('roomJoined', { code, mark: 'O' });
    io.to(code).emit('opponentJoined');
    io.to(code).emit('state', { board: room.board, turn: room.turn });
  });

  socket.on('move', (index) => {
    const code = socket.data.room;
    const room = rooms.get(code);
    if (!room) return;
    const mark = room.players[socket.id];
    if (!mark || mark !== room.turn) return;
    if (room.board[index]) return;
    if (room.sockets.length < 2) return;

    room.board[index] = mark;
    const result = checkResult(room.board);
    room.turn = mark === 'X' ? 'O' : 'X';

    io.to(code).emit('state', { board: room.board, turn: room.turn, lastMove: index });
    if (result) {
      io.to(code).emit('gameOver', result);
    }
  });

  socket.on('rematch', () => {
    const code = socket.data.room;
    const room = rooms.get(code);
    if (!room) return;
    room.board = Array(9).fill(null);
    room.turn = 'X';
    io.to(code).emit('state', { board: room.board, turn: room.turn });
  });

  socket.on('disconnect', () => {
    const code = socket.data.room;
    const room = rooms.get(code);
    if (!room) return;
    room.sockets = room.sockets.filter((id) => id !== socket.id);
    delete room.players[socket.id];
    if (room.sockets.length === 0) {
      rooms.delete(code);
    } else {
      io.to(code).emit('opponentLeft');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Tic-tac-toe server running on port ${PORT}`);
});
