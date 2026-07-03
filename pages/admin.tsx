import dynamic from "next/dynamic";
const Admin = dynamic(() => import("../client/src/pages/admin"), { ssr: false });
export default Admin;