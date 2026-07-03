import dynamic from "next/dynamic";
const Booking = dynamic(() => import("../client/src/pages/booking"), { ssr: false });
export default Booking;