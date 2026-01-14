// Mock billing database
const mockInvoices = [
  {
    id: "INV-001",
    amount: 129.99,
    date: "2024-01-01",
    status: "paid",
    description: "Order ORD-001",
  },
  {
    id: "INV-002",
    amount: 49.99,
    date: "2024-01-05",
    status: "pending",
    description: "Order ORD-002",
  },
  {
    id: "INV-003",
    amount: 159.99,
    date: "2024-01-10",
    status: "pending",
    description: "Order ORD-003",
  },
];

const mockRefunds = [
  {
    refundId: "REF-001",
    invoiceId: "INV-001",
    amount: 20,
    reason: "Discount applied",
    status: "completed",
    date: "2024-01-03",
  },
];

export const billingTools: Record<string, any> = {
  get_invoice_details: {
    type: "function",
    function: {
      description: "Get invoice details",
      name: "get_invoice_details",
      parameters: {
        type: "object",
        properties: {
          invoiceId: { type: "string" },
          orderId: { type: "string" },
        },
      },
    },
  },

  check_refund_status: {
    type: "function",
    function: {
      description: "Check refund status",
      name: "check_refund_status",
      parameters: {
        type: "object",
        properties: {
          refundId: { type: "string" },
          invoiceId: { type: "string" },
        },
      },
    },
  },

  process_refund: {
    type: "function",
    function: {
      description: "Process a refund for an invoice",
      name: "process_refund",
      parameters: {
        type: "object",
        properties: {
          invoiceId: { type: "string" },
          amount: { type: "number" },
          reason: { type: "string" },
        },
        required: ["invoiceId", "amount", "reason"],
      },
    },
  },

  get_subscription_info: {
    type: "function",
    function: {
      description: "Get subscription plan details",
      name: "get_subscription_info",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string" },
        },
      },
    },
  },

  update_payment_method: {
    type: "function",
    function: {
      description: "Update payment method for subscription",
      name: "update_payment_method",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string" },
          cardLast4: { type: "string" },
          expiryMonth: { type: "number" },
          expiryYear: { type: "number" },
        },
        required: ["userId", "cardLast4", "expiryMonth", "expiryYear"],
      },
    },
  },
};

export async function executeToolBilling(toolName: string, toolInput: any): Promise<any> {
  if (toolName === "get_invoice_details") {
    const { invoiceId, orderId } = toolInput;
    let invoice;

    if (invoiceId) {
      invoice = mockInvoices.find((inv) => inv.id === invoiceId);
    } else if (orderId) {
      invoice = mockInvoices.find((inv) => inv.description.includes(orderId));
    }

    if (!invoice) {
      return { error: "Invoice not found" };
    }

    return invoice;
  }

  if (toolName === "check_refund_status") {
    const { refundId, invoiceId } = toolInput;
    let refund;

    if (refundId) {
      refund = mockRefunds.find((r) => r.refundId === refundId);
    } else if (invoiceId) {
      refund = mockRefunds.find((r) => r.invoiceId === invoiceId);
    }

    if (!refund) {
      return { error: "Refund not found or no refunds for this invoice" };
    }

    return {
      refundId: refund.refundId,
      amount: refund.amount,
      status: refund.status,
      reason: refund.reason,
      processedDate: refund.date,
      expectedArrival: refund.status === "completed" ? "Already received" : "5-10 business days",
    };
  }

  if (toolName === "process_refund") {
    const { invoiceId, amount, reason } = toolInput;
    const invoice = mockInvoices.find((inv) => inv.id === invoiceId);

    if (!invoice) {
      return { error: "Invoice not found" };
    }

    if (invoice.status === "refunded") {
      return { error: "Invoice already refunded" };
    }

    return {
      success: true,
      refundId: `REF-${Date.now()}`,
      amount,
      reason,
      status: "processing",
      estimatedArrival: "3-5 business days",
      message: `Refund of $${amount} has been initiated`,
    };
  }

  if (toolName === "get_subscription_info") {
    return {
      plan: "premium",
      status: "active",
      monthlyAmount: 9.99,
      nextBillingDate: "2024-02-14",
      features: ["Priority support", "Early access to new features", "Ad-free experience"],
      canCancel: true,
      message: "Your Premium subscription is active",
    };
  }

  if (toolName === "update_payment_method") {
    const { userId, cardLast4, expiryMonth, expiryYear } = toolInput;
    return {
      success: true,
      message: "Payment method updated successfully",
      cardLast4,
      expiryDate: `${expiryMonth}/${expiryYear}`,
    };
  }

  return { error: "Unknown tool" };
}
