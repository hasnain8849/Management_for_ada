import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface InventoryItem {
  id: number;
  name: string;
  code: string;
  quantity: number;
  size: string;
  color: string;
}

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [newItem, setNewItem] = useState<InventoryItem>({
    id: 0,
    name: "",
    code: "",
    quantity: 0,
    size: "",
    color: "",
  });

  // input handle
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  // add item
  const handleAdd = () => {
    if (!newItem.name || !newItem.code) return;
    setItems([...items, { ...newItem, id: Date.now() }]);
    setNewItem({ id: 0, name: "", code: "", quantity: 0, size: "", color: "" });
  };

  // delete item
  const handleDelete = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Inventory Management</h2>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          value={newItem.name}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="code"
          placeholder="Item Code"
          value={newItem.code}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={newItem.quantity}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="size"
          placeholder="Size (S/M/L)"
          value={newItem.size}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="color"
          placeholder="Color"
          value={newItem.color}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>

      <Button onClick={handleAdd}>Add Item</Button>

      <ul className="mt-6 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span>
              {item.name} ({item.code}) - {item.quantity} pcs - {item.size} -{" "}
              {item.color}
            </span>
            <Button variant="destructive" onClick={() => handleDelete(item.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InventoryManagement;
