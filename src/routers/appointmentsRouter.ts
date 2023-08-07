import { Router } from "express";
import { getAppointments } from "../controllers"

const appointmentsRouter = Router();

appointmentsRouter.get('/appointments', getAppointments);

export default appointmentsRouter;