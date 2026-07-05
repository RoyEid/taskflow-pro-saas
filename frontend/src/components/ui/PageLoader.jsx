import { useEffect } from "react";
import BrandLoader from "./BrandLoader";

export default function PageLoader({ message = "Loading..." }) {
  useEffect(() => {
    const frames = [
      "⏳ Loading TaskFlow",
      "⌛ Loading TaskFlow.",
      "⏳ Loading TaskFlow..",
      "⌛ Loading TaskFlow...",
    ];
    let currentFrame = 0;

    const intervalId = setInterval(() => {
      document.title = frames[currentFrame];
      currentFrame = (currentFrame + 1) % frames.length;
    }, 400);

    return () => {
      clearInterval(intervalId);
      document.title = "TaskFlow Pro — Project Management";
    };
  }, []);

  return (
    <BrandLoader
      text={message}
      fullScreen={true}
      size="lg"
    />
  );
}
