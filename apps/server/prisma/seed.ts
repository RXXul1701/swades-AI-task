import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      email: "john@example.com",
      name: "John Doe",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "jane@example.com",
      name: "Jane Smith",
    },
  });

  // Create sample orders
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      status: "delivered",
      items: ["Wireless Headphones", "USB Cable"],
      total: 129.99,
      tracking: "TRK123456",
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user1.id,
      status: "in_transit",
      items: ["Laptop Stand"],
      total: 49.99,
      tracking: "TRK789012",
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: user2.id,
      status: "processing",
      items: ["Mechanical Keyboard", "Mouse Pad"],
      total: 159.99,
    },
  });

  // Create sample invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      orderId: order1.id,
      userId: user1.id,
      amount: 129.99,
      status: "paid",
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      orderId: order2.id,
      userId: user1.id,
      amount: 49.99,
      status: "pending",
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      orderId: order3.id,
      userId: user2.id,
      amount: 159.99,
      status: "pending",
    },
  });

  // Create sample refund
  const refund1 = await prisma.refund.create({
    data: {
      invoiceId: invoice1.id,
      userId: user1.id,
      amount: 20,
      reason: "Discount applied",
      status: "completed",
    },
  });

  // Create sample conversations
  const conv1 = await prisma.conversation.create({
    data: {
      userId: user1.id,
      title: "Order tracking inquiry",
      messages: {
        create: [
          {
            role: "user",
            content: "Where is my order?",
            agent: "user",
          },
          {
            role: "assistant",
            content:
              "I can help you track your order. Which order would you like to check on?",
            agent: "order",
          },
        ],
      },
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      userId: user2.id,
      title: "Refund request",
      messages: {
        create: [
          {
            role: "user",
            content: "I would like to request a refund",
            agent: "user",
          },
          {
            role: "assistant",
            content:
              "I can help you with that. Can you please provide the order or invoice ID?",
            agent: "billing",
          },
        ],
      },
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log(`📦 Created ${3} orders`);
  console.log(`💳 Created ${3} invoices`);
  console.log(`💰 Created ${1} refund`);
  console.log(`💬 Created ${2} conversations`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
