import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, BN, Idl, Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as SPLToken from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AccountUtils, isKp, stringifyPKsAndBNs } from '../prog-common';
import { Forum } from '../types/forum';
import {
    findForumAuthorityPDA,
    findForumTreasuryPDA,
    findUserProfilePDA,
    findQuestionPDA,
} from './forum.pda';

// Enum: Tags
export const Tags = {
    DAOsAndGovernance: { daosAndGovernance: {}},
    DataAndAnalytics: { dataAndAnalytics: {}},
    DeFi: { defi: {}},
    Development: { development: {}},
    Gaming: { gaming: {}},
    Mobile: { mobile: {}},
    NFTs: { nfts: {}},
    Payments: { payments: {}},
    Research: { research:{}},
    ToolsAndInfrastructure: { toolsAndInfrastructure: {}},
    Trading: { trading:{}}
}

// export type Tags =
//     {DAOsAndGovernance: {}} |
//     {DataAndAnalytics: {}} |
//     {DeFi: {}} |
//     {Development: {}} |
//     {Gaming: {}} |
//     {Mobile: {}} |
//     {NFTs: {}} |
//     {Payments: {}} |
//     {Research: {} } |
//     {ToolsAndInfrastructure: {}} |
//     {Trading: {}}

export class ForumClient extends AccountUtils {
    wallet: anchor.Wallet;
    provider!: anchor.Provider;
    forumProgram!: anchor.Program<Forum>;

    constructor(
        conn: Connection,
        wallet: anchor.Wallet,
        idl?: Idl,
        programId?: PublicKey
    ) {
        super(conn);
        this.wallet = wallet;
        this.setProvider();
        this.setForumProgram(idl, programId);
    }

    setProvider() {
        this.provider = new AnchorProvider(
            this.conn,
            this.wallet,
            AnchorProvider.defaultOptions()
        );
        anchor.setProvider(this.provider);
    }

    setForumProgram(idl?: Idl, programId?: PublicKey) {
        //instantiating program depends on the environment
        if (idl && programId) {
            //means running in prod
            this.forumProgram = new anchor.Program<Forum>(
                idl as any,
                programId,
                this.provider
            );
        } else {
            //means running inside test suite
            this.forumProgram = anchor.workspace.BountyPool as Program<Forum>;
        }
    }

    // -------------------------------------------------------- fetch deserialized accounts

    async fetchForumAccount(forum: PublicKey) {
        return this.forumProgram.account.forum.fetch(forum);
    }

    async fetchUserProfileAccount(userProfile: PublicKey) {
        return this.forumProgram.account.userProfile.fetch(userProfile);
    }

    async fetchQuestionAccount(question: PublicKey) {
        return this.forumProgram.account.question.fetch(question);
    }

    async fetchTreasuryBalance(forum: PublicKey) {
        const [treasury] = await findForumTreasuryPDA(forum);
        return this.getBalance(treasury);
    }

    // -------------------------------------------------------- get all PDAs by type

    async fetchAllForumPDAs(forumManager?: PublicKey) {
        const filter = forumManager
            ? [
                {
                    memcmp: {
                        offset: 10, //need to prepend 8 bytes for anchor's disc and 2 for version: u16
                        bytes: forumManager.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.forumProgram.account.forum.all(filter);
        console.log('Found a total of', pdas.length, 'forum PDAs');
        return pdas;
    }

    async fetchAllUserProfilePDAs(profileOwner?: PublicKey) {
        const filter = profileOwner
            ? [
                {
                    memcmp: {
                        offset: 8, //need to prepend 8 bytes for anchor's disc and 2 for version: u16
                        bytes: profileOwner.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.forumProgram.account.userProfile.all(filter);
        console.log('Found a total of', pdas.length, 'user profile PDAs');
        return pdas;
    }

    async fetchAllQuestionPDAs(userProfile?: PublicKey) {
        const filter = userProfile
            ? [
                {
                    memcmp: {
                        offset: 8, //need to prepend 8 bytes for anchor's disc and 2 for version: u16
                        bytes: userProfile.toBase58(),
                    },
                },
            ]
            : [];
        const pdas = await this.forumProgram.account.question.all(filter);
        console.log('Found a total of', pdas.length, 'question PDAs for user profile with address', userProfile.toBase58());
        return pdas;
    }

    // -------------------------------------------------------- execute ixs

    async initForum(
        forum: Keypair,
        forumManager: PublicKey | Keypair,
        forumProfileFee: BN,
        forumQuestionFee: BN,
        forumBountyMinimum: BN,
    ) {
        // Derive PDAs
        const [forumAuthority, forumAuthBump] = await findForumAuthorityPDA(forum.publicKey);
        const [forumTreasury, forumTreasuryBump] = await findForumTreasuryPDA(forum.publicKey);

        // Create Signers Array
        const signers = [forum];
        if (isKp(forumManager)) signers.push(<Keypair>forumManager);

        console.log('initializing forum account with pubkey: ', forum.publicKey.toBase58());

        // Transaction
        const txSig = await this.forumProgram.methods
            .initForum(
                forumAuthBump,
                forumProfileFee,
                forumQuestionFee,
                forumBountyMinimum,
            )
            .accounts({
                forum: forum.publicKey,
                forumManager: isKp(forumManager)? (<Keypair>forumManager).publicKey : <PublicKey>forumManager,
                forumAuthority: forumAuthority,
                forumTreasury: forumTreasury,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        return {
            forumAuthority,
            forumAuthBump,
            forumTreasury,
            forumTreasuryBump,
            txSig
        }
    }

    async updateForumParams(
        forum: PublicKey,
        forumManager: PublicKey | Keypair,
        newForumProfileFee: BN,
        newForumQuestionFee: BN,
        newForumBountyMinimum: BN,
    ) {
        // Create Signers Array
        const signers = [];
        if (isKp(forumManager)) signers.push(<Keypair>forumManager);

        console.log('updating forum fees for forum account with pubkey: ', forum.toBase58());

        // Transaction
        const txSig = await this.forumProgram.methods
            .updateForumParams(
                newForumProfileFee,
                newForumQuestionFee,
                newForumBountyMinimum,
            )
            .accounts({
                forum: forum,
                forumManager: isKp(forumManager)? (<Keypair>forumManager).publicKey : <PublicKey>forumManager,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        return {
            txSig
        }
    }

    async payoutFromTreasury(
        forum: PublicKey,
        forumManager: PublicKey | Keypair,
        receiver: PublicKey,
        minimumBalanceForRentExemption: BN,
    ) {
        // Derive PDAs
        const [forumTreasury, forumTreasuryBump] = await findForumTreasuryPDA(forum);

        // Create Signers Array
        const signers = [];
        if (isKp(forumManager)) signers.push(<Keypair>forumManager);

        console.log('paying out from treasury for forum account with pubkey: ', forum.toBase58());

        // Transaction
        const txSig = await this.forumProgram.methods
            .payoutFromTreasury(
                forumTreasuryBump,
                minimumBalanceForRentExemption,
            )
            .accounts({
                forum: forum,
                forumManager: isKp(forumManager)? (<Keypair>forumManager).publicKey : <PublicKey>forumManager,
                forumTreasury: forumTreasury,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        return {
            forumTreasury,
            forumTreasuryBump,
            txSig
        }
    }

    async closeForum(
        forum: PublicKey,
        forumManager: PublicKey | Keypair,
        receiver: PublicKey,
    ) {
        // Derive PDAs
        const [forumTreasury, forumTreasuryBump] = await findForumTreasuryPDA(forum);

        // Create Signers Array
        const signers = [];
        if (isKp(forumManager)) signers.push(<Keypair>forumManager);

        console.log('closing forum account with pubkey: ', forum.toBase58());

        // Transaction
        const txSig = await this.forumProgram.methods
            .closeForum(
                forumTreasuryBump,
            )
            .accounts({
                forum: forum,
                forumManager: isKp(forumManager)? (<Keypair>forumManager).publicKey : <PublicKey>forumManager,
                forumTreasury: forumTreasury,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        return {
            forumTreasury,
            forumTreasuryBump,
            txSig
        }
    }

    async createUserProfile(
        forum: PublicKey,
        profileOwner: PublicKey | Keypair
    ) {
        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [forumAuthority, forumAuthBump] = await findForumAuthorityPDA(forum);
        const [forumTreasury, forumTreasuryBump] = await findForumTreasuryPDA(forum);
        const [userProfile, userProfileBump] = await findUserProfilePDA(profileOwnerKey);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('creating user profile account with pubkey: ', userProfile.toBase58());

        // Transaction
        const txSig = await this.forumProgram.methods
            .createUserProfile(
                forumAuthBump,
                forumTreasuryBump,
            )
            .accounts({
                forum: forum,
                forumAuthority: forumAuthority,
                forumTreasury: forumTreasury,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        return {
            forumAuthority,
            forumAuthBump,
            forumTreasury,
            forumTreasuryBump,
            userProfile,
            userProfileBump,
            txSig
        }
    }

    async editUserProfile(
        profileOwner: PublicKey | Keypair,
        nft_token_mint: PublicKey,
    ) {
        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [userProfile, userProfileBump] = await findUserProfilePDA(profileOwnerKey);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('editing user profile account with pubkey: ', userProfile.toBase58());

        // Transaction
        const txSig = await this.forumProgram.methods
            .editUserProfile(
                userProfileBump
            )
            .accounts({
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                nftPfpTokenMint: nft_token_mint,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        return {
            userProfile,
            userProfileBump,
            txSig
        }
    }

    async deleteUserProfile(
        forum: PublicKey,
        profileOwner: PublicKey | Keypair,
        receiver: PublicKey,
    ) {
        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [userProfile, userProfileBump] = await findUserProfilePDA(profileOwnerKey);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('deleting user profile account with pubkey: ', userProfile.toBase58());

        // Transaction
        const txSig = await this.forumProgram.methods
            .deleteUserProfile(
                userProfileBump
            )
            .accounts({
                forum: forum,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                receiver: receiver,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        return {
            userProfile,
            userProfileBump,
            txSig
        }
    }

    async askQuestion(
        forum: PublicKey,
        profileOwner: PublicKey | Keypair,
        title: string,
        content: string,
        tags: any,
        bountyAmount: BN,
    ) {
        const questionSeedKeypair = Keypair.generate();
        const questionSeed: PublicKey = questionSeedKeypair.publicKey;

        const profileOwnerKey = isKp(profileOwner) ? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner;

        // Derive PDAs
        const [forumTreasury, forumTreasuryBump] = await findForumTreasuryPDA(forum);
        const [userProfile, userProfileBump] = await findUserProfilePDA(profileOwnerKey);
        const [question, questionBump] = await findQuestionPDA(forum, userProfile, questionSeed);

        // Create Signers Array
        const signers = [];
        if (isKp(profileOwner)) signers.push(<Keypair>profileOwner);

        console.log('creating question with pubkey: ', question.toBase58());

        // Transaction
        const txSig = await this.forumProgram.methods
            .askQuestion(
                forumTreasuryBump,
                userProfileBump,
                title,
                content,
                tags,
                bountyAmount,
            )
            .accounts({
                forum: forum,
                forumTreasury: forumTreasury,
                profileOwner: isKp(profileOwner)? (<Keypair>profileOwner).publicKey : <PublicKey>profileOwner,
                userProfile: userProfile,
                question: question,
                questionSeed: questionSeed,
                systemProgram: SystemProgram.programId,
            })
            .signers(signers)
            .rpc();

        return {
            forumTreasury,
            forumTreasuryBump,
            userProfile,
            userProfileBump,
            question,
            questionBump,
            questionSeed,
            txSig
        }
    }















}
