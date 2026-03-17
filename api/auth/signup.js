import handler from "./[action].js";

export default async function signupHandler(req, res) {
  req.query = { ...(req.query || {}), action: "signup" };
  return handler(req, res);
}
