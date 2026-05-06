import { Hono } from "hono";
import cardsRouter from "./cards.routes";

const app = new Hono();

const routes = app.route("/v1/cards", cardsRouter);

export default app;
export type AppType = typeof routes;
