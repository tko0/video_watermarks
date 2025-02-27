"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeWatermark = exports.detectWatermark = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const detectWatermark = (filePath) => {
    return new Promise((resolve) => {
        // Placeholder for a more advanced detection logic
        resolve(filePath.includes("tiktok"));
    });
};
exports.detectWatermark = detectWatermark;
const removeWatermark = (filePath) => {
    return new Promise((resolve, reject) => {
        const outputPath = path_1.default.join("uploads", `processed_${path_1.default.basename(filePath)}`);
        const ffmpegCommand = `ffmpeg -i ${filePath} -vf "delogo=x=100:y=100:w=200:h=100" ${outputPath}`;
        (0, child_process_1.exec)(ffmpegCommand, (error) => {
            if (error)
                reject(error);
            resolve(outputPath);
        });
    });
};
exports.removeWatermark = removeWatermark;
