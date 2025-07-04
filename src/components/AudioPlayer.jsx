import React from "react";

export default function AudioPlayer({ audioUrl }) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <audio controls>
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
