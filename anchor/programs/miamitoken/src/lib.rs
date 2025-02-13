#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod miami_token {
    use super::*;

    pub fn create_token_mint(ctx: Context<CreateMintAccount>) -> Result<()> {
      msg!("Token mint created successfully! The mint address is: {}", ctx.accounts.token_mint.key());
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
    )]
    pub token_mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

