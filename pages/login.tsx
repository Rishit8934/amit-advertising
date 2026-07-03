import dynamic from "next/dynamic";
const Login = dynamic(() => import("../client/src/pages/login"), { ssr: false });
export default Login;