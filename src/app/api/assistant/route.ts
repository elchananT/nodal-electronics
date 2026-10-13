import { answerMessage } from "@/server/assistant";
import { errorResponse, jsonOk, readJsonBody } from "@/server/http";
import { asRecord, Issues, requiredString } from "@/server/validation";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const issues = new Issues();
    const record = asRecord(body, "body", issues);
    const message = requiredString(record?.message, "message", issues, { max: 500 });
    issues.throwIfAny();
    return jsonOk(await answerMessage(message ?? ""));
  } catch (error) {
    return errorResponse(error);
  }
}
