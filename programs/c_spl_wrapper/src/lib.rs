use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Self, Token, Transfer},
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use spl_token_2022::{
    extension::{
        confidential_transfer::ConfidentialTransferMint,
        ExtensionType,
    },
    state::Mint as MintState,
};

declare_id!("F7e5FyeG8StgnEDWTgBZSYyacfQuzgtHCxu1qg9ucseR");

#[program]
pub mod c_spl_wrapper {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let original_mint = &ctx.accounts.original_mint;
        let wrapped_mint = &ctx.accounts.wrapped_mint;
        
        msg!("Initialized Wrapper for Mint: {}", original_mint.key());
        Ok(())
    }

    pub fn wrap(ctx: Context<Wrap>, amount: u64) -> Result<()> {
        // 1. Transfer Original Token to Vault
        let transfer_accounts = Transfer {
            from: ctx.accounts.user_original_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts
        );
        anchor_spl::token::transfer(cpi_ctx, amount)?;

        // 2. Mint Wrapped Token to User
        let seeds = &[
            b"mint",
            ctx.accounts.original_mint.key().as_ref(),
            &[ctx.bumps.wrapped_mint],
        ];
        let signer = &[&seeds[..]];

        let mint_to_accounts = anchor_spl::token_interface::MintTo {
            mint: ctx.accounts.wrapped_mint.to_account_info(),
            to: ctx.accounts.user_wrapped_account.to_account_info(),
            authority: ctx.accounts.wrapped_mint.to_account_info(),
        };
        let cpi_mint_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            mint_to_accounts,
            signer
        );
        anchor_spl::token_interface::mint_to(cpi_mint_ctx, amount)?;
        
        Ok(())
    }

    pub fn unwrap(ctx: Context<Unwrap>, amount: u64) -> Result<()> {
        // 1. Burn Wrapped Token from User
        let burn_accounts = anchor_spl::token_interface::Burn {
            mint: ctx.accounts.wrapped_mint.to_account_info(),
            from: ctx.accounts.user_wrapped_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_burn_ctx = CpiContext::new(
            ctx.accounts.token_2022_program.to_account_info(),
            burn_accounts
        );
        anchor_spl::token_interface::burn(cpi_burn_ctx, amount)?;

        // 2. Transfer Original Token from Vault to User
        let seeds = &[
            b"mint",
            ctx.accounts.original_mint.key().as_ref(),
            &[ctx.bumps.wrapped_mint],
        ];
        let signer = &[&seeds[..]];

        let transfer_out_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_original_account.to_account_info(),
            authority: ctx.accounts.wrapped_mint.to_account_info(), // Wrapped mint is vault owner
        };
        let cpi_out_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_out_accounts,
            signer
        );
        anchor_spl::token::transfer(cpi_out_ctx, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub original_mint: Account<'info, anchor_spl::token::Mint>,
    
    // We use a PDA for the wrapped mint to ensure 1:1 mapping
    #[account(
        init,
        payer = user,
        seeds = [b"mint", original_mint.key().as_ref()],
        bump,
        mint::decimals = original_mint.decimals,
        mint::authority = wrapped_mint,
        mint::token_program = token_2022_program,
    )]
    pub wrapped_mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_2022_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Wrap<'info> {
    pub user: Signer<'info>,
    pub original_mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(
        mut,
        seeds = [b"mint", original_mint.key().as_ref()],
        bump,
    )]
    pub wrapped_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut, 
        token::mint = original_mint,
        token::authority = user,
    )]
    pub user_original_account: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"vault", original_mint.key().as_ref()],
        bump,
        token::mint = original_mint,
        token::authority = wrapped_mint,
    )]
    pub vault: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(
        mut,
        token::mint = wrapped_mint,
        token::authority = user,
    )]
    pub user_wrapped_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct Unwrap<'info> {
    pub user: Signer<'info>,
    pub original_mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(
        mut,
        seeds = [b"mint", original_mint.key().as_ref()],
        bump,
    )]
    pub wrapped_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut, 
        token::mint = original_mint,
    )]
    pub user_original_account: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", original_mint.key().as_ref()],
        bump,
        token::mint = original_mint,
        token::authority = wrapped_mint,
    )]
    pub vault: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(
        mut,
        token::mint = wrapped_mint,
        token::authority = user,
    )]
    pub user_wrapped_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

