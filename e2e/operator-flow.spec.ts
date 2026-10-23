/** Module responsible for validating the operator journey in a real browser. */

import { expect, test } from "@playwright/test";

test("operator inspects a scratch and sees persisted evidence", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Ready for inspection")).toBeVisible();

  await page.getByRole("button", { name: /Scratch ANOMALY/ }).click();
  await page.getByRole("button", { name: "Run visual inspection" }).click();

  await expect(page.getByText("FAIL").first()).toBeVisible();
  await expect(page.getByText("Anomaly score")).toBeVisible();
  await expect(page.getByText("NLK-0102-scratch").last()).toBeVisible();
});

test("reference sample completes as pass", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Reference surface PASS/ }).click();
  await page.getByRole("button", { name: "Run visual inspection" }).click();
  await expect(page.getByText("PASS").first()).toBeVisible();
});
