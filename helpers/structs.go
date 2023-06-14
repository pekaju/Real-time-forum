package helpers

type SinglePost struct {
	ID           int
	Heading      string
	Likes        int
	Dislikes     int
	UserLike     string
	Text         string
	Category     string
	Comments     []Comment
	UserId       string
	User         User
	PostLink     string
	CommentCount int
}

type Comment struct {
	ID                int
	SinglePost_id     int
	CommentText       string
	Likes             int
	Dislikes          int
	UserId            string
	UserLike          string
	User              User
	SinglePostHeading string
	SinglePostLink    string
}

type User struct {
	UserId   string
	Username string
	Email    string
	Status   string
	MessageToUser
}

type MessageToUser struct {
	LastMessage string
	Sent        string
}

type PostComment struct {
	SinglePostId  int
	Comment       string
	CommentUserId string
}

type UserData struct {
	User         User
	Posts        []SinglePost
	Comments     []Comment
	PostLikes    []SinglePost
	CommentLikes []Comment
	IsLoggedIn   bool
}
