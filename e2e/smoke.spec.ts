import { expect, test } from "@playwright/test";

test("inline preview renders and explains why VR is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#stage canvas")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-xr", "inline");
  await expect(page.getByRole("button", { name: /VR not available|no WebXR/ })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("3D preview");
  expect(errors).toEqual([]);
});

test("emulated Quest 3 enters and exits an immersive session", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?emulate=quest3");
  await expect(page.locator("html")).toHaveAttribute("data-xr-emulated", "quest3");
  const enter = page.getByRole("button", { name: "Enter VR" });
  await expect(enter).toBeEnabled();
  await enter.click();
  await expect(page.locator("html")).toHaveAttribute("data-xr", "immersive");
  // The emulator covers the page during a session like a headset does, so exit
  // through the keyboard, which also proves the control is keyboard-operable.
  await page.getByRole("button", { name: "Exit VR" }).press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-xr", "inline");
  expect(errors).toEqual([]);
});
