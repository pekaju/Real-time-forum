package helpers

import "real-time-forum/pkg"

func PushMessageToDatabase(payload pkg.MessagePayload) {
	Db.Exec("INSERT INTO chats(toUser, fromUser, timeSent, msg) VALUES (?, ?, ?, ?)", payload.ToUserID, payload.FromUserID, payload.TimeSent, payload.Message)
}

func PushMessageToDatabaseNew(payload NewMessageEvent) {
	Db.Exec("INSERT INTO chats(toUser, fromUser, timeSent, msg) VALUES (?, ?, ?, ?)", payload.To, payload.From, payload.Sent, payload.Message)
}
