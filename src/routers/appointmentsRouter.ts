import { Router } from "express";
import { getAppointments, getAvailableDates, createAppointment, editAppointment, deleteAppointment, getIssues } from "../controllers"

const appointmentsRouter = Router();

appointmentsRouter.get('/appointments', getAppointments);
appointmentsRouter.get('/appointments/available', getAvailableDates);
appointmentsRouter.post('/appointments/create', createAppointment);
appointmentsRouter.patch('/appointments/edit', editAppointment);
appointmentsRouter.delete('/appointments/delete/:id', deleteAppointment);
appointmentsRouter.get('/appointments/issues', getIssues);

export default appointmentsRouter;