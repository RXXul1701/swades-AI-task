// Mock orders database
const mockOrders = [
  {
    id: "ORD-001",
    status: "delivered",
    items: ["Wireless Headphones", "USB Cable"],
    total: 129.99,
    estimatedDelivery: "2024-01-12",
    trackingNumber: "TRK123456",
  },
  {
    id: "ORD-002",
    status: "in_transit",
    items: ["Laptop Stand"],
    total: 49.99,
    estimatedDelivery: "2024-01-15",
    trackingNumber: "TRK789012",
  },
  {
    id: "ORD-003",
    status: "processing",
    items: ["Mechanical Keyboard", "Mouse Pad"],
    total: 159.99,
    estimatedDelivery: "2024-01-18",
    trackingNumber: null,
  },
];

export const orderTools: Record<string, any> = {
  fetch_order_details: {
    type: "function",
    function: {
      description:"Fetch full order details. Use ONLY after the user has explicitly provided a valid orderId. Do NOT call this tool if the orderId is missing.",
      name: "fetch_order_details",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order ID to look up" },
        },
        required: ["orderId"],
      },
    },
  },

  check_delivery_status: {
    type: "function",
    function: {
      description: "Check delivery status and tracking info for an existing order. Use ONLY when the user explicitly asks about delivery or tracking AND has provided an orderId.",
      name: "check_delivery_status",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          trackingNumber: { type: "string" },
        },
        required: ["orderId"],
      },
    },
  },

  modify_order: {
    type: "function",
    function: {
      description: "Modify an order. Use ONLY after the user has provided orderId and clearly stated what modification they want. If information is missing, ask the user first.",
      name: "modify_order",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          modification: { type: "string", enum: ["address", "items", "delivery_speed"] },
          details: { type: "string", description: "Details of the modification" },
        },
        required: ["orderId", "modification", "details"],
      },
    },
  },

  cancel_order: {
    type: "function",
    function: {
      description: "Cancel an order. Use ONLY after the user confirms cancellation intent AND provides orderId. Never cancel without explicit confirmation.",
      name: "cancel_order",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          reason: { type: "string" },
        },
        required: ["orderId"],
      },
    },
  },
};

export async function executeToolOrder(toolName: string, toolInput: any): Promise<any> {
  if (toolName === "fetch_order_details") {
    const { orderId } = toolInput;
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) {
      return { error: "Order not found", orderId };
    }
    return order;
  }

  if (toolName === "check_delivery_status") {
    const { orderId, trackingNumber } = toolInput;
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) {
      return { error: "Order not found" };
    }
    return {
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber || trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      lastUpdate: new Date().toISOString(),
    };
  }

  if (toolName === "modify_order") {
    const { orderId, modification, details } = toolInput;
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) {
      return { error: "Order not found" };
    }
    if (order.status !== "processing") {
      return {
        error: "Can only modify orders in processing status",
        currentStatus: order.status,
      };
    }
    return {
      success: true,
      orderId,
      modification,
      message: `Order ${modification} has been updated: ${details}`,
    };
  }

  if (toolName === "cancel_order") {
    const { orderId, reason } = toolInput;
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) {
      return { error: "Order not found" };
    }
    if (["delivered", "cancelled"].includes(order.status)) {
      return {
        error: "Cannot cancel order in this status",
        currentStatus: order.status,
      };
    }
    return {
      success: true,
      orderId,
      message: "Order cancelled successfully",
      refundAmount: order.total,
      refundETA: "3-5 business days",
    };
  }

  return { error: "Unknown tool" };
}
