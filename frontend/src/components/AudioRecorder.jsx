import React, { useState, useRef } from 'react';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setAudioChunks((prev) => [...prev, e.data]);
      }
    };

    recorder.onstop = async () => {
      // 録音停止後にファイル化してバックエンドに送信
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      // api.js 側で定義してもいいが、ここで直接fetchする例
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // 成功時のハンドリング（文字起こし結果を表示など）
        const data = await response.json();
        alert('文字起こし結果: ' + data.transcript);
      } else {
        alert('エラーが発生しました');
      }
    };

    recorder.start();
    setMediaRecorder(recorder);
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorder.stop();
  };

  return (
    <div>
      {!isRecording && <button onClick={startRecording}>録音開始</button>}
      {isRecording && <button onClick={stopRecording}>録音停止</button>}
    </div>
  );
};

export default AudioRecorder;