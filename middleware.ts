import createMiddleware from "next-intl/middleware";
import { locales } from "./src/lib/i18n";

export default createMiddleware({
  locales,
  defaultLocale: "zh",
  localePrefix: "as-needed",
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
