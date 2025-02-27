import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path"; // Add path for file resolution
import videoRoutes from "./routes/videoRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/video", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/videos", videoRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
