import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "../../../schemas/public-report.schema.json" with { type: "json" };
import type { PublicReport } from "../types";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile<PublicReport>(schema);
const forbidden =
  /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|shp(?:at|ca|pa|ss)_[A-Za-z0-9]+|gh[pousr]_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+|-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+\S+|\bAIza[0-9A-Za-z_-]{20,}|\bsk-[A-Za-z0-9_-]{16,}|\+\d[\d ()-]{8,}\d)/i;

export function assertPublicReport(
  value: unknown,
): asserts value is PublicReport {
  if (!validate(value))
    throw new Error("The report does not match the public data schema.");
  if (new URL(value.siteUrl).hostname !== "ratniva.com")
    throw new Error("The site hostname is not allowlisted.");
  function inspect(node: unknown) {
    if (typeof node === "string") {
      if (forbidden.test(node))
        throw new Error("The report failed the public data safety check.");
      if (/https?:\/\//i.test(node)) {
        for (const candidate of node.match(/https?:\/\/[^\s<>"']+/gi) || []) {
          const url = new URL(candidate);
          if (
            url.protocol !== "https:" ||
            url.username ||
            url.password ||
            url.search ||
            url.hash
          )
            throw new Error("The report contains an unsafe URL.");
          const site = new URL((value as PublicReport).siteUrl).hostname;
          if (
            url.hostname !== site &&
            url.hostname !== "github.com" &&
            ![
              "www.giva.co",
              "www.palmonas.com",
              "www.zavya.co",
              "www.tiffany.com",
              "www.canada.ca",
            ].includes(url.hostname)
          )
            throw new Error("The report contains an unapproved URL host.");
        }
      }
    } else if (Array.isArray(node)) node.forEach(inspect);
    else if (node && typeof node === "object")
      Object.values(node).forEach(inspect);
  }
  inspect(value);
}

export async function loadReport(signal?: AbortSignal): Promise<PublicReport> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/report.json`, {
    signal,
    cache: "no-cache",
  });
  if (!response.ok) throw new Error("The audit report could not be loaded.");
  const data: unknown = await response.json();
  assertPublicReport(data);
  return data;
}
