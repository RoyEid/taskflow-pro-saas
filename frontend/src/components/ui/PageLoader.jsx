import BrandLoader from "./BrandLoader";

export default function PageLoader({ message = "Loading..." }) {
  return (
    <BrandLoader
      text={message}
      fullScreen={true}
      size="lg"
    />
  );
}
