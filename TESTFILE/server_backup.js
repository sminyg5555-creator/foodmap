const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "foodmap"
});

db.connect((err) => {

    if (err) {
        console.log("DB 연결 실패");
        console.log(err);
        return;
    }

    console.log("DB 연결 성공");
});

app.get("/restaurants", (req, res) => {

    db.query(
        "SELECT * FROM foodmap",
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result);
        }
    );

});

app.listen(3000, () => {
    console.log("서버 실행중");
});