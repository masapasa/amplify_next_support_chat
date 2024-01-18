import { Card, Link } from "@aws-amplify/ui-react";
import { type Schema } from '@/amplify/data/resource'

export function ThreadLink({thread, setSelectedThread}: {thread: Schema['Thread'], setSelectedThread: (thread: Schema['Thread']) => void}) {
    const date = new Date(thread.createdAt);
    const timeStr = date.getHours().toString().padStart(2, '0') + ":" +
                    date.getMinutes().toString().padStart(2, '0') + ":" + 
                    date.getSeconds().toString().padStart(2, '0')
    return <div className="pb-2"><Link onClick={() => setSelectedThread(thread)} color={'ghostwhite'} style={{paddingBottom: '1em'}}><Card variation='elevated' backgroundColor={'slategray'}>
        {timeStr}
    </Card></Link></div>
}