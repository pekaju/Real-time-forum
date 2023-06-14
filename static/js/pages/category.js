import { getNicknameFromUserId, navigateTo, logout, checkLogin } from "../script.js";
import { getUsers, loadWs } from "./ws.js";


export async function loadCategory(event, path) {
    if (await checkLogin() === false) {
        logout()
    }
    let posts = []
    var categoryName
    if (event !== null) {
        categoryName = event.target.closest("#category").dataset.cat;
    }else if (path !== "") {
        categoryName = path
    }else {
        console.log("error with url")
    }
    const response =  await fetch(`/posts?category=${categoryName}`)
    const data = await response.json()
    for (const postData of data){
        var post = {
            id: postData.id,
            heading: postData.heading,
            likeCount: postData.likecount,
            dislikeCount: postData.dislikecount,
            commentCount: postData.commentcount,
        };
        var userid = postData.userid
        const nickname = await getNicknameFromUserId(userid)
        post.creator = nickname
        posts.push(post)
    }
    let postTableRows = ""
    for (const post of posts) {
        postTableRows += `
        <tr data-id="`+ post.id +`" style="cursor: pointer;">
            <td class="table-data">
              <div>
                <img id="mainIcon" src="./static/img/icon-for-forum-11.jpeg" style="width:40px;height40px;margin-right:10px;">
              </div>
              <div>
                <div class="upperSTD">
                  <div>`+ post.heading + `</div>
                </div>
                <div class="lowerSTD">
                  <div class="littlemargin">
                    <img id="smallIcon" src="./static/img/comment.png" style="margin-right:3px;height:15px;width:15px;">`+ post.commentCount + `</div>
                    <div class="littlemargin">👍 `+ post.likeCount + `</div>
                  <div class="littlemargin">👎 `+ post.dislikeCount + `</div>
                    Created by: `+ post.creator + `
                </div>
              </div>
            </td>
        </tr>
        `
    }
        document.getElementById("forum-content").innerHTML = `
        <div class="mainbody">
            <header>
                <div class="inside-header">
                    <h1>`+ categoryName + ` forum</h1>
                    <div id="flex1" class="justify-right">
                        <div class="header-buttons"><a href="/"><button id="home-btn" style="width:70px" class="button-4">Home</button></a>
                        <button class="button-4" id="logout-btn" style="width:70px">Logout</button>
                        </div>
                    </div>
                </div>
            </header>
            <div class="column">
                <br>
                <div style="display:flex;justify-content:center;">
                    <table style="width:100%;margin-right:3vw;margin-left:3vw;">
                        ${postTableRows}
                    </table>
                </div>
                <br>
                <article class="new-post-container" id="add-post-container">
                <p style="margin-top:0px;margin-bottom:10px;">Add a new post</p>
                <form id="post-form">
                    <label for="title">Title:</label>
                    <input class="title-input" type="text" id="title" name="title" required style="border-radius: 2px; padding: 5px; width: 97%; margin:0px; height:20px;border-width:1px;"><br>

                    <label for="content">Content:</label>
                    <textarea id="new-content" name="content" required style="padding: 10px;width: 97%; height: 102px;resize: none;"></textarea><br>
                    <div class="create-post" style="width:100%;margin-right:3vw;margin-left:3vw;">
                    <button class="button-4" id="new-post" style="margin-left:0; left:-40px; margin-bottom:20px">Create a post</button>
                </div>
                </form>
            </article>
            </div>
            </div>
        </div>
    `
    const rows = document.querySelectorAll("tr")
    rows.forEach((row) => {
        row.addEventListener("click", () => {
            const id = row.getAttribute("data-id")
            navigateTo(`/post?postid=${id}`)
        })
    })
    document.getElementById("new-post").addEventListener("click", async (e) => {
        const title = document.getElementById("title").value;
        const content = document.getElementById("new-content").value;
        const url = "/createpost"
        var inside = {
            title: title,
            content: content,
            category: categoryName
        }
        await fetch(url, {
            method: "POST",
            headers: {
               "Content-Type": "application/json"
            },
            body: JSON.stringify(inside)
        })
        .then(response => {
            console.log("responsee")
            return response.json()
    })
        .then(data => {
            console.log(data, "heredata")
        })
    }) 
    document.getElementById("logout-btn").addEventListener("click", (event) => {
        event.preventDefault()
        logout()
    })
    await loadWs()
    await getUsers()
}
