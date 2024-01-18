import { type Schema } from '@/amplify/data/resource'
import { Input } from '@aws-amplify/ui-react'
import { useEffect, useState, useRef, MutableRefObject } from 'react'
import { client } from '@/models/clients/publicDataClient';
import { useImmer } from 'use-immer';
import { LiaUserAstronautSolid, LiaUser } from "react-icons/lia";

function MessageBubble({message}: {message: Schema['Message']}) {
    if (message.owner) {
        return <div className="flex items-center flex-row-reverse mb-4">
            <div className="rounded-full bg-slate-500 ml-2 p-1">
              <LiaUserAstronautSolid size={30} color='white'/>
            </div>
            <div className="flex-1 bg-indigo-100 text-gray-800 p-2 rounded-lg mb-2 relative">
            <div>{message.content}</div>

            <div className="absolute right-0 top-1/2 transform translate-x-1/2 rotate-45 w-2 h-2 bg-indigo-100"></div>
            </div>
        </div>
    } else {
        return <div className="flex items-center mb-4">
        <div className="rounded-full bg-slate-500 mr-2 p-1">
              <LiaUser size={30} color='white'/>
        </div>
        <div className="flex-1 bg-indigo-400 text-white p-2 rounded-lg mb-2 relative">
          <div>{message.content}</div>
    
          <div className="absolute left-0 top-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-indigo-400"></div>
        </div>
      </div>
    }
}

export function ThreadChatBox({thread, clearThread}: {thread: Schema['Thread'], clearThread: () => void}) {
    const [currentMessage, setCurrentMessage] = useState<string>("");
    const [messages, updateMessages] = useImmer<Schema['Message'][]>([]);
    const messagesEndRef = useRef(null)
    
    const updateCurrentMessage = (e: React.FormEvent<HTMLInputElement>) => {
        setCurrentMessage(e.currentTarget.value);
    }

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        client.models.Message.create({threadMessagesId: thread.id, content: currentMessage})
        setCurrentMessage("")
    }

    useEffect(() => {
        const sub = client.models.Message.onCreate({filter: {threadMessagesId: {eq: thread.id}}}).subscribe((message) => {
            updateMessages((draft) => {draft.push(message)})
            
            setTimeout(() => {
                // @ts-ignore
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }, 100)
        })

        return () => sub.unsubscribe();
    }, []);


    return <>
        <div className="w-80 h-96 flex flex-col border shadow-md bg-white text-black">
  <div className="flex items-center justify-end border-b p-2">

    <div className="text-right">
      <button className="inline-flex hover:bg-indigo-50 rounded-full p-2" type="button" onClick={clearThread}>
        Close
      </button>
    </div>
  </div>

  <div className="flex-1 px-4 py-4 overflow-y-auto">
    {messages.map((m, i) => <MessageBubble key={m.id} message={m} />)}
    <div ref={messagesEndRef} />
  </div>

  <div className="flex items-center border-t p-2">

    <div className="w-full mx-2">
        <form onSubmit={sendMessage}>
            <Input value={currentMessage} onChange={updateCurrentMessage} />
        </form>
    </div>


    <div>
      <button className="inline-flex hover:bg-indigo-50 rounded-full p-2" type="button" onClick={sendMessage}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>
    </div>

  </div>
</div>
    </>
}