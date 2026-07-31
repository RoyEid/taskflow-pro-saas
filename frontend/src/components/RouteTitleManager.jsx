import { useLocation } from "react-router";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getRoutePageName } from "../utils/pageTitles";

export default function RouteTitleManager() {
  const { pathname } = useLocation();

  useDocumentTitle(getRoutePageName(pathname));

  return null;
}
