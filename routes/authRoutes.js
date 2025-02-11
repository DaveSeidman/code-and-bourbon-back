const express = require('express');
const passport = require('passport');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: true
  }),
  (req, res) => {
    res.send(`
      <script>
        window.opener.postMessage({ type: 'oauth-success', user: ${JSON.stringify(req.user)} }, "${FRONTEND_URL}");
        window.close();
      </script>
    `);
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

    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Clear session cookie
      res.status(200).json({ message: "Successfully logged out" });
    });
  });
});

module.exports = router;
