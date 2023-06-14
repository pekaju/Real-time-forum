package helpers

import (
	"fmt"
)

func GetUserPosts(userId string) []SinglePost {
	userPosts := []SinglePost{}
	rows, err := Db.Query("select id, heading, tekst, '/post?postid=' || id as PostLink, likecount, dislikecount from posts  where userId = ? ", userId)
	if err != nil {
		fmt.Println(err)
	}
	defer rows.Close()
	for rows.Next() {
		singlePost := new(SinglePost)
		err = rows.Scan(&singlePost.ID, &singlePost.Heading, &singlePost.Text, &singlePost.PostLink, &singlePost.Likes, &singlePost.Dislikes)
		if err != nil {
			fmt.Println(err)
		} else {
			userPosts = append(userPosts, *singlePost)
		}
	}
	return userPosts
}

func GetUserComments(userId string) []Comment {
	userComments := []Comment{}
	rows, err := Db.Query(`select comments.id, comment, heading, '/post?postid=' || posts.id as PostPath, comments.Likes, comments.Dislikes from comments
	 Left join posts on posts.id = comments.post_id where commentUserId = '` + userId + `'`)
	if err != nil {
		fmt.Println(err)
	}
	defer rows.Close()
	for rows.Next() {
		comment := new(Comment)
		err = rows.Scan(&comment.ID, &comment.CommentText, &comment.SinglePostHeading, &comment.SinglePostLink, &comment.Likes, &comment.Dislikes)
		if err != nil {
			fmt.Println(err)
		} else {
			userComments = append(userComments, *comment)
		}
	}
	return userComments
}

func GetUserPostLikes(userId string) []SinglePost {
	userPostLikes := []SinglePost{}
	rows, err := Db.Query(`select id, heading, tekst, '/post?postid=' || id as PostLink, likeCount, dislikeCount from posts  
	Left JOIN (select * from likes where postType = 'post' and likeType = 'like') AS LikesData  On LikesData.postId = posts.id
	where Likesdata.userId ='` + userId + `'`)
	if err != nil {
		fmt.Println(err)
	}
	defer rows.Close()
	for rows.Next() {
		singlePost := new(SinglePost)
		err = rows.Scan(&singlePost.ID, &singlePost.Heading, &singlePost.Text, &singlePost.PostLink, &singlePost.Likes, &singlePost.Dislikes)
		if err != nil {
			fmt.Println(err)
		} else {
			userPostLikes = append(userPostLikes, *singlePost)
		}
	}
	return userPostLikes
}

func GetUserCommentLikes(userId string) []Comment {
	userCommentLikes := []Comment{}
	rows, err := Db.Query(`select comments.id, comment, heading, '/post?postid=' || posts.id as PostPath, comments.Likes, comments.Dislikes from comments
	LEFT JOIN posts on posts.id = comments.post_id
	LEFT JOIN (select * from likes where postType = 'comment' and likeType = 'like') AS LikesData  On LikesData.postId = comments.id
	where Likesdata.userId = '` + userId + `'`)
	if err != nil {
		fmt.Println(err)
	}
	defer rows.Close()
	for rows.Next() {
		comment := new(Comment)
		err = rows.Scan(&comment.ID, &comment.CommentText, &comment.SinglePostHeading, &comment.SinglePostLink, &comment.Likes, &comment.Dislikes)
		if err != nil {
			fmt.Println(err)
		} else {
			userCommentLikes = append(userCommentLikes, *comment)
		}
	}
	return userCommentLikes
}
