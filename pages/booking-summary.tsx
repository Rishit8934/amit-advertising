import dynamic from "next/dynamic";
const BookingSummary = dynamic(() => import("../client/src/pages/booking-summary"), { ssr: false });
export default BookingSummary;