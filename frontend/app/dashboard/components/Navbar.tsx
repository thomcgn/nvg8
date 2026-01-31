"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("jwt");
        router.push("/");
    };

    return (
        <header className="flex justify-between items-center p-4 bg-gray-600">
            <h1 className="text-xl font-semibold">K. Fischer - 31.Januar 2026 - 16:45</h1>
            <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
                Logout
            </button>
        </header>
    );
}
