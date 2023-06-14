let socket = null;

export async function loadWs(userid) {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    // Create a new WebSocket connection
    socket = new WebSocket("ws://localhost:8080/ws");

    // Set up event listeners
    socket.onopen = async () => {
      let response = await fetch("/getuserid")
      let userid = await response.json()
      const message = "Hi from the client!";
      const senderId = userid;
      const recipientId = "test";
      const payload = {
        fromUserId: senderId,
        toUserId: recipientId,
        message: message,
      };
      socket.send(JSON.stringify(payload))
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error", error);
    };
  }

  socket.onclose = (event) => {
    console.log("Socket closed connection: ", event)
  }

  socket.onerror = (error) => {
    console.log("Socket error: ", error)
  }

  return socket;

}

export async function loadWsPage() {
  let response = await fetch("/getuserid")
  let userid = await response.json()
  const socket = await loadWs();
  //let response = await fetch("/getmessages")
  //let oldMessages = await response.json()

  document.getElementById("chat-content").innerHTML = `
    <h1>Chat</h1>
    <div id="messages">

    </div>
    <form id="chat-form">
      <input type="text" id="message-input" placeholder="Type your message...">
      <button id="send-message" type="submit">Send</button>
    </form>
    `
  document.getElementById("chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value;
    console.log(userid)
    const senderId = userid;
    const recipientId = "recipientUserid";
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const payload = {
      fromUserId: senderId,
      toUserId: recipientId,
      message: message,
    };
    socket.send(JSON.stringify(payload));
    messageInput.value = "";
    //addMessageToUI(message, senderId, `${date} ${time}`);

    function addMessageToUI(message, username, timestamp) {
      const messagesDiv = document.getElementById("messages");
      const messageBox = document.createElement("div");
      messageBox.classList.add("message-box");

      const senderIdDiv = document.createElement("div");
      senderIdDiv.classList.add("username");
      senderIdDiv.innerText = username;

      const timestampSpan = document.createElement("span");
      timestampSpan.classList.add("timestamp");
      timestampSpan.innerText = timestamp;
      senderIdDiv.append(timestampSpan)

      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message");
      messageDiv.innerText = message;

      messageBox.appendChild(senderIdDiv);
      messageBox.appendChild(messageDiv);

      messagesDiv.appendChild(messageBox);
    }
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      handleNewMessage(payload);
    };
    function handleNewMessage(payload) {
      const titleCaseUsername = payload.Username.charAt(0).toUpperCase() + payload.Username.substr(1).toLowerCase();
      addMessageToUI(payload.message, titleCaseUsername, payload.timeSent);
    }
  });
}