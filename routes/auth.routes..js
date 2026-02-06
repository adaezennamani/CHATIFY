const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const router = express.Router();


// REGISTER / LOGIN   --security gaurd of chatify, creates users, checks passwords, decides who is allowed in
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ msg: "All fields required" });

    try {
        let user = await User.findOne({ username });  //does this username already exist?

        if (!user) {
            // If user doesn't exist, create new (auto-register) user, hash password and save to database
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({ username, password: hashedPassword });
            await user.save();

            return res.status(201).json({ msg: "Account created", username: user.username });
        }

        // User exists → check password
        const isMatch = await bcrypt.compare(password, user.password); //compares entered password with hashed password in db
        if (!isMatch) return res.status(400).json({ msg: "Invalid username or password" });

        res.json({ msg: "Login successful", username: user.username });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;



//How it all connects

/* Frontend (script.js)
   ↓ sends username & password
/auth/login (auth.routes.js)
   ↓ checks database
User.js (MongoDB schema)
   ↓ result
auth.routes.js → response
   ↓
script.js → allow chat  */
