// src/app/layout.tsx
import SessionAuthProvider from "@/context/SessionAuthProvider";
import Footer from "@/components/footer";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import BootstrapClient from "@/components/BootstrapClient"; // Importa el componente de cliente

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} d-flex flex-column min-vh-100`}>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css"
        />
        <main className="container flex-grow-1">
          <SessionAuthProvider>
            {children}
          </SessionAuthProvider>
        </main>
        {/* <Footer /> */}
        <BootstrapClient /> {/* Carga Bootstrap solo en el cliente */}
      </body>
    </html>
  );
}