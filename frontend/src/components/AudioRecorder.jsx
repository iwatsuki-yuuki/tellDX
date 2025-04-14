import React, { useState, useRef } from 'react';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    audioChunks.current = []; // 録音データを初期化
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.current.push(e.data); // refに直接push
      }
    };

    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      try {
        const response = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          alert('文字起こし結果: ' + data.transcript);
        } else {
          alert('バックエンドでエラーが発生しました');
        }
      } catch (error) {
        alert('リクエスト中にエラーが発生しました: ' + error.message);
      }
    };

    mediaRecorder.current.start();
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div>
      {!isRecording && <button onClick={startRecording}>録音開始</button>}
      {isRecording && <button onClick={stopRecording}>録音停止</button>}
    </div>
  );
};

export default AudioRecorder;