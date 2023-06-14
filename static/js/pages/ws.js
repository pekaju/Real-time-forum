let socket = null;
let userid = "";
let username = "";
let wsConnected = false;
var recipientId = "";
var chatVisible = false;
var loadingMessages = false;
let currentChatRowsCount = 0;
var scrollHeightBeforeLoad = 0;
let typingTimer; // Timer identifier
const typingDelay = 1000; // Delay in milliseconds (1 second)

/**
 * Event is used to wrap all messages Send and Recieved
 * on the Websocket
 * The type is used as a RPC
 * */
class Event {
  // Each Event needs a Type
  // The payload is not required
  constructor(type, payload) {
    this.type = type;
    this.payload = payload;
  }
}
/**
 * SendMessageEvent is used to send messages to other clients
 * */
class SendMessageEvent {
  constructor(message, from, to) {
    this.message = message;
    this.from = from;
    this.to = to;
  }
}
/**
 * NewMessageEvent is messages comming from clients
 * */
class NewMessageEvent {
  constructor(message, from, sent) {
    this.message = message;
    this.from = from;
    this.sent = sent;
  }
}
/**
 * ChangeRecipientIdEvent is used to change recipient
 * */
class ChangeRecipientIdEvent {
  constructor(recipient) {
    this.recipient = recipient;
  }
}
/**
 * ChangeRecipientIdEvent is used to change recipient
 * */
export class GetUsersEvent {
  constructor(userId) {
    this.userId = userId;
  }
}
/**
 * CloseConnectionEvent is used to close ws connection
 * */
export class CloseConnectionEvent {
  constructor(userId) {
    this.userId = userId;
  }
}

/**
 * LoadMorerows is used to load more rows to the chat
 * */
export class LoadMoreRows {
  constructor(recipientId, rows) {
    this.recipientId = recipientId;
    this.rows = rows;
  }
}

class TypingInProgress {
  constructor(userId, recipientId, active) {
    this.from = userId;
    this.to = recipientId;
    this.active = active;
  }
}

async function setRecipient() {
  const recipientName = await fetch(`/user?userid=${recipientId}`)
    .then((d) => {
      return d.json();
    })
    .then((d) => {
      return d.username;
    });

  let changeEvent = new ChangeRecipientIdEvent(recipientId);
  sendEvent("change_recipient", changeEvent);
  let chatHeader = document.getElementById("chat-header");
  chatHeader.innerHTML = `Chat - ${recipientName}`;
  document.querySelectorAll(".chat-user").forEach((e) => {
    e.classList.remove("active");
  });
  let recipientUserDiv = document
    .getElementById(recipientId)
    .classList.add("active");
}

export async function getUsers() {
  let response = await fetch("/getuserid");
  userid = await response.json();
  username = await fetch(`/user?userid=${userid}`)
    .then((d) => {
      return d.json();
    })
    .then((d) => {
      return d.username;
    });
  let getEvent = new GetUsersEvent(userid);
  sendEvent("get_users", getEvent);
}

async function loadMoreChatRows() {
  let getEvent = new LoadMoreRows(recipientId, currentChatRowsCount + 15);
  sendEvent("load_more_rows", getEvent);
}

/**
 * routeEvent is a proxy function that routes
 * events into their correct Handler
 * based on the type field
 * */
function routeEvent(event) {
  if (event.type === undefined) {
    alert("no 'type' field in event");
  }
  switch (event.type) {
    case "new_message":
      // Format payload
      const messageEvent = Object.assign(new NewMessageEvent(), event.payload);
      if (messageEvent.from === recipientId) {
        appendChatMessage(messageEvent, "r-message", true);
        document.getElementById("typing-event").style.display = "none";
      } else {
        handleOtherUserMessages(messageEvent);
      }
      break;
    case "chat_data":
      document.getElementById(
        "messages"
      ).innerHTML = `
      <p id="typing-event" class="message r-message" style="display:none"><img src="./static/img/loading.gif" alt="typing-in-progress"/></p>
      <p id="typing-user" style="display:none; margin-left: 5px;" class="message r-message"></p> 
      `;
      currentChatRowsCount = event.payload.length;
      for (let elem of event.payload) {
        appendChatMessage(
          elem,
          elem.from === userid ? "s-message" : "r-message",
          true
        );
      }
      break;
    case "chat_extra_data":
      let chatDiv = document.getElementById("messages");
      chatDiv.innerHTML = `
      <p id="typing-event" class="message r-message" style="display:none"><img src="./static/img/loading.gif" alt="typing-in-progress"/></p>
      <p id="typing-user" style="display:none; margin-left: 5px;" class="message r-message"></p> 
      `;
      currentChatRowsCount = event.payload.length;
      for (let elem of event.payload) {
        appendChatMessage(
          elem,
          elem.from === userid ? "s-message" : "r-message",
          false
        );
      }
      chatDiv.scrollTop = chatDiv.scrollHeight - scrollHeightBeforeLoad;
      loadingMessages = false;
      break;
    case "users_data":
      let data = event.payload;
      createUsers(data);
      break;
    case "user_status_change":
      let userData = event.payload;
      let userContainer = document.getElementById(userData.userId);
      if (userContainer !== null) {
        let statusDiv = userContainer.querySelector(".user-status");
        if (userData.status === "online") {
          statusDiv.classList.add("online");
          statusDiv.classList.remove("offline");
        } else {
          statusDiv.classList.add("offline");
          statusDiv.classList.remove("online");
        }
      }
    case "typing_in_progress":
      const typingEvent = Object.assign(new TypingInProgress(), event.payload);
      if (typingEvent.from === recipientId) {
        openChatTypingEvent(typingEvent);
      }
      break;
    default:
      alert("unsupported message type");
      break;
  }
}

async function openChatTypingEvent(event) {
  let element = document.getElementById("typing-event");
  let userElement = document.getElementById("typing-user")
  console.log(userElement)
  let user = await fetch(`/user?userid=${event.from}`)
    .then((d) => {
      return d.json();
    })
    .then((d) => {
      return d.username;
    });

  if (event.active === true) {
    const messagesDiv = document.getElementById("messages");
    let scrolledDown =
      messagesDiv.scrollHeight -
        messagesDiv.scrollTop -
        messagesDiv.clientHeight <
      1;
    element.style.display = "block";
    userElement.innerHTML = `${user} is typing...`
    userElement.style.display = "block";
    if (scrolledDown) {
      // show typing if scrolled to the bottom
      messagesDiv.scrollTop = messagesDiv.scrollTop + 120;
    }
  } else {
    element.style.display = "none";
    userElement.style.display = "none";
  }
}

// createUsers function creates the users list in chat
export function createUsers(d) {
  let chatHistoryUsers = d.filter((e) => e.Sent !== "");
  let otherUsers = d.filter((e) => e.Sent === "");
  chatHistoryUsers.sort(function (a, b) {
    const dateA = new Date(a.LastMessage.Sent).getTime();
    const dateB = new Date(b.LastMessage.Sent).getTime();

    if (dateA < dateB) {
      return 1;
    } else if (dateA > dateB) {
      return -1;
    }

    return 0;
  });

  otherUsers.sort((a, b) => (a.Username > b.Username ? 1 : -1));
  let data = [...chatHistoryUsers, ...otherUsers];
  let usersContainer = document.getElementById("users-container");
  usersContainer.innerHTML = "";
  let header = document.createElement("h2");
  header.innerHTML = "Users";
  header.setAttribute("id", "users-header");
  usersContainer.appendChild(header);

  for (let elem of data) {
    let newElem = document.createElement("div");
    newElem.classList.add("chat-user");
    newElem.setAttribute("id", elem.UserId);

    let newUserName = document.createElement("div");
    newUserName.classList.add("chat-username");
    newUserName.innerHTML = elem.Username;

    let lastMessage = document.createElement("div");
    lastMessage.classList.add("chat-last-message");
    lastMessage.innerHTML = elem.LastMessage;

    let status = document.createElement("div");
    status.classList.add("user-status");
    if (elem.Status === "online") {
      status.classList.add("online");
    } else {
      status.classList.add("offline");
    }

    newElem.appendChild(newUserName);
    newElem.append(lastMessage);
    newElem.append(status);
    usersContainer.appendChild(newElem);
    newElem.addEventListener("click", () => {
      changeRecipient(elem.UserId);
    });
  }
  if (window.location.pathname === "/chat") {
    changeRecipient(data[0].UserId);
  }
}

/**
 * appendChatMessage takes in new messages and adds them to the chat
 * */
function appendChatMessage(messageEvent, direction, scrollBottom) {
  // check which user sent the last message, if the same user
  // that sends the new message then add row without sender name
  var messages = document.querySelectorAll(".message-box");
  var lastMessage = messages[messages.length - 1];
  const messagesDiv = document.getElementById("messages");

  if (
    messages.length > 0 &&
    lastMessage.getAttribute("direction") === direction
  ) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", direction);
    messageDiv.innerText = messageEvent.message;
    lastMessage.appendChild(messageDiv);
  } else {
    var date = new Date(messageEvent.sent);
    // Append Message
    const messageBox = document.createElement("div");
    messageBox.setAttribute("direction", direction);
    messageBox.classList.add("message-box");

    const senderIdDiv = document.createElement("div");
    senderIdDiv.classList.add("username");
    const titleCaseUsername =
      messageEvent.username.charAt(0).toUpperCase() +
      messageEvent.username.substr(1).toLowerCase();
    senderIdDiv.innerText = titleCaseUsername;

    const timestampSpan = document.createElement("span");
    timestampSpan.classList.add("timestamp");
    timestampSpan.innerText = date;
    senderIdDiv.append(timestampSpan);

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", direction);
    messageDiv.innerText = messageEvent.message;

    messageBox.appendChild(senderIdDiv);
    messageBox.appendChild(messageDiv);
    let typinInProgressElem = document.getElementById("typing-event");
    messagesDiv.insertBefore(messageBox, typinInProgressElem);
  }
  if (scrollBottom) {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  let recipientUserDiv = document.getElementById(recipientId);
  recipientUserDiv.querySelector(".chat-last-message").innerHTML =
    messageEvent.message;
}

function changeRecipient(userId) {
  recipientId = userId;
  let recipientUserDiv = document.getElementById(userId);
  recipientUserDiv.querySelector(".chat-last-message").style.fontWeight = 400;
  if (chatVisible) {
    setRecipient();
  } else {
    loadChat();
  }
  //setRecipient()
}

export function closeConnection() {
  let closeEvent = new CloseConnectionEvent(userid);
  sendEvent("close_connection", closeEvent);
}

/**
 * sendMessage will send a new message onto the Chat
 * */
function sendMessage(event) {
  event.preventDefault();
  var newmessage = document.getElementById("message-input");
  if (newmessage != null) {
    let outgoingEvent = new SendMessageEvent(
      newmessage.value,
      userid,
      recipientId
    );
    sendEvent("send_message", outgoingEvent);
    let outputMessage = {
      message: newmessage.value,
      sent: Date(),
      username: username,
    };
    appendChatMessage(outputMessage, "s-message", true);
    let recipientUserDiv = document.getElementById(recipientId);
    let usersContainer = document.getElementById("users-container");
    if (recipientUserDiv !== usersContainer.children[1]) {
      // Remove the recipient user div from its current position
      usersContainer.removeChild(recipientUserDiv);
      // Insert the recipient user div at the top of the users-container
      usersContainer.insertBefore(recipientUserDiv, usersContainer.children[1]);
    }
    newmessage.value = "";
  }
  return false;
}

/**
 * sendEvent
 * eventname - the event name to send on
 * payload - the data payload
 * */
function sendEvent(eventName, payload) {
  // Create a event Object with a event named send_message
  const event = new Event(eventName, payload);
  // Format as JSON and send
  waitForSocketConnection(socket, () => {
    socket.send(JSON.stringify(event));
  });
}

export async function loadWs() {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    // Create a new WebSocket connection
    socket = new WebSocket("ws://localhost:8080/ws");

    // Set up event listeners
    socket.onopen = async () => {
      wsConnected = true;
      console.log("WebSocket connection opened");
    };
    socket.onclose = () => {
      wsConnected = false;
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error", error);
    };
  }
  socket.onclose = (event) => {
    wsConnected = false;
    console.log("Socket closed connection: ", event);
  };
  socket.onerror = (error) => {
    console.log("Socket error: ", error);
  };

  socket.onmessage = function (evt) {
    // parse websocket message as JSON
    const eventData = JSON.parse(evt.data);
    // Assign JSON data to new Event Object
    const event = Object.assign(new Event(), eventData);
    // Let router manage message
    routeEvent(event);
  };
  return socket;
}

// Make the function wait until the connection is made...
function waitForSocketConnection(socket, callback) {
  setTimeout(function () {
    if (socket.readyState === 1) {
      if (callback != null) {
        callback();
      }
    } else {
      console.log("wait for connection...");
      waitForSocketConnection(socket, callback);
    }
  }, 5); // wait 5 milisecond for the connection...
}

export async function loadChat() {
  let response = await fetch("/getuserid");
  userid = await response.json();
  username = await fetch(`/user?userid=${userid}`)
    .then((d) => {
      return d.json();
    })
    .then((d) => {
      return d.username;
    });
  socket = await loadWs();
  document.getElementById("forum-content").style.display = "none";
  document.getElementById("chat-content").style.display = "block";
  chatVisible = true;
  document.getElementById("chat-content").innerHTML = `
        <div id="chat-container">
            <div id="messages-container">
                <div id="chat-header-container">
                    <h2 id="chat-header">Chat</h2>
                    <button id="close-chat" class="button-4">return to Forum</button>
                </div>
                <div id="messages">
                <p id="typing-event" class="message r-message" style="display:none;"><img src="./static/img/loading.gif" alt="typing-in-progress"/></p>
                <p id="typing-user" style="display:none; margin-left: 5px;" class="message r-message"></p> 
                </div>
                <form id="chat-form">
                    <input type="text" id="message-input" placeholder="Type your message...">
                    <button id="send-message" type="submit">Send</button>
                </form>
            </div>
        </div>
    `;
  setRecipient();
  document.getElementById("chat-form").onsubmit = sendMessage;
  document.getElementById("close-chat").addEventListener("click", () => {
    document.getElementById("chat-content").style.display = "none";
    document.getElementById("forum-content").style.display = "block";
    chatVisible = false;
    document.querySelectorAll(".chat-user").forEach((e) => {
      e.classList.remove("active");
    });
  });
  let chatDiv = document.getElementById("messages");
  chatDiv.addEventListener("scroll", throttle(loadMoreRowsCallback, 50));
  document.getElementById("message-input").addEventListener("input", () => {
    let outgoingEvent = new TypingInProgress(userid, recipientId, true);
    sendEvent("typing_in_progress", outgoingEvent);

    clearTimeout(typingTimer); // Clear the previous timer

    // Start a new timer
    typingTimer = setTimeout(() => {
      // This code will execute when typing has stopped
      let outgoingEvent = new TypingInProgress(userid, recipientId, false);
      sendEvent("typing_in_progress", outgoingEvent);
    }, typingDelay);
  });
  document.getElementById("message-input").addEventListener("blur", (event) => {
    let outgoingEvent = new TypingInProgress(userid, recipientId, false);
    sendEvent("typing_in_progress", outgoingEvent);
  });
}

function loadMoreRowsCallback() {
  let chatDiv = document.getElementById("messages");
  if (chatDiv.scrollTop < 80 && !loadingMessages) {
    scrollHeightBeforeLoad = chatDiv.scrollHeight;
    loadMoreChatRows();
  }
}

function throttle(fn, wait) {
  var time = Date.now();
  return function () {
    if (time + wait - Date.now() < 0) {
      fn();
      time = Date.now();
    }
  };
}

// this function shows new messages from users and maybe a notification, but doesn't update current chat
function handleOtherUserMessages(messageEvent) {
  let recipientUserDiv = document.getElementById(messageEvent.from);
  let usersContainer = document.getElementById("users-container");
  if (recipientUserDiv !== usersContainer.children[1]) {
    // Remove the recipient user div from its current position
    usersContainer.removeChild(recipientUserDiv);
    // Insert the recipient user div at the top of the users-container
    usersContainer.insertBefore(recipientUserDiv, usersContainer.children[1]);
  }
  recipientUserDiv.querySelector(".chat-last-message").style.fontWeight = 700;
  recipientUserDiv.querySelector(".chat-last-message").innerHTML =
    messageEvent.message;
}
