import { Router } from "express";
import { getAppointments, createAppointment } from "../controllers"
import { getTakenDates } from "../controllers";

const appointmentsRouter = Router();

appointmentsRouter.get('/appointments', getAppointments);
appointmentsRouter.get('/appointments/dates', getTakenDates)
appointmentsRouter.post('/appointments/create', createAppointment);

export default appointmentsRouter;