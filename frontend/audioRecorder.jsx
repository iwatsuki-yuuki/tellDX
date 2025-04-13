import React, { useState } from 'react';

function App() {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // 録音を開始する処理
  const startRecording = async () => {
    // ブラウザのマイク許可を要求
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // MediaRecorder（録音用オブジェクト）を生成
    const recorder = new MediaRecorder(stream);

    // 音声データが利用可能になる度にaudioChunksに追加
    recorder.ondataavailable = event => {
      setAudioChunks(prevChunks => [...prevChunks, event.data]);
    };

    // 録音開始
    recorder.start();
    setMediaRecorder(recorder);
  };

  // 録音を停止する処理
  const stopRecording = () => {
    mediaRecorder.stop(); // 録音を停止

    mediaRecorder.onstop = () => {
      // 音声データをBlobに変換（webm形式で）
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

      // Blobデータをサーバーに送信する関数を呼び出す
      sendToServer(audioBlob);

      // audioChunksを初期化
      setAudioChunks([]);
    };
  };

  // サーバーにBlobデータをアップロードする処理
  const sendToServer = (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "recorded_audio.webm");

    // サーバー（FastAPI）にアップロード
    fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    })
    .then(response => response.json())
    .then(data => console.log('サーバーからの応答:', data))
    .catch(error => console.error('エラー:', error));
  };

  // 画面に表示されるボタン
  return (
    <div>
      <button onClick={startRecording}>録音開始</button>
      <button onClick={stopRecording}>録音停止</button>
    </div>
  );
}

export default App;

const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

