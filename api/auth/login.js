import handler from "./[action].js";

export default async function loginHandler(req, res) {
  req.query = { ...(req.query || {}), action: "login" };
  return handler(req, res);
}
