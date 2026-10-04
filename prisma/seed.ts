import { PrismaClient, Role, FormType, FieldType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shopvault.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@shopvault.com',
      phone: '9999999999',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Create Demo Member
  const memberPassword = await bcrypt.hash('member123', 12);
  await prisma.user.upsert({
    where: { email: 'demo@shopvault.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@shopvault.com',
      phone: '8888888888',
      password: memberPassword,
      role: Role.MEMBER,
    },
  });

  // Create Sellers
  const amazon = await prisma.seller.upsert({
    where: { name: 'Amazon' },
    update: {},
    create: {
      name: 'Amazon',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      websiteUrl: 'https://www.amazon.in',
    },
  });

  const flipkart = await prisma.seller.upsert({
    where: { name: 'Flipkart' },
    update: {},
    create: {
      name: 'Flipkart',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Flipkart_logo.svg',
      websiteUrl: 'https://www.flipkart.com',
    },
  });

  // Create Sample Products
  await prisma.product.createMany({
    data: [
      {
        sellerId: amazon.id,
        name: 'boAt Airdopes 141 Bluetooth Truly Wireless Earbuds',
        description: 'Wireless earbuds with 42hrs playback, low latency mode for gaming.',
        imageUrl: 'https://m.media-amazon.com/images/I/51d-bJeCmzL._SL1500_.jpg',
        price: 999,
        externalUrl: 'https://www.amazon.in/dp/B09N3XMH9X',
        searchKeyword: 'boat airdopes 141',
      },
      {
        sellerId: amazon.id,
        name: 'Noise ColorFit Pro 5 Smart Watch',
        description: '1.85 inch AMOLED display, Bluetooth calling, 100+ sports modes.',
        imageUrl: 'https://m.media-amazon.com/images/I/61RfQ-jYxzL._SL1500_.jpg',
        price: 2499,
        externalUrl: 'https://www.amazon.in/dp/B0CJXJXY52',
        searchKeyword: 'noise colorfit pro 5',
      },
      {
        sellerId: flipkart.id,
        name: 'Realme Buds Air 5 Pro',
        description: 'ANC wireless earbuds with LDAC, 38hrs battery.',
        imageUrl: 'https://m.media-amazon.com/images/I/51mDF29bXyL._SL1200_.jpg',
        price: 3299,
        externalUrl: 'https://www.flipkart.com/realme-buds-air-5-pro',
        searchKeyword: 'realme buds air 5 pro',
      },
    ],
    skipDuplicates: true,
  });

  // Create Default Form Template: Order Details (Form 1)
  const orderForm = await prisma.formTemplate.create({
    data: {
      name: 'Order Details Form',
      formType: FormType.ORDER_DETAILS,
      description: 'Submit your order details after purchasing the product.',
      fields: {
        create: [
          { label: 'Order ID', fieldType: FieldType.SHORT_TEXT, placeholder: 'e.g., 403-1234567-8901234', isRequired: true, sortOrder: 1 },
          { label: 'Order Date', fieldType: FieldType.DATE, isRequired: true, sortOrder: 2 },
          { label: 'Order Amount (₹)', fieldType: FieldType.NUMBER, placeholder: 'Amount paid in INR', isRequired: true, sortOrder: 3 },
          { label: 'Payment Method', fieldType: FieldType.DROPDOWN, options: JSON.stringify(['Prepaid - UPI', 'Prepaid - Card', 'Prepaid - Net Banking', 'COD']), isRequired: true, sortOrder: 4 },
          { label: 'Amazon/Flipkart Profile Name', fieldType: FieldType.SHORT_TEXT, placeholder: 'Your profile name on the platform', isRequired: true, sortOrder: 5 },
          { label: 'Order Screenshot', fieldType: FieldType.FILE_UPLOAD, helpText: 'Screenshot showing order ID, product, and amount', isRequired: true, sortOrder: 6 },
          { label: 'Delivery Screenshot', fieldType: FieldType.FILE_UPLOAD, helpText: 'Screenshot after product is delivered (can submit later)', isRequired: false, sortOrder: 7 },
          { label: 'UPI ID for Refund', fieldType: FieldType.SHORT_TEXT, placeholder: 'e.g., yourname@upi', isRequired: true, sortOrder: 8 },
        ],
      },
    },
  });

  // Create Default Form Template: Review Proof (Form 2)
  const reviewForm = await prisma.formTemplate.create({
    data: {
      name: 'Review Proof Form',
      formType: FormType.REVIEW_PROOF,
      description: 'Submit proof of your review after posting on Amazon/Flipkart.',
      fields: {
        create: [
          { label: 'Review Rating Given', fieldType: FieldType.DROPDOWN, options: JSON.stringify(['5 Stars', '4 Stars']), isRequired: true, sortOrder: 1 },
          { label: 'Review Title', fieldType: FieldType.SHORT_TEXT, placeholder: 'Title of your review', isRequired: true, sortOrder: 2 },
          { label: 'Review Text', fieldType: FieldType.LONG_TEXT, placeholder: 'Full review you posted', isRequired: true, sortOrder: 3 },
          { label: 'Review Screenshot', fieldType: FieldType.FILE_UPLOAD, helpText: 'Screenshot showing your review is live with "Verified Purchase" badge', isRequired: true, sortOrder: 4 },
          { label: 'Review Profile Link', fieldType: FieldType.URL, placeholder: 'Link to your Amazon/Flipkart profile', isRequired: false, sortOrder: 5 },
          { label: 'Product Photos Uploaded in Review', fieldType: FieldType.FILE_UPLOAD, helpText: 'Screenshot showing photos you uploaded with review', isRequired: false, sortOrder: 6 },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('Admin login: admin@shopvault.com / admin123');
  console.log('Demo login: demo@shopvault.com / member123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });