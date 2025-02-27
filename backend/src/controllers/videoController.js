"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideo = exports.uploadVideo = void 0;
const uploadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        // Process video upload logic here
        res.status(200).json({ message: "Video uploaded successfully", filename: req.file.filename });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error uploading video" });
    }
});
exports.uploadVideo = uploadVideo;
const processVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        if (!filename) {
            res.status(400).json({ message: "Filename is required" });
            return;
        }
        // Process video logic here (e.g., watermark detection, FFmpeg processing)
        res.status(200).json({ message: "Video processed successfully", filename });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing video" });
    }
});
exports.processVideo = processVideo;
