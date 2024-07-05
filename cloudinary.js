const cloudinary = require("cloudinary");

cloudinary.v2.config({
  cloud_name: "dxndplrix",
  api_key: "635338432495951",
  api_secret: "tlqMNLq13a6khZVgbno_5VWzC1Y",
  secure: true,
});

module.exports = cloudinary.v2;
