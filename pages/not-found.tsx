import dynamic from "next/dynamic";

const NotFound = dynamic(() => import("../client/src/pages/not-found"), { ssr: false });
export default NotFound;
