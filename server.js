require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema
const placeSchema = new mongoose.Schema({
  title: String,
  latitude: Number,
  longitude: Number,
  description: String,
  photo: String,
  mapLink: String,
  isCity: Boolean,
  ideal: String,
  createdAt: { type: Date, default: Date.now }
});

const Place = mongoose.model('Place', placeSchema);

// API Endpoints
app.get('/places', async (req, res) => {
  try {
    const places = await Place.find().sort({ createdAt: -1 });
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load places' });
  }
});

app.post('/places', async (req, res) => {
  try {
    const { photo, ...rest } = req.body;
    const uploadedImage = await cloudinary.uploader.upload(photo, {
      folder: 'map-locations'
    });
    
    const newPlace = new Place({
      ...rest,
      photo: uploadedImage.secure_url
    });
    
    await newPlace.save();
    res.json({ message: 'Location saved successfully!' });
  } catch (error) {
    console.error('Error saving place:', error);
    res.status(500).json({ error: 'Failed to save location' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.delete('/places', async (req, res) => {
  try {
    // Extract the place data (like id, title, etc.) from the request body
    const { _id } = req.body; // Assuming the client sends the place ID in the body
    console.log

    if (!id) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    // Find the place using the id (you can also match by title, or other fields)
    const place = await Place.find({ _id: id });
    
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }

    // Remove the place from the database
    await place.remove();
    res.json({ message: 'Place deleted successfully' });

  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ error: 'Failed to delete place' });
  }
});
