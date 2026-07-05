import BrandLoader from "./ui/BrandLoader";

function LoadingState({ message }) {
  return (
    <BrandLoader
      text={message || "Loading..."}
      size="md"
    />
  );
}

export default LoadingState;
