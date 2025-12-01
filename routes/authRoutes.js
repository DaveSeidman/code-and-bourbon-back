const express = require('express');
const passport = require('passport');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// Google OAuth login
router.get('/google', (req, res, next) => {
  const redirect = req.query.redirect || FRONTEND_URL;

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: encodeURIComponent(redirect)
  })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${FRONTEND_URL}/login`,
  session: true
}),
  (req, res) => {
    const redirectUrl = req.query.state
      ? decodeURIComponent(req.query.state)
      : FRONTEND_URL;

    req.login(req.user, (err) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] LOGIN ERROR: ${err.message}`);
        return res.redirect(`${FRONTEND_URL}/login?error=true`);
      }

      console.log(`[${new Date().toISOString()}] LOGIN: ${req.user.displayName} (${req.user.email})`);
      return res.redirect(redirectUrl);
    });
  }
);

// Check authenticated user
router.get('/user', (req, res) => {
  res.json(req.isAuthenticated() ? req.user : null);
});

// Logout
router.get('/logout', (req, res) => {
  const user = req.user;

  req.logout((err) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] LOGOUT ERROR: ${err.message}`);
      return res.status(500).json({ message: "Logout failed" });
    }

    console.log(`[${new Date().toISOString()}] LOGOUT: ${user?.displayName} (${user?.email})`);

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(200).json({ message: "Successfully logged out" });
    });
  });
});

module.exports = router;