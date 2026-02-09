"use client";

interface NavbarProps {
    userName: string;
    userRole: string;
    lastLogin: string;
}

export default function Navbar({ userName, userRole }: NavbarProps) {
    const lastLoginRaw = localStorage.getItem("lastLogin");
    const lastLogin = lastLoginRaw
        ? new Date(lastLoginRaw).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        : "–";

    const todayFormatted = new Date().toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return (
        <nav className="flex justify-between items-center bg-white shadow px-6 py-4">
            <div>
                <p className="text-sm text-gray-500">Angemeldet als</p>
                <h2 className="text-lg font-semibold text-gray-900">
                    {userName} · {userRole}
                </h2>
                <p className="text-sm text-gray-500">
                    {todayFormatted} · Letzter Login: {lastLogin}
                </p>
            </div>

            <button
                onClick={() => {
                    localStorage.removeItem("jwt");
                    localStorage.removeItem("lastLogin");
                    location.href = "/";
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>
        </nav>
    );
}
