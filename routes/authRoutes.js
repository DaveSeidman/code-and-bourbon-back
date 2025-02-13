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
    // Optional: Explicitly call req.login again (though Passport should have already done this).
    // Including it ensures the session is definitely established before redirecting.
    req.login(req.user, (err) => {
      if (err) {
        console.error('Login error after OAuth callback:', err);
        // Redirect to a specific error page or fallback
        return res.redirect(`${FRONTEND_URL}/login?error=true`);
      }
      // Redirect to your frontend. The session cookie is set on this top-level navigation.
      return res.redirect(FRONTEND_URL);
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
