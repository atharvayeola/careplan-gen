import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Specialty Pharmacy Care Plan Generator",
    description: "Generate AI-powered care plans for specialty pharmacy patients",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
