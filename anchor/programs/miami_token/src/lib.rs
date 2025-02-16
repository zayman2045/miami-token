#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{mint_to, MintTo},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

declare_id!("EmSvUFba9Fuz8T4wpu9WVF2mvdPjLGWnawnND5i5DeNd");

#[program]
pub mod miami_token {
    use super::*;

    // Create a new token mint
    pub fn create_token_mint(ctx: Context<CreateTokenMint>) -> Result<()> {
        let token_mint_state = &mut ctx.accounts.token_mint_state;
        token_mint_state.mint = ctx.accounts.token_mint.key();
        token_mint_state.supply = 0;
        token_mint_state.is_initialized = true;

        msg!("Token mint created successfully!");
        msg!("Token mint address: {}", ctx.accounts.token_mint.key());
        msg!(
            "Token mint state address: {}",
            ctx.accounts.token_mint_state.key()
        );

        Ok(())
    }

    // Airdrop tokens to the user's associated token account
    pub fn airdrop_tokens(ctx: Context<AirdropTokens>, amount: u64) -> Result<()> {
        let token_mint_key = ctx.accounts.token_mint.key();

        // Define the signer seeds for the token mint state PDA
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"mint_state",
            &token_mint_key.to_bytes(),
            &[ctx.bumps.token_mint_state],
        ]];

        // Accounts required to make the mint_to CPI call
        let cpi_accounts = MintTo {
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.token_mint_state.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        mint_to(cpi_ctx, amount)?;

        // Update the token mint state supply
        let token_mint_state = &mut ctx.accounts.token_mint_state;
        token_mint_state.supply += amount;

        msg!(
            "Airdropped {} tokens to user {}",
            amount,
            ctx.accounts.user.key()
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateTokenMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
      init,
      payer = signer,
      mint::authority = token_mint_state,
      mint::decimals = 9,
    )]
    pub token_mint: InterfaceAccount<'info, Mint>,
    #[account(init, payer = signer, space = 8 + TokenMintState::INIT_SPACE, seeds = [b"mint_state", token_mint.key().as_ref()], bump)]
    pub token_mint_state: Account<'info, TokenMintState>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct AirdropTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub token_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds = [b"mint_state", token_mint.key().as_ref()], bump)]
    pub token_mint_state: Account<'info, TokenMintState>,
    #[account(
    init_if_needed,
    payer = user,
    associated_token::mint = token_mint,
    associated_token::authority = user,
    associated_token::token_program = token_program
  )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[account]
#[derive(InitSpace)]
pub struct TokenMintState {
    pub mint: Pubkey,
    pub supply: u64,
    pub is_initialized: bool,
}
