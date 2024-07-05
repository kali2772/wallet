const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", (req, res) => {
  const { name, phoneNum, password, tPin } = req.body;
  if (!phoneNum || !password || !name || !tPin) {
    return res.status(422).json({ error: "please add all the fields" });
  } else {
    User.findOne({ phoneNum: phoneNum })
      .then((savedUser) => {
        if (savedUser) {
          return res
            .status(422)
            .json({ error: "user already exist with this phoneNum" });
        }
        bcrypt.hash(password, 12).then((hashpassword) => {
          const user = new User({
            phoneNum,
            password: hashpassword,
            name,
            tPin,
          });
          user.save().then((user) => {
            res.json({ massage: "saved" });
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

router.post("/login", (req, res) => {
  const { phoneNum, password } = req.body;
  if (!phoneNum || !password) {
    res.status(422).json({ error: "please provide phoneNum or password" });
  } else {
    User.findOne({ phoneNum: phoneNum }).then((savedUser) => {
      if (!savedUser) {
        return res.status(422).json({ error: "invalid username or password" });
      }
      bcrypt
        .compare(password, savedUser.password)
        .then((doMatch) => {
          if (doMatch) {
            // res.json({message:"successfully signin"})
            const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET);
            const { _id, name, phoneNum, transections, firstLogin, pic } =
              savedUser;
            res.json({
              token,
              user: {
                _id,
                name,
                phoneNum,
                transections,
                firstLogin,
                pic,
              },
            });
          } else {
            return res
              .status(422)
              .json({ error: "invalid phoneNum or password" });
          }
        })
        .catch((err) => {
          console.log("Bcrypt comparison error:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        });
    });
  }
});

module.exports = router;
