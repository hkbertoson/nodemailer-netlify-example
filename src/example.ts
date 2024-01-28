import type { Handler } from "@netlify/functions";
import isEmail from "validator/es/lib/isEmail";
import type { Options as SMTPTransportOptions } from "nodemailer/lib/smtp-transport";
import { parseRequestBody, sendEmail, isValid } from "./utils";

type Env = {
  EMAIL: string;
  PASS: string;
  ALLOWED_ORIGINS: string;
};

const env: Env = process.env as any;

if (!env.EMAIL || !env.PASS || !env.ALLOWED_ORIGINS) {
  throw new Error(
    "Environment variables EMAIL, PASS, and ALLOWED_ORIGINS must be set"
  );
}

const emailConfig = {
  service: "gmail",
  auth: {
    user: env.EMAIL,
    pass: env.PASS,
  },
} satisfies SMTPTransportOptions;

const allowedOrigins = env.ALLOWED_ORIGINS.split(",").filter(Boolean);

export const handler: Handler = async (event) => {
  const origin = event.headers.origin;
  const isJson = event.headers["content-type"] === "application/json";
  let headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : "",
  } as const;

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  if (!allowedOrigins.includes(origin)) {
    const message = "Access denied. Origin not allowed.";
    return {
      statusCode: 403,
      headers,
      body: isJson ? JSON.stringify({ error: message }) : "",
    };
  }

  if (event.httpMethod !== "POST") {
    const message = "Method Not Allowed";
    return {
      statusCode: 405,
      headers,
      body: isJson ? JSON.stringify({ error: message }) : "",
    };
  }

  const payload = parseRequestBody(event.body);

  const validation = isValid(payload);
  if (!validation.isValid) {
    const errorMessages = validation.errorMessages;
    return isJson
      ? {
          statusCode: 400,
          headers,
          body: JSON.stringify({ errors: errorMessages }),
        }
      : {
          statusCode: 303,
          headers: { ...headers, Location: `${origin}/#error` },
          body: "",
        };
  }

  if (!isEmail(payload.email)) {
    return isJson
      ? {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid email address" }),
        }
      : {
          statusCode: 303,
          headers: { ...headers, Location: `${origin}/#error` },
          body: "",
        };
  }

  return sendEmail(payload, origin, isJson, headers, emailConfig);
};
