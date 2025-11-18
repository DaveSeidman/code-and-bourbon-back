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
    // Extract redirect path from state
    console.log(req.query)
    const redirectUrl = req.query.state
      ? decodeURIComponent(req.query.state)
      : FRONTEND_URL;

    req.login(req.user, (err) => {
      if (err) {
        console.error('Login error after OAuth callback:', err);
        return res.redirect(`${FRONTEND_URL}/login?error=true`);
      }

      return res.redirect(redirectUrl);
    });
  }
);



// Check authenticated user
router.get('/user', (req, res) => {
  res.json(req.isAuthenticated() ? req.user : null);
});

router.get('/debug-session', (req, res) => {
  console.log("Session Data:", req.session);
  console.log("User Data:", req.user);
  res.json({
    session: req.session,
    user: req.user || null
  });
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
