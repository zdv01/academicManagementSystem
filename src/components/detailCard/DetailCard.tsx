import React from "react";

interface DetailItem {
    label: string;
    value: React.ReactNode;
}

interface Props {

    title: string;

    details: DetailItem[];
}

const DetailCard: React.FC<Props> = ({
    title,
    details
}) => {

    return (

        <div
            className="
                bg-white
                rounded-xl
                shadow
                p-5
                space-y-4
            "
        >

            <h2
                className="
                    text-xl
                    font-bold
                "
            >
                {title}
            </h2>

            <div
                className="
                    text-base
                    space-y-3
                "
            >

                {
                    details.map((detail, index) => (

                        <p key={index}>

                            <strong
                                className="
                                    font-semibold
                                "
                            >
                                {detail.label}:
                            </strong>

                            {" "}

                            <span>
                                {detail.value}
                            </span>

                        </p>
                    ))
                }

            </div>

        </div>
    );
};

export default DetailCard;