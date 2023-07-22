const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is running at http:localhost:3000/");
    });
  } catch (error) {
    console.log("DB error: ${error.message}");
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;

  let hashedPassword = await bcrypt.hash(password, 10);

  let selectUserQuery = `
     SELECT * FROM user
     WHERE username = '${username}';`;
  let dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    let createUserQuery = `
           INSERT INTO
             user(username,name,password,gender,location)
             VALUES 
             (
              '${username}',
              '${name}',
              '${hashedPassword}',
              '${gender}',
              '${location}'
             );`;
    if (password.length > 5) {
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
      WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched === true) {
      response.send("Login Success");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
    SELECT * FROM user 
    WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    let isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatched === true) {
      const lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
        UPDATE user
       SET password = '${encryptedPassword}'
        WHERE username = '${username}';`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
