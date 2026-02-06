const mongoose = require("mongoose");


//defines what user should look like, or what a user must posses before joining the chatroom
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,   // ensures no duplicate usernames
        lowercase: true,
        trim: true //extra spaces are removed
    },
    password: { //stores hashed passwords
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", UserSchema); //creates user model
