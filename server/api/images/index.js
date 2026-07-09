const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/images", (req, res) => {
  const imgDir = path.join(__dirname, "../../img");

  fs.readdir(imgDir, (err, files) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "读取图片目录失败" });
    }
    const imageList = files.map((f) => ({
      name: f,
      url: `/img/${f}`,
    }));
    res.json({ code: 200, data: imageList });
  });
});

module.exports = router;
