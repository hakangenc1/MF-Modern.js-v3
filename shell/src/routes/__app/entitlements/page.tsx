// Resource route — all behaviour is in page.data.ts (loader redirects, action
// rewrites the entitlement cookie). This component never renders: the loader
// always returns a redirect Response.
export default function EntitlementsResource() {
  return null;
}
