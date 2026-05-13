// import Breadcrumb from "../components/Breadcrumb";
// import CheckboxOne from "../components/CheckboxOne";
// import DropdownDefault from "../components/DropdownDefault";
// import TableOne from "../components/TableOne";
import { Toaster } from "react-hot-toast";
import UserFormCard from "../components/userFormCard/UserFormCard";
import ECommerce from "./Dashboard/ECommerce";
// import Header from "../components/Header";

export default function Prove() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Component Showcase
        </h1>

        <div className="border-2 border-dashed border-gray-300 rounded-2xl min-h-[500px] p-6">
          {/* Tus componentes de prueba aquí */}
            <Toaster/>
        </div>
      </div>
    </div>
  );
}


// import { useState } from "react";

// import FilterBar from "../components/filterBar/FilterBar";

// export default function Prove() {

//     const [search, setSearch] = useState("");

//     const [role, setRole] = useState("");

//     const [career, setCareer] = useState("");

//     const [status, setStatus] = useState("");

//     return (
//         <div className="p-10 bg-gray-100 min-h-screen">

//             <FilterBar

//                 searchPlaceholder="
//                     Buscar por nombre, email o código...
//                 "

//                 searchValue={search}

//                 onSearchChange={setSearch}

//                 onSearch={() => {
//                     console.log("Buscar");
//                 }}

//                 filters={[
//                     {
//                         name: "role",
//                         placeholder: "Rol",
//                         value: role,
//                         onChange: setRole,
//                         options: [
//                             {
//                                 label: "Todos",
//                                 value: "all"
//                             },
//                             {
//                                 label: "Docente",
//                                 value: "teacher"
//                             },
//                             {
//                                 label: "Estudiante",
//                                 value: "student"
//                             }
//                         ]
//                     },

//                     {
//                         name: "career",
//                         placeholder: "Carrera",
//                         value: career,
//                         onChange: setCareer,
//                         options: [
//                             {
//                                 label: "Ingeniería",
//                                 value: "engineering"
//                             },
//                             {
//                                 label: "Medicina",
//                                 value: "medicine"
//                             }
//                         ]
//                     },

//                     {
//                         name: "status",
//                         placeholder: "Estado",
//                         value: status,
//                         onChange: setStatus,
//                         options: [
//                             {
//                                 label: "Activo",
//                                 value: "active"
//                             },
//                             {
//                                 label: "Inactivo",
//                                 value: "inactive"
//                             }
//                         ]
//                     }
//                 ]}

//                 clearButton={{
//                     label: "Limpiar filtros",
//                     onClick: () => {
//                         setSearch("");
//                         setRole("");
//                         setCareer("");
//                         setStatus("");
//                     }
//                 }}

//                 primaryButton={{
//                     label: "Nuevo usuario",
//                     onClick: () => {
//                         console.log("Nuevo usuario");
//                     }
//                 }}

//             />

//         </div>
//     );
// }