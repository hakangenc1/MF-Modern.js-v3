import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getCards, setCardFrozen, type Card } from "@/mock";
import { getSession } from "@/mock/session";

export type CardsData = { cards: Card[] };

export const loader = async ({ request }: LoaderFunctionArgs): Promise<CardsData> => {
  getSession(request);
  return { cards: await getCards() };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const id = String(form.get("id"));
  const frozen = form.get("frozen") === "true";
  const card = await setCardFrozen(id, frozen);
  return { card };
};
