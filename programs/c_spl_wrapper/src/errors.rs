use anchor_lang::prelude::*;

#[error_code]
pub enum WrapperError {
    #[msg("Wrapper is paused")]
    WrapperPaused,
    #[msg("Amount cannot be zero")]
    ZeroAmount,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid mint pair")]
    InvalidMintPair,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Fee too high (max 10%)")]
    FeeTooHigh,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Fee calculation error")]
    FeeCalculationError,
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
}
