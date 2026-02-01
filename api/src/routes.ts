import { Router } from "express";
import { wrapController, unwrapController, initializeController } from "./controllers";

const router = Router();

// Health check
router.get("/health", (req, res) => {
    res.json({ status: "ok", service: "c-SPL Wrapper API", version: "1.0.0" });
});

router.post("/initialize", initializeController);
router.post("/wrap", wrapController);
router.post("/unwrap", unwrapController);
router.post("/configure-confidential", (req, res) => require("./controllers").configureConfidentialController(req, res));
router.post("/apply-pending-balance", (req, res) => require("./controllers").applyPendingBalanceController(req, res));

export default router;
