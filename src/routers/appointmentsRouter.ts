import { Router } from "express";
import { getAppointments } from "../controllers"
import { getTakenDates } from "../controllers";

const appointmentsRouter = Router();

appointmentsRouter.get('/appointments', getAppointments);
appointmentsRouter.get('/appointments/dates', getTakenDates)

export default appointmentsRouter;