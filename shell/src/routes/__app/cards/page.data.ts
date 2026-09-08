import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import {
  addVirtualCard,
  deleteVirtualCard,
  getCards,
  replaceCard,
  setCardFrozen,
  setCardLimit,
  toggleCategoryLock,
  type Card,
  type TransactionCategory,
} from "@/mock";
import { getSession, loginRedirect } from "@/mock/session";

export type CardsData = { cards: Card[] };

export const loader = async ({ request }: LoaderFunctionArgs): Promise<CardsData | Response> => {
  if (!getSession(request)) return loginRedirect(request);
  return { cards: await getCards() };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = getSession(request);
  if (!session) return loginRedirect(request);
  const form = await request.formData();
  const id = String(form.get("id"));
  const intent = String(form.get("intent") ?? "freeze");

  if (
    (intent === "add-virtual" || intent === "del-virtual") &&
    !session.entitlements.includes("cards.virtual")
  ) {
    return { card: null };
  }

  let card: Card | null = null;
  switch (intent) {
    case "freeze":
      card = await setCardFrozen(id, form.get("frozen") === "true", String(form.get("reason") ?? ""));
      break;
    case "limit":
      card = await setCardLimit(id, Math.round(Number(form.get("limit") ?? "0") * 100));
      break;
    case "lock":
      card = await toggleCategoryLock(id, String(form.get("category")) as TransactionCategory);
      break;
    case "add-virtual":
      card = await addVirtualCard(id, String(form.get("label") ?? ""));
      break;
    case "del-virtual":
      card = await deleteVirtualCard(id, String(form.get("vid")));
      break;
    case "replace":
      card = await replaceCard(id);
      break;
  }
  return { card };
};
