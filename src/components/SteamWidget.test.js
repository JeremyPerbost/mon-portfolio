import { act, render, screen } from "@testing-library/react";
import SteamWidget from "./SteamWidget";

afterEach(() => { delete global.fetch; });

test("shows the current Steam game", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      isPlaying: true,
      title: "Counter-Strike 2",
      cover: "https://cdn.example/game.jpg",
      url: "https://store.steampowered.com/app/730",
    }),
  });
  await act(async () => { render(<SteamWidget endpoint="https://example.test/steam" />); });
  expect(screen.getByRole("link", { name: /Counter-Strike 2/ })).toHaveAttribute("href", "https://store.steampowered.com/app/730");
});

test("stays hidden when no game is running", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ isPlaying: false }) });
  let view;
  await act(async () => { view = render(<SteamWidget endpoint="https://example.test/steam" />); });
  expect(view.container).toBeEmptyDOMElement();
});
