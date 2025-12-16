interface Props {
  open: boolean;
  onClose: () => void;
  creditLimit: number;
  unpaidAmount: number;
  creditBalance: number;
  orderTotal: number;
}

export default function CreditLimitModal({
  open,
  onClose,
  creditLimit,
  unpaidAmount,
  creditBalance,
  orderTotal
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-red-600">
          Insufficient Credit Balance
        </h2>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Credit Limit</span>
            <span>₹{creditLimit}</span>
          </div>
          <div className="flex justify-between">
            <span>Used Credit</span>
            <span>₹{unpaidAmount}</span>
          </div>
          <div className="flex justify-between text-green-600 font-medium">
            <span>Available Credit</span>
            <span>₹{creditBalance}</span>
          </div>
          <div className="flex justify-between text-red-600 font-semibold">
            <span>Order Total</span>
            <span>₹{orderTotal}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
