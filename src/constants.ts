import ip from "ip"

export const IP = ip.address();
const URL: string = `http://${IP}`;
export const PORT: number = 3000;
export const WEB_SERVER_PORT: number = 5173;
const DOMAIN: string = `${URL}:${PORT}`;


export default DOMAIN;