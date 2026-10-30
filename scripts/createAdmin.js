import bcrypt from "bcrypt";
import mongoose from "mongoose";
import "dotenv/config";

import User from "../model/userModel.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";

async function createAdmin() {
  const firstName = process.env.ADMIN_FIRST_NAME?.trim();
  const lastName = process.env.ADMIN_LAST_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!firstName || !lastName || !email || !password) {
    throw new Error(
      "Set ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env"
    );
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("ADMIN_PASSWORD must not exceed 72 bytes");
  }

  await connectDatabase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error(
      "A user with this email already exists. No changes were made."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    role: "admin",
    status: "active",
  });

  console.log(`Administrator created: ${admin.email}`);
}

try {
  await createAdmin();
} catch (error) {
  console.error("Could not create administrator:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
  await mongoose.disconnect().catch(() => {});
}