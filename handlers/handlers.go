package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"real-time-forum/helpers"
	"real-time-forum/pkg"
	"strconv"
	"text/template"
)

type Category struct {
	Id           int
	CategoryName string
	Img          string
}

var (
	templates = template.Must(template.ParseFiles("./static/index.html"))
)

func HandleIndex(w http.ResponseWriter, r *http.Request) {
	err := templates.ExecuteTemplate(w, "index.html", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func GetUserIdFromCookie(w http.ResponseWriter, r *http.Request) string {
	c, _ := r.Cookie("sessionId")
	username := helpers.FindNicknameFromCookie(c.Value)
	userId := helpers.GetUserId(username)
	return userId
}

func GetUserData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	resp := make(map[string]string)
	queryUserId := r.URL.Query().Get("userid")
	if queryUserId != "" {
		resp["userId"] = queryUserId
		resp["username"] = helpers.FindNicknameFromUserId(queryUserId)
	} else {
		c, err := r.Cookie("sessionId")
		if err != nil {
			if err == http.ErrNoCookie {
				// If the cookie is not set, return an unauthorized status
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			// For any other type of error, return a bad request status
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		username := helpers.FindNicknameFromCookie(c.Value)
		userId := helpers.GetUserId(username)
		resp["userId"] = userId
		resp["username"] = username
	}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}
	w.Write(jsonResp)
}

func GetNickname(w http.ResponseWriter, r *http.Request) {
	cookieId := r.URL.Query().Get("cookieid")
	username := helpers.FindNicknameFromCookie(cookieId)
	jsonData, err := json.Marshal(username)
	if err != nil {
		fmt.Println(err)
		return
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonData)
}

func GetCategories(w http.ResponseWriter, r *http.Request) {
	var data = []Category{}
	rows, err := helpers.Db.Query(`select * from categories`)
	if err != nil {
		fmt.Println(err)
	}
	defer rows.Close()
	for rows.Next() {
		category := new(Category)
		err = rows.Scan(&category.Id, &category.CategoryName, &category.Img)
		if err != nil {
			fmt.Println(err)
		} else {
			data = append(data, *category)
		}
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println(err)
		return
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonData)
}

func FavHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "ok", 200)
}

func GetCategoryPosts(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	posts := helpers.GetPosts(category)
	jsonData, err := json.Marshal(posts)
	if err != nil {
		fmt.Println(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonData)
}

func GetCommentData(w http.ResponseWriter, r *http.Request) {
	postid := r.URL.Query().Get("postid")
	rows, err := helpers.Db.Query("SELECT * FROM comments WHERE post_id = ?", postid)
	if err != nil {
		fmt.Println(err)
	}
	commentArr := []pkg.Comment{}
	for rows.Next() {
		comment := pkg.Comment{}
		rows.Scan(&comment.Id, &comment.PostId, &comment.Comment, &comment.Likes, &comment.Dislikes, &comment.CommentUserId)
		commentArr = append(commentArr, comment)
	}
	jsonData, err := json.Marshal(commentArr)
	if err != nil {
		fmt.Println(err)
	}
	// Set the Content-Type header to application/json
	// Write the JSON response
	w.Write(jsonData)
}

func GetUserProfileData(w http.ResponseWriter, r *http.Request) {
	data := r.URL.Query().Get("data")
	userId := r.URL.Query().Get("userid")
	var post []helpers.SinglePost
	var comment []helpers.Comment
	var jsonData []byte
	var err error
	if data == "posts" {
		post = helpers.GetUserPosts(userId)
		jsonData, err = json.Marshal(post)
	} else if data == "comments" {
		comment = helpers.GetUserComments(userId)
		jsonData, err = json.Marshal(comment)
	} else if data == "postLikes" {
		post = helpers.GetUserPostLikes(userId)
		jsonData, err = json.Marshal(post)
	} else if data == "commentLikes" {
		comment = helpers.GetUserCommentLikes(userId)
		jsonData, err = json.Marshal(comment)
	}
	if err != nil {
		fmt.Println(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonData)
}

func GetUserPosts(w http.ResponseWriter, r *http.Request) {
	userId := r.URL.Query().Get("userid")
	posts := helpers.GetUserPosts(userId)
	jsonData, err := json.Marshal(posts)
	if err != nil {
		fmt.Println(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonData)
}

func GetPostData(w http.ResponseWriter, r *http.Request) {
	postid := r.URL.Query().Get("postid")
	c, err := r.Cookie("sessionId")
	if err != nil {
		if err == http.ErrNoCookie {
			// If the cookie is not set, return an unauthorized status
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		// For any other type of error, return a bad request status
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	username := helpers.FindNicknameFromCookie(c.Value)
	userid := helpers.GetUserId(username)
	postAndErr := helpers.GetPostById(postid, userid)
	jsonData, err := json.Marshal(postAndErr)
	if err != nil {
		fmt.Println(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonData)
}

func GetNickNameFromUserId(w http.ResponseWriter, r *http.Request) {
	userid := r.URL.Query().Get("userid")
	nickname := ""
	rows, err := helpers.Db.Query("SELECT nickname FROM users WHERE userid = ?", userid)
	if err != nil {
		fmt.Println(err)
	}
	for rows.Next() {
		rows.Scan(&nickname)
	}
	jsonData, err := json.Marshal(nickname)
	if err != nil {
		fmt.Println(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonData)
}

func AddCommentHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	resp := make(map[string]string)
	var comment helpers.PostComment
	c, err := r.Cookie("sessionId")
	if err != nil {
		if err == http.ErrNoCookie {
			// If the cookie is not set, return an unauthorized status
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		// For any other type of error, return a bad request status
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	username := helpers.FindNicknameFromCookie(c.Value)
	err = json.NewDecoder(r.Body).Decode(&comment)
	comment.CommentUserId = helpers.GetUserId(username)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if !helpers.InsertNewComment(comment.SinglePostId, comment.Comment, comment.CommentUserId) {
		resp["result"] = "error"
		resp["username"] = username
		resp["error"] = "Failed to insert comment into database"
	} else {
		resp["result"] = "success"
		resp["username"] = username
		resp["userid"] = helpers.GetUserId(username)
		resp["id"] = strconv.Itoa(helpers.GetCommentMaxId())
		resp["error"] = ""
	}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}
	w.Write(jsonResp)
	return
}

func AddPostLikeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
	}
	if r.URL.Path != "/vote" {
		http.NotFound(w, r)
		fmt.Println("Wrong path")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	resp := make(map[string]string)
	id := r.URL.Query().Get("id")
	vote := r.URL.Query().Get("vote")
	c, err := r.Cookie("sessionId")
	if err != nil {
		if err == http.ErrNoCookie {
			// If the cookie is not set, return an unauthorized status
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		// For any other type of error, return a bad request status
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	username := helpers.FindNicknameFromCookie(c.Value)
	userid := helpers.GetUserId(username)
	if vote == "like" {
		_, err := helpers.Db.Exec("UPDATE posts SET likeCount = likeCount + 1 where id = '" + id + "'")
		_, err1 := helpers.Db.Exec("INSERT INTO likes (userId, postId, postType, likeType) VALUES (?, ?, ?, ?)", userid, id, "post", "like")
		if err != nil || err1 != nil {
			fmt.Println(err, err1)
			resp["result"] = "error"
			resp["error"] = "Failed to update database!"
		} else {
			resp["result"] = "success"
			resp["error"] = ""
		}
	} else if vote == "dislike" {
		_, err = helpers.Db.Exec("UPDATE posts SET dislikeCount = dislikeCount + 1 where id = '" + id + "'")
		_, err1 := helpers.Db.Exec("INSERT INTO likes (userId, postId, postType, likeType) VALUES (?, ?, ?, ?)", userid, id, "post", "dislike")
		if err != nil || err1 != nil {
			resp["result"] = "error"
			resp["error"] = "Failed to update database!"
		} else {
			resp["result"] = "success"
			resp["error"] = ""
		}
	} else {
		resp["result"] = "error"
		resp["error"] = "Failed to read vote!"
	}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}
	w.Write(jsonResp)
	return
}

func AddCommentLikeHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/addcomment/vote" {
		http.NotFound(w, r)
		fmt.Println("Wrong path")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	resp := make(map[string]string)
	id := r.URL.Query().Get("id")
	vote := r.URL.Query().Get("vote")
	nickname := r.URL.Query().Get("username")
	userId := helpers.GetUserId(nickname)
	postId := 0
	row := helpers.Db.QueryRow("SELECT postId FROM comments WHERE id = '" + id + "'")
	row.Scan(&postId)
	str := strconv.Itoa(postId)
	helpers.CheckCommentLike(vote, id, str, userId)
	if vote == "like" {
		_, err := helpers.Db.Exec("UPDATE comments SET likes = likes + 1 where id = '" + id + "'")
		_, err1 := helpers.Db.Exec("INSERT INTO likes (userId, postId, postType, likeType, commentId) VALUES (?, ?, ?, ?, ?)", userId, str, "comment", "like", id)
		if err != nil || err1 != nil {
			resp["result"] = "error"
			resp["error"] = "Failed to insert into database!"
		} else {
			resp["result"] = "success"
			resp["error"] = ""
		}
	} else if vote == "dislike" {
		_, err := helpers.Db.Exec("UPDATE comments SET dislikes = dislikes + 1 where id = '" + id + "'")
		_, err1 := helpers.Db.Exec("INSERT INTO likes (userId, postId, postType, likeType, commentId) VALUES (?, ?, ?, ?, ?)", userId, str, "comment", "dislike", id)
		if err != nil || err1 != nil {
			resp["result"] = "error"
			resp["error"] = "Failed to insert into database!"
		} else {
			resp["result"] = "success"
			resp["error"] = ""
		}
	} else {
		resp["result"] = "error"
		resp["error"] = "Failed to read vote!"
	}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}
	w.Write(jsonResp)
	return
}

func CheckUserLikeHandler(w http.ResponseWriter, r *http.Request) {
	resp := ""
	nickname := r.URL.Query().Get("username")
	posttype := r.URL.Query().Get("posttype")
	id := r.URL.Query().Get("id")
	userId := helpers.GetUserId(nickname)
	if posttype == "comment" {
		rows, err := helpers.Db.Query("SELECT likeType FROM	likes WHERE commentId = ? and userId = ?", id, userId)
		if err != nil {
			fmt.Println(err)
		}
		defer rows.Close()
		if rows.Next() {
			rows.Scan(&resp)
		} else {
			resp = "none"
		}
	}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}
	w.Write(jsonResp)
	return
}

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	resp := ""
	var newpost struct {
		Title    string `json:"title"`
		Content  string `json:"content"`
		Category string `json:"category"`
	}
	err := json.NewDecoder(r.Body).Decode(&newpost)
	c, err := r.Cookie("sessionId")
	if err != nil {
		if err == http.ErrNoCookie {
			// If the cookie is not set, return an unauthorized status
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		// For any other type of error, return a bad request status
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	username := helpers.FindNicknameFromCookie(c.Value)
	userId := helpers.GetUserId(username)
	_, err = helpers.Db.Exec("INSERT INTO posts (heading, tekst, likecount, dislikecount, commentcount, category, userid) VALUES (?, ?, ?, ?, ?, ?, ?)", newpost.Title, newpost.Content, 0, 0, 0, newpost.Category, userId)
	if err != nil {
		fmt.Println(err)
		resp = "error"
	} else {
		resp = "success"
	}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}
	w.Write(jsonResp)
	return
}

func GetUserIdHandler(w http.ResponseWriter, r *http.Request) {
	cookie, _ := r.Cookie("sessionId")
	username := helpers.FindNicknameFromCookie(cookie.Value)
	userId := helpers.GetUserId(username)
	jsonResp, err := json.Marshal(userId)
	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}
	w.Write(jsonResp)
}
