import { logout } from "../script.js";
import { getUsers, loadWs } from "./ws.js";


export async function loadProfile(){
    let params = new URLSearchParams(window.location.search);
    const userId = params.get('userid');
    const username = await fetch(`/user?userid=${userId}`).then(d => {return d.json()}).then(d => {return d.username})
    const userPosts = await fetch(`/profile/data?userid=${userId}&data=posts`).then(d => {return d.json()})
    const userComments = await fetch(`/profile/data?userid=${userId}&data=comments`).then(d => {return d.json()})
    const userPostLikes = await fetch(`/profile/data?userid=${userId}&data=postLikes`).then(d => {return d.json()})
    const userCommentLikes = await fetch(`/profile/data?userid=${userId}&data=commentLikes`).then(d => {return d.json()})
    let currentData, userPostsData = "", userCommentsData = "", userPostLikesData = "", userCommentLikesData = ""


    // generateUserPosts
    currentData = ""
    for (let row of userPosts) {
        currentData += `<div class="post">
                <div class="inside-post">
                    <div class="post-thread">
                        Thread: 
                        <a style="margin-left:3px" href="${row.PostLink}">${row.Heading}</a>
                    </div>
                    <section class="user-post-content">
                        <div class="post-text">
                            <pre>${row.Text}</pre>
                        </div>
                        <div class="profile-row-likes">
                            <aside class="likes" id="post-like-container">
                            Likes:
                            <div id="post-like-count" style="display:inline">${row.Likes}</div>
                            </aside>
                            <aside class="dislikes" id="post-dislike-container">
                            Dislikes:
                            <div id="post-dislike-count" style="display:inline">${row.Dislikes}</div>
                        </aside>
                    </div>
                    </section>
                </div>
            </div>
            <br/>`
    }
    userPostsData = `<div class="created-posts">
            <h2>User posts:</h2>
            ${(currentData === "" ? `<div class="no-rows">No rows to show</div>` : currentData)}
        </div>`

    //generete user comments
    currentData = ""
    for (let row of userComments) {
        currentData += `<div class="post">
            <div class="inside-post">
                <div class="post-thread">
                    Thread: 
                    <a style="margin-left:3px" href="${row.SinglePostLink } ">${row.SinglePostHeading}</a>
                </div>
                <section class="user-post-content">
                    <div class="post-text">
                        <pre>${row.CommentText}</pre>
                    </div>
                    <div class="profile-row-likes">
                        <aside class="likes" id="post-like-container">
                        Likes:
                        <div id="post-like-count" style="display:inline">${row.Likes}</div>
                        </aside>
                        <aside class="dislikes" id="post-dislike-container">
                        Dislikes:
                        <div id="post-dislike-count" style="display:inline">${row.Dislikes}</div>
                        </aside>
                    </div>
                </section>
            </div>
        </div>
        <br/>`
    }
    userCommentsData = `<div class="created-posts">
        <h2>User comments:</h2>
        ${(currentData === "" ? `<div class="no-rows">No rows to show</div>` : currentData)}
    </div>`

    //generete user postLikes
    currentData = ""
    for (let row of userPostLikes) {
        currentData += `<div class="post">
            <div class="inside-post">
                <div class="post-thread">
                    Thread: 
                    <a style="margin-left:3px" href="${row.PostLink}">${row.Heading}</a>
                </div>
                <section class="user-post-content">
                    <div class="post-text">
                        <pre>${row.Text}</pre>
                    </div>
                    <div class="profile-row-likes">
                        <aside class="likes" id="post-like-container">
                        Likes:
                        <div id="post-like-count" style="display:inline">${row.Likes}</div>
                        </aside>
                        <aside class="dislikes" id="post-dislike-container">
                        Dislikes:
                        <div id="post-dislike-count" style="display:inline">${row.Dislikes}</div>
                        </aside>
                    </div>
                </section>
            </div>
        </div>
        <br/>`
    }
    userPostLikesData = `<div class="created-posts">
        <h2>User liked posts:</h2>
        ${(currentData === "" ? `<div class="no-rows">No rows to show</div>` : currentData)}
    </div>`

    //generete user comments likes
    currentData = ""
    for (let row of userCommentLikes) {
        currentData += `<div class="post">
            <div class="inside-post">
                <div class="post-thread">
                    Thread: 
                    <a style="margin-left:3px" href="${row.SinglePostLink } ">${row.SinglePostHeading}</a>
                </div>
                <section class="user-post-content">
                    <div class="post-text">
                        <pre>${row.CommentText}</pre>
                    </div>
                    <div class="profile-row-likes">
                        <aside class="likes" id="post-like-container">
                        Likes:
                        <div id="post-like-count" style="display:inline">${row.Likes}</div>
                        </aside>
                        <aside class="dislikes" id="post-dislike-container">
                        Dislikes:
                        <div id="post-dislike-count" style="display:inline">${row.Dislikes}</div>
                        </aside>
                    </div>
                </section>
            </div>
        </div>
        <br/>`
    }
    userCommentLikesData = `<div class="created-posts">
        <h2>User comments:</h2>
        ${(currentData === "" ? `<div class="no-rows">No rows to show</div>` : currentData)}
    </div>`

    if (username === "") {
        document.getElementById("content").innerHTML = `
        <div>User not found</div>`
    } else {
        document.getElementById("forum-content").innerHTML  = `
        <div class="mainbody">
            <header class="header">
                <div class="inside-header">
                    <h2>User ${username} profile</h2>
                    <div class="header-buttons"><a href="/"><button id="home-btn" style="width:70px" class="button-4">Home</button></a>
                    <button class="button-4" id="logout-btn" style="width:70px">Logout</button>
                    </div>
                </div>
            </header>
            ${userPostsData}
            ${userCommentsData}
            ${userPostLikesData}
            ${userCommentLikesData}
            <br/>
        </div>
        `
    }
    document.getElementById("logout-btn").addEventListener("click", (event) => {
        event.preventDefault()
        logout()
    })
    await loadWs()
    await getUsers()
}
