import "@/styles/globals.css";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], display: "swap" });

export default function App({ Component, pageProps }) {
  return (
    <div className={nunito.className}>
      <Component {...pageProps} />
    </div>
  );
}
