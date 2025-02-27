import { Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import cv from "@u4/opencv4nodejs";

const rootPath = path.resolve(__dirname, "..", "..");
const videoPath = path.join(rootPath, "uploads");
const tempPath = path.join(rootPath, "temp");
const watermarkPath = path.join(rootPath, "assets", "tiktok_logo.png");

// Ensure required directories exist
if (!fs.existsSync(videoPath)) fs.mkdirSync(videoPath, { recursive: true });
if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Upload video request received.");

    if (!req.file) {
      console.log("No file uploaded.");
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const filePath = path.join(videoPath, req.file.filename);
    console.log(`Video uploaded successfully. File path: ${filePath}`);

    res.status(200).json({ message: "Video uploaded successfully", filename: req.file.filename, filePath });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Error uploading video" });
  }
};

export const processVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Processing video request received.");

    const { filename } = req.params;
    if (!filename) {
      console.log("No filename provided.");
      res.status(400).json({ message: "Filename is required" });
      return;
    }

    const filePath = path.join(videoPath, filename);
    const outputFilePath = path.join(videoPath, `processed_${filename}.mp4`);

    console.log(`Processing video: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log("File does not exist:", filePath);
      res.status(404).json({ message: "File not found" });
      return;
    }

    console.log("Extracting frame for watermark detection...");
    const extractedFrames = await extractFrames(filePath, tempPath);

    if (extractedFrames.length === 0) {
      console.log("No frames extracted. Unable to detect watermark.");
      res.status(500).json({ message: "Failed to extract frames." });
      return;
    }

    console.log(`Extracted ${extractedFrames.length} frames. Detecting watermark...`);
    let watermarkCoordinates = null;

    for (const frame of extractedFrames) {
      watermarkCoordinates = await detectWatermark(frame);
      if (watermarkCoordinates) break;
    }

    if (!watermarkCoordinates) {
      console.log("Watermark detection failed.");
      res.status(500).json({ message: "Watermark detection failed" });
      return;
    }

    console.log("Watermark detected at coordinates:", watermarkCoordinates);
    const { watermark } = watermarkCoordinates;
    const { x, y, width, height } = watermark;

    ffmpeg(filePath)
      .output(outputFilePath)
      .videoFilter([`delogo=x=${x}:y=${y}:w=${width + 10}:h=${height + 30}:show=0`])
      .on("end", () => {
        console.log(`Video processed successfully: ${outputFilePath}`);
        res.status(200).json({ message: "Video processed successfully", processedFilePath: outputFilePath });
      })
      .on("error", (err) => {
        console.error("Error processing video:", err);
        res.status(500).json({ message: "Error processing video" });
      })
      .run();
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ message: "Error processing video" });
  }
};

const detectWatermark = async (framePath: string) => {
  try {
    let image = cv.imread(framePath);
    image = image.cvtColor(cv.COLOR_BGR2GRAY);

    if (!fs.existsSync(watermarkPath)) {
      console.error("Watermark template not found:", watermarkPath);
      return null;
    }

    let watermarkTemplate = cv.imread(watermarkPath);
    watermarkTemplate = watermarkTemplate.cvtColor(cv.COLOR_BGR2GRAY);

    // Ensure watermark template has valid dimensions before resizing
    if (watermarkTemplate.rows === 0 || watermarkTemplate.cols === 0) {
      console.error("Invalid watermark template dimensions.");
      return null;
    }

    // Dynamically resize the watermark template based on the frame size
    const scaleFactor = 30 / watermarkTemplate.rows; // Adjust scale based on height
    watermarkTemplate = watermarkTemplate.resize(
      Math.floor(watermarkTemplate.rows * scaleFactor),
      Math.floor(watermarkTemplate.cols * scaleFactor)
    );

    console.log("Adjusted Watermark Size:", watermarkTemplate.cols, watermarkTemplate.rows);
    console.log("Extracted Frame Size:", image.cols, image.rows);

    // Apply Gaussian blur to enhance template matching
    image = image.gaussianBlur(new cv.Size(3, 3), 0);
    watermarkTemplate = watermarkTemplate.gaussianBlur(new cv.Size(3, 3), 0);

    // Perform template matching to find the watermark
    const result = image.matchTemplate(watermarkTemplate, cv.TM_CCOEFF_NORMED);
    const minMax = result.minMaxLoc();

    console.log(`Template Match Confidence: ${minMax.maxVal}`);

    if (minMax.maxVal < 0.7) {
      console.log("No watermark detected with high confidence.");
      return null;
    }

    // Get watermark position
    const { x, y } = minMax.maxLoc;
    const width = watermarkTemplate.cols;
    const height = watermarkTemplate.rows;

    // Define the region of interest for the username (assumed to be directly below the watermark)
    const usernameY = y + height; // 5 pixels of spacing below the watermark
    const usernameHeight = height; // Assume username is roughly the same height as the watermark

    // Blur both the watermark and username areas
    const blurSize = new cv.Size(15, 15);
    const roiWatermark = new cv.Rect(x, y, width, height);
    const roiUsername = new cv.Rect(x, usernameY, width, usernameHeight);

    image.getRegion(roiWatermark).blur(blurSize).copyTo(image.getRegion(roiWatermark));
    image.getRegion(roiUsername).blur(blurSize).copyTo(image.getRegion(roiUsername));

    // Save or return the modified image
    cv.imwrite(framePath, image);

    return {
      watermark: { x, y, width, height },
      username: { x, y: usernameY, width, height: usernameHeight },
    };
  } catch (err) {
    console.error("Error detecting and removing watermark/username:", err);
    return null;
  }
};

const extractFrames = (videoPath: string, outputDir: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 3,
        folder: outputDir,
        filename: "frame_%02d.png",
      })
      .on("end", () => {
        const extractedFrames = fs.readdirSync(outputDir)
          .filter(file => file.startsWith("frame_") && file.endsWith(".png"))
          .map(file => path.join(outputDir, file));

        resolve(extractedFrames);
      })
      .on("error", (err) => reject(err));
  });
};
