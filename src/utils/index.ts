import type { Options as SMTPTransportOptions } from "nodemailer/lib/smtp-transport";
import type { SendMailOptions } from "nodemailer";
import * as nodemailer from "nodemailer";

export type ValidationRule = {
  field: string;
  validator: (value: string | undefined) => boolean;
  errorMessage: string;
};

export const validationRules: ValidationRule[] = [
  {
    field: "email",
    validator: (value) => typeof value === "string" && value.trim().length > 0,
    errorMessage: "is empty",
  },
  {
    field: "subject",
    validator: (value) => typeof value === "string" && value.trim().length > 0,
    errorMessage: "is empty",
  },
  {
    field: "message",
    validator: (value) => typeof value === "string" && value.trim().length > 0,
    errorMessage: "is empty",
  },
  // Add other fields and validations as needed
];

/**
 * Validates the payload against a set of predefined rules.
 * Edit `validationRules` in utils/index.ts to match the fields in your form.
 * @see {@link validationRules} - The array of validation rules in utils/index.ts.
 * @param {Record<string, string | undefined> | undefined} payload - The payload to validate.
 * @returns {{isValid: boolean, errorMessages: Record<string, string>}} - Returns an object with `isValid` indicating if the payload passes all validation rules, and `errorMessages` providing details about each failed validation.
 */
export const isValid = (
  payload: Record<string, string | undefined> | undefined
): { isValid: boolean; errorMessages: Record<string, string> } => {
  const errorMessages: Record<string, string> = {};

  if (!payload) {
    return {
      isValid: false,
      errorMessages: { payload: "is empty" },
    };
  }

  validationRules.forEach(({ field, validator, errorMessage }) => {
    if (!validator(payload[field])) {
      errorMessages[field] = errorMessage;
    }
  });

  const isValid = Object.keys(errorMessages).length === 0;
  return { isValid, errorMessages };
};

/**
 * Trims a string and ensures it is not empty.
 * @param {unknown} value - The value to process.
 * @returns {string | undefined} - Returns the trimmed string or undefined if the input is not a string or is empty.
 */
export const getTrimmedNonEmptyString = (
  value: unknown
): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

/**
 * Parses the request body and returns an object with key-value pairs.
 * @param {string | null} body - The body of the request to parse.
 * @returns {Record<string, string> | undefined} Returns an object with key-value pairs if the body can be parsed, otherwise undefined.
 */
export const parseRequestBody = (
  body: string | null
): Record<string, string> | undefined => {
  if (!body) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(body);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return undefined; // Ensure parsed is an object
    }

    const result = Object.keys(parsed).reduce((acc, key) => {
      const trimmedValue = getTrimmedNonEmptyString(parsed[key]);
      if (trimmedValue !== undefined) {
        acc[key] = trimmedValue;
      }
      return acc;
    }, {} as Record<string, string>);

    return Object.keys(result).length > 0 ? result : undefined;
  } catch {
    const params = new URLSearchParams(body);
    const result = Array.from(params.keys()).reduce((acc, key) => {
      const trimmedValue = getTrimmedNonEmptyString(params.get(key));
      if (trimmedValue !== undefined) {
        acc[key] = trimmedValue;
      }
      return acc;
    }, {} as Record<string, string>);

    return Object.keys(result).length > 0 ? result : undefined;
  }
};

/**
 * Sends an email using the provided payload and configuration.
 * The email configuration is defined in example.ts as `emailConfig`.
 * @param {RequestPayload} payload - The payload containing the email details.
 * @param {string} origin - The origin of the request.
 * @param {boolean} isJson - Indicates if the response should be in JSON format (if the form is submitted with or without js).
 * @param {Record<string, string>} headers - The headers to include in the response.
 * @param {SMTPTransportOptions} emailConfig - Defined at top of example.ts based on env variables for the SMTP transport configuration.
 * @returns {Promise<{statusCode: number, headers: Record<string, string>, body: string}>} - Returns a promise that resolves to the response object.
 */
export const sendEmail = async (
  payload: Record<string, string>,
  origin: string,
  isJson: boolean,
  headers: Record<string, string>,
  emailConfig: SMTPTransportOptions
): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> => {
  const transporter = nodemailer.createTransport(emailConfig);
  const mailOptions = {
    from: emailConfig.auth.user,
    to: payload.email,
    subject: payload.subject,
    html: `<p>${payload.message}</p>`,
  } satisfies SendMailOptions;

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
};
