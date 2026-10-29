require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./models/db');
const foodRoutes = require('./routes/foodRoutes');
const stockRoutes = require('./routes/stockRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Food Management API is running' });
});

app.get('/health', async (req, res) => {
  try {
    await connectDB();
    res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});

app.use('/api/foods', foodRoutes);
app.use('/api/stock', stockRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Khong tim thay API' });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend dang chay tai cong ${PORT}`);
    });
  } catch (error) {
    console.error('Khong the khoi dong backend:', error.message);
    process.exit(1);
  }
}

startServer();
