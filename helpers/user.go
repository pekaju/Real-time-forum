package helpers

import (
	"fmt"
	"real-time-forum/pkg"

	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"
)

func InsertUser(user pkg.NewUser) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error crypting the password for sample data", err)
		return err
	}
	UserID, err := uuid.NewV4()
	if err != nil {
		fmt.Println("Error generating new uuid")
		return err
	}
	//generate a random string for userid
	UID := UserID.String()
	if err != nil {
		fmt.Println("Error converting UUID to integer")
		return err
	}
	_, err = Db.Exec("INSERT INTO users (userid, nickname, age, gender, firstname, lastname, email, passwd, staatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", UID, user.Nickname, user.Age, user.Gender, user.FirstName, user.LastName, user.Email, hashedPassword, "offline")
	if err != nil {
		return err
	}
	return nil
}

func CheckLoginUser(user string, password string) pkg.Login {
	userId := GetUserId(user)
	login := pkg.Login{}
	query := fmt.Sprintf("SELECT passwd FROM users WHERE userid = ?")
	rows, err := Db.Query(query, userId)
	defer rows.Close()
	if err != nil {
		fmt.Println(err)
		login.Error = "Error with database query"
		login.Message = "Error"
	}
	if !rows.Next() {
		login.Error = "error"
		login.Message = "Username or email not found"
	} else {
		pw := ""
		err := rows.Scan(&pw)
		if err != nil {
			fmt.Println(err)
			login.Error = "Error with database query"
			login.Message = "Error"
		} else {
			err = bcrypt.CompareHashAndPassword([]byte(pw), []byte(password))
			if err != nil {
				//pw doesnt match password
				login.Error = "error"
				login.Message = "Password is incorrect"
			} else {
				login.Error = ""
				login.Message = "Success"
				login.UserId = userId
			}
		}
	}
	return login
}

func GetUserId(nicknameOrEmail string) string {
	rows, err := Db.Query("SELECT userid FROM users WHERE nickname = ? or email = ?", nicknameOrEmail, nicknameOrEmail)
	if err != nil {
		return ""
	}
	userId := ""
	if rows.Next() {
		rows.Scan(&userId)
	}
	rows.Close()
	return userId
}

func FindNicknameFromCookie(cookieid string) string {
	rows, err := Db.Query("SELECT userid FROM cookies WHERE cookieId = ?", cookieid)
	if err != nil {
		fmt.Println(err)
	}
	var userid = ""
	for rows.Next() {
		fmt.Println("1")
		rows.Scan(&userid)
	}
	rows.Close()
	rows, err = Db.Query("SELECT nickname FROM users WHERE userid = ?", userid)
	defer rows.Close()
	if err != nil {
		fmt.Println("selectnicknamefromusers")
		fmt.Println(err)
	}
	var nickname = ""
	for rows.Next() {
		fmt.Println("2")
		rows.Scan(&nickname)
	}
	return nickname
}

func FindNicknameFromUserId(userId string) string {
	rows, err := Db.Query("SELECT nickname FROM users WHERE userid = ?", userId)
	if err != nil {
		fmt.Println("selectnicknamefromusers")
		fmt.Println(err)
	}
	var username = ""
	for rows.Next() {
		rows.Scan(&username)
	}
	rows.Close()

	return username
}
