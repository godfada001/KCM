import app from "../app.js";
import { connectDatabase } from "../config/database.js";

export default async function handler(req, res) {
  await connectDatabase();
  return app(req, res);
}
