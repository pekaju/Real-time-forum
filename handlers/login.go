package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real-time-forum/helpers"
	"real-time-forum/pkg"
)

type CheckAvailabilityResponse struct {
	Available bool `json:"available"`
}
type SubmitRegisterResponse struct {
	Success bool `json:"success"`
}

func HandleLoginCheck(w http.ResponseWriter, r *http.Request) {
	sessionCookie, err := r.Cookie("sessionId")
	if err != nil || sessionCookie.Value == "" {
		// The user is not logged in
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(struct {
			IsLoggedIn bool `json:"isLoggedIn"`
		}{false})
		return
	}
	if (!helpers.IsCookieInDatabase(sessionCookie.Value)) {
		// The user is not logged in
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(struct {
			IsLoggedIn bool `json:"isLoggedIn"`
		}{false})
		return
	}

	// The user is logged in
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		IsLoggedIn bool   `json:"isLoggedIn"`
		CookieId   string `json:"cookieid"`
	}{true, sessionCookie.Value})
}

func SubmitRegister(w http.ResponseWriter, r *http.Request) {
	response := SubmitRegisterResponse{}
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// Create a new user from the form data
	decoder := json.NewDecoder(r.Body)
	var user pkg.NewUser
	err := decoder.Decode(&user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// Create a channel to receive the result of the registration
	resultChan := make(chan bool)

	// Spawn a goroutine to handle the registration
	go func() {
		// Perform the database insertion
		err := helpers.InsertUser(user)
		if err != nil {
			helpers.LogErr(err)
			resultChan <- false
			return
		}

		// Registration was successful
		resultChan <- true
	}()

	// Wait for the registration result on the channel
	response.Success = <-resultChan

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		helpers.LogErr(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonResponse)

}

func CheckAvailability(w http.ResponseWriter, r *http.Request) {
	response := CheckAvailabilityResponse{
		Available: true,
	}
	value := r.URL.Query().Get("value")
	query := fmt.Sprintf("SELECT userid FROM users WHERE %s = ? or %s = ?", "nickname", "email")
	rows, err := helpers.Db.Query(query, value, value)
	defer rows.Close()
	if err != nil {
		helpers.LogErr(err)
	}
	if rows.Next() {
		response.Available = false
	}
	jsonResponse, err := json.Marshal(response)
	if err != nil {
		helpers.LogErr(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonResponse)
}

func SubmitLogin(w http.ResponseWriter, r *http.Request) {
	var user = r.URL.Query().Get("user")
	var password = r.URL.Query().Get("password")
	login := pkg.Login{}
	login = helpers.CheckLoginUser(user, password)
	if (login.Message == "Success") {
		cookieId := helpers.AddNewCookie(user)
		if cookieId == "" {
			login.Message = "Could not add a cookie"
			login.Error = "Error"
		}else {
			login.CookieId = cookieId
			cookie := &http.Cookie{
				Name:   "sessionId",
				Value:  cookieId,
				Path:   "/",
			
			}
			http.SetCookie(w, cookie)
		}
	}
	jsonResponse, err := json.Marshal(login)
	if err != nil {
		helpers.LogErr(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonResponse)
}

func LogOut(w http.ResponseWriter, r *http.Request) {
	var cookieId = r.URL.Query().Get("cookieid")
	result := helpers.DeleteCookie(cookieId)
	jsonResponse, err := json.Marshal(result)
	if err != nil {
		helpers.LogErr(err)
	}
	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonResponse)
}