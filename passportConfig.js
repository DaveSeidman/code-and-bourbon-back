require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Member = require('./models/member');

const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.codeandbourbon.com'
  : `http://localhost:${process.env.PORT}`;

module.exports = function () {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/auth/google/callback`,
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let member = await Member.findOne({ googleId: profile.id });

        if (!member) {
          member = new Member({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value
          });
          await member.save();
        }
        return done(null, member);
      } catch (error) {
        return done(error, null);
      }
    }));

  passport.serializeUser((member, done) => {
    done(null, member.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const member = await Member.findById(id);
      done(null, member);
    } catch (error) {
      done(error, null);
    }
  });
};