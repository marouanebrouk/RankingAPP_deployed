import { createServer } from "@vercel/node";
import app from "../server.js";

export default createServer(app);
