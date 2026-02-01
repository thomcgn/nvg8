interface Props {
    title: string;
    value: number;
    icon?: React.ReactNode;
}

export default function StatCard({ title, value, icon }: Props) {
    return (
        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
            {icon && <div className="text-indigo-600 text-xl">{icon}</div>}
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
