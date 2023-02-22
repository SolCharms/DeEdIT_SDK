type NetworkConfig = {
    clusterApiUrl: string,
    signerKeypair: string
}

// Forum Manager Account
export const networkConfig: NetworkConfig =
    {
        clusterApiUrl: "https://api.devnet.solana.com",
        signerKeypair: "/home/SolCharms/.config/solana/devnet-forum/forum_manager.json"
    }

// // User 1 Account
// export const networkConfig: NetworkConfig =
//     {
//         clusterApiUrl: "https://api.devnet.solana.com",
//         signerKeypair: "/home/SolCharms/.config/solana/devnet-forum/user_1.json"
//     }
