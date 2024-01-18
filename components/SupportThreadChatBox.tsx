import { type Schema } from '@/amplify/data/resource'
import { Input } from '@aws-amplify/ui-react'
import { useEffect, useState, useRef, MutableRefObject } from 'react'
import { client } from '@/models/clients/supportDataClient';

function MessageBubble({message}: {message: Schema['Message']}) {
    if (!message.owner) {
  return <div className="items-center mb-4">
    <div className="flex-1 bg-indigo-100 text-gray-800 p-2 rounded-lg mb-2 relative">
      <div>{message.content}</div>

      <div className="absolute right-0 top-1/2 transform translate-x-1/2 rotate-45 w-2 h-2 bg-indigo-100"></div>
    </div>
  </div>
    } else {
        return <div className="items-center mb-4">
        <div className="flex-1 bg-indigo-400 text-white p-2 rounded-lg mb-2 relative">
          <div>{message.content}</div>
    
          <div className="absolute left-0 top-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-indigo-400"></div>
        </div>
      </div>
    }

}

export function SupportThreadChatBox({thread, messages}: {thread: Schema['Thread'], messages: Schema['Message'][]}) {
    const [currentMessage, setCurrentMessage] = useState<string>("");

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
        setTimeout(() => {
            // @ts-ignore
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }, []);


    return <>
        <div className="flex flex-col h-full border shadow-md bg-white text-black">

            <div className="flex-1 px-4 py-4 overflow-y-auto">
                    <div>
                        {messages.map((m, i) => <MessageBubble key={m.id} message={m} />)}
                        <div ref={messagesEndRef} />
                    </div>
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