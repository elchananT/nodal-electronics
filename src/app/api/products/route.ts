import type { NextRequest } from "next/server";
import { errorResponse, jsonOk } from "@/server/http";
import { listProducts, parseProductListQuery } from "@/server/products";

export async function GET(request: NextRequest) {
  try {
    const query = parseProductListQuery(request.nextUrl.searchParams);
    return jsonOk(await listProducts(query));
  } catch (error) {
    return errorResponse(error);
  }
}
