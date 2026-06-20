const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: "foodmap",
  port: process.env.MYSQLPORT
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

app.post("/login", (req, res) => {

    const { id, password } = req.body;

    if (
        id === "admin" &&
        password === "1234"
    ) {
        return res.json({
            success: true,
            message: "로그인 성공"
        });
    }

    res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호 오류"
    });

});

app.post("/restaurants", (req, res) => {
  const { name, category, place_url, address, tag, latitude, longitude } = req.body;

  const checkSql = `
    SELECT * FROM foodmap
    WHERE name = ?
       OR address = ?
       OR place_url = ?
  `;

  db.query(checkSql, [name, address, place_url], (err, duplicateResults) => {
    if (err) return res.status(500).json(err);

    if (duplicateResults.length > 0) {
      return res.json({
        success: false,
        message: "이미 등록된 음식점입니다."
      });
    }

   const sql = `
  INSERT INTO foodmap
  (name, category, place_url, address, tag, latitude, longitude)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

    db.query(sql, [name, category, place_url, address, tag, latitude, longitude], (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true,
        message: "음식점 등록 성공",
        id: result.insertId
      });
    });
  });
});

app.delete("/restaurants/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM foodmap WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "삭제할 음식점을 찾을 수 없습니다."
      });
    }

    res.json({
      success: true,
      message: "음식점 삭제 완료"
    });
  });
});

app.post("/restaurant-requests", (req, res) => {
  const { name, category, place_url, address, latitude, longitude } = req.body;

 const sql = `
  INSERT INTO restaurant_requests
  (name, category, place_url, address, latitude, longitude, status)
  VALUES (?, ?, ?, ?, ?, ?, 'pending')
`;

  db.query(
    sql,
    [name, category, place_url, address, latitude, longitude],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true,
        message: "맛집 제보가 완료되었습니다."
      });
    }
  );
});

app.get("/restaurant-requests", (req, res) => {
  db.query(
    "SELECT * FROM restaurant_requests WHERE status = 'pending'",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});


app.post("/restaurant-requests/:id/approve", (req, res) => {
  const { id } = req.params;

  const selectRequestSql =
    "SELECT * FROM restaurant_requests WHERE id = ?";

  db.query(selectRequestSql, [id], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "제보를 찾을 수 없습니다."
      });
    }

    const request = results[0];

    // 좌표가 없으면 승인 막기
    if (!request.latitude || !request.longitude) {
      return res.json({
        success: false,
        message: "좌표가 없는 제보입니다. 주소를 다시 확인해주세요."
      });
    }

    // 주소 중복 확인
   const checkDuplicateSql = `
  SELECT * FROM foodmap
  WHERE name = ?
     OR address = ?
     OR place_url = ?
`;

db.query(
  checkDuplicateSql,
  [request.name, request.address, request.place_url],
  (err, duplicateResults) => {
      if (err) return res.status(500).json(err);

      if (duplicateResults.length > 0) {
        const rejectSql = `
          UPDATE restaurant_requests
          SET status = 'rejected'
          WHERE id = ?
        `;

        db.query(rejectSql, [id], (err) => {
          if (err) return res.status(500).json(err);

          return res.json({
            success: false,
            duplicate: true,
            message: "이미 등록된 음식점이라 자동 거절되었습니다."
          });
        });

        return;
      }

      const insertSql = `
        INSERT INTO foodmap
        (name, category, place_url, address, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          request.name,
          request.category,
          request.place_url,
          request.address,
          request.latitude,
          request.longitude
        ],
        (err) => {
          if (err) return res.status(500).json(err);

          const updateSql = `
            UPDATE restaurant_requests
            SET status = 'approved'
            WHERE id = ?
          `;

          db.query(updateSql, [id], (err) => {
            if (err) return res.status(500).json(err);

            res.json({
              success: true,
              message: "맛집이 승인되었습니다."
            });
          });
        }
      );
    });
  });
});

app.post("/restaurant-requests/:id/reject", (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE restaurant_requests
    SET status = 'rejected'
    WHERE id = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      success: true,
      message: "맛집 제보가 거절되었습니다."
    });
  });
});

app.put("/restaurants/:id", (req, res) => {
  const { id } = req.params;

  const {
    name,
    category,
    place_url,
    address,
    tag,
    latitude,
    longitude
  } = req.body;

  const sql = `
    UPDATE foodmap
    SET name = ?,
        category = ?,
        place_url = ?,
        address = ?,
        tag = ?,
        latitude = ?,
        longitude = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, category, place_url, address, tag, latitude, longitude, id],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true,
        message: "음식점 수정 완료"
      });
    }
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("서버 실행중");
});