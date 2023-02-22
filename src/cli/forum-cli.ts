import { ForumClient } from '../forum';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
// import * as SPLToken from "@solana/spl-token";
import { default as fs } from 'fs/promises';
import { default as yargs } from 'yargs';
import * as anchor from '@coral-xyz/anchor';
import { IDL as ForumIDL } from '../types/forum';
import { FORUM_PROG_ID } from '../index';
import { stringifyPKsAndBNs } from '../prog-common';
import {
    findForumAuthorityPDA,
    findForumTreasuryPDA,
} from '../forum/forum.pda';

import { networkConfig } from "../cli/config_devnet/networkConfig-devnet";
import { forumConfig } from "../cli/config_devnet/forumConfig-devnet";
import { questionConfig } from "../cli/config_devnet/questionConfig-devnet";

// ----------------------------------------------- Legend ---------------------------------------------------------

// -a answer account address (answer)
// -c comment account address (comment)
// -d destination (token) account address (destination)
// -f forum account address (forum)
// -k pubkey of account being fetched (key)
// -m forum manager account address (manager)
// -o user profile owner address (owner)
// -p user profile account address (profile)
// -q question account address (question)
// -r receiver account address (receiver)
// -s token account address (spl-token)
// -t mint address (minT)
// -u unix timestamp (unix)
// -z dryRun



const parser = yargs(process.argv.slice(2)).options({
    dryRun: {
        alias: 'z',
        type: 'boolean',
        default: false,
        description: 'set Dry Run flag'
    },
})



// --------------------------------------------- forum manager instructions ---------------------------------------------



// Initialize forum account (payer = forum manager)
// Must config forum parameters in forumConfig
    .command('init-forum', 'Initialize a forum account', {
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const forum = Keypair.generate();
                 const forumProfileFee: anchor.BN = forumConfig.forumProfileFee;
                 const forumQuestionFee: anchor.BN = forumConfig.forumQuestionFee;
                 const forumBountyMinimum: anchor.BN = forumConfig.forumBountyMinimum;

                 if (!argv.dryRun) {
                     const forumInstance = await forumClient.initForum(
                         forum,
                         wallet.payer,
                         forumProfileFee,
                         forumQuestionFee,
                         forumBountyMinimum
                     );
                     console.log(stringifyPKsAndBNs(forumInstance));
                 } else {
                     console.log('Initializing forum account with account pubkey',
                                 stringifyPKsAndBNs(forum));
                 }
             })



// Update forum parameters
// Must config forum parameters in forumConfig
    .command('update-forum-params', 'Update forum parameters', {
        forumPubkey: {
            alias: 'f',
            type: 'string',
            demandOption: true,
            description: 'forum account pubkey'
        },
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const forumKey = new PublicKey(argv.forumPubkey);
                 const newForumProfileFee: anchor.BN = forumConfig.forumProfileFee;
                 const newForumQuestionFee: anchor.BN = forumConfig.forumQuestionFee;
                 const newForumBountyMinimum: anchor.BN = forumConfig.forumBountyMinimum;

                 if (!argv.dryRun) {
                     const updateForumParamsInstance = await forumClient.updateForumParams(
                         forumKey,
                         wallet.payer,
                         newForumProfileFee,
                         newForumQuestionFee,
                         newForumBountyMinimum
                     );
                     console.log(stringifyPKsAndBNs(updateForumParamsInstance));
                 } else {
                     console.log('Updating forum parameters of forum account with pubkey', forumKey.toBase58());
                 }
             })



// Payout from treasury
    .command('payout-from-treasury', 'Payout from treasury', {
        forumPubkey: {
            alias: 'f',
            type: 'string',
            demandOption: true,
            description: 'forum account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const rentBytes: number = 16;

                 const forumKey = new PublicKey(argv.forumPubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey? new PublicKey(argv.receiverPubkey) : wallet.publicKey;
                 const minimumBalanceForRentExemption: anchor.BN = new anchor.BN(await rpcConn.getMinimumBalanceForRentExemption(rentBytes));

                 console.log('Minimum balance for rent exemption for a data size of', rentBytes,
                             'bytes is: ', stringifyPKsAndBNs(minimumBalanceForRentExemption));

                 if (!argv.dryRun) {
                     const payoutInstance = await forumClient.payoutFromTreasury(
                         forumKey,
                         wallet.payer,
                         receiverKey,
                         minimumBalanceForRentExemption
                     );
                     console.log(stringifyPKsAndBNs(payoutInstance));
                 } else {
                     console.log('Paying out from treasury of forum account with pubkey', forumKey.toBase58());
                 }
             })



// Close forum
    .command('close-forum', 'Close a forum account', {
        forumPubkey: {
            alias: 'f',
            type: 'string',
            demandOption: true,
            description: 'forum account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const forumKey: PublicKey = new PublicKey(argv.forumPubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey ? new PublicKey(argv.receiverPubkey) : wallet.publicKey;

                 if (!argv.dryRun) {
                     const closeForumInstance = await forumClient.closeForum(
                         forumKey,
                         wallet.payer,
                         receiverKey,
                     );
                     console.log(stringifyPKsAndBNs(closeForumInstance));
                 } else {
                     console.log('Closing forum account with pubkey:', forumKey.toBase58());
                 }
             })



// ---------------------------------------------- user profile instructions ------------------------------------------



// Create user profile account (payer = profile owner)
    .command('create-profile', 'Create a user profile account', {
        forumPubkey: {
            alias: 'f',
            type: 'string',
            demandOption: true,
            description: 'forum account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const forum = new PublicKey(argv.forumPubkey);

                 if (!argv.dryRun) {
                     const profileInstance = await forumClient.createUserProfile(
                         forum,
                         wallet.payer
                     );
                     console.log(stringifyPKsAndBNs(profileInstance));
                 } else {
                     console.log('Initializing user profile account for wallet with pubkey',
                                 stringifyPKsAndBNs(wallet.publicKey));
                 }
             })


// Edit user profile account
    .command('edit-profile', 'Edit a user profile account', {
        tokenMint: {
            alias: 't',
            type: 'string',
            demandOption: true,
            description: 'token mint account address'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const tokenMintKey = new PublicKey(argv.tokenMint);

                 if (!argv.dryRun) {
                     const editInstance = await forumClient.editUserProfile(
                         wallet.payer,
                         tokenMintKey
                     );
                     console.log(stringifyPKsAndBNs(editInstance));
                 } else {
                     console.log('Editing user profile account for wallet with pubkey',
                                 stringifyPKsAndBNs(wallet.publicKey));
                 }
             })



// Delete user profile account
    .command('delete-profile', 'Delete a user profile account', {
        forumPubkey: {
            alias: 'f',
            type: 'string',
            demandOption: true,
            description: 'forum account pubkey'
        },
        receiverPubkey: {
            alias: 'r',
            type: 'string',
            demandOption: false,
            description: 'receiver account pubkey for reclaimed rent lamports'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const forumKey: PublicKey = new PublicKey(argv.forumPubkey);
                 const receiverKey: PublicKey = argv.receiverPubkey ? new PublicKey(argv.receiverPubkey) : wallet.publicKey;

                 if (!argv.dryRun) {
                     const deleteInstance = await forumClient.deleteUserProfile(
                         forumKey,
                         wallet.payer,
                         receiverKey
                     );
                     console.log(stringifyPKsAndBNs(deleteInstance));
                 } else {
                     console.log('Deleting user profile account for wallet with pubkey',
                                 stringifyPKsAndBNs(wallet.publicKey));
                 }
             })



// -------------------------------------------------- user interaction instructions ------------------------------------------



// Ask question
// Must config question parameters in questionConfig
    .command('ask-question', 'Ask question', {
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const forumKey: PublicKey = questionConfig.forum;
                 const title: string = questionConfig.title;
                 const content: string = questionConfig.content;
                 const tags = questionConfig.tags;
                 const bountyAmount: anchor.BN = questionConfig.bountyAmount;

                 if (!argv.dryRun) {
                     const questionInstance = await forumClient.askQuestion(
                         forumKey,
                         wallet.payer,
                         title,
                         content,
                         tags,
                         bountyAmount
                     );
                     console.log(stringifyPKsAndBNs(questionInstance));
                 } else {
                     console.log('Asking question for user profile with wallet pubkey',
                                 stringifyPKsAndBNs(wallet.publicKey));
                 }
             })















// -------------------------------------------------- PDA account fetching instructions ------------------------------------------



// Fetch all forum PDAs for a given manager and display their account info
// Pass in manager pubkey or will default to pubkey of keypair path in networkConfig.ts
    .command('fetch-all-forums', 'Fetch all forum PDA accounts info', {
        managerPubkey: {
            alias: 'm',
            type: 'string',
            demandOption: false,
            description: 'forum manager pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const managerKey: PublicKey = argv.managerPubkey ? new PublicKey(argv.managerPubkey) : wallet.publicKey;

                 if (!argv.dryRun) {
                     console.log('Fetching all forum PDAs for manager with pubkey:', managerKey.toBase58());
                     const forumPDAs = await forumClient.fetchAllForumPDAs(managerKey);

                     // Loop over all PDAs and display account info
                     for (let num = 1; num <= forumPDAs.length; num++) {
                         console.log('Forum account', num, ':');
                         console.dir(stringifyPKsAndBNs(forumPDAs[num - 1]), {depth: null});
                     }

                 } else {
                     console.log('Found a total of n forum PDAs for manager pubkey:', managerKey.toBase58());
                 }
             })



// Fetch forum PDA by Pubkey
// Forum account pubkey required in command
    .command('fetch-forum-by-key', 'Fetch forum PDA account info by pubkey', {
        forumPubkey: {
            alias: 'k',
            type: 'string',
            demandOption: true,
            description: 'forum account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const forumKey: PublicKey = new PublicKey(argv.forumPubkey);

                 if (!argv.dryRun) {

                     const forumPDA = await forumClient.fetchForumAccount(forumKey);

                     console.log('Displaying account info for forum with pubkey: ', forumKey.toBase58());
                     console.dir(stringifyPKsAndBNs(forumPDA), {depth: null});

                 } else {
                     console.log('Found forum PDA for pubkey:', forumKey.toBase58());
                 }
             })



// Fetch all user profile PDAs
    .command('fetch-all-profiles', 'Fetch all user profile PDA accounts info', {
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 if (!argv.dryRun) {

                     console.log('Fetching all profile PDAs');
                     const profilePDAs = await forumClient.fetchAllUserProfilePDAs();

                     // Loop over all PDAs and display account info
                     for (let num = 1; num <= profilePDAs.length; num++) {
                         console.log('User profile account', num, ':');
                         console.dir(stringifyPKsAndBNs(profilePDAs[num - 1]), {depth: null});
                     }

                 } else {
                     console.log('Found n user profile PDA accounts');
                 }
             })



// Fetch user profile PDA by Pubkey
// User profile account pubkey required in command
    .command('fetch-profile-by-key', 'Fetch user profile PDA account info by pubkey', {
        userProfilePubkey: {
            alias: 'k',
            type: 'string',
            demandOption: true,
            description: 'user profile account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const profileKey: PublicKey = new PublicKey(argv.userProfilePubkey);

                 if (!argv.dryRun) {

                     const profilePDA = await forumClient.fetchUserProfileAccount(profileKey);

                     console.log('Displaying account info for user profile with pubkey: ', profileKey.toBase58());
                     console.dir(stringifyPKsAndBNs(profilePDA), {depth: null});

                 } else {
                     console.log('Found user profile PDA for pubkey:', profileKey.toBase58());
                 }
             })



// Fetch user profile PDA by Owner Pubkey
// User profile account owner pubkey required in command
    .command('fetch-profile-by-owner', 'Fetch user profile PDA account info by owner pubkey', {
        userProfileOwnerPubkey: {
            alias: 'o',
            type: 'string',
            demandOption: true,
            description: 'user profile account owner pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const profileOwnerKey: PublicKey = new PublicKey(argv.userProfileOwnerPubkey);

                 if (!argv.dryRun) {

                     const profilePDAs = await forumClient.fetchAllUserProfilePDAs(profileOwnerKey);

                     // Loop over all PDAs and display account info
                     for (let num = 1; num <= profilePDAs.length; num++) {
                         console.log('Displaying account info for user profile with owner pubkey: ', profileOwnerKey.toBase58());
                         console.dir(stringifyPKsAndBNs(profilePDAs[num - 1]), {depth: null});
                     }

                 } else {
                     console.log('Found user profile PDA for owner pubkey:', profileOwnerKey.toBase58());
                 }
             })



// Fetch all question PDAs for a specific user profile account
    .command('fetch-all-questions', 'Fetch all question PDA accounts info', {
        userProfilePubkey: {
            alias: 'p',
            type: 'string',
            demandOption: true,
            description: 'user profile account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const userProfileKey: PublicKey = new PublicKey(argv.userProfilePubkey);

                 if (!argv.dryRun) {

                     console.log('Fetching all question PDAs for user profile with pubkey: ', userProfileKey.toBase58());
                     const questionPDAs = await forumClient.fetchAllQuestionPDAs(userProfileKey);

                     // Loop over all PDAs and display account info
                     for (let num = 1; num <= questionPDAs.length; num++) {
                         console.log('Question account', num, ':');
                         console.dir(stringifyPKsAndBNs(questionPDAs[num - 1]), {depth: null});
                     }

                 } else {
                     console.log('Found n question PDA accounts for user profile with pubkey: ', userProfileKey.toBase58());
                 }
             })



// Fetch question PDA by Pubkey
// Question account pubkey required in command
    .command('fetch-question-by-key', 'Fetch question PDA account info by pubkey', {
        questionPubkey: {
            alias: 'k',
            type: 'string',
            demandOption: true,
            description: 'question account pubkey'
        }
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const questionKey: PublicKey = new PublicKey(argv.questionPubkey);

                 if (!argv.dryRun) {

                     const questionPDA = await forumClient.fetchUserProfileAccount(questionKey);

                     console.log('Displaying account info for question with pubkey: ', questionKey.toBase58());
                     console.dir(stringifyPKsAndBNs(questionPDA), {depth: null});

                 } else {
                     console.log('Found question PDA for pubkey:', questionKey.toBase58());
                 }
             })













// Fetch forum authority PDA
// Forum account pubkey required in command
    .command('fetch-forum-auth', 'Fetch forum authority PDA pubkey', {
        forumPubkey: {
            alias: 'f',
            type: 'string',
            demandOption: true,
            description: 'forum account pubkey'
        }
    },
             async (argv) => {

                 const forumKey: PublicKey = new PublicKey(argv.forumPubkey);

                 if (!argv.dryRun) {

                     const [forumAuthKey, _forumAuthKeyBump] = await findForumAuthorityPDA(forumKey);

                     console.log('Forum authority key is: ', forumAuthKey.toBase58());

                 } else {
                     console.log('Found forum authority key for forum account with pubkey: ', forumKey.toBase58());
                 }
             })



// Fetch treasury balance
// Forum account pubkey required in command
    .command('fetch-treasury-balance', 'Fetch forum account treasury balance', {
        forumPubkey: {
            alias: 'f',
            type: 'string',
            demandOption: true,
            description: 'forum account pubkey'
        },
    },
             async (argv) => {
                 const rpcConn = new Connection(networkConfig.clusterApiUrl, { confirmTransactionInitialTimeout: 91000 });
                 const wallet: anchor.Wallet = new anchor.Wallet(await loadWallet(networkConfig.signerKeypair));
                 const forumClient: ForumClient = new ForumClient(
                     rpcConn,
                     wallet,
                     ForumIDL,
                     FORUM_PROG_ID,
                 );

                 const forumKey: PublicKey = new PublicKey(argv.forumPubkey);

                 if (!argv.dryRun) {

                     const treasuryBalance = await forumClient.fetchTreasuryBalance(forumKey)

                     console.log('Displaying treasury balance for forum account with pubkey: ', forumKey.toBase58());
                     console.log(stringifyPKsAndBNs(treasuryBalance));

                 } else {
                     console.log('Found treasury balance for forum account with pubkey:', forumKey.toBase58());
                 }
             })






































// ------------------------------------------------ misc ----------------------------------------------------------
    .usage('Usage: $0 [-d] -c [config_file] <command> <options>')
    .help();



async function loadWallet(fileName: string): Promise<Keypair> {
    let walletBytes = JSON.parse((await fs.readFile(fileName)).toString());
    let privKeyBytes = walletBytes.slice(0,32);
    let keypair = Keypair.fromSeed(Uint8Array.from(privKeyBytes));
    return keypair
}



// Let's go!
(async() => {
    await parser.argv;
    process.exit();
})();
