import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3450, () => {
      console.log(`listening on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("mongodb connection failed: " + err);
  });
