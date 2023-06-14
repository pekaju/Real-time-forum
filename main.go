package main

import (
	"log"
	"net/http"
	"real-time-forum/handlers"
	"real-time-forum/helpers"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Create a Manager instance used to handle WebSocket Connections
	manager := helpers.NewManager()

	defer helpers.Db.Close()
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.HandleFunc("/", handlers.HandleIndex)
	http.HandleFunc("/logincheck", handlers.HandleLoginCheck)
	http.HandleFunc("/favicon.ico", handlers.FavHandler)
	http.HandleFunc("/submitRegisterData", handlers.SubmitRegister)
	http.HandleFunc("/check-availability", handlers.CheckAvailability)
	http.HandleFunc("/submitlogin", handlers.SubmitLogin)
	http.HandleFunc("/logout", handlers.LogOut)
	http.HandleFunc("/categories", handlers.GetCategories)
	http.HandleFunc("/posts", handlers.GetCategoryPosts)
	http.HandleFunc("/getnickname", handlers.GetNickname)
	http.HandleFunc("/commentdata", handlers.GetCommentData)
	http.HandleFunc("/profile/data", handlers.GetUserProfileData)
	http.HandleFunc("/user", handlers.GetUserData)
	http.HandleFunc("/getpostdata", handlers.GetPostData)
	http.HandleFunc("/getnicknamefromuserid", handlers.GetNickNameFromUserId)
	http.HandleFunc("/addcomment", handlers.AddCommentHandler)
	http.HandleFunc("/vote", handlers.AddPostLikeHandler)
	http.HandleFunc("/addcomment/vote", handlers.AddCommentLikeHandler)
	http.HandleFunc("/checkuserlike", handlers.CheckUserLikeHandler)
	http.HandleFunc("/createpost", handlers.CreatePostHandler)
	http.HandleFunc("/getuserid", handlers.GetUserIdHandler)
	//http.HandleFunc("/ws", handlers.WsEndPoint)
	http.HandleFunc("/ws", manager.ServeWS)
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Println(err)
	}
}
