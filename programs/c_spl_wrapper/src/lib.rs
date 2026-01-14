use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::invoke,
    program::invoke_signed,
    system_instruction,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, Transfer},
    token_interface::{Mint, TokenAccount},
    token_2022::Token2022,
};
use spl_token_2022::{
    extension::{
        confidential_transfer,
        ExtensionType,
    },
    state::Mint as MintState,
};

pub mod state;
pub mod errors;
pub mod events;

use state::*;
use errors::*;
use events::*;

declare_id!("F7e5FyeG8StgnEDWTgBZSYyacfQuzgtHCxu1qg9ucseR");

#[program]
pub mod c_spl_wrapper {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>, 
        wrap_fee_bps: u16, 
        unwrap_fee_bps: u16,
        auditor: Option<Pubkey>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.wrapper_config;
        let stats = &mut ctx.accounts.wrapper_stats;

        // 1. Validate fees
        require!(wrap_fee_bps <= 1000, WrapperError::FeeTooHigh);
        require!(unwrap_fee_bps <= 1000, WrapperError::FeeTooHigh);

        // 2. Initialize Config PDA
        config.authority = ctx.accounts.user.key();
        config.original_mint = ctx.accounts.original_mint.key();
        config.wrapped_mint = ctx.accounts.wrapped_mint.key();
        config.vault = ctx.accounts.vault.key();
        config.wrap_fee_bps = wrap_fee_bps;
        config.unwrap_fee_bps = unwrap_fee_bps;
        config.is_paused = false;
        config.bump = ctx.bumps.wrapper_config;
        config.auditor = auditor;

        // 3. Initialize Stats PDA
        stats.total_wrapped = 0;
        stats.total_unwrapped = 0;
        stats.total_deposited = 0;
        stats.total_fees_collected = 0;
        stats.bump = ctx.bumps.wrapper_stats;

        // 3. Manually create and initialize Wrapped Mint
        
        let space = ExtensionType::try_calculate_account_len::<MintState>(&[
            ExtensionType::ConfidentialTransferMint,
        ])?;

        let lamports = (Rent::get()?).minimum_balance(space);
        let original_mint_key = ctx.accounts.original_mint.key();
        let mint_seeds = &[
            b"mint",
            original_mint_key.as_ref(),
            &[ctx.bumps.wrapped_mint],
        ];
        let signer = &[&mint_seeds[..]];

        // A. Create Account
        invoke_signed(
            &system_instruction::create_account(
                ctx.accounts.user.key,
                ctx.accounts.wrapped_mint.key,
                lamports,
                space as u64,
                ctx.accounts.token_2022_program.key,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.wrapped_mint.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer,
        )?;

        // B. Initialize Confidential Transfer Extension
        let config_key = ctx.accounts.wrapper_config.key();
        
        let init_ct_ix = confidential_transfer::instruction::initialize_mint(
            ctx.accounts.token_2022_program.key,
            ctx.accounts.wrapped_mint.key,
            Some(config_key), // CT authority = WrapperConfig PDA
            true, // auto_approve_new_accounts
            None, // auditor requires ElGamal pubkey, not stored yet - future enhancement
        )?;
        
        invoke(
            &init_ct_ix,
            &[
                ctx.accounts.wrapped_mint.to_account_info(),
                ctx.accounts.wrapper_config.to_account_info(),
            ],
        )?;

        // C. Initialize Mint
        // spl-token-2022 v0.9/v3/v8: initialize_mint(prog, mint, authority, freeze_authority, decimals)
        // Expects references for Pubkeys usually? 
        // spl-token-2022 8.0.1 source uses `&Pubkey` for authority args.
        
        let init_mint_ix = spl_token_2022::instruction::initialize_mint(
            ctx.accounts.token_2022_program.key,
            ctx.accounts.wrapped_mint.key,
            &config_key,     
            Some(&config_key), 
            ctx.accounts.original_mint.decimals, 
        )?;

        invoke(
            &init_mint_ix,
            &[
                ctx.accounts.wrapped_mint.to_account_info(),
                ctx.accounts.wrapper_config.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;

        msg!("Initialized Wrapper for Mint: {}", ctx.accounts.original_mint.key());
        Ok(())
    }

    pub fn wrap(ctx: Context<Wrap>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.wrapper_config;
        let stats = &mut ctx.accounts.wrapper_stats;

        // 1. Validation
        require!(amount > 0, WrapperError::ZeroAmount);
        require!(!config.is_paused, WrapperError::WrapperPaused);

        // 2. Calculate Fees
        let fee = amount
            .checked_mul(config.wrap_fee_bps as u64)
            .ok_or(WrapperError::FeeCalculationError)?
            .checked_div(10_000)
            .ok_or(WrapperError::FeeCalculationError)?;

        let net_amount = amount.checked_sub(fee).ok_or(WrapperError::Overflow)?;

        // 3. Transfer Original Token to Vault
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

        // 4. Mint Wrapped Token to User
        // Sign with Config PDA seeds (authority)
        let original_mint_key = ctx.accounts.original_mint.key();
        let seeds = &[
            b"config",
            original_mint_key.as_ref(),
            &[config.bump],
        ];
        let signer = &[&seeds[..]];

        let mint_to_accounts = anchor_spl::token_interface::MintTo {
            mint: ctx.accounts.wrapped_mint.to_account_info(),
            to: ctx.accounts.user_wrapped_account.to_account_info(),
            authority: ctx.accounts.wrapper_config.to_account_info(),
        };
        let cpi_mint_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            mint_to_accounts,
            signer
        );
        anchor_spl::token_interface::mint_to(cpi_mint_ctx, net_amount)?;
        
        // 5. Update Stats
        stats.total_wrapped = stats.total_wrapped.checked_add(net_amount).ok_or(WrapperError::Overflow)?;
        stats.total_deposited = stats.total_deposited.checked_add(amount).ok_or(WrapperError::Overflow)?;
        stats.total_fees_collected = stats.total_fees_collected.checked_add(fee).ok_or(WrapperError::Overflow)?;

        emit!(WrapEvent {
            user: ctx.accounts.user.key(),
            original_mint: ctx.accounts.original_mint.key(),
            wrapped_mint: ctx.accounts.wrapped_mint.key(),
            amount: net_amount,
            fee,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn unwrap(ctx: Context<Unwrap>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.wrapper_config;
        let stats = &mut ctx.accounts.wrapper_stats;

        // 1. Validation
        require!(amount > 0, WrapperError::ZeroAmount);
        require!(!config.is_paused, WrapperError::WrapperPaused);

        // 2. Calculate Fees
        let fee = amount
            .checked_mul(config.unwrap_fee_bps as u64)
            .ok_or(WrapperError::FeeCalculationError)?
            .checked_div(10_000)
            .ok_or(WrapperError::FeeCalculationError)?;

        let net_amount = amount.checked_sub(fee).ok_or(WrapperError::Overflow)?;

        // 2.5 Sanity check: ensure vault has enough tokens
        require!(
            ctx.accounts.vault.amount >= net_amount,
            WrapperError::InsufficientVaultBalance
        );

        // 3. Burn Wrapped Token
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

        // 4. Transfer Original Token from Vault
        let original_mint_key = ctx.accounts.original_mint.key();
        let seeds = &[
            b"config",
            original_mint_key.as_ref(),
            &[config.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_out_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_original_account.to_account_info(),
            authority: ctx.accounts.wrapper_config.to_account_info(), // Config is authority
        };
        let cpi_out_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_out_accounts,
            signer
        );
        anchor_spl::token::transfer(cpi_out_ctx, net_amount)?;

        // 5. Update Stats
        stats.total_unwrapped = stats.total_unwrapped.checked_add(net_amount).ok_or(WrapperError::Overflow)?;
        stats.total_fees_collected = stats.total_fees_collected.checked_add(fee).ok_or(WrapperError::Overflow)?;

        emit!(UnwrapEvent {
            user: ctx.accounts.user.key(),
            original_mint: ctx.accounts.original_mint.key(),
            wrapped_mint: ctx.accounts.wrapped_mint.key(),
            amount: net_amount,
            fee,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn pause(ctx: Context<AdminOnly>) -> Result<()> {
        let config = &mut ctx.accounts.wrapper_config;
        config.is_paused = true;
        emit!(PauseEvent {
            authority: ctx.accounts.authority.key(),
            is_paused: true,
        });
        Ok(())
    }

    pub fn unpause(ctx: Context<AdminOnly>) -> Result<()> {
        let config = &mut ctx.accounts.wrapper_config;
        config.is_paused = false;
        emit!(PauseEvent {
            authority: ctx.accounts.authority.key(),
            is_paused: false,
        });
        Ok(())
    }

    pub fn set_fees(
        ctx: Context<AdminOnly>, 
        wrap_fee_bps: u16, 
        unwrap_fee_bps: u16
    ) -> Result<()> {
        require!(wrap_fee_bps <= 1000, WrapperError::FeeTooHigh);
        require!(unwrap_fee_bps <= 1000, WrapperError::FeeTooHigh);

        let config = &mut ctx.accounts.wrapper_config;
        config.wrap_fee_bps = wrap_fee_bps;
        config.unwrap_fee_bps = unwrap_fee_bps;
        
        emit!(FeesUpdatedEvent {
            authority: ctx.accounts.authority.key(),
            wrap_fee_bps,
            unwrap_fee_bps,
        });
        Ok(())
    }

    pub fn set_authority(ctx: Context<AdminOnly>, new_authority: Pubkey) -> Result<()> {
        require!(new_authority != Pubkey::default(), WrapperError::InvalidAuthority);
        
        let config = &mut ctx.accounts.wrapper_config;
        let old_authority = config.authority;
        config.authority = new_authority;
        
        emit!(AuthorityUpdatedEvent {
            old_authority,
            new_authority,
        });
        Ok(())
    }

    pub fn withdraw_fees(ctx: Context<WithdrawFees>) -> Result<()> {
        let config = &ctx.accounts.wrapper_config;
        let stats = &ctx.accounts.wrapper_stats;
        
        // Calculate backed tokens (circulating wrapped supply)
        let backed_tokens = stats.total_wrapped
            .checked_sub(stats.total_unwrapped)
            .ok_or(WrapperError::Overflow)?;
        
        // Get current vault balance
        let vault_balance = ctx.accounts.vault.amount;
        
        // Withdrawable = vault - backed (the surplus from fees)
        let withdrawable = vault_balance
            .checked_sub(backed_tokens)
            .ok_or(WrapperError::Overflow)?;
        
        require!(withdrawable > 0, WrapperError::ZeroAmount);
        
        // Transfer fees to authority
        let original_mint_key = ctx.accounts.original_mint.key();
        let seeds = &[
            b"config",
            original_mint_key.as_ref(),
            &[config.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.authority_token_account.to_account_info(),
            authority: ctx.accounts.wrapper_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
            signer
        );
        anchor_spl::token::transfer(cpi_ctx, withdrawable)?;

        emit!(FeesWithdrawnEvent {
            authority: ctx.accounts.authority.key(),
            amount: withdrawable,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Freeze a wrapped token account (emergency use)
    pub fn freeze_account(ctx: Context<FreezeAccountCtx>) -> Result<()> {
        let config = &ctx.accounts.wrapper_config;
        let original_mint_key = ctx.accounts.original_mint.key();
        let seeds = &[
            b"config",
            original_mint_key.as_ref(),
            &[config.bump],
        ];
        let signer = &[&seeds[..]];

        let freeze_accounts = anchor_spl::token_interface::FreezeAccount {
            account: ctx.accounts.target_account.to_account_info(),
            mint: ctx.accounts.wrapped_mint.to_account_info(),
            authority: ctx.accounts.wrapper_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            freeze_accounts,
            signer
        );
        anchor_spl::token_interface::freeze_account(cpi_ctx)?;

        emit!(AccountFrozenEvent {
            account: ctx.accounts.target_account.key(),
            frozen: true,
        });

        Ok(())
    }

    /// Thaw a frozen wrapped token account
    pub fn thaw_account(ctx: Context<FreezeAccountCtx>) -> Result<()> {
        let config = &ctx.accounts.wrapper_config;
        let original_mint_key = ctx.accounts.original_mint.key();
        let seeds = &[
            b"config",
            original_mint_key.as_ref(),
            &[config.bump],
        ];
        let signer = &[&seeds[..]];

        let thaw_accounts = anchor_spl::token_interface::ThawAccount {
            account: ctx.accounts.target_account.to_account_info(),
            mint: ctx.accounts.wrapped_mint.to_account_info(),
            authority: ctx.accounts.wrapper_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            thaw_accounts,
            signer
        );
        anchor_spl::token_interface::thaw_account(cpi_ctx)?;

        emit!(AccountFrozenEvent {
            account: ctx.accounts.target_account.key(),
            frozen: false,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub original_mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(
        init,
        payer = user,
        seeds = [b"config", original_mint.key().as_ref()],
        bump,
        space = WrapperConfig::LEN
    )]
    pub wrapper_config: Account<'info, WrapperConfig>,

    #[account(
        init,
        payer = user,
        seeds = [b"stats", original_mint.key().as_ref()],
        bump,
        space = WrapperStats::LEN
    )]
    pub wrapper_stats: Account<'info, WrapperStats>,

    /// CHECK: Manually initialized in handler
    #[account(
        mut,
        seeds = [b"mint", original_mint.key().as_ref()],
        bump,
    )]
    pub wrapped_mint: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        seeds = [b"vault", original_mint.key().as_ref()],
        bump,
        token::mint = original_mint,
        token::authority = wrapper_config,
    )]
    pub vault: Account<'info, anchor_spl::token::TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Wrap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub original_mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(
        seeds = [b"config", original_mint.key().as_ref()],
        bump = wrapper_config.bump,
        has_one = original_mint,
        has_one = wrapped_mint,
        has_one = vault,
    )]
    pub wrapper_config: Account<'info, WrapperConfig>,

    #[account(
        mut,
        seeds = [b"stats", original_mint.key().as_ref()],
        bump = wrapper_stats.bump,
    )]
    pub wrapper_stats: Account<'info, WrapperStats>,

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

    #[account(mut)]
    pub vault: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = wrapped_mint,
        associated_token::authority = user,
        associated_token::token_program = token_2022_program,
    )]
    pub user_wrapped_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct Unwrap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub original_mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(
        seeds = [b"config", original_mint.key().as_ref()],
        bump = wrapper_config.bump,
        has_one = original_mint,
        has_one = wrapped_mint,
        has_one = vault,
    )]
    pub wrapper_config: Account<'info, WrapperConfig>,

    #[account(
        mut,
        seeds = [b"stats", original_mint.key().as_ref()],
        bump = wrapper_stats.bump,
    )]
    pub wrapper_stats: Account<'info, WrapperStats>,

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

    #[account(mut)]
    pub vault: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(
        mut,
        token::mint = wrapped_mint,
        token::authority = user,
    )]
    pub user_wrapped_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(
        mut, 
        has_one = authority @ WrapperError::Unauthorized,
        seeds = [b"config", wrapper_config.original_mint.as_ref()],
        bump = wrapper_config.bump,
    )]
    pub wrapper_config: Account<'info, WrapperConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    pub original_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(
        has_one = authority @ WrapperError::Unauthorized,
        has_one = vault,
        seeds = [b"config", original_mint.key().as_ref()],
        bump = wrapper_config.bump,
    )]
    pub wrapper_config: Account<'info, WrapperConfig>,

    #[account(
        seeds = [b"stats", original_mint.key().as_ref()],
        bump = wrapper_stats.bump,
    )]
    pub wrapper_stats: Account<'info, WrapperStats>,

    #[account(mut)]
    pub vault: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// Authority's token account to receive fees
    #[account(
        mut,
        token::mint = original_mint,
    )]
    pub authority_token_account: Account<'info, anchor_spl::token::TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FreezeAccountCtx<'info> {
    pub original_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(
        has_one = authority @ WrapperError::Unauthorized,
        seeds = [b"config", original_mint.key().as_ref()],
        bump = wrapper_config.bump,
    )]
    pub wrapper_config: Account<'info, WrapperConfig>,

    #[account(
        seeds = [b"mint", original_mint.key().as_ref()],
        bump,
    )]
    pub wrapped_mint: InterfaceAccount<'info, Mint>,

    /// The token account to freeze/thaw
    #[account(
        mut,
        token::mint = wrapped_mint,
    )]
    pub target_account: InterfaceAccount<'info, TokenAccount>,

    pub authority: Signer<'info>,
    pub token_2022_program: Program<'info, Token2022>,
}
