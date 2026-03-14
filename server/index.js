const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large payloads for images

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resideai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const agreementRoutes = require('./routes/agreements');
const vacateRequestRoutes = require('./routes/vacateRequests');
const conversationRoutes = require('./routes/conversations');
const visitRoutes = require('./routes/visits');
const auth = require('./middleware/auth');
const Agreement = require('./models/Agreement');

// Direct agreement document upload endpoint to avoid routing issues
app.put('/api/agreements/:id/documents', auth, async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ msg: 'Name and data are required' });
    }

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) {
      return res.status(404).json({ msg: 'Agreement not found' });
    }

    if (agreement.tenant.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (!Array.isArray(agreement.documents)) {
      agreement.documents = [];
    }

    agreement.documents.push({
      name,
      data,
      uploadedAt: new Date()
    });

    await agreement.save();

    res.json(agreement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/payments', require('./routes/payments'));
app.use('/api/vacate-request', vacateRequestRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/visits', visitRoutes);

app.get('/', (req, res) => {
  res.send('ReSideAI API is running');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
