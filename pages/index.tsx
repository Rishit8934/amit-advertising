import dynamic from "next/dynamic";
const Home = dynamic(() => import("../client/src/pages/home"), { ssr: false });
export default Home;