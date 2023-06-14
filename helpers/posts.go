package helpers

import (
	"fmt"
	"real-time-forum/pkg"
	"strconv"
)

func GetPosts(category string) []pkg.PostInCategoryList {
	posts := []pkg.PostInCategoryList{}
	rows, err := Db.Query("SELECT id, heading, likecount, dislikecount, commentcount, userid FROM posts WHERE category = ?", category)
	if err != nil {
		fmt.Println(err)
	}
	defer rows.Close()
	for rows.Next() {
		newPost := pkg.PostInCategoryList{}
		rows.Scan(&newPost.Id, &newPost.Heading, &newPost.LikeCount, &newPost.DislikeCount, &newPost.CommentCount, &newPost.UserId)
		posts = append(posts, newPost)
	}
	return posts
}

func GetPostById(id string, userid string) pkg.PostErr {
	intId, _ := strconv.Atoi(id)
	post := pkg.Post{}
	posterr := pkg.PostErr{}
	rows, err := Db.Query(`SELECT id, heading, tekst, likecount, dislikecount, commentcount, userid ,
	CASE 
		WHEN likeType IS NULL THEN "" 
		ELSE liketype 
		END AS UserLike
	FROM posts
	LEFT JOIN (SELECT postId, likeType FROM likes WHERE posttype = 'post' and 
	userId = '`+userid+`') AS likesData on likesData.postId = posts.id
	WHERE posts.id = ?`, intId)
	defer rows.Close()
	if err != nil {
		fmt.Println(err)
	}
	if !rows.Next() {
		posterr.Post = post
		posterr.Error = "error"
		return posterr
	} else {
		rows.Scan(&post.Id, &post.Heading, &post.Text, &post.LikeCount, &post.DislikeCount, &post.CommentCount, &post.UserId, &post.UserLike)
	}
	posterr.Post = post
	posterr.Error = ""
	return posterr
}

// insert new comment under the post
func InsertNewComment(singlePostId int, comment string, commentUserId string) bool {
	sqlStatement := `
	INSERT INTO comments (post_id, comment, likes, dislikes, commentUserId)
	VALUES (?, ?, ?, ?, ?);
	`
	_, err := Db.Exec(sqlStatement, singlePostId, comment, 0, 0, commentUserId)
	if err != nil {
		fmt.Println(err)
		return false
	}
	fmt.Println("Comment added successfully. PostId:", singlePostId)
	return true
}

func GetCommentMaxId() int {
	var maxId int

	err := Db.QueryRow("SELECT MAX(id) from comments").Scan(&maxId)
	if err != nil {
		fmt.Println(err)
		return -1
	}
	return maxId
}

func CheckCommentLike(vote string, id string, postId string, userId string) {
	if vote == "like" {
		stmt, err := Db.Prepare("DELETE FROM likes WHERE likeType = ? and commentId = ? and userId = ?")
		if err != nil {
			fmt.Println("Error preparing delete statement")
			return
		}
		defer stmt.Close()
		result, err := stmt.Exec("dislike", id, userId)
		if err != nil {
			fmt.Println("Error executing delete statement.")
			return
		}
		checkExecute, err := result.RowsAffected()
		if checkExecute == 1 {
			_, err = Db.Exec("UPDATE comments SET dislikes = dislikes - 1 where id = '" + id + "'")
		}
	} else if vote == "dislike" {
		stmt, err := Db.Prepare("DELETE FROM likes WHERE likeType = ? and commentId = ? and userId = ?")
		if err != nil {
			fmt.Println("Error preparing delete statement")
			return
		}
		defer stmt.Close()
		result, err := stmt.Exec("like", id, userId)
		if err != nil {
			fmt.Println("Error executing delete statement.")
			return
		}
		checkExecute, err := result.RowsAffected()
		if checkExecute == 1 {
			_, err = Db.Exec("UPDATE comments SET likes = likes - 1 where id = '" + id + "'")
		}
	}
}
