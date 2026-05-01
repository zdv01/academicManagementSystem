import { Info } from "../../models/Info";
import GenericTable from "../../components/GenericTable";
import { infoService } from "../../services/InfoService";
// import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const info: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<Info[]>([]);
    console.log("dataaa: ", data);
    // 🔹 Llamar `fetchData` cuando el componente se monta
    useEffect(() => {
        fetchData();
    }, []);

    // 🔹 Obtiene los datos de los usuarios
    const fetchData = async () => {
        const info = await infoService.getInfo();
        console.log("esto es infoooo:", info);
        const formattedData = info.map((item: any) => ({
            ...item,
            name: item.name.common,         
            capital: item.capital?.[0] || "N/A", 
            region: item.region            
        }));
        console.log("esto es info:", formattedData);
        setData(formattedData);
    };

    const handleAction = (action: string, item: Info) => {
        if (action === "view") {
            console.log("the view:", item);
            fetchData();
        }
    };

    const handleCreate = () => {
        console.log("Create user");
        navigate("/users-create");
    };


    return (
        <div>
            <h2>User List</h2>
            <button
                onClick={handleCreate}
                className="inline-flex items-center justify-center bg-primary py-2 px-4 text-sm font-medium text-white rounded-md hover:bg-opacity-90 transition"
            >
                Crear
            </button>

            <GenericTable
                data={data}
                columns={["name", "capital", "region"]}
                actions={[
                    { name: "view", label: "View" },
                ]}
                onAction={handleAction}
            />
        </div>
    );
};

export default info;