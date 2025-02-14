#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{mint_to, MintTo},
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

declare_id!("F6ca21MY9PkQbtam7VhbRxroHLoVX5Voukmi5ksyhES8");

#[program]
pub mod miami_token {
    use super::*;

    pub fn create_token_mint(ctx: Context<CreateMintAccount>) -> Result<()> {
        msg!(
            "Token mint created successfully! The mint address is: {}",
            ctx.accounts.token_mint.key()
        );
        Ok(())
    }

    pub fn airdrop_tokens(ctx: Context<AirdropTokens>, amount: u64) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[b"mint", &[ctx.bumps.token_mint]]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.token_mint.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        mint_to(cpi_ctx, amount)?;

        msg!(
            "Airdropped {} tokens to {}",
            amount,
            ctx.accounts.user.key()
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMintAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
      init,
      payer = signer,
      mint::authority = token_mint,
      mint::decimals = 9,
      seeds = [b"mint"],
      bump
    )]
    pub token_mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct AirdropTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"mint"], bump)]
    pub token_mint: InterfaceAccount<'info, Mint>,
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
