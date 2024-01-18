import { Badge, Card, Link } from "@aws-amplify/ui-react";
import { type Schema } from '@/amplify/data/resource'
import { Observable } from "rxjs";
import { useEffect, useState } from "react";

type Props = {
    thread: Schema['Thread'],
    isSelected: boolean,
    setSelectedThread: (thread: Schema['Thread']) => void,
    getCount: () => number,
    threadMessagesChanged: Observable<any> | undefined
}

export function ThreadLink({thread, isSelected, setSelectedThread, getCount, threadMessagesChanged}: Props) {
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        threadMessagesChanged?.subscribe(() => {
            setCount(getCount());
        })
        //setCount(getCount());
        setTimeout(() => setCount(getCount()), 1000);
    }, [])

    const date = new Date(thread.createdAt);
    const timeStr = date.getHours().toString().padStart(2, '0') + ":" +
                    date.getMinutes().toString().padStart(2, '0') + ":" + 
                    date.getSeconds().toString().padStart(2, '0');
    return <div className="pb-2 relative top-0 left-0">
        <Link onClick={() => setSelectedThread(thread)} color={'ghostwhite'} style={{paddingBottom: '1em'}}>
            <Card variation='elevated' backgroundColor={isSelected? 'darkgray' : 'slategray'}>
                {timeStr}
                <div className="absolute right-3 top-3">
                <Badge>
                {count}
                </Badge></div>
            </Card>
        </Link>
    </div>
}