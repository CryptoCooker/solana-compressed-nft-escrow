use anchor_lang::prelude::*;

declare_id!("9PXknQSJw9Roe3xrogPW8pr1ztNFcBiJbFzEz8EyFEN6");

#[derive(Clone)]
pub struct SPLCompression;

impl anchor_lang::Id for SPLCompression {
    fn id() -> Pubkey {
        spl_account_compression::id()
    }
}

pub const VAULT_TAG:&[u8] = b"VAULT_TAG";

#[program]
pub mod cnft_escrow {
    use super::*;

    pub fn deposit_cnft<'info>(
        ctx: Context<'_, '_, '_, 'info, CnftCtx<'info>>,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32,
    ) -> Result<()> {
        let tree_config = ctx.accounts.tree_authority.to_account_info();
        let leaf_owner = ctx.accounts.authority.to_account_info();
        let new_leaf_owner = ctx.accounts.escrow_vault.to_account_info();
        let leaf_delegate = ctx.accounts.leaf_delegate.to_account_info();
        let merkle_tree = ctx.accounts.merkle_tree.to_account_info();
        let log_wrapper = ctx.accounts.log_wrapper.to_account_info();
        let compression_program = ctx.accounts.compression_program.to_account_info();
        let system_program = ctx.accounts.system_program.to_account_info();

        let cnft_transfer_cpi = mpl_bubblegum::instructions::TransferCpi::new(
            &ctx.accounts.bubblegum_program,
            mpl_bubblegum::instructions::TransferCpiAccounts {
                tree_config: &tree_config,
                leaf_owner: (&leaf_owner, true),
                leaf_delegate: (&leaf_delegate, false),
                new_leaf_owner: &new_leaf_owner,
                merkle_tree: &merkle_tree,
                log_wrapper: &log_wrapper,
                compression_program: &compression_program,
                system_program: &system_program,
            },
            mpl_bubblegum::instructions::TransferInstructionArgs {
                root: root,
                data_hash: data_hash,
                creator_hash: creator_hash,
                nonce: nonce,
                index: index,
            },
        );
        
        cnft_transfer_cpi.invoke_with_remaining_accounts(
            ctx.remaining_accounts
            .iter()
            .map(|account| (account, false, false))
            .collect::<Vec<_>>().as_slice()
        )?;

        Ok(())
    }

    pub fn withdraw_cnft<'info>(
        ctx: Context<'_, '_, '_, 'info, CnftCtx<'info>>,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32,
    ) -> Result<()> {
        let signer_seeds = &[VAULT_TAG, &[ctx.bumps.escrow_vault]];
        let signer = &[&signer_seeds[..]];

        let tree_config = ctx.accounts.tree_authority.to_account_info();
        let leaf_owner = ctx.accounts.escrow_vault.to_account_info();
        let new_leaf_owner = ctx.accounts.authority.to_account_info();
        let leaf_delegate = ctx.accounts.leaf_delegate.to_account_info();
        let merkle_tree = ctx.accounts.merkle_tree.to_account_info();
        let log_wrapper = ctx.accounts.log_wrapper.to_account_info();
        let compression_program = ctx.accounts.compression_program.to_account_info();
        let system_program = ctx.accounts.system_program.to_account_info();

        let cnft_transfer_cpi = mpl_bubblegum::instructions::TransferCpi::new(
            &ctx.accounts.bubblegum_program,
            mpl_bubblegum::instructions::TransferCpiAccounts {
                tree_config: &tree_config,
                leaf_owner: (&leaf_owner, true),
                leaf_delegate: (&leaf_delegate, false),
                new_leaf_owner: &new_leaf_owner,
                merkle_tree: &merkle_tree,
                log_wrapper: &log_wrapper,
                compression_program: &compression_program,
                system_program: &system_program,
            },
            mpl_bubblegum::instructions::TransferInstructionArgs {
                root: root,
                data_hash: data_hash,
                creator_hash: creator_hash,
                nonce: nonce,
                index: index,
            },
        );
        
        cnft_transfer_cpi.invoke_signed_with_remaining_accounts(
            signer,
            ctx.remaining_accounts
            .iter()
            .map(|account| (account, false, false))
            .collect::<Vec<_>>().as_slice()
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CnftCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [VAULT_TAG],
        bump,
    )]
    /// CHECK: This account doesnt even exist (it is just the pda to sign)
    pub escrow_vault: UncheckedAccount<'info>,
    #[account(mut)]
    #[account(
        seeds = [merkle_tree.key().as_ref()],
        bump,
        seeds::program = bubblegum_program.key()
    )]
    /// CHECK: This account is modified in the downstream program
    pub tree_authority: UncheckedAccount<'info>,
    /// CHECK: We only check this address
    pub leaf_delegate: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account is neither written to nor read from.
    pub merkle_tree: UncheckedAccount<'info>,
    /// CHECK: This account is neither written to nor read from.
    pub log_wrapper: UncheckedAccount<'info>,
    pub compression_program: Program<'info, SPLCompression>,
    /// CHECK: This account is neither written to nor read from.
    pub bubblegum_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
