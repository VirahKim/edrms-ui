import React, { useState, useRef, useEffect } from 'react';
import './VideoRecorder.css';

const VideoRecorder = ({ timeLimit = 120, onRecordingComplete, attemptNumber = 1 }) => {
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Request camera access on mount
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        setError('Camera access denied. Please enable camera permissions.');
        setHasPermission(false);
      }
    };

    initializeCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    if (!streamRef.current) {
      setError('Camera not available');
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm',
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setRecordedChunks(chunks);
        onRecordingComplete({
          blob,
          duration: Math.floor((timeLimit - timeLeft) / 1),
          url,
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      setTimeLeft(timeLimit);
      setError('');

      // Timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            mediaRecorder.stop();
            setRecording(false);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    setVideoUrl(null);
    setRecordedChunks([]);
    setTimeLeft(timeLimit);
    setError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasPermission) {
    return (
      <div className="video-recorder-container error">
        <div className="error-message">
          <h3>Camera Access Required</h3>
          <p>Please enable camera access to record your video response.</p>
          <p>Supported browsers: Chrome, Firefox, Safari, Edge</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-recorder-container">
      <div className="video-recorder-header">
        <h3>Recording Attempt #{attemptNumber}</h3>
        <div className="time-limit-info">Max Duration: {formatTime(timeLimit)}</div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="video-preview">
        {!videoUrl ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="camera-feed"
          />
        ) : (
          <video
            src={videoUrl}
            controls
            className="recorded-video"
            playsInline
          />
        )}
      </div>

      <div className="recorder-timer">
        <span className={`time ${recording ? 'recording' : ''}`}>
          {formatTime(timeLeft)}
        </span>
        {recording && <span className="recording-indicator">● Recording</span>}
      </div>

      <div className="recorder-controls">
        {!videoUrl ? (
          <>
            {!recording ? (
              <button
                onClick={startRecording}
                className="btn btn-primary btn-lg"
                disabled={recording}
              >
                <i className="fas fa-circle"></i> Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="btn btn-danger btn-lg"
              >
                <i className="fas fa-stop"></i> Stop Recording
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={resetRecording}
              className="btn btn-secondary btn-lg"
            >
              <i className="fas fa-redo"></i> Retry
            </button>
            <button
              onClick={() => {
                setVideoUrl(null);
                setRecordedChunks([]);
              }}
              className="btn btn-primary btn-lg"
            >
              <i className="fas fa-check"></i> Use This Recording
            </button>
          </>
        )}
      </div>

      <div className="video-guidelines">
        <h4>Recording Tips:</h4>
        <ul>
          <li>Ensure good lighting and clear audio</li>
          <li>Face the camera directly</li>
          <li>Maximum {formatTime(timeLimit)} per recording</li>
          <li>You can re-record up to 5 times</li>
          <li>Minimum 3 seconds of content required</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoRecorder;
