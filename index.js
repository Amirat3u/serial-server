const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // autorise le frontend Vue
    methods: ['GET', 'POST']
  }
});

// Simulation d'un port série
const fakeSerial = {
  write: (msg) => {
    console.log('Simulé : envoi →', msg);
  }
};

// Envoie un message simulé toutes les 5 secondes
setInterval(() => {
  const fakeMessage = '↪ Message simulé reçu du port série';
  console.log(fakeMessage);
  io.emit('serial-data', fakeMessage);
}, 5000);

// WebSocket : écoute des connexions du frontend
io.on('connection', (socket) => {
  console.log('✅ Client connecté');

  // Quand le frontend envoie une commande
  socket.on('send-message', (msg) => {
    console.log('Commande reçue (frontend) :', msg);
    fakeSerial.write(msg + '\n');
  });
});

server.listen(3000, () => {
  console.log('🚀 Serveur backend simulé sur http://localhost:3000');
});

