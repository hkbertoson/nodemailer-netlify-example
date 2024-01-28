# Example netlify nodemailer function

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/OliverSpeir/nodemailer-netlify-example)

Two versions here currently: 

1. [example.js](/src/example.js) is simplified with no validation
2. [example.ts](/src/example.ts) has validation and is bundled with rollup for optimization 

## Usage

Set form action to / fetch `https://yourdomain.netlify.app/.netlify/functions/example`

Use either a gmail account with app password or an actual SMTP server

This project structure will work if you want to simply clone or use deploy with netlify button. However you don't need to use this project structure, you can set up the netlify function however you want.

The TS version can be used by setting the netlify build command to `pnpm run build` or by building locally and copying [/netlify/functions/example.js](/netlify/functions/example.js) into your own repo.

This function will take about 1 second to send an email (even on a "hot" start)

## Creating App Password

[Create Gmail App Password](https://security.google.com/settings/security/apppasswords)

## SMTP Config

1. Standard SMTP
```js
const emailConfig = {
  host: process.env.HOST,
  port: process.env.PORT,
  auth: {
    user: process.env.USERNAME,
    pass: process.env.PASSWORD,
  }
}
```
2. Gmail App Password
```js
const emailConfig = {
  service: "gmail",
  auth: {
    user: env.EMAIL,
    pass: env.PASSWORD,
  },
}
```
3. [OAuth2](https://nodemailer.com/smtp/oauth2/)

## Manually deploy to netlify

1. Clone this repo
2. "Add new site"
3. "Import an existing project"
4. "Deploy with GitHub / GitLab"
5. No Presets Needed ( set build command if using ts version)
6. Add Environmental Variables
7. Deploy and view logs at Logs in Left Sidear then Functions then Select example
8. Set form action / fetch `https://domain.netlify.app/.netlify/functions/example`


## Resources

1. [Nodemailer Docs](https://nodemailer.com/)
2. [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
