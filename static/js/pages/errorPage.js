
export function loadErrorPage() {
    document.getElementById("content").innerHTML = `
    <h1>404 Page Not Found</h1>
    <p>We're sorry, but the page you are looking for could not be found.</p>
    <p>Please check the URL and try again, or go to our <a href="/" data-link>home page</a>.</p>

    `
}