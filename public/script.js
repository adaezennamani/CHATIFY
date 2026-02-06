
(function () {

    const app = document.querySelector(".app");
    const socket = io(); //connect to socket.io

    let uname; //store logged-in username

    const messageInput = app.querySelector(".chat-screen #message-input");
    const sendBtn = app.querySelector(".chat-screen #send-message");
    const authMsg = app.querySelector("#auth-msg");
    const imageBtn = document.getElementById("image-btn");
    const imageInput = document.getElementById("image-input")
    const messageContainer = app.querySelector(".chat-screen .messages"); // UPDATED



    //Login/Register Function

    app.querySelector("#join-user").addEventListener("click", async () => {
        const username = app.querySelector("#username").value.trim();
        const password = app.querySelector("#password").value.trim();

        if (!username || !password) {
            authMsg.innerText = "Please enter username and password"
            return;
        }

        try {
            //send login reguest to backend
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                //if login failed, show error
                authMsg.innerText = data.msg || "Login failed";
                return;
            }

            //login sucess
            uname = username;
            authMsg.innerText = "";

            //show chat screen
            app.querySelector(".join-screen").classList.remove("active");
            app.querySelector(".chat-screen").classList.add("active");

            //Notify chatroom
            socket.emit("newuser", uname);
        } catch (err) {
            console.error(err);
            authMsg.innerText = "Server error. Try again later.";
        }


    })

    //Send Message
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        renderMessage("my", {
            username: uname,
            text: message
        });
        socket.emit("chat", {
            username: uname,
            text: message
        });

        messageInput.value = "";
        autoResize();
    }

    // Click send button
    sendBtn.addEventListener("click", sendMessage);

    // Enter = send, Shift+Enter = new line
    messageInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // prevent newline
            sendMessage();
        }
    });

    // Auto-resize function
    messageInput.addEventListener("input", autoResize);
    function autoResize() {
        messageInput.style.height = "auto";
        messageInput.style.height = messageInput.scrollHeight + "px";
    }
    //

    //Exit Chat
    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function () {
        socket.emit("exituser", uname);
        window.location.href = window.location.href;
    })

    //Image sending
    imageBtn.addEventListener("click", () => {
        imageInput.click();
    });

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);
        formData.append("username", uname);

        fetch("/upload-image", {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                // Render my image immediately
                renderImageMessage("my", data);
                // Send to others
                socket.emit("chat-image", data);
            });

        imageInput.value = "";
    });



    //Socket.io Events
    // socket.on("update", function (update) {
    //     renderMessage("update", update);
    // })

    socket.on("chat", function (message) {
        renderMessage("other", message);
    })

    socket.on("update", (msg) => {
        const el = document.createElement("div");
        el.className = "update";
        el.innerText = msg;
        messageContainer.appendChild(el);
        scrollDown();
    });

    socket.on("chat-image", (data) => { //emits socket.io events so users see it in real time
        renderImageMessage("other", data);
    });


    function renderImageMessage(type, data) {  //Adds an img tag inside the chat bubble, uses url returned from the backend to display image
        const el = document.createElement("div");
        el.className = `message ${type === "my" ? "my-message" : "other-message"}`;

        el.innerHTML = `
            <div>
                <div class="name">${type === "my" ? "You" : data.username}</div>  
                <img src="${data.imageUrl}" class="chat-image">
            </div>
        `;

        messageContainer.appendChild(el);
        scrollDown();
    }

    function scrollDown() {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }



    //Render Message
    function renderMessage(type, message) {
        let messageContainer = app.querySelector(".chat-screen .messages");
        if (type == "my") {
            let el = document.createElement("div");
            el.setAttribute("class", "message my-message");
            el.innerHTML = `
                <div>
                    <div class="name">You</div>
                    <div class="text">${message.text}</div>
                </div>
                `;
            messageContainer.appendChild(el);
        } else if (type == "other") {
            let el = document.createElement("div");
            el.setAttribute("class", "message other-message");
            el.innerHTML = `
                <div>
                    <div class="name">${message.username}</div>
                    <div class="text">${message.text}</div>
                </div>
                `;
            messageContainer.appendChild(el);
        } else if (type == "update") {
            let el = document.createElement("div");
            el.setAttribute("class", "update");
            el.innerText = message;
            messageContainer.appendChild(el);
        }

        //scroll chat to the end
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }


    //Emoji Picker
    const emojiBtn = document.getElementById("emoji-btn");
    const emojiPicker = document.getElementById("emoji-picker");

    emojiBtn.addEventListener("click", () => {
        emojiPicker.style.display =
            emojiPicker.style.display === "none" ? "block" : "none";
    });

    emojiPicker.addEventListener("emoji-click", (event) => {
        const emoji = event.detail.unicode;

        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;

        messageInput.value =
            messageInput.value.substring(0, start) +
            emoji +
            messageInput.value.substring(end);

        messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;

        messageInput.focus();
        autoResize();
    });


})();