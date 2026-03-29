import React from "react";
import { resolveMediaSrc } from "../../../utils/projects";
import { mediaTypeFromSrc, youtubeIdFrom } from "../../../utils/projectsExtras";

export default function MediaPreview({ src }) {
  if (!src) {
    return <div className="ap-media-preview ap-media-preview--empty">No src</div>;
  }

  const type = mediaTypeFromSrc(src);

  if (type === "youtube") {
    const id = youtubeIdFrom(src);
    return (
      <div className="ap-media-preview">
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="YouTube thumbnail" />
        <span className="ap-media-badge">YouTube</span>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="ap-media-preview">
        <video src={resolveMediaSrc(src)} className="ap-media-preview-video" muted />
        <span className="ap-media-badge">Video</span>
      </div>
    );
  }

  return (
    <div className="ap-media-preview">
      <img src={resolveMediaSrc(src)} alt="Media preview" />
    </div>
  );
}