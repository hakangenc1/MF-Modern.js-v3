import { redirect } from "@modern-js/runtime/router";

// This .output server drops Set-Cookie from a loader's redirect, so we can't
// clear the cookie here. Instead send the user to the persona picker with
// ?switch — choosing a persona there issues a fresh bank_session that overwrites
// the old one, and the persona-scoped entitlement override is ignored once the
// persona changes. (An unused old cookie otherwise lapses on its 8h Max-Age.)
export const loader = () => redirect("/login?switch=1");
export const action = () => redirect("/login?switch=1");
