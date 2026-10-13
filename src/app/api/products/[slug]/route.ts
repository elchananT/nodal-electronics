import { errorResponse, jsonOk } from "@/server/http";
import { getProductDetail } from "@/server/products";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    return jsonOk(await getProductDetail(slug));
  } catch (error) {
    return errorResponse(error);
  }
}
