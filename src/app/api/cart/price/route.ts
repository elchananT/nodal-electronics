import { priceCart, parseCartItems } from "@/server/cart";
import { errorResponse, jsonOk, readJsonBody } from "@/server/http";
import { Issues } from "@/server/validation";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const issues = new Issues();
    const items = parseCartItems(body, issues);
    issues.throwIfAny();
    return jsonOk(await priceCart(items));
  } catch (error) {
    return errorResponse(error);
  }
}
