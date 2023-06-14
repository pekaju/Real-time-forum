import { getNicknameFromUserId, navigateTo, logout } from "../script.js"
import { getUsers, loadWs } from "./ws.js";


async function getCommentData(id) {
    const response = await fetch(`/commentdata?postid=${id}`)
    const data = await response.json()
    return data
}

async function getPostData(id) {
    const response = await fetch(`/getpostdata?postid=${id}`)
    const data = await response.json()
    if (data.Error !== "") {
        navigateTo("/Error")
        return data.Error
    }
    return data.Post
}

export async function displayPost(id) {
    const commentData = await getCommentData(id)
    const postData = await getPostData(id)
    if (postData === "error") {
        return
    }
    postData.creator = await getNicknameFromUserId(postData.userid)
    var commentContainerVar = ""
    for (const comment of commentData) {
        comment.creator = await getNicknameFromUserId(comment.userid)
        commentContainerVar += `
    <article class="comment-container" id=${comment.id}>
                    <section class="comment-content">
                        <pre>${comment.comment}</pre>
                    </section>
                    <div class="comment-bottom-section">
                        <aside class="likes" id="like-container">
                            Likes:
                            <div id="like-count" style="display:inline">${comment.likes}</div>
                            <button id="like-button">👍</button>
                        </aside>
                        <aside class="dislikes" id="dislike-container">
                            Dislikes:
                            <div id="dislike-count" style="display:inline">${comment.dislikes}</div>
                            <button id="dislike-button">👎</button>
                        </aside>
                        <aside class="user"> User:
                            <a target="_self" href="/profile?userid=${comment.userid}">${comment.creator}</a>
                        </aside>
                    </div>
                </article>
    `
    }
    document.getElementById("forum-content").innerHTML = `
        <article class="post-container" id=${postData.id}>
        <header class="header">
            <div class="inside-header">
                <h2>${postData.heading}</h2>
                <div class="header-buttons"><a href="/"><button id="home-btn" style="width:70px" class="button-4">Home</button></a>
                <button class="button-4" id="logout-btn" style="width:70px">Logout</button>
                </div>
            </div>
        </header>
        <section class="post-content">
            <div class="post-text">
                <pre>${postData.text}</pre>
            </div>
            <div class="post-bottom-section">
                <aside class="likes" id="post-like-container">
                    Likes:
                    <div id="post-like-count" style="display:inline">${postData.likecount}</div>
                    <button id="post-like-button"` + (postData.userlike === "like" ? 'class="liked"' : (postData.userlike === "dislike" ? "disabled" : "")) + `>👍</button>
                </aside>
                <aside class="dislikes" id="post-dislike-container">
                    Dislikes:
                    <div id="post-dislike-count" style="display:inline">${postData.dislikecount}</div>               
                    <button id="post-dislike-button"` + (postData.userlike === "dislike" ? 'class="disliked"' : (postData.userlike === "like" ? "disabled" : "")) + `>👎</button>
                </aside>
                <aside class="user"> User:
                    <a target="_self" href="/profile?userid=${postData.userid}">${postData.creator}</a>
                </aside>
            </div>
        </section>
        <section class="comments-container">
        ${commentContainerVar}
        </section>
        <article class="comment-container" id="add-comment-container">
            <form id="comment-form">
                    <label for="userComment" id="user-comment-label">Add your comment:</label>
                    <textarea type="text" name="userComment" id="userComment" required></textarea>
                <div id="submit-button-div">
                    <button class="button-4">Add comment</button>
                </div>
            </form>
        </article>
        </article>

    `

    // send post request to the server and add post to the database, if successful, then update html and add comment to the html.
    document.querySelector("#comment-form").addEventListener("submit", function (e) {
        e.preventDefault();
        let params = new URLSearchParams(window.location.search);
        let postId = params.get('postid');
        let comment = document.getElementById("userComment").value
        let user = "Error"
        let userid = ""
        let id = ""
        let url = "/addcomment"
        let body = JSON.stringify({
            "SinglePostId": parseInt(postId),
            "Comment": comment
        })
        fetch(url, {
            method: 'POST',
            body: body,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.result === "success") {
                    user = data.username
                    userid = data.userid
                    id = data.id
                    document.querySelector(".comments-container").innerHTML = document.querySelector(".comments-container").innerHTML + `
                <article class="comment-container" id=${id}>
                    <section class="comment-content">
                        <pre>${comment}</pre>
                    </section>
                    <div class="comment-bottom-section">
                        <aside class="likes" id="like-container">
                            Likes:
                            <div id="like-count" style="display:inline">0</div>
                            <button id="like-button">👍</button>
                        </aside>
                        <aside class="dislikes" id="dislike-container">
                            Dislikes:
                            <div id="dislike-count" style="display:inline">0</div>
                            <button id="dislike-button">👎</button>
                        </aside>
                        <aside class="user"> User:
                            <a target="_self" href="/profile?userid=${userid}">${user}</a>
                        </aside>
                    </div>
                </article>`
                    console.log("comment added")
                    document.getElementById("userComment").value = ""
                    window.location.reload()
                } else {
                    console.log(data.error)
                }
            });
    });
    document.getElementById("logout-btn").addEventListener("click", (event) => {
        event.preventDefault()
        logout()
    })
    setPostLikeEvent()
    setLikesOnClick()
    await loadWs()
    await getUsers()
}


// set post like 
function setPostLikeEvent(postData) {
    let params = new URLSearchParams(window.location.search);
    let postId = params.get('postid');
    let postDislikeBtn
    let postLikeBtn = document.getElementById("post-like-button");
    postLikeBtn.addEventListener("click", function () {
        const likeCountEl = document.getElementById("post-like-count");
        if (postLikeBtn.classList.contains("liked")) {
            alert("Post already liked")
        } else {
            setPostVote("like", postId)
            likeCountEl.innerHTML = parseInt(likeCountEl.innerHTML) + 1
            postLikeBtn.classList.add("liked")
            document.getElementById("post-dislike-button").disabled = true
        }
    });

    postDislikeBtn = document.getElementById("post-dislike-button");
    postDislikeBtn.addEventListener("click", function () {
        const dislikeCountEl = document.getElementById("post-dislike-count");
        if (postDislikeBtn.classList.contains("disliked")) {
            alert("Post already disliked")
        } else {
            setPostVote("dislike", postId)
            dislikeCountEl.innerHTML = parseInt(dislikeCountEl.innerHTML) + 1
            postDislikeBtn.classList.add("disliked")
            document.getElementById("post-like-button").disabled = true
        }
    });
}

async function setPostVote(vote, id) {
    const url = "/vote?vote=" + vote + "&id=" + id
    const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    });
    const data = await response.json();
    if (data.result !== "success") {
        console.log("Failed to " + vote + " post");
    }
}


export async function setLikesOnClick() {
    var username = localStorage.getItem("username");
    const likebtns = document.querySelectorAll("#like-button")
    for (const btn of likebtns) {
        btn.addEventListener("click", async (e) => {
            let likeBtn = e.target
            let dislikeBtn = likeBtn.parentNode.parentNode.querySelector('#dislike-container').querySelector('#dislike-button')
            likeBtn.disabled = true
            dislikeBtn.disabled = true
            let id = e.target.parentNode.parentNode.parentNode.id
            let likeType = await checkUserLike("comment", id)
            let likecontainer = e.target.parentNode
            let likeCountElem = likecontainer.querySelector('#like-count')
            if (likeType === "like") {
                alert("Comment already liked")
            } else {
                setVote("like", id, username)
                likeCountElem.innerHTML = parseInt(likeCountElem.innerHTML) + 1
                let dislikecontainer = e.target.parentNode.parentNode.querySelector('#dislike-container')
                let dislikeCountElem = dislikecontainer.querySelector('#dislike-count')
                if (likeType === "dislike") {
                    dislikeCountElem.innerHTML = parseInt(dislikeCountElem.innerHTML) - 1
                }
            }
            likeBtn.disabled = false
            dislikeBtn.disabled = false
        })
    }
    const dislikebtns = document.querySelectorAll("#dislike-button")
    for (const btn of dislikebtns) {
        btn.addEventListener("click", async (e) => {
            let dislikeBtn = e.target
            let likeBtn = dislikeBtn.parentNode.parentNode.querySelector('#like-container').querySelector('#like-button')
            likeBtn.disabled = true
            dislikeBtn.disabled = true
            let id = e.target.parentNode.parentNode.parentNode.id
            let likeType = await checkUserLike("comment", id)
            let dislikecontainer = e.target.parentNode
            let dislikeCountElem = dislikecontainer.querySelector('#dislike-count')
            if (likeType === "dislike") {
                alert("Comment already disliked")
            } else {
                setVote("dislike", id, username)
                dislikeCountElem.innerHTML = parseInt(dislikeCountElem.innerHTML) + 1
                let likecontainer = e.target.parentNode.parentNode.querySelector('#like-container')
                let likeCountElem = likecontainer.querySelector('#like-count')
                if (likeType === "like") {
                    likeCountElem.innerHTML = parseInt(likeCountElem.innerHTML) - 1
                }
            }
            likeBtn.disabled = false
            dislikeBtn.disabled = false
        })
    }
    async function setVote(vote, id, username) {
        let url = window.location.protocol + "//" + window.location.host + "/addcomment/vote?vote=" + vote + "&id=" + id + "&username=" + username
        await fetch(url, {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.result !== "success") {
                    console.log("Failed to " + vote + " comment")
                }
            });
    }
}

async function checkUserLike(postType, id) {
    var answer
    var username = localStorage.getItem("username");
    let url = "/checkuserlike?username=" + username + "&posttype=" + postType + "&id=" + id
    await fetch(url, {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then((response) => response.json())
        .then((data) => {
            answer = data
        });
    return answer
}
setLikesOnClick()