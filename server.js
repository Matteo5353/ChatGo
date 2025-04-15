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

// Creating a 2d sphere - for getting the distance in km from the markers
placeSchema.index({ location: '2dsphere' });

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

app.get('/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const place = await Place.findById(id);
    if (!place) return res.status(404).json({ error: "Place not found" });
    res.json(place);
  } catch (err) {
    res.status(500).json({ error: "Error fetching place by ID" });
  }
});


// 2. DELETE a specific place by ID
app.delete('/places/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Place.delete(id); // Find and delete the place by ID
    if (!id) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json({ message: 'Place deleted successfully' });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ error: 'Failed to delete place' });
  }
});
