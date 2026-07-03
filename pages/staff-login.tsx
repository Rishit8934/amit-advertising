import dynamic from "next/dynamic";
const StaffLogin = dynamic(() => import("../client/src/pages/staff-login"), { ssr: false });
export default StaffLogin;