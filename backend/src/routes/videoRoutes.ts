import express from "express";
import { uploadVideo, processVideo } from "../controllers/videoController";
import multer from "multer";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST route to upload a video
router.post("/upload", upload.single("video"), uploadVideo);

// GET route to process the uploaded video
router.get("/process/:filename", processVideo);

// GET route to view the processed video
router.get("/video/:filename", (req, res) => {
  const videoFilePath = path.join(__dirname, "..", "uploads", req.params.filename);

  // Check if the file exists
  res.sendFile(videoFilePath, (err) => {
    if (err) {
      console.log("Error sending video:", err);
      res.status(404).send("Video not found");
    }
  });
});

export default router;
