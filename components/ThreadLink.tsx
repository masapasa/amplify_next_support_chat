import { Badge, Card, Link } from "@aws-amplify/ui-react";
import { type Schema } from '@/amplify/data/resource'
import { Observable, Subscription } from "rxjs";
import { useEffect, useState } from "react";
import { IoMdClock } from "react-icons/io";

type Props = {
    thread: Schema['Thread'],
    isSelected: boolean,
    setSelectedThread: (thread: Schema['Thread'] | undefined) => void,
    getCount: () => number,
    threadMessagesChanged: Observable<any> | undefined
}

export function ThreadLink({thread, isSelected, setSelectedThread, getCount, threadMessagesChanged}: Props) {
    const [count, setCount] = useState<number>(0);
    const [threadAbandoned, setThreadAbandoned] = useState<boolean>(false);

    const evaluateAbandonment = () => {
        const secondsSinceUpdate = (((new Date()).getTime() - (new Date(thread.updatedAt)).getTime()) / 1_000)
        setThreadAbandoned(secondsSinceUpdate > 120);
    }
    useEffect(() => {
        let sub: Subscription | undefined;
        setTimeout(() => {
            sub = threadMessagesChanged?.subscribe(() => {
                setCount(getCount());
            })
            setCount(getCount())}
         , 1000);

         // Evaluate thread abandonment now and every 30 seconds
         evaluateAbandonment()
         const abandonmentInterval = setInterval(() => {
            evaluateAbandonment()
         }, 30_000)
        return () => {
            sub?.unsubscribe();
            clearInterval(abandonmentInterval);
        }
    }, []);

    const date = new Date(thread.createdAt);
    const timeStr = date.getHours().toString().padStart(2, '0') + ":" +
                    date.getMinutes().toString().padStart(2, '0') + ":" + 
                    date.getSeconds().toString().padStart(2, '0');
    return <div className="pb-2 relative top-0 left-0">
        <Link onClick={() => setSelectedThread(thread)} color={'ghostwhite'} style={{paddingBottom: '1em'}}>
            <Card variation='elevated' backgroundColor={isSelected? 'darkgray' : 'slategray'}>
                {timeStr}
                <div className="absolute right-3 top-3 flex flex-row">
                    {threadAbandoned ? 
                        <div className="rounded-full bg-slate-700 text-white"><IoMdClock size="25" /></div> : null}
                    {count > 0 ? (
                <Badge backgroundColor={'darkmagenta'}>
                    <span className="text-white">{count}</span>
                </Badge>) : null}</div>
            </Card>
        </Link>
    </div>
}