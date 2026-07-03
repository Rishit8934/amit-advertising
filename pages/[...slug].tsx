import dynamic from "next/dynamic";

const App = dynamic(() => import("../client/src/App"), { ssr: false });

export default function CatchAllPage() {
  return <App />;
}
