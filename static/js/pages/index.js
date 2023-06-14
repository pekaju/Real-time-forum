import { logout, navigateTo } from "../script.js"
import { getUsers, loadWs } from "./ws.js";


export async function loadMainPage() {
    let categories

    // get user
    const user = await fetch("/user", {
        method: "get",
        headers: new Headers({
            'Content-Type': 'application/json'
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        if (response.headers.get('Content-Type').indexOf('application/json') === -1) {
            throw new TypeError('Response is not JSON');
        }
        return response.json();
    })
    .catch(error => {
        console.error(error);
    });

    const userId = user.userId
    const username = user.username

    await fetch("/categories", {
        method: "get",
        headers: new Headers({
            'Content-Type': 'application/json'
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.headers.get('Content-Type').indexOf('application/json') === -1) {
                throw new TypeError('Response is not JSON');
            }
            return response.json();
        })
        .then(data => {
            categories = data
        })
        .catch(error => {
            console.error(error);
        });

    let categorieElems = ""
    //window.history.pushState({}, "", "/");
    for (let elem of categories) {
        categorieElems += `
        <div class="category" style="cursor: pointer;">
            <div id="category" class="card" data-cat="` + elem.CategoryName + `">
                <img class="image" src="` + elem.Img + `" alt="Img" style="width:100%">
                <div class="categoryNameContainer">
                    <h4>` + elem.CategoryName + `</h4>
                </div>
            </div>
        </div>`
    }
    document.getElementById("content").innerHTML = `
        <div id="users-container">
            <h2>Users</h2>
        </div>
        <div id="main">
            <div id="forum-content">
                <div class="mainbody">
                    <header>
                        <div class="inside-header">
                            <div>
                                <h1>Welcome to kood/Jõhvi forum, ` + username + `</h1>
                            </div>
                            <div id="flex1" class="justify-right">
                                <div class="header-buttons">
                                    <button class="button-4" id="profile">My profile</button>
                                    <button class="button-4" id="logout-btn">Logout</button>
                                    <button class="button-4" id="noti-button">Chat</button>
                                </div>
                            </div>
                        </div>
                    </header>
                    <div class="column">
                        <div class="categoriesHeader">
                            <h2>Select one of the forum categories:</h2>
                        </div>
                        <div class="categories">
                            ` + categorieElems + `
                        </div>
                    </div>
                </div>
            </div>
            <div id="chat-content"></div>
        </div>
        `
    document.getElementById("logout-btn").addEventListener("click", (event) => {
        event.preventDefault()
        logout()
    })

    document.getElementById("profile").addEventListener("click", (event) => {
        event.preventDefault()
        navigateTo("/profile?userid=" + userId)
    })

    document.getElementById("noti-button").addEventListener("click", (event) => {
        event.preventDefault()
        navigateTo("/chat")
    })

    const categoryQuery = document.querySelectorAll(".category")
    categoryQuery.forEach(category => {
        category.addEventListener("click", (event) => {
            event.preventDefault()
            const categoryName = event.target.closest("#category").dataset.cat;
            navigateTo("/"+categoryName)
        })
    })
    await loadWs()
    await getUsers()
}