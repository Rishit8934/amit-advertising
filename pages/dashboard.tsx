import dynamic from "next/dynamic";
const Dashboard = dynamic(() => import("../client/src/pages/dashboard"), { ssr: false });
export default Dashboard;