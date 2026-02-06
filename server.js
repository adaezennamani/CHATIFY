const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const multer = require("multer") //saves images to uploads folder, generates a unique filename for the pictures
const Message = require("./models/message");

dotenv.config()

const app = express();
const server = require("http").createServer(app);

//creating sockets
const io = require("socket.io")(server);


//middleware
app.use(express.json()); //parse JSON for authentication
app.use(express.static(path.join(__dirname + "/public")));
app.use("/uploads", express.static("uploads"));

//Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

//auth routes
const authRoutes = require("./routes/auth.routes.");
app.use("/api/auth", authRoutes);

//image upload to multer
//where images are stored and how they are named
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage })

//Image upload Route

//recieves image from frontend
app.post("/upload-image", upload.single("image"), (req, res) => {
    res.json({
        username: req.body.username,
        imageUrl: `/uploads/${req.file.filename}`
    });
})

io.on("connection", function (socket) {
    socket.on("newuser", function (username) {
        socket.broadcast.emit("update", username + " joined the conversation")
    });
    socket.on("exituser", function (username) {
        socket.broadcast.emit("update", username + " left the conversation")
    });
    socket.on("chat", function (message) {
        socket.broadcast.emit("chat", message)
    });
    //image message
    socket.on("chat-image", (data) => {
        socket.broadcast.emit("chat-image", data)
    })
});

//saves image to mongodb
app.post("/upload-image", upload.single("image"), async (req, res) => {
    try {
        const msg = new Message({
            username: req.body.username,
            imageUrl: `/uploads/${req.file.filename}`
        });

        await msg.save(); // <-- saves image message to MongoDB

        res.json({
            username: req.body.username,
            imageUrl: `/uploads/${req.file.filename}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
});

server.listen(5000)
console.log("Server is running on port 5000")