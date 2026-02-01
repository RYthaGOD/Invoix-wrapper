use anchor_lang::prelude::*;

#[account]
pub struct WrapperConfig {
    pub authority: Pubkey,          // Admin who can pause/set fees
    pub original_mint: Pubkey,      // The source SPL token mint
    pub wrapped_mint: Pubkey,       // The Token-2022 CT-enabled mint
    pub vault: Pubkey,              // The vault holding original tokens
    pub auditor_elgamal_pubkey: Option<[u8; 32]>, // Auditor's ElGamal key
    pub wrap_fee_bps: u16,          // Fee for wrapping (basis points)
    pub unwrap_fee_bps: u16,        // Fee for unwrapping (basis points)
    pub is_paused: bool,            // Emergency pause state
    pub bump: u8,                   // Bump seed for PDA
}

impl WrapperConfig {
    // 8 discriminator
    // 32 authority
    // 32 original_mint
    // 32 wrapped_mint
    // 32 vault
    // 1 + 32 (Option<Pubkey>)
    // 2 wrap_fee_bps
    // 2 unwrap_fee_bps
    // 1 is_paused
    // 1 bump
    // = 8 + 32 * 4 + 33 + 2 + 2 + 1 + 1 = 175 bytes
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 33 + 2 + 2 + 1 + 1;
}

#[account]
pub struct WrapperStats {
    pub total_wrapped: u64,      // Net tokens minted (after fees)
    pub total_unwrapped: u64,    // Net tokens redeemed (before fees)
    pub total_deposited: u64,    // Gross tokens deposited to vault
    pub total_fees_collected: u64,
    pub bump: u8,
}

impl WrapperStats {
    // 8 discriminator
    // 8 total_wrapped
    // 8 total_unwrapped
    // 8 total_deposited
    // 8 total_fees_collected
    // 1 bump
    // = 8 + 8 + 8 + 8 + 8 + 1 = 41 bytes
    pub const LEN: usize = 8 + 8 + 8 + 8 + 8 + 1;
}
