// /src/components/InventoryManagement.tsx

const errorData = {
  code: "rate-limited",
  message: "You have hit the rate limit. Please upgrade to keep chatting.",
  providerLimitHit: false,
  isRetryable: true,
};

export default function InventoryManagement() {
  return (
    <div>
      <h1>Inventory Management</h1>
      <pre>{JSON.stringify(errorData, null, 2)}</pre>
    </div>
  );
}
