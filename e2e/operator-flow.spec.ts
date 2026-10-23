/** Module responsible for validating the operator journey in a real browser. */

import { expect, test } from "@playwright/test";

test("operator inspects a scratch and sees persisted evidence", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Station ready")).toBeVisible();

  await page.getByRole("button", { name: /Scratch ANOMALY/ }).click();
  await page.getByRole("button", { name: /RUN INSPECTION/ }).click();

  await expect(page.locator(".verdict .decision")).toHaveText("FAIL");
  await expect(page.getByText("Anomaly score")).toBeVisible();
  await expect(page.getByText("NLK-0102-scratch").last()).toBeVisible();
});

test("reference sample completes as pass", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Reference surface PASS/ }).click();
  await page.getByRole("button", { name: /RUN INSPECTION/ }).click();
  await expect(page.locator(".verdict .decision")).toHaveText("PASS");
});
