"use client";

interface NavbarProps {
    userName: string;
    userRole: string;
    lastLogin: string;
}

export default function Navbar({ userName, userRole, lastLogin }: NavbarProps) {
    const today = new Date();
    const todayFormatted = today.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const timeFormatted = today.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <nav className="flex justify-between items-center bg-white shadow px-6 py-4">
            <div>
                <p className="text-sm text-gray-500">Angemeldet als</p>
                <h2 className="text-lg font-semibold text-gray-900">{userName} · {userRole}</h2>
                <p className="text-sm text-gray-500">
                    {todayFormatted} · Letzter Login: {lastLogin !== "–" ? lastLogin : timeFormatted}
                </p>
            </div>

            {/* Optional: Logout-Button */}
            <button
                onClick={() => {
                    localStorage.removeItem("jwt");
                    location.href = "/";
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>
        </nav>
    );
}
