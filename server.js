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
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // exit if DB connection fails
  });


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


const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Register Route
app.post('/users/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login Route
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Account not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ message: 'Login successful', username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});




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
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ error: 'Failed to fetch place' });
  }
});


app.delete('/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPlace = db.posts.deleteOne({ _id: id })
    //const deletedPlace = await Place.findByIdAndDelete(id);
    if (!deletedPlace) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json({ message: 'Place deleted successfully!' });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ error: 'Failed to delete place' });
  }
});



const PORT = process.env.PORT || 3000; // 3000 is fallback for local development

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
