import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/v1", apiRoutes);

app.get("/", (req, res) => {
    res.send({ status: "ok", service: "Invoix Wrapper API" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
