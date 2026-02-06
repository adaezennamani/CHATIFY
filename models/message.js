// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    username: String,
    text: String,
    imageUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Message", messageSchema);


/*Summary of the flow:

Frontend: User selects image → FormData → POST /upload-image.

Backend: Multer saves image → responds with URL → emits Socket.io event.

Frontend: Renders <img> in chat bubble for both sender and other users.

(Optional DB): Save image URL in MongoDB for chat history.*/