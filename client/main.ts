import App from "./App.svelte";
import { mount } from "svelte";

document.addEventListener(
  "click",
  (e) => {
    const link = (e.target as HTMLElement)?.closest("a");

    if (
      !link ||
      link.host !== location.host ||
      link.hasAttribute("download") ||
      link.target === "_blank"
    ) {
      return;
    }

    e.preventDefault();

    const url = link.getAttribute("href");

    if (url && url !== "#") {
      history.pushState({}, "", import.meta.env.BASE + url);
      dispatchEvent(new PopStateEvent("popstate"));
    }
  },
  true,
);

mount(App, { target: document.getElementById("app")! });
