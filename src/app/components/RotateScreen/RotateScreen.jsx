
'use client';

import './RotateScreen.css'; 

export default function RotateScreen() {
  return (
    <div className="rotateScreenOverlay">
      <div className="rotateScreenUserMessage">
        <p><u>Mobile Users:</u> Please rotate your device to landscape mode.</p>
        <p> <u>Desktop Users:</u> Please Extend your window.</p>
      </div>
    </div>
  );
}