import dynamic from "next/dynamic";
const ROPage = dynamic(() => import("../client/src/pages/ro-page"), { ssr: false });
export default ROPage;