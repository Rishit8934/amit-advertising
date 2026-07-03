import dynamic from "next/dynamic";
const RateCard = dynamic(() => import("../client/src/pages/rate-card"), { ssr: false });
export default RateCard;