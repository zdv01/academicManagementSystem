import React, { useState } from "react";
import { Role } from "../../models/Role";
import GenericTable from "../../components/GenericTable";



const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([
    { id: 1, name: "Admin" },
    { id: 2, name: "User" },
  ]);

  const handleAction = (action: string, item: Role) => {
    if (action === "assignPermissions") {
      console.log("Assign permissions to role:", item);
    }
  };

  return (
    <div>
      <h2>Role List</h2>
      <GenericTable
        data={roles}
        columns={["id", "name"]}
        actions={[{ name: "assignPermissions", label: "Assign Permissions" }]}
        onAction={handleAction}
      />
    </div>
  );
};

export default Roles;