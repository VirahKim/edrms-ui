import React, { useRef } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ videoUrl, title, candidateName, duration, attemptNumber }) => {
  const videoRef = useRef(null);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `video-response-${attemptNumber}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="video-player-container">
      {title && <h4 className="video-title">{title}</h4>}

      <div className="video-player-wrapper">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="video-player"
          playsInline
        />
      </div>

      <div className="video-player-info">
        <div className="info-item">
          {candidateName && (
            <>
              <span className="info-label">Candidate:</span>
              <span className="info-value">{candidateName}</span>
            </>
          )}
        </div>
        {attemptNumber && (
          <div className="info-item">
            <span className="info-label">Attempt:</span>
            <span className="info-value">#{attemptNumber}</span>
          </div>
        )}
        {duration && (
          <div className="info-item">
            <span className="info-label">Duration:</span>
            <span className="info-value">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      <div className="video-player-actions">
        <button onClick={downloadVideo} className="btn btn-sm btn-secondary">
          <i className="fas fa-download"></i> Download
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
