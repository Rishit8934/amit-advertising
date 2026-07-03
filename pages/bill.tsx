import dynamic from "next/dynamic";
const BillPage = dynamic(() => import("../client/src/pages/bill"), { ssr: false });
export default BillPage;