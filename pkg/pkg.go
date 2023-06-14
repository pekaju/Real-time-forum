package pkg

type NewUser struct {
	Nickname  string `json:"nickname"`
	Age       string `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type Login struct {
	Message  string
	Error    string
	CookieId string
	UserId   string
}

type PostInCategoryList struct {
	Id           int    `json:"id"`
	Heading      string `json:"heading"`
	LikeCount    int    `json:"likecount"`
	DislikeCount int    `json:"dislikecount"`
	CommentCount int    `json:"commentcount"`
	UserId       string `json:"userid"`
}

type Comment struct {
	Id            int    `json:"id"`
	PostId        int    `json:"postid"`
	Comment       string `json:"comment"`
	Likes         int    `json:"likes"`
	Dislikes      int    `json:"dislikes"`
	CommentUserId string `json:"userid"`
}

type Post struct {
	Id           int    `json:"id"`
	Heading      string `json:"heading"`
	Text         string `json:"text"`
	LikeCount    int    `json:"likecount"`
	DislikeCount int    `json:"dislikecount"`
	CommentCount int    `json:"commentcount"`
	UserId       string `json:"userid"`
	UserLike     string `json:"userlike"`
}

type PostErr struct {
	Post  Post
	Error string
}

type MessagePayload struct {
	ToUserID   string `json:"toUserId"`
	FromUserID string `json:"fromUserId"`
	Message    string `json:"message"`
	TimeSent   string `json:"timeSent"`
	Username   string `json:"username`
}
