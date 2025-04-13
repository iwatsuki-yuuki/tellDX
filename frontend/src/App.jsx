import React from 'react';
import AudioRecorder from './components/AudioRecorder';

const App = () => {
  return (
    <div>
      <h1>音声録音・文字起こしサービス</h1>
      <AudioRecorder />
      {/* 文字起こし結果やエクセル/DBへの保存状況などを表示するコンポーネントを追加 */}
    </div>
  );
};

export default App;