import { getOrder } from "@/server/checkout";
import { errorResponse, jsonOk } from "@/server/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return jsonOk(await getOrder(id));
  } catch (error) {
    return errorResponse(error);
  }
}
