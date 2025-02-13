#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod miamitoken {
    use super::*;

  pub fn close(_ctx: Context<CloseMiamitoken>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.miamitoken.count = ctx.accounts.miamitoken.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.miamitoken.count = ctx.accounts.miamitoken.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeMiamitoken>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.miamitoken.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeMiamitoken<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Miamitoken::INIT_SPACE,
  payer = payer
  )]
  pub miamitoken: Account<'info, Miamitoken>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseMiamitoken<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub miamitoken: Account<'info, Miamitoken>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub miamitoken: Account<'info, Miamitoken>,
}

#[account]
#[derive(InitSpace)]
pub struct Miamitoken {
  count: u8,
}
