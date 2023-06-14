package helpers

import (
	"encoding/json"
	"fmt"
	"sort"
	"time"
)

// Event is the Messages sent over the websocket
// Used to differ between different actions
type Event struct {
	// Type is the message type sent
	Type string `json:"type"`
	// Payload is the data Based on the Type
	Payload json.RawMessage `json:"payload"`
}

// EventHandler is a function signature that is used to affect messages on the socket and triggered
// depending on the type
type EventHandler func(event Event, c *Client) error

const (
	// EventSendMessage is the event name for new chat messages sent
	EventSendMessage = "send_message"
	// EventNewMessage is a response to send_message
	EventNewMessage = "new_message"
	// EventChangeRecipient is event when switching recipient
	EventChangeRecipient = "change_recipient"
	// EventGetUsers gets the users for the chat
	EventGetUsers = "get_users"
	// EventSetStatus gets the users for the chat
	EventSetStatus = "set_status"
	// EventCloseConnection closes the client connection
	EventCloseConnection = "close_connection"
	// LoadMoreRows loads more rows to the chat
	LoadMoreRows = "load_more_rows"
	// TypingInProgress is used to digess when typing is in progress
	TypingInProgress = "typing_in_progress"
)

const ChatRowsPerFetch = 15

// SendMessageEvent is the payload sent in the
// send_message event
type SendMessageEvent struct {
	Message  string `json:"message"`
	From     string `json:"from"`
	To       string `json:"to"`
	Username string `json:"username"`
}

type TypingInProgressEvent struct {
	From string `json:"from"`
	To   string `json:"to"`
	Active bool `json:"active"`
}

// NewMessageEvent is returned when responding to send_message
type NewMessageEvent struct {
	SendMessageEvent
	Sent string `json:"sent"`
}

// SendMessageHandler will send out a message to recipient in the chat
func SendMessageHandler(event Event, c *Client) error {
	// Marshal Payload into wanted format
	var chatevent SendMessageEvent
	if err := json.Unmarshal(event.Payload, &chatevent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	// Prepare an Outgoing Message to others
	var broadMessage NewMessageEvent

	broadMessage.Sent = time.Now().Format("2006-01-02 15:04:05")
	broadMessage.Message = chatevent.Message
	broadMessage.From = chatevent.From
	broadMessage.To = chatevent.To
	broadMessage.Username = c.user.Username

	// save to database
	PushMessageToDatabaseNew(broadMessage)

	data, err := json.Marshal(broadMessage)
	if err != nil {
		return fmt.Errorf("failed to marshal broadcast message: %v", err)
	}

	// Place payload into an Event
	var outgoingEvent Event
	outgoingEvent.Payload = data
	outgoingEvent.Type = EventNewMessage
	// Broadcast to all other Clients
	for client := range c.manager.clients {
		// Only send to recipient
		if client.user.UserId == c.recipientId {
			client.egress <- outgoingEvent
		}

	}
	return nil
}

func TypingInProgressHandler(event Event, c *Client) error {
	// Place payload into an event
	
	var typingEvent TypingInProgressEvent
	if err := json.Unmarshal(event.Payload, &typingEvent); err != nil {
		return fmt.Errorf("failed to marshal typing in progress event: %v", err)
	}
	data, err := json.Marshal(typingEvent)
	if err != nil {
		return fmt.Errorf("failed to marshal broadcast message: %v", err)
	}

	// Place payload into an Event
	var outgoingEvent Event
	outgoingEvent.Payload = data
	outgoingEvent.Type = TypingInProgress
	for client := range c.manager.clients {
		// Only send to recipient
		if client.user.UserId == c.recipientId {
			client.egress <- outgoingEvent
		}

	}
	return nil
}

type ChangeRecipientEvent struct {
	RecipientId string `json:"recipient"`
}

// ChangeRecipientHandler will handle switching of different users
func ChangeRecipientHandler(event Event, c *Client) error {
	// Marshal Payload into wanted format
	var changeRecipientEvent ChangeRecipientEvent
	if err := json.Unmarshal(event.Payload, &changeRecipientEvent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	// Add Client to chat room
	c.recipientId = changeRecipientEvent.RecipientId

	// Place payload into an Event
	var outgoingEvent Event
	outgoingEvent.Payload = GetChatData(c.user.UserId, changeRecipientEvent.RecipientId, ChatRowsPerFetch)
	outgoingEvent.Type = "chat_data"
	c.egress <- outgoingEvent

	return nil
}

type LoadMoreRowsEvent struct {
	RecipientId string `json:"recipientId"`
	Rows        int    `json:"rows"`
}

func LoadMoreRowsHandler(event Event, c *Client) error {
	// Marshal Payload into wanted format
	var loadMorerowsEvent LoadMoreRowsEvent
	if err := json.Unmarshal(event.Payload, &loadMorerowsEvent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	// Place payload into an Event
	var outgoingEvent Event
	outgoingEvent.Payload = GetChatData(c.user.UserId, loadMorerowsEvent.RecipientId, loadMorerowsEvent.Rows)
	outgoingEvent.Type = "chat_extra_data"
	c.egress <- outgoingEvent

	return nil
}

func GetChatData(userId, recipientId string, rowsCount int) []byte {

	rows, err := Db.Query(`SELECT toUser AS 'To', fromUser as 'From', msg as 'Message' , nickname as 'Username',  timeSent as 'Sent' FROM chats 
		LEFT JOIN Users on chats.fromUser = Users.userid
		WHERE (toUser = ? AND fromUser = ?) OR (toUser = ? AND fromUser = ?)  ORDER BY timesent DESC LIMIT ?`, recipientId, userId, userId, recipientId, rowsCount)
	if err != nil {
		fmt.Println(err)
	}
	chatData := []NewMessageEvent{}
	for rows.Next() {
		nme := NewMessageEvent{}
		rows.Scan(&nme.To, &nme.From, &nme.Message, &nme.Username, &nme.Sent)
		chatData = append(chatData, nme)
	}
	chatData = reverseChatData(chatData)
	jsonData, err := json.Marshal(chatData)
	if err != nil {
		fmt.Println(err)
	}
	return jsonData
}

func reverseChatData(input []NewMessageEvent) []NewMessageEvent {
	if len(input) == 0 {
		return input
	}
	return append(reverseChatData(input[1:]), input[0])
}

// GetUsersHandler gets the users for the hat
func GetUsersHandler(event Event, c *Client) error {
	// Place payload into an Event
	var outgoingEvent Event
	rawMessage := GetUsersAndLastMessage(c.user.UserId)
	outgoingEvent.Payload = rawMessage
	outgoingEvent.Type = "users_data"
	c.egress <- outgoingEvent

	return nil
}

func GetUsersAndLastMessage(userId string) []byte {

	rows, err := Db.Query(`SELECT userId, nickname, staatus FROM users WHERE userId != ?`, userId)
	if err != nil {
		fmt.Println(err)
	}
	userData := []User{}
	for rows.Next() {
		user := User{}
		rows.Scan(&user.UserId, &user.Username, &user.Status)
		userData = append(userData, user)
	}
	finalUserData := []User{}
	for _, userItem := range userData {
		rows2, err2 := Db.Query(`SELECT msg as 'Message' , timeSent as 'Sent' FROM chats 
		LEFT JOIN Users on chats.toUser = Users.userid
		WHERE (toUser = ? AND fromUser = ?) OR (toUser = ? AND fromUser = ?)  ORDER BY timesent DESC LIMIT 1`, userItem.UserId, userId, userId, userItem.UserId)
		if err2 != nil {
			fmt.Println(err)
		}
		for rows2.Next() {
			rows2.Scan(&userItem.LastMessage, &userItem.Sent)
		}
		finalUserData = append(finalUserData, userItem)
	}
	sort.SliceStable(finalUserData, func(i, j int) bool {
		return finalUserData[i].Sent > finalUserData[j].Sent
	})
	jsonData, err := json.Marshal(finalUserData)
	if err != nil {
		fmt.Println(err)
	}
	return jsonData
}

// SendStatusHandler broadcasts a message to users that the user status has changed
func SendStatusHandler(c *Client) error {
	// Place payload into an Event
	var outgoingEvent Event
	rawMessage := GetUserStatus(c.user.UserId)

	outgoingEvent.Payload = rawMessage
	outgoingEvent.Type = "user_status_change"

	for client := range c.manager.clients {
		client.egress <- outgoingEvent
	}
	return nil
}

type SendStatusEvent struct {
	UserId string `json:"userId"`
	Status string `json:"status"`
}

func GetUserStatus(userId string) []byte {

	rows, err := Db.Query(`SELECT userId, staatus FROM users WHERE userId = ?`, userId)
	if err != nil {
		fmt.Println(err)
	}
	sse := SendStatusEvent{}
	for rows.Next() {
		rows.Scan(&sse.UserId, &sse.Status)

	}
	jsonData, err := json.Marshal(sse)
	if err != nil {
		fmt.Println(err)
	}
	return jsonData
}

// GetUsersHandler gets the users for the hat
func CloseConnectionHandler(event Event, c *Client) error {
	fmt.Println("CLOSE CONNECTION:", c.user.Username)
	c.manager.removeClient(c)
	return nil
}
