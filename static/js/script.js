import { loadMainPage } from "./pages/index.js";
import { loadCategory } from "./pages/category.js";
import { loadErrorPage } from "./pages/errorPage.js"
import { displayPost } from "./pages/post.js"
import { loadProfile } from "./pages/profile.js";
import { loadChat } from "./pages/ws.js"
import { closeConnection } from "./pages/ws.js";
//import { loadWs } from "./pages/webSocket.js";

export const navigateTo = url => {
    if (url === "") {
        return
    }
    history.pushState(null, null, url)
    router();
}

const router = async () => {
    var titles = {
        "/login": "Login",
        "/register": "Register",
        "/": "",
        "/Home": "Home",
        "/Info": "Info",
        "/School": "School",
        "/Creativity": "Creativity",
        "/post": "Post",
        "/Error": "404",
        "/profile": "User profile",
        "/chat": "Forum chat"
    };

    var routes = [
        {
            "path": "/login",
            "view": loadLoginPage
        },
        {
            "path": "/register",
            "view": loadRegisterPage
        },
        {
            "path": "/",
            "view": loadPage
        },
        {
            "path": "/Home",
            "view": loadMainPage
        },
        {
            "path": "/Info",
            "view": loadCategory
        },
        {
            "path": "/School",
            "view": loadCategory
        },
        {
            "path": "/Creativity",
            "view": loadCategory
        },
        {
            "path": "/post",
            "view": displayPost
        },
        {
            "path": "/Error",
            "view": loadErrorPage
        },
        {
            "path": "/profile",
            "view": loadProfile
        },
        {
            "path": "/chat",
            "view": loadChat
        }
    ];

    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get("postid");
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            isMatch: (idParam && window.location.pathname === "/post" && route.path === "/post") ||
                (!idParam && window.location.pathname === route.path)
        };
    });
    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);
    if (!match) {
        match = {
            route: routes[8],
            isMatch: true
        };
    }

    document.title = titles[match.route.path];
    if (match.route.view === loadCategory) {
        const arg = match.route.path.slice(1);
        match.route.view(null, arg);
    } else if (match.route.view === displayPost) {
        match.route.view(idParam);
    } else {
        match.route.view();
    }
}

window.onpopstate = function () {
    router();
};

async function loadPage() {
    // Make a POST request to the server to check the login status
    await fetch("/logincheck", {
        method: "get",
        headers: {
            "Content-Type": "application/json"
        }
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
            // Check the response and update the page accordingly
            if (data.isLoggedIn) {
                navigateTo("/Home")
            } else {
                const currentPath = window.location.pathname;
                if (currentPath === "/register") {
                    navigateTo("/register");
                } else {
                    navigateTo("/login")
                }
            }
        });
}

export async function getNickname() {
    var myCookieId = localStorage.getItem('myCookieId');
    const response = await fetch(`/getnickname?cookieid=${myCookieId}`)
    const json = response.json()
    const nickname = json.nickname
    return nickname
}

export async function getNicknameFromUserId(userId) {
    const response = await fetch(`/getnicknamefromuserid?userid=${userId}`)
    const json = await response.json()
    return json
}

export function logout() {
    closeConnection()
    fetch(`/logout?cookieid=${localStorage.getItem("myCookieId")}`)
    //var data = response.json()
    document.cookie = "sessionId=; Max-Age=0"
    localStorage.removeItem('myCookieId');
    navigateTo("/login")
}

async function login() {
    const formElement = document.getElementById('login-form');
    const email = formElement.elements['email'].value;
    const password = formElement.elements['password'].value;
    const response = await fetch(`/submitlogin?user=${email}&password=${password}`);
    const data = await response.json();
    const errorElement = document.getElementById('error')
    if (data.Error !== "") {
        errorElement.innerHTML = data.Message
        errorElement.style.visibility = "visible"
    } else {
        //loadWs(data.UserId)
        localStorage.setItem('myCookieId', data.CookieId);
        navigateTo("/Home")
    }
}

function loadLoginPage() {
    document.getElementById("content").innerHTML = `
            <div class="login-container">
                <div class="loginbox">
                    <div class="heading">
                        <h1>Login:</h1>
                    </div>
                    <form id="login-form">
                        <label for="email">Email or username</label>
                        <input name="email" type="text" id="email">

                        <label for="password">Password</label>
                        <input name="password" type="password" id="password">

                        <p id="error" style="color:red; visibility:hidden; width: 300px;"></p>

                        <button class="button-4" id="login-button">Login</button>
                        <button class="button-4" id="reg-button">Register</button>
                    </form>
                </div>
            </div>`;
    // Add event listener to the login form submission event
    const loginButton = document.getElementById("login-button")
    loginButton.addEventListener("click", (event) => {
        event.preventDefault();
        login()
    });

    // Add event listener to the register button click event
    const regButton = document.getElementById("reg-button");
    regButton.addEventListener("click", (event) => {
        event.preventDefault();
        navigateTo("/register")
    });
}

function submitRegister() {
    if (document.getElementById("nicknameError").style.visibility === "visible") {
        return
    } else if (document.getElementById("emailError").style.visibility === "visible") {
        return
    } else if (document.getElementById("error").style.visibility === "visible") {
        return
    } else {
        // Get the form data
        const form = document.getElementById("register-form");
        const formData = new FormData(form);
        let plainObject = {};
        for (let [key, value] of formData.entries()) {
            plainObject[key] = value;
        }

        let jsonString = JSON.stringify(plainObject);
        // Send the data using fetch

        fetch("/submitRegisterData", {
            method: "post",
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: jsonString
        })
            .then(response => response.json())
            .then(data => {
                // Handle the response from the server
                if (data.success) {
                    navigateTo("/login")
                } else {
                    // Display an error message
                    const error = document.getElementById("error");
                    error.style.visibility = "visible";
                }
            })
            .catch(error => {
                console.error(error);
            });
    }
}

function loadRegisterPage() {
    document.getElementById("content").innerHTML = `
            <div class="reg-container">
                <div class="reg-loginbox">
                    <div class="heading">
                        <h1>Register:</h1>
                    </div>
                    <form id="register-form" enctype="multipart/form-data">
                        <div style="display:flex;font-size:small;">
                        <label for="nickname">Nickname</label><p id="nicknameError" style="color:red; visibility:hidden;margin-top:0px;margin-left:10px;margin-bottom:0px;"></p>
                        </div>
                        <input name="nickname" type="text" id="nickname">

                        <div style="display:flex;font-size:small;">
                        <label for="age">Age</label><p id="ageError" style="color:red; visibility:hidden;margin-top:0px;margin-left:10px;margin-bottom:0px;"></p>
                        </div>
                        <input name="age" type="text" id="age">

                        <label for="gender">Gender</label>

                        <div style="display:flex;font-size:small;margin-bottom:15px;margin-top:5px;">
                        <div>
                          <input type="radio" name="gender" value="male" id="male-gender">
                          <label for="male-gender">Male</label>
                        </div>
                        <div>
                          <input type="radio" name="gender" value="female" id="female-gender">
                          <label for="female-gender">Female</label>
                        </div>
                        <div>
                          <input type="radio" name="gender" value="other" id="other-gender">
                          <label for="other-gender">Other</label>
                        </div>
                        </div>
                        <label for="firstname">First name</label>
                        <input name="firstname" type="text" id="firstname">

                        <label for="lastname">Last name</label>
                        <input name="lastname" type="text" id="lastname">

                        <div style="display:flex;font-size:small;">
                        <label for="email">E-mail</label><p id="emailError" style="color:red; visibility:hidden;margin-top:0px;margin-left:10px;margin-bottom:0px;"></p>
                        </div>
                        <input name="email" type="text" id="email">

                        <label for="password">Password</label>
                        <input name="password" type="password" id="password">

                        <p id="error" style="color:red; visibility:hidden; width: 300px; margin-bottom: 10px; margin-top: 10px;"></p>

                        <button id="submit-register-button" class="button-4">Register</button>
                        </form>
                </div>
            </div>
            `;

    const nicknameInput = document.getElementById("nickname");
    nicknameInput.addEventListener("input", () => {
        checkAvailability(nicknameInput.value, "nicknameError", "This nickname is already taken");

    });

    const emailInput = document.getElementById("email");
    emailInput.addEventListener("input", () => {
        checkAvailability(emailInput.value, "emailError", "This email is already taken");
    });

    const ageInput = document.getElementById("age")
    ageInput.addEventListener("input", () => {
        checkAgeInput(ageInput.value)
    })

    const submitRegisterButton = document.getElementById("submit-register-button");
    submitRegisterButton.addEventListener("click", submitRegisterHandler);
    function submitRegisterHandler(event) {
        event.preventDefault();
        if (checkEmptyFields()) {
            submitRegister();
        } else {
            return false
        }
    }


    async function checkAvailability(value, errorId, errorMessage) {
        const response = await fetch(`/check-availability?value=${value}`);
        const data = await response.json();
        const error = document.getElementById(errorId);
        if (!data.available) {
            error.innerHTML = errorMessage;
            error.style.visibility = "visible";
        } else {
            error.innerHTML = "";
            error.style.visibility = "hidden";
        }
    }
    async function checkAgeInput(input) {
        const ageErr = document.getElementById("ageError")
        if (input === "") {
            ageErr.style.visibility = "hidden"
        } else {
            const age = parseInt(input);
            const ageRegex = /^\d+$/;
            if (!ageRegex.test(input)) {
                ageErr.innerHTML = "Age must be a number";
                ageErr.style.visibility = "visible";
            } else if (age < 1 || age > 100) {
                ageErr.innerHTML = "Age must be between 1 and 100"
                ageErr.style.visibility = "visible"
            }
        }
    }

    function checkEmptyFields() {
        const error = document.getElementById("error")
        const nickname = document.getElementById("nickname")
        if (nickname.value == "") {
            error.style.visibility = "visible"
            error.innerHTML = "All fields must be filled"
            return false
        } else {
            error.innerHTML = "";
            error.style.visibility = "hidden";
        }
        const age = document.getElementById("age")
        if (age.value == "") {
            error.style.visibility = "visible"
            error.innerHTML = "All fields must be filled"
            return false
        } else {
            error.innerHTML = "";
            error.style.visibility = "hidden";
        }
        const genderInputs = document.querySelectorAll('input[name="gender"]');
        let selectedGender = false;

        for (let i = 0; i < genderInputs.length; i++) {
            if (genderInputs[i].checked) {
                selectedGender = true;
                break;
            }
        }
        if (!selectedGender) {
            error.style.visibility = "visible"
            error.innerHTML = "All fields must be filled"
            return false
        } else {
            error.innerHTML = "";
            error.style.visibility = "hidden";
        }
        const firstname = document.getElementById("firstname")
        if (firstname.value == "") {
            error.style.visibility = "visible"
            error.innerHTML = "All fields must be filled"
            return false
        } else {
            error.innerHTML = "";
            error.style.visibility = "hidden";
        }
        const lastname = document.getElementById("lastname")
        if (lastname.value == "") {
            error.style.visibility = "visible"
            error.innerHTML = "All fields must be filled"
            return false
        } else {
            error.innerHTML = "";
            error.style.visibility = "hidden";
        }
        const email = document.getElementById("email")
        if (email.value == "") {
            error.style.visibility = "visible"
            error.innerHTML = "All fields must be filled"
            return false
        } else {
            error.innerHTML = "";
            error.style.visibility = "hidden";
        }
        const password = document.getElementById("password")
        if (password.value == "") {
            error.style.visibility = "visible"
            error.innerHTML = "All fields must be filled"
            return false
        } else {
            error.innerHTML = "";
            error.style.visibility = "hidden";
        }
        return true
    }
}
// Call the loadPage function when the page is loaded
document.addEventListener("DOMContentLoaded", async () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault()
            navigateTo(e.target.href)
        }
    })
    router()
})

export async function checkLogin() {
    var answer
    await fetch("/logincheck", {
        method: "get",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.headers.get('Content-Type').indexOf('application/json') === -1) {
                throw new TypeError('Response is not JSON');
            }
            return response.json()
        })
        .then(data => {
            // Check the response and update the page accordingly
            if (data.isLoggedIn) {
                answer = true
            } else {
               answer = false
            }
        });
    return answer
}
