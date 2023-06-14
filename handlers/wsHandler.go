package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"real-time-forum/helpers"
	"real-time-forum/pkg"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func reader(conn *websocket.Conn) {
	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}
		var payload pkg.MessagePayload
		err = json.Unmarshal(p, &payload)
		if err != nil {
			log.Println(err)
			return
		}
		payload.TimeSent = time.Now().Format("2006-01-02 15:04:05")
		payload.Username = helpers.FindNicknameFromUserId(payload.FromUserID)
		helpers.PushMessageToDatabase(payload)
		b, _ := json.Marshal(payload)
		if err := conn.WriteMessage(messageType, b); err != nil {
			log.Println(err)
			return
		}
	}
}

func WsEndPoint(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}
	log.Println("Client successfully connected..")

	reader(ws)

}
