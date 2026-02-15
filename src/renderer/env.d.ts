import type { ColmenaApi } from "../preload/index";

declare global {
  interface Window {
    colmena: ColmenaApi;
  }
}
