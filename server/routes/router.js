const express = require("express");
const users = require("../model/usersSchema");
const moment = require("moment");

const router = new express.Router();
const multer = require("multer");

// Multer Storage Configuration
const imgconfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./uploads");
  },
  filename: (req, file, callback) => {
    callback(null, `image-${Date.now()}-${file.originalname}`);
  },
});

// File Filter to Allow Only Images
const isImage = (req, file, callback) => {
  if (file.mimetype.startsWith("image")) {
    callback(null, true);
  } else {
    callback(new Error("Only images are allowed"));
  }
};

const upload = multer({
  storage: imgconfig,
  fileFilter: isImage,
});

// Register Route
router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const { filename } = req.file;
    const { name } = req.body;

    if (!name || !filename) {
      return res
        .status(400)
        .json({ status: 400, message: "Fill all the data" });
    }

    const date = moment(new Date()).format("YYYY-MM-DD");

    const userdata = new users({
      name: name,
      imgpath: filename,
      date: new Date(),
    });

    await userdata.save(); // ✅ Save user data only once

    res.status(201).json({
      status: 201,
      message: "User registered successfully",
      data: userdata,
    });
  } catch (error) {
    console.error("Error in /register route:", error.message); // ✅ Log error for debugging

    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

router.get("/getdata", async (req, res) => {
  try {
    const getUser = await users.find();
    res.status(201).json({ status: 201, getUser });
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

// delete

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const dltUser = await users.findByIdAndDelete({ _id: id });
    res.status(201).json({ status: 201, dltUser });
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

module.exports = router;
