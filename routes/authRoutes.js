const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: "http://localhost:3000/login",
    session: true
  }),
  (req, res) => {
    res.redirect("http://localhost:8080");
  }
);

// Check authenticated user
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.redirect("http://localhost:8080");
  });
});

module.exports = router;
