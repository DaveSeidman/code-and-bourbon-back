const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/user');

// Determine the correct backend URL
const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://code-and-bourbon-back.onrender.com'
  : 'http://localhost:3000';

module.exports = function () {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/auth/google/callback`,  // ✅ Now it's fully qualified
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value
          });
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));

  passport.serializeUser((user, done) => {
    console.log("✅ Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log("🔄 Deserializing user with ID:", id);
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
