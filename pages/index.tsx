import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { type Schema } from '@/amplify/data/resource'
import { useEffect, useState } from 'react'
import { ThreadChatBox } from '@/components/ThreadChatBox'
import { client } from '@/models/clients/publicDataClient';

const inter = Inter({ subsets: ['latin'] })

function Home() {
  const [thread, setThread] = useState<Schema['Thread'] | undefined>(undefined);
  const startSupportChat = async () => {
    setThread((await client.models.Thread.create({archived: false})).data);
  }

  useEffect(() => {
    if (thread) {
      const threadMaintenance = setInterval(() => {
        client.models.Thread.update({id: thread.id});
      }, 60_000)
      return () => clearInterval(threadMaintenance)
    }
  }, [thread])

  return (
    <>
      <Head>
        <title>Chat home</title>
        <meta name="description" content="Next/Amplify Support Chat" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={"absolute bottom-5 right-5"}>
          {thread ? 
            <>
              <ThreadChatBox thread={thread} clearThread={() => setThread(undefined)}/>
            </> :
          <button type="button" onClick={startSupportChat} className="bg-gray-500 hover:bg-gray-600 py-2 px-4 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none">
            Start Support Chat!
          </button>}
        </div>

      </main>
    </>
  )
}

export default Home