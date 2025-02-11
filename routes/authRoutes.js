const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: "http://localhost:3000/login",
    session: true
  }),
  (req, res) => {
    res.send(`
      <script>
        window.opener.postMessage({ type: 'oauth-success', user: ${JSON.stringify(req.user)} }, "http://localhost:8080");
        window.close();
      </script>
    `);
  }
);

router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

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
