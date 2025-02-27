"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: "uploads/" });
// POST route to upload a video
router.post("/upload", upload.single("video"), videoController_1.uploadVideo);
// GET route to process the uploaded video
router.get("/process/:filename", videoController_1.processVideo);
// GET route to view the processed video
router.get("/video/:filename", (req, res) => {
    const videoFilePath = path_1.default.join(__dirname, "..", "uploads", req.params.filename);
    // Check if the file exists
    res.sendFile(videoFilePath, (err) => {
        if (err) {
            console.log("Error sending video:", err);
            res.status(404).send("Video not found");
        }
    });
});
exports.default = router;
