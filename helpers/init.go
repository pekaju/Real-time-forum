package helpers

import (
	"database/sql"
	"io/ioutil"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var Db *sql.DB

func init() {
	var err error
	Db, err = sql.Open("sqlite3", "./forumdata/database.db")
	if err != nil {
		log.Println("init1")
		LogErr(err)
	}
	checker, err := ioutil.ReadFile("./forumdata/database.db")
	if err != nil {
		log.Println("init1")
		LogErr(err)
	}
	if len(checker) == 0 {
		sqlScript, err := ioutil.ReadFile("./forumdata/data.sql")
		_, err = Db.Exec(string(sqlScript))
		if err != nil {
			log.Println("init1")
			LogErr(err)
		}
	}
}

func LogErr(err error) {
	log.Println(err)
}
