use anchor_lang::prelude::*;

#[event]
pub struct WrapEvent {
    pub user: Pubkey,
    pub original_mint: Pubkey,
    pub wrapped_mint: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct UnwrapEvent {
    pub user: Pubkey,
    pub original_mint: Pubkey,
    pub wrapped_mint: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct PauseEvent {
    pub authority: Pubkey,
    pub is_paused: bool,
}

#[event]
pub struct FeesUpdatedEvent {
    pub authority: Pubkey,
    pub wrap_fee_bps: u16,
    pub unwrap_fee_bps: u16,
}

#[event]
pub struct AuthorityUpdatedEvent {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}

#[event]
pub struct FeesWithdrawnEvent {
    pub authority: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AccountFrozenEvent {
    pub account: Pubkey,
    pub frozen: bool,
}
