import { GlobalRegistrator } from "@happy-dom/global-registrator";

// A real URL, so history.pushState and location work like in the browser.
GlobalRegistrator.register({ url: "http://localhost/admin/" });
