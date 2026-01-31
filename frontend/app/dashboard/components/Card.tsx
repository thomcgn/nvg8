interface CardProps {
    title: string;
    value: number | string;
    icon?: React.ReactNode;
}

export default function Card({ title, value, icon }: CardProps) {
    return (
        <div className="bg-white shadow rounded p-4 flex items-center justify-between">
            <div>
                <p className="text-sm text-black">{title}</p>
                <p className="text-2xl  text-black font-bold">{value}</p>
            </div>
            {icon && <div className="text-indigo-800 text-3xl">{icon}</div>}
        </div>
    );
}
