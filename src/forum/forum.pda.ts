import { PublicKey } from '@solana/web3.js';
import { FORUM_PROG_ID } from '../index';

export const findForumAuthorityPDA = async (forum: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [forum.toBytes()],
        FORUM_PROG_ID
    );
};

export const findForumTreasuryPDA = async (forum: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('treasury'), forum.toBytes()],
        FORUM_PROG_ID
    );
};

export const findUserProfilePDA = async (profile_owner: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('user_profile'), profile_owner.toBytes()],
        FORUM_PROG_ID
    );
};

export const findQuestionPDA = async (forum: PublicKey, user_profile: PublicKey, question_seed: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('question'), forum.toBytes(), user_profile.toBytes(), question_seed.toBytes()],
        FORUM_PROG_ID
    );
};
