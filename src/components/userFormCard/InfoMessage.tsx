interface Props {
    message: string;
}

export default function InfoMessage({ message }: Props) {

    return (
        <div
            className="
                bg-blue-50
                border
                border-blue-200
                text-blue-700
                text-sm
                rounded-lg
                p-3
            "
        >
            {message}
        </div>
    );
}