import React, { useState } from "react";

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<string[]>(["Shirt", "Trousers", "Shoes"]);

  return (
    <div>
      <h1>Inventory Management</h1>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default InventoryManagement;
