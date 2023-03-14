# DeEdIT SDK

### A Decentralized Educational Information and Tooling (hence the name DeEdIT) Protocol codenamed and marketed as "xAndria".

This README is intended to cater to experienced developers with a focus on protocol level program interactions. To simply use the protocol as an end-user, visit ------ where you will be greeted with nice graphical interfaces and buttons which do things. 

## Disclaimer 

March 13 2023:

The project, codenamed xAndria is un-audited open-source software. It was built from the ground up by a single developer over a 30 day period (Feb 14 2023 - March 13 2023) for submission in Solana's Grizzlython hackathon. Any use of this software is done so at your own risk and the developer induces zero liabilty in doing so. (Edit: Indeed, see the Program Improvements / Debugging section at the end of this readme to grasp how much was learned just in the process of this demonstration).

Furthermore, any speculative positions in this demo are purely hypothetical and intended for use as educational tools only. They are not to be construed as having any financial relevance whatsoever, nor insight into the financial markets, nor financial advice.

## Prelude

Open the terminal and cd into the desired working directory (For me it's ~/Development/Solana/SDKs ).

Clone the Repository using the command 'git clone'. You should now have a local copy of the project as something like ~/Development/Solana/SDKs/DeEdIT_SDK/

To conveniently use the program's CLI functionality from any directory without having to account for relative paths or typing out the absolute path to the CLI's directory every time, we will create a shorthand path alias. Open your .bashrc file (located in the Home directory) and add the following line at the bottom of the textfile:

    alias forum-cli='ts-node ~/Development/Solana/SDKs/DeEdIT_SDK/src/cli/forum-cli.ts'

accounting for the fact that your path to the forum-cli.ts file may be slightly different depending on where you put the cloned repository.

The remainder of this demonstration assumes a familiarity with Solana's CLI. You will need to create filesystem wallet keypairs and airdrop yourself some Solana to follow along with the demo.

## Configuration

In order to use the program we need to create some filesystem wallets and then configure the .ts files in ../src/cli/config_devnet/

To make filesystem wallets run the Solana CLI command:

    solana-keygen new --outfile ~/path-to-file/name-of-file.json
    
I've gone ahead and created 6 wallets and airdropped each of them about 5-10 Sol.

- /home/SolCharms/.config/solana/devnet-forum/forum_manager.json
- /home/SolCharms/.config/solana/devnet-forum/user_1.json
- ...
- ...
- ...
- /home/SolCharms/.config/solana/devnet-forum/user_5.json

There are 7 configuration files and we will edit them as needed throughout the demonstration. They are:

   - the network configuration
   - the forum configuration
   - the about me configuration
   - the bigNotes configuration
   - the question configuration
   - the answer configuration
   - the comment configuration
   
The choice for using configuration files was two-fold. For one, since there are multiple public keys / numerical values required for many of the commands, and users can have a multitude of accounts of each type, storage files would be necessary anyways. And secondly, entering multiple options in the process of a command would require a tedious copying/pasting process which configuration files ultimately forego. Nonetheless, the command line interface built here tries to be as flexible as possible, forcing you to use configuration files when it is absolutely in your best interest and otherwise giving you the flexibility to enter options manually.

The network configuration (../config_devnet/networkConfig-devnet.ts) is necessary right away. We will first set up the configuration from the perspective of someone who will initialize and manage a forum (later we will also do it from the perspective of other users). Two inputs are required:

    the clusterApiUrl
    the signerKeypair

Here's what mine looks like:

![Screenshot from 2023-03-13 21-31-11](https://user-images.githubusercontent.com/97003046/224869092-1d86e36f-8f70-4864-8437-141710e0e624.png)

## Initializing a Forum

The forum is where all the business takes place. It is an account that stores all the data needed protocol-wide. To initialize a forum account, one must decide on all the protocol fees and all the ways reputation can be earned. To configure a forum, we need to input all the required parameters into the config file (../config_devnet/forumConfig-devnet.ts). Here's mine:

![Screenshot from 2023-03-13 21-43-54](https://user-images.githubusercontent.com/97003046/224870596-d38aac72-eb85-43e8-a994-1cb2b8f77327.png)

Notice that all quantities of Sol are entered in terms of Lamports (the conversion is 1 Sol = 10^9 Lamports). This holds true for any SPL-Tokens as well. That is, as integer multiples of their respective smallest denomination and their conversion follows 10^n where n is the token's number of decimals.  

Once this file is configured, we will run the command 

    forum-cli init-forum

The output to the terminal, upon successful transaction, should appear as:

![Screenshot from 2023-03-13 21-53-41](https://user-images.githubusercontent.com/97003046/224871935-519e4e92-c59f-4f00-85ef-a04c47e3fe6f.png)

We can view all the forums associated to this manager's pubkey by running

    forum-cli fetch-all-forums

which produces an output as:

![Screenshot from 2023-03-13 21-59-22](https://user-images.githubusercontent.com/97003046/224872762-a02d50c7-4011-4726-bfb6-0ee7aaff8056.png)

where mine correctly states that there are 2 forum accounts (one from prior testing). We see all chosen fee and reputation parameters reflected in the account's data. 

Suppose however, that we wanted to change some of the parameters (say, answer repuatation to 25, comment reputation to 5 and forum big notes bounty minimum to 2.5 Sol). Updating the config file to reflect the changes

![Screenshot from 2023-03-13 22-14-24](https://user-images.githubusercontent.com/97003046/224875189-141fc4e8-199f-4b19-9815-f7fd97af489d.png)

and running the command (with the -f option necessary and being the forum pubkey)

    forum-cli update-forum-params -f 5CL3JJC156CrDGvQfWpCcmdW3v2HJQYs6bYe3FhzAJts

A successful transaction outputs

![Screenshot from 2023-03-13 22-18-35](https://user-images.githubusercontent.com/97003046/224875790-29c74012-5398-435c-bc6b-50f0f437d72f.png)

and running the command

    forum-cli fetch-forum-by-key -k 5CL3JJC156CrDGvQfWpCcmdW3v2HJQYs6bYe3FhzAJts

displays the changes reflected:

![Screenshot from 2023-03-13 22-20-25](https://user-images.githubusercontent.com/97003046/224876071-c4c82635-6705-41b3-9455-815ecc610d31.png)

## Creating a User Profile

To create a user profile, we will change the network config's signer keypair as follows:

![Screenshot from 2023-03-13 22-23-41](https://user-images.githubusercontent.com/97003046/224876580-f7ba3ffc-1d74-499d-857d-809f0bcc8765.png)

Running the command

    forum-cli create-profile -f 5CL3JJC156CrDGvQfWpCcmdW3v2HJQYs6bYe3FhzAJts

the output to the terminal should appear as something like 

![Screenshot from 2023-03-13 22-28-43](https://user-images.githubusercontent.com/97003046/224877290-06b10d97-bc42-4646-9ae4-50f938aa6e08.png)

We can fetch the user profile by running the command

    forum-cli fetch-profile-by-key -k CnvMMVHfenQXNWrdDpHrqVEj7dYz6PvmLwsd9HDMLAyt

which displays the user profile state account to the terminal as something like

![Screenshot from 2023-03-13 22-31-34](https://user-images.githubusercontent.com/97003046/224877706-523177a7-40e1-4ae6-8a33-b055e832edcf.png)

Fetching the forum account, we see that there is now 1 forum profile account present:

![Screenshot from 2023-03-13 22-58-32](https://user-images.githubusercontent.com/97003046/224881631-54a7d434-7998-4f2a-b3cf-922fd33aa61f.png)

The next step after a user's profile has been created is to create an 'about me'. This first requires configuring the file (../config_devnet/aboutMeConfig-devnet.ts) to add the necessary about me text

![Screenshot from 2023-03-13 22-46-05](https://user-images.githubusercontent.com/97003046/224879868-27667c3e-d1d4-45b7-a2c0-8eea7024992e.png)

and then by running the command

    forum-cli create-about-me

obtaining an output similar to

![Screenshot from 2023-03-13 22-57-07](https://user-images.githubusercontent.com/97003046/224881401-11b66491-6ac9-4079-b0a5-e7ec6fc0799a.png)

Fetching the user profile

![Screenshot from 2023-03-13 23-02-23](https://user-images.githubusercontent.com/97003046/224882181-971ceea8-12b3-4007-97ff-91c684ced398.png)

we now see that the user profile has an about me and has earned 100 reputation!

We can also view the about me state account by running the command

    forum-cli fetch-about-me-by-profile -p CnvMMVHfenQXNWrdDpHrqVEj7dYz6PvmLwsd9HDMLAyt

which displays the following output to the terminal

![Screenshot from 2023-03-13 23-06-10](https://user-images.githubusercontent.com/97003046/224882710-4a9c85bb-fae7-49c8-a388-4938f3a7e7f0.png)

To edit the about me, change the content in the config file and execute

    forum-cli edit-about-me

A successful transaction outputs

![Screenshot from 2023-03-13 23-43-03](https://user-images.githubusercontent.com/97003046/224887739-a5a17f67-46d9-453e-9f0c-a52f4f0a5785.png)

and the about me account is updated to reflect the changes

![Screenshot from 2023-03-13 23-44-13](https://user-images.githubusercontent.com/97003046/224887946-fd635fc3-3cdd-4819-9704-4f5a12b5df53.png)

I'll go ahead and create the remaining user profiles.

## Asking a Question

To ask a question on the forum, we must first configure the question config file (../config_devnet/questionConfig-devnet.ts)






























## Program Improvements / Debugging

1. Combine Delete User Profile and Delete About Me into one instruction. Creating them separately was done to incentivize a user's first action on the protocol and to give the user a first taste at gaining some reputation. Deleting them does not have to be done subsequently. 



