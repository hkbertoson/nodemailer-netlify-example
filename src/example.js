import nodemailer from "nodemailer";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").filter(Boolean)
  : [];

const emailConfig = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
};

export async function handler(event) {
  const origin = event.headers.origin;
  const isJson = event.headers["content-type"] === "application/json";
  let headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : "",
  };

  // Preflight request handling (CORS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  // Handle requests from unallowed origins
  if (!allowedOrigins.includes(origin)) {
    return {
      statusCode: 403,
      headers,
      body: isJson
        ? JSON.stringify({ error: "Access denied. Origin not allowed." })
        : "",
    };
  }

  // Handle incorrect HTTP methods
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: isJson ? JSON.stringify({ error: "Method Not Allowed" }) : "",
    };
  }

  // Parse the event (post request) body
  let payload;
  try {
    // Attempt to parse the body as JSON
    payload = JSON.parse(event.body);
  } catch (jsonError) {
    try {
      // If JSON parsing fails, attempt to parse as URL-encoded form data
      const params = new URLSearchParams(event.body);
      payload = Object.fromEntries(params);
    } catch (formError) {
      console.error("Error parsing request body:", formError);
      return {
        statusCode: 400,
        headers,
        body: isJson ? JSON.stringify({ error: "Invalid request body" }) : "",
      };
    }
  }

  const email = payload.email;
  const subject = payload.subject;
  const message = payload.message;

  const transporter = nodemailer.createTransport(emailConfig);
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    html: `<p>${message}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return isJson
      ? {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: "Email sent successfully" }),
        }
      : {
          statusCode: 303,
          headers: { ...headers, Location: `${origin}/#success` },
          body: "",
        };
  } catch (error) {
    console.error("Error sending email: ", error);
    return isJson
      ? {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Failed to send email" }),
        }
      : {
          statusCode: 303,
          headers: { ...headers, Location: `${origin}/#error` },
          body: "",
        };
  }
}
