const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middlewear/requireLogin");
const Transection = mongoose.model("Transection");
const User = mongoose.model("User");
const cloudinary = require("../cloudinary.js");
const fileUpload = require("express-fileupload");

router.use(express.json({ limit: "50mb" }));
router.use(express.urlencoded({ extended: true, limit: "50mb" }));
router.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp", // Specify the directory where temporary files are stored
    createParentPath: true, // Ensure the directory structure exists
    cleanup: true,
  })
);

router.get("/mytransection", requireLogin, (req, res) => {
  User.findOne({ phoneNum: req.user.phoneNum })
    .select("-_id -phoneNum -availableAmound -password -tPin")
    .populate("transection", "_id sender recever amount date")
    .then((user) => {
      if (!user.transection == "") {
        return res.json({ transection: user.transection });
      } else {
        return res.status(402).json({ massege: "you had no transection yet" });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
router.get("/balence", requireLogin, (req, res) => {
  User.findOne({ phoneNum: req.user.phoneNum })
    .select("availableAmound")
    .then((user) => {
      return res.json({ availableAmound: user.availableAmound });
    })
    .catch((err) => {
      console.log(err);
    });
});
router.post("/addmoney", requireLogin, (req, res) => {
  const amount = parseInt(req.body.amount);
  User.findOneAndUpdate(
    { phoneNum: req.user.phoneNum },
    {
      $set: {
        availableAmound: req.user.availableAmound + amount,
      },
    },
    { new: true }
  )
    .select("-password -tPin")
    // .populate("transection", "_id sender recever amount date")
    .then((addmoney) => {
      // console.log(addmoney);
      res.json({
        message:
          "add money(" +
          req.body.amount +
          ") in your wallet current balenced is" +
          addmoney.availableAmound +
          " etc",
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
router.post("/search-user", requireLogin, (req, res) => {
  let userPattern = parseInt(req.body.phoneNum);
  User.find({ phoneNum: userPattern })
    .select("_id name phoneNum pic")
    .then((user) => {
      console.log({ user });
      res.json({ user: user });
    })
    .catch((err) => {
      console.log(err);
    });
});
router.post("/user/:_id/transfer", requireLogin, async (req, res) => {
  let { amount, tPin } = req.body;
  amount = parseInt(amount);
  tPin = parseInt(tPin);
  let cheking = true;
  let newAmountSender = 0;
  let newAmountRicever = 0;
  await User.findOne({ _id: req.user._id }).then((check) => {
    if (amount == 0 || check.availableAmound < amount) {
      console.log("minimum 1 rupees or ensufiicient balenced");
      cheking = false;
      return res.status(422).json({ error: "minimum 1 rupees" });
    } else if (check.tPin !== tPin) {
      console.log("transection pin not correct");
      cheking = false;
      return res.status(422).json({ error: "transection pin not correct" });
    }
    newAmountSender = check.availableAmound - amount;
  });
  if (cheking) {
    // console.log(cheking, newAmountSender, req.params._id);
    User.findOne({ phoneNum: req.params._id })
      .then(async (userAvailable) => {
        newAmountRicever = userAvailable.availableAmound + amount;
        await User.findOneAndUpdate(
          { _id: req.user._id },
          { $set: { availableAmound: newAmountSender } },
          { new: true }
        ); /* .then((res) => {
          console.log(newAmountSender, "-amount", newAmountRicever);
        }); */
        const transection = new Transection({
          sender: req.user.phoneNum,
          recever: req.params._id,
          amount,
        });
        transection.save().then(async (transection) => {
          // console.log("-transection");
          try {
            await User.updateMany(
              { _id: { $in: [req.user._id, userAvailable._id] } },
              { $push: { transection: transection._id } },
              { new: true }
            )
              .then((re) => {
                console.log(re);
              })
              .catch((err) => {
                console.error(err);
              });
            await User.findOneAndUpdate(
              { phoneNum: req.params._id },
              {
                $set: {
                  availableAmound: newAmountRicever,
                },
              },
              { new: true }
            )
              .select("-password -tPin")
              .then((result) => {
                console.log(result);
                return res.status(200).json({ transection, result });
              })
              .catch((err) => {
                console.error(err);
                // res.status(500).send("server error");
              });
          } catch (err) {
            console.error(err.message);
            res.status(500).send("server error");
          }
        });
      })
      .catch((err) => {
        return res.status(456).json({ error: "user not found" });
      });
  }
});
router.get("/user/:_id/transections", requireLogin, (req, res) => {
  User.findOne({ _id: req.user._id })
    .select("-_id -phoneNum -availableAmound -password -tPin")
    .populate("transection", "_id sender recever amount date")
    .then(async (user) => {
      const frdPic = await User.findOne({ phoneNum: parseInt(req.params._id) })
        .select("pic")

        .then((frd) => {
          return frd.pic;
        })
        .catch((err) => {
          console.log(err);
          return;
        });
      if (
        !user.transection.sender == req.params._id ||
        !user.transection.recever == req.params._id
      ) {
        return res
          .status(422)
          .json({ massege: "no transition commited. trying to send money" });
      } else {
        return res.json({ transections: user.transection , pic: frdPic });
      }
    })
    .catch((err) => {
      return res.status(456).json({ error: "user not found" });
    });
});
router.post("/cashback", requireLogin, (req, res) => {
  const { amount } = req.body;
  const transectionAmount = parseInt(amount);
  try {
    if (transectionAmount % 500 == 0) {
      const hasCoupon = Math.random() < 0.5;
      console.log(hasCoupon);
      if (hasCoupon) {
        return res.json({
          cashback: 0,
          massege: "congratulation! you have recieved a coupon",
        });
      } else {
        return res.json({ cashback: 0, massege: "batter luck next time" });
      }
    } else if (transectionAmount < 1000) {
      const cashbackAmount = transectionAmount * 0.05;
      return res.json({
        cashback: cashbackAmount,
        massege:
          "you got" +
          cashbackAmount +
          "rupees cashback, amount add your wallet sometime",
      });
    } else {
      const cashbackAmount = transectionAmount * 0.02;
      return res.json({
        cashback: cashbackAmount,
        massege:
          "you got" +
          cashbackAmount +
          "rupees cashback, amount add your wallet sometime",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "internal server error" });
  }
});
router.post("/picfile", requireLogin, async (req, res) => {
  const { image } = req.files;
  req.user.password = undefined;
  await cloudinary.uploader.upload(
    image.tempFilePath,
    { format: "webp" },
    (err, result) => {
      if (result) {
        const photo = result.url;
        // const cii = result.public_id;

        User.findByIdAndUpdate(
          req.user._id,
          { $set: { pic: photo, firstLogin: false } },
          { new: true }
        )
          .select(
            "-_id -phoneNum -availableAmound -password -tPin -transection"
          )
          .then((result) => {
            console.log(result, "success");
            res.json(result);
          })
          .catch((err) => {
            console.log("error:", err);
            return res.status(422).json({ error: err });
          });
      } else {
        console.log("error:", err);
      }
    }
  );
});
module.exports = router;
