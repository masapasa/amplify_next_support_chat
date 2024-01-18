import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import amplifyConfig from '@/amplifyconfiguration.json';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { ThemeProvider } from '@aws-amplify/ui-react';


Amplify.configure(amplifyConfig)

export default function App({ Component, pageProps }: AppProps) {
  return <ThemeProvider><Component {...pageProps} /></ThemeProvider>
}
