// src/Downloader.js
import React, { useState } from 'react';

const Downloader = () => {
  const [url, setUrl] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = { url };
    if (start) data.start = start;
    if (end) data.end = end;

    const endpoint = start || end ? '/download/clip' : '/download';

    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    setLoading(false);

    if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
      
        // Prompt the user to enter the filename
        const filename = prompt('Enter the filename for the downloaded video:', 'video.mp4');
        if (filename) {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = downloadUrl;
          a.download = filename+'.mp4';  // Use the filename provided by the user
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
        } else {
          alert('Download cancelled. No filename provided.');
        }
      } else {
        alert('Failed to download video');
      }
      
  };

  return (
    <div className="container">
      <h1>YouTube Downloader</h1>
      <form onSubmit={handleDownload}>
        <input
          type="text"
          placeholder="YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Start Time (HH:MM:SS)"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="text"
          placeholder="End Time (HH:MM:SS)"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Downloading...' : 'Download Video'}
        </button>
      </form>
      {loading && <div className="spinner"></div>}
    </div>
  );
};

export default Downloader;
