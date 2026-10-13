import { createOrder, parseCheckoutInput } from "@/server/checkout";
import { errorResponse, jsonOk, readJsonBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    const input = parseCheckoutInput(await readJsonBody(request));
    return jsonOk(await createOrder(input), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
