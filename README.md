# DeEdIT Protocal SDK

## Prelude

Open the terminal and cd into the desired working directory (For me it's ~/Development/Solana/SDKs ).

Clone the Repository using the command 'git clone'. You should now have a local copy of the project as something like ~/Development/Solana/SDKs/DeEdIT_SDK/

To conveniently use the program's CLI functionality from any directory without having to account for relative paths or typing out the absolute path to the CLI's directory every time, we will create a shorthand path alias. Open your .bashrc file (located in the Home directory) and add the following line at the bottom of the textfile:

    alias forum-cli='ts-node ~/Development/Solana/SDKs/DeEdIT_SDK/src/cli/forum-cli.ts'

accounting for the fact that your path to the forum-cli.ts file may be slightly different depending on where you put the cloned repository.

The remainder of this demonstration assumes a familiarity with Solana's CLI. You will need to create filesystem wallet keypairs and minted and distributed tokens to various wallet addresses to follow the tutorial completely.

## Configuration

In order to use the program we need to configure the .ts files in ../src/cli/config_devnet/

There are 3 configuration files and we will edit them as needed throughout the demonstration. They are:

   - the network configuration
   - the forum configuration
   - the question configuration
   
The choice for using configuration files was two-fold. For one, since there are multiple public keys / numerical values required for many of the commands, and users can have a multitude of accounts of each type, storage files would be necessary anyways. And secondly, entering multiple options in the process of a command would require a tedious copying/pasting process which configuration files ultimately forego. Nonetheless, the command line interface built here tries to be as flexible as possible, forcing you to use configuration files when it is absolutely in your best interest and otherwise giving you the flexibility to enter options manually.

The network configuration (../config_devnet/networkConfig-devnet.ts) is necessary right away. We will first set up the configuration from the perspective of someone who will initialize and manage a forum (later we will also do it from the perspective of other users). Two inputs are required:

    the clusterApiUrl
    the signerKeypair

Here's what mine looks like:

