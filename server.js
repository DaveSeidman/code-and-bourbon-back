require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passportConfig = require('./passportConfig');

const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:8080",  // React frontend
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: "yourSecretKey",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passportConfig();

// Routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.log(err));
