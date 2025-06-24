const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { SerialPort, ReadlineParser, list } = require('serialport');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let serial = null;
let parser = null;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// 🔌 Route GET /ports
app.get('/ports', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    const portNames = ports.map(p => p.path);
    res.json(portNames);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des ports' });
  }
});

// 🔌 Route POST /connect
app.post('/connect', (req, res) => {
  const { port, baud } = req.body;

  if (serial && serial.isOpen) {
    serial.close();
  }

  try {
    serial = new SerialPort({ path: port, baudRate: parseInt(baud) });
    parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }));

    parser.on('data', (data) => {
      const cleaned = data.trim();
      console.log('📥 Reçu :', cleaned);
      io.emit('serial-data', cleaned);
    });

    serial.on('open', () => {
      console.log(`✅ Port série ${port} ouvert à ${baud} bauds.`);
    });

    serial.on('error', (err) => {
      console.error('❌ Erreur série :', err.message);
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('⚠ Échec ouverture port série :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Client WebSocket connecté');

  socket.on('send-message', (msg) => {
    console.log('➡ Commande du client :', msg);
    if (serial && serial.isOpen) {
      serial.write(msg + '\n');
    } else {
      console.warn('⚠ Port série non disponible');
    }
  });

  socket.on('disconnect', () => {
    console.log('❎ Client WebSocket déconnecté');
  });
});

server.listen(3000, () => {
  console.log('🚀 Serveur WebSocket actif sur http://localhost:3000');
});
