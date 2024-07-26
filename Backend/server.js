const express = require("express");
const fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require("ffmpeg-static");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");
const path = require("path"); // Add this line to require the path module
const app = express();
const PORT = process.env.PORT || 3000;

ffmpeg.setFfmpegPath(ffmpegPath);

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("YouTube Downloader API");
});

// Simple download
app.post("/download", async (req, res) => {
  const { url } = req.body;
  console.log("Received URL:", url);

  if (!ytdl.validateURL(url)) {
    return res.status(400).send("Invalid YouTube URL");
  }

  res.header("Content-Disposition", 'attachment; filename="video.mp4"');

  try {
    const video = ytdl(url, { format: "mp4" , quality: 'highest' });
    console.log("Video info:", await ytdl.getInfo(url));

    let startTime;
    video.on("response", () => {
      startTime = Date.now();
    });

    video.on("progress", (chunkLength, downloaded, total) => {
      const percent = (downloaded / total) * 100;
      const downloadedMinutes = (Date.now() - startTime) / 1000 / 60;
      const estimatedDownloadTime =
        downloadedMinutes / (percent / 100) - downloadedMinutes;

      console.log(`Progress: ${percent.toFixed(2)}%`);
      console.log(`Downloaded: ${(downloaded / 1024 / 1024).toFixed(2)}MB`);
      console.log(
        `Estimated time left: ${estimatedDownloadTime.toFixed(2)} minutes`
      );
    });

    video.on("error", (err) => {
      console.error("Error during video download:", err);
      res.status(500).send("Error during video download");
    });

    video.pipe(res);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

const parseTime = (time) => {
  const parts = time.split(':');
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
};

// Download clip
app.post('/download/clip', async (req, res) => {
  const { url, start, end } = req.body;
  console.log('Received URL:', url);

  if (!ytdl.validateURL(url)) {
    return res.status(400).send('Invalid YouTube URL');
  }

  const startTime = start ? parseTime(start) : 0;
  const outputPath = path.join(__dirname, 'clip.mp4');

  try {
    const video = ytdl(url, { quality: 'highest' });

    const videoInfo = await ytdl.getBasicInfo(url);
    const videoDuration = videoInfo.videoDetails.lengthSeconds;
    const endTime = end ? parseTime(end) : videoDuration;

    if (startTime >= endTime || startTime >= videoDuration) {
      return res.status(400).send('Invalid start or end time');
    }
    video.on("progress", (chunkLength, downloaded, total) => {
      const percent = (downloaded / total) * 100;
      const downloadedMinutes = (Date.now() - startTime) / 1000 / 60;
      const estimatedDownloadTime =
        downloadedMinutes / (percent / 100) - downloadedMinutes;

      console.log(`Progress: ${percent.toFixed(2)}%`);
      console.log(`Downloaded: ${(downloaded / 1024 / 1024).toFixed(2)}MB`);
      console.log(
        `Estimated time left: ${estimatedDownloadTime.toFixed(2)} minutes`
      );
    });

    // Download the full video first
    const videoPath = path.join(__dirname, 'video.mp4');
    const writeStream = fs.createWriteStream(videoPath);
    video.pipe(writeStream);

    writeStream.on('finish', () => {
      res.header('Content-Disposition', 'attachment; filename="clip.mp4"');

      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .outputOptions('-c copy')
        .format('mp4')
        .on('start', (cmdline) => {
          console.log('Spawned ffmpeg with command: ' + cmdline);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error during video processing:', err);
          console.error('ffmpeg stdout:', stdout);
          console.error('ffmpeg stderr:', stderr);
          if (!res.headersSent) {
            res.status(500).send('Error during video processing');
          }
        })
        .on('end', () => {
          console.log('Processing finished successfully');
          res.download(outputPath, 'clip.mp4', (err) => {
            if (err) {
              console.error('Error sending the file:', err);
              res.status(500).send('Error sending the file');
            }
            // Clean up temporary files
            fs.unlinkSync(videoPath);
            fs.unlinkSync(outputPath);
          });
        })
        .save(outputPath);
    });

    writeStream.on('error', (err) => {
      console.error('Error writing video file:', err);
      res.status(500).send('Error writing video file');
    });
  } catch (err) {
    console.error('Error:', err);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
