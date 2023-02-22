import { BN } from '@coral-xyz/anchor';

type ForumConfig = {
    forumProfileFee: BN,
    forumQuestionFee: BN,
    forumBountyMinimum: BN
}

export const forumConfig: ForumConfig =
    {
        forumProfileFee: new BN(2_000_000_000),
        forumQuestionFee: new BN(100_000),
        forumBountyMinimum: new BN(150_000_000)
    }
