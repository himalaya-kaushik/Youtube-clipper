const ytdl = require("@distube/ytdl-core");
var ffmpeg = require('ffmpeg');
//const ffmpegPath = require("ffmpeg-static");
//ffmpeg.setFfmpegPath(ffmpegPath);
// Download a video
//const video = ytdl("https://youtu.be/FDrTTA36HnU?si=UepVhOSaOVjfk2zB").pipe(require("fs").createWriteStream("video.mp4"));

//ytdl("https://youtu.be/FDrTTA36HnU?si=UepVhOSaOVjfk2zB").pipe(require("fs").createWriteStream("video.mp4"));

try {
	var process = new ffmpeg('video.mp4');
    //console.log(process);
	process.then(function (video) {
		// Video metadata
		console.log(video.metadata);
		// FFmpeg configuration
		console.log(video.info_configuration);
	}, function (err) {
		console.log('Error: ' + err);
	});
} catch (e) {
    console.log('felrknmvlsrnbvdrb',e);
	console.log('sfswrfgsrgvs', e.code);
	console.log('srvsrvsrvsrvsvsr',e.msg);
}