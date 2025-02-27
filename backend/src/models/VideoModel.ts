export interface Video {
  filename: string;
  originalName: string;
  uploadDate: Date;
  status: "pending" | "processed" | "failed";
  processedPath?: string;
}

export const videos: Video[] = [];
