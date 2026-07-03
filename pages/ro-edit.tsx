import dynamic from "next/dynamic";
const ROEdit = dynamic(() => import("../client/src/pages/ro-edit"), { ssr: false });
export default ROEdit;