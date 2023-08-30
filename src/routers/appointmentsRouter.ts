import { Router } from "express";
import { getAppointments, createAppointment, editAppointment } from "../controllers"
import { getTakenDates } from "../controllers";

const appointmentsRouter = Router();

appointmentsRouter.get('/appointments', getAppointments);
appointmentsRouter.get('/appointments/dates', getTakenDates)
appointmentsRouter.post('/appointments/create', createAppointment);
appointmentsRouter.patch('/appointments/edit', editAppointment);

export default appointmentsRouter;