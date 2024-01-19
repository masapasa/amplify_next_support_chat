# Amplify NextJS Support Chat Template

This template builds a basic support chat application. It allows logged in members of the "Support" User Group to field chat interactions with unauthenticated users interacting with a chat box on a webpage.

See [live demo](https://main.d34r3igvub7ye.amplifyapp.com/) to see what you get out-of-the-box.

## Development

### Set up the database

Deploy necessary resources to your AWS account via

```bash
npm run sandbox
```

This will create an `amplifyconfiguration.json` file at the root of your project, which contains all configuration necessary to interact with the deployed resources.

### Testing the Website

#### Install dependencies

```bash
npm install
```

#### Start the development server

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Deploy on Amplify

Deploy this app directly to AWS Amplify with one click

[![amplifybutton](https://oneclick.amplifyapp.com/button.svg)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/stocaaro/amplify-next-support-chat)

## Post deployment
Users will only have access to the support interface after they have been added to the "Support" user group in Cognito, which can be done in the Amplify Gen2 interface in the console, or through the Cognito console.
