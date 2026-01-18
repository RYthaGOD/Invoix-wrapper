import { Router } from "express";
import { wrapController, unwrapController } from "./controllers";

const router = Router();

router.post("/wrap", wrapController);
router.post("/unwrap", unwrapController);

export default router;
