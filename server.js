require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passportConfig = require('./passportConfig');
const eventRoutes = require('./routes/events');
const signupRoutes = require('./routes/signups');

const authRoutes = require('./routes/authRoutes');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors({
  origin: ["http://localhost:8080", "https://codeandbourbon.com"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 * 14, // 14 days
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  }
}));


app.use(passport.initialize());
app.use(passport.session());

passportConfig();

// Routes
app.use('/auth', authRoutes);

app.get('/', (req, res) => { res.send("Code and Bourbon Backend Server") });

app.use('/api/events', eventRoutes);
app.use('/api/signups', signupRoutes);


const PORT = process.env.PORT;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log(`Connected to MongoDB at ${process.env.MONGO_URI}`);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  });

}).catch(err => console.log(err));