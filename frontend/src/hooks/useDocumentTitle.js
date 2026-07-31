import { useLayoutEffect } from "react";
import { formatDocumentTitle } from "../utils/pageTitles";

export default function useDocumentTitle(pageName) {
  const title = formatDocumentTitle(pageName);

  useLayoutEffect(() => {
    document.title = title;
  }, [title]);
}
