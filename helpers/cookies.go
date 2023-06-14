package helpers

import (
	"fmt"
	"time"

	"github.com/gofrs/uuid"
)

func AddNewCookie(nicknameOrEmail string) string {
	//cookie id is a UUID
	cookieId, err := uuid.NewV4()
	if err != nil {
		fmt.Println("Error generating new uuid")
		return ""
	}
	// set the cookie to expire in 7 days
	expires := time.Now().AddDate(0, 0, 7)
	userId := GetUserId(nicknameOrEmail)
	if userId == "" {
		return ""
	}

	//make a sql statement for inserting a new cookie to cookies table
	sqlStatement := `
	INSERT INTO cookies (userid, cookieid, expires)
	VALUES (?, ?, ?);
	`
	//execute the sql statement
	_, err = Db.Exec(sqlStatement, userId, cookieId.String(), expires)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	fmt.Println("Cookie successfully inserted into the database.")
	//return the UUID in string format
	return cookieId.String()
}
func DeleteCookie(cookieId string) string {
	sqlStatement := `
	DELETE FROM cookies WHERE cookieId = ?
	`
	result, err := Db.Exec(sqlStatement, cookieId)
	if err != nil {
		fmt.Println(err)
	}
	res, err := result.RowsAffected()
	if err != nil {
		fmt.Println(err)
	}
	if res > 0 {
		fmt.Printf("%d deleted from the database", res)
		return "success"
	}
	return "error"
}

func IsCookieInDatabase(cookieId string) bool {
	rows, err := Db.Query("SELECT * FROM cookies WHERE cookieId = ?", cookieId)
	defer rows.Close()
	if err != nil {
		fmt.Println(err)
	}else {
		if rows.Next() {
			return true
		}
	}
	return false
}