import React, { useMemo, useState } from "react";

interface Action {
    name: string;
    label: string;
}

interface GenericTableProps {
    data: Record<string, any>[];
    columns: string[];
    actions: Action[];
    onAction: (name: string, item: Record<string, any>) => void;

    pageSize?: number;
}

const GenericTable: React.FC<GenericTableProps> = ({
    data,
    columns,
    actions,
    onAction,
    pageSize = 5,
}) => {

    const getValueClass = (value: any, column: string) => {

        if (value === "Active") {
            return "meta-3 font-semibold";
        }

        if (value === "Inactive") {
            return "danger font-semibold";
        }

        if (column.toLowerCase().includes("email")) {
            return "meta-5";
        }

        if (column.toLowerCase().includes("code")) {
            return "meta-6 font-mono";
        }

        return "black";
    };

    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(data.length / pageSize);

    const paginatedData = useMemo(() => {

        const start = (currentPage - 1) * pageSize;

        const end = start + pageSize;

        return data.slice(start, end);

    }, [data, currentPage, pageSize]);

    const startRecord =
        data.length === 0
            ? 0
            : (currentPage - 1) * pageSize + 1;

    const endRecord = Math.min(
        currentPage * pageSize,
        data.length
    );

    return (

        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

            <div className="max-w-full overflow-x-auto">

                <table className="w-full table-auto">

                    <thead>

                        <tr className="bg-gray-2 text-left dark:bg-meta-4">

                            {columns.map((col, index) => (

                                <th
                                    key={col}
                                    className={`py-4 px-4 font-medium text-black dark:text-white ${
                                        index === 0
                                            ? "min-w-[220px] xl:pl-11"
                                            : "min-w-[150px]"
                                    }`}
                                >
                                    {col}
                                </th>

                            ))}

                            <th className="py-4 px-4 font-medium text-black dark:text-white">
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {paginatedData.map((item, index) => (

                            <tr key={index}>

                                {columns.map((col, colIndex) => (

                                    <td
                                        key={col}
                                        className={`border-b border-[#eee] py-5 px-4 dark:border-strokedark ${
                                            colIndex === 0
                                                ? "pl-9 xl:pl-11"
                                                : ""
                                        }`}
                                    >
                                        <p className={getValueClass(item[col], col)}>
                                            {item[col]}
                                        </p>
                                    </td>

                                ))}

                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">

                                    <div className="flex items-center gap-2">

                                        {actions.map((action) => (

                                            <button
                                                key={action.name}
                                                onClick={() =>
                                                    onAction(action.name, item)
                                                }
                                                type="button"
                                                className={`rounded-md border border-stroke px-2 py-1 text-xs font-medium transition hover:bg-gray-2 dark:border-strokedark
                                                    ${
                                                        action.name === "deactivate"
                                                            ? "text-red-500 hover:bg-red-100"
                                                            : ""
                                                    }
                                                    ${
                                                        action.name === "edit"
                                                            ? "text-blue-500 hover:bg-blue-100"
                                                            : ""
                                                    }
                                                `}
                                            >
                                                {action.label}
                                            </button>

                                        ))}

                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            <div className="flex items-center justify-between border-t border-stroke px-6 py-4 dark:border-strokedark">

                <div className="text-sm text-gray-500">

                    Showing {startRecord} to {endRecord} of {data.length} records

                </div>

                <div className="flex items-center gap-2">

                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() =>
                            setCurrentPage((prev) => prev - 1)
                        }
                        className="
                            rounded-md
                            border
                            border-stroke
                            px-3
                            py-1
                            text-sm
                            disabled:opacity-50
                            dark:border-strokedark
                        "
                    >
                        Previous
                    </button>

                    {
                        Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                        ).map((page) => (

                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`
                                    rounded-md
                                    px-3
                                    py-1
                                    text-sm
                                    border
                                    ${
                                        currentPage === page
                                            ? "bg-primary text-white border-primary"
                                            : "border-stroke dark:border-strokedark"
                                    }
                                `}
                            >
                                {page}
                            </button>

                        ))
                    }

                    <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                            setCurrentPage((prev) => prev + 1)
                        }
                        className="
                            rounded-md
                            border
                            border-stroke
                            px-3
                            py-1
                            text-sm
                            disabled:opacity-50
                            dark:border-strokedark
                        "
                    >
                        Next
                    </button>

                </div>

            </div>

        </div>
    );
};

export default GenericTable;