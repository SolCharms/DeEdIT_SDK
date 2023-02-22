import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Tags } from '../../forum/forum.client'

type QuestionConfig = {
    forum: PublicKey,
    title: string,
    content: string,
    tags: any,
    bountyAmount: BN
}

// export const questionConfig: QuestionConfig =
//     {
//         forum: new PublicKey("5FN8oZPWyaqV79cSTRVVFkQGiq6WBjGgvhePaHw1pfMp"),
//         questionSeed: new PublicKey("EDZYtPw5BEdvPGPC2bm66DdDuzKskMfEUk5XxVHADrR9"),
//         title: "This is the first test question",
//         content: "Gentlemen, I would like to take the time to congratulate you on your efforts thus far. I know the journey has been long and arduous, and there is yet much more work to do. But for now we celebrate our achievements. Here is a toast to the first question posted towards our vision of bringing education tooling to the Solana blockchain.",
//         tags: Tags.Development,
//         bountyAmount: new BN(150_000_000)
//     }


export const questionConfig: QuestionConfig =
    {
        forum: new PublicKey("5FN8oZPWyaqV79cSTRVVFkQGiq6WBjGgvhePaHw1pfMp"),
        title: "This is the second test question",
        content: "Gentlemen, I would like to take the time to congratulate you on your efforts thus far. I know the journey has been long and arduous, and there is yet much more work to do. But for now we celebrate our achievements. Here is a toast to the first question posted towards our vision of bringing education tooling to the Solana blockchain.",
        tags: Tags.Development,
        bountyAmount: new BN(150_000_000)
    }
