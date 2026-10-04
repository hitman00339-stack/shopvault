# 🛡️ ShopVault — Review Deal Platform

A professional Amazon/Flipkart review deal management system where members
buy products, post reviews, and submit proof for cashback reimbursement.

## ✨ Features

### For Members
- 🔐 Secure login & registration
- 🏷️ Browse active deals by platform (Amazon, Flipkart, Myntra, etc.)
- 📦 Submit order details with screenshots (Form 1)
- ⭐ Submit review proof with links & screenshots (Form 2)
- 📊 Track order history, spending & cashback earnings
- 🎫 Raise support tickets for delivery/return/refund issues
- 💳 Manage UPI ID & bank details for refunds

### For Admins
- 📊 Real-time dashboard with stats
- 🏷️ Create, edit, hide, restore deals
- 📝 **Visual Form Builder** — create custom forms with 9 field types
  - Short Answer, Long Answer, Number, Date, File Upload,
    Dropdown, Email, Phone, URL
  - Mark fields as mandatory/optional
  - Reorder fields with ↑↓ buttons
- 📋 Review & approve/reject submissions with one click
- 👥 View all users with per-member spending totals
- 📤 Export data as CSV — Full, Seller-wise, Date-wise
- 🔒 Ban/unban users

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 14 (App Router)             |
| Language   | TypeScript                          |
| Styling    | Tailwind CSS + Custom Components    |
| Database   | PostgreSQL (Neon / Supabase)        |
| ORM        | Prisma                              |
| Auth       | JWT (jose) + bcryptjs               |
| Hosting    | Vercel                              |

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd shopvault
npm install