/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/c_spl_wrapper.json`.
 */
export type CSplWrapper = {
    "address": "D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY";
    "metadata": {
        "name": "cSplWrapper";
        "version": "0.1.0";
        "spec": "0.1.0";
        "description": "Created with Anchor";
    };
    "instructions": [
        {
            "name": "freezeAccount";
            "docs": [
                "Freeze a wrapped token account (emergency use)"
            ];
            "discriminator": [
                253,
                75,
                82,
                133,
                167,
                238,
                43,
                130
            ];
            "accounts": [
                {
                    "name": "originalMint";
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "wrapperConfig";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrappedMint";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    109,
                                    105,
                                    110,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "targetAccount";
                    "docs": [
                        "The token account to freeze/thaw"
                    ];
                    "writable": true;
                },
                {
                    "name": "authority";
                    "signer": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "token2022Program";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [];
        },
        {
            "name": "initialize";
            "discriminator": [
                175,
                175,
                109,
                31,
                13,
                152,
                155,
                237
            ];
            "accounts": [
                {
                    "name": "user";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "originalMint";
                },
                {
                    "name": "wrapperConfig";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrapperStats";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    115,
                                    116,
                                    97,
                                    116,
                                    115
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrappedMint";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    109,
                                    105,
                                    110,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "vault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "token2022Program";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                },
                {
                    "name": "rent";
                    "address": "SysvarRent111111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "wrapFeeBps";
                    "type": "u16";
                },
                {
                    "name": "unwrapFeeBps";
                    "type": "u16";
                },
                {
                    "name": "auditor";
                    "type": {
                        "option": "pubkey";
                    };
                }
            ];
        },
        {
            "name": "pause";
            "discriminator": [
                211,
                22,
                221,
                251,
                74,
                121,
                193,
                47
            ];
            "accounts": [
                {
                    "name": "wrapperConfig";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "wrapper_config.original_mint";
                                "account": "wrapperConfig";
                            }
                        ];
                    };
                },
                {
                    "name": "authority";
                    "signer": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "setAuthority";
            "discriminator": [
                133,
                250,
                37,
                21,
                110,
                163,
                26,
                121
            ];
            "accounts": [
                {
                    "name": "wrapperConfig";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "wrapper_config.original_mint";
                                "account": "wrapperConfig";
                            }
                        ];
                    };
                },
                {
                    "name": "authority";
                    "signer": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                }
            ];
            "args": [
                {
                    "name": "newAuthority";
                    "type": "pubkey";
                }
            ];
        },
        {
            "name": "setFees";
            "discriminator": [
                137,
                178,
                49,
                58,
                0,
                245,
                242,
                190
            ];
            "accounts": [
                {
                    "name": "wrapperConfig";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "wrapper_config.original_mint";
                                "account": "wrapperConfig";
                            }
                        ];
                    };
                },
                {
                    "name": "authority";
                    "signer": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                }
            ];
            "args": [
                {
                    "name": "wrapFeeBps";
                    "type": "u16";
                },
                {
                    "name": "unwrapFeeBps";
                    "type": "u16";
                }
            ];
        },
        {
            "name": "thawAccount";
            "docs": [
                "Thaw a frozen wrapped token account"
            ];
            "discriminator": [
                115,
                152,
                79,
                213,
                213,
                169,
                184,
                35
            ];
            "accounts": [
                {
                    "name": "originalMint";
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "wrapperConfig";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrappedMint";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    109,
                                    105,
                                    110,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "targetAccount";
                    "docs": [
                        "The token account to freeze/thaw"
                    ];
                    "writable": true;
                },
                {
                    "name": "authority";
                    "signer": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "token2022Program";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [];
        },
        {
            "name": "unpause";
            "discriminator": [
                169,
                144,
                4,
                38,
                10,
                141,
                188,
                255
            ];
            "accounts": [
                {
                    "name": "wrapperConfig";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "wrapper_config.original_mint";
                                "account": "wrapperConfig";
                            }
                        ];
                    };
                },
                {
                    "name": "authority";
                    "signer": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "unwrap";
            "discriminator": [
                126,
                175,
                198,
                14,
                212,
                69,
                50,
                44
            ];
            "accounts": [
                {
                    "name": "user";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "originalMint";
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "wrapperConfig";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrapperStats";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    115,
                                    116,
                                    97,
                                    116,
                                    115
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrappedMint";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    109,
                                    105,
                                    110,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "userOriginalAccount";
                    "writable": true;
                },
                {
                    "name": "vault";
                    "writable": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "userWrappedAccount";
                    "writable": true;
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "token2022Program";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                },
                {
                    "name": "associatedTokenProgram";
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
                }
            ];
            "args": [
                {
                    "name": "amount";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "withdrawFees";
            "discriminator": [
                198,
                212,
                171,
                109,
                144,
                215,
                174,
                89
            ];
            "accounts": [
                {
                    "name": "originalMint";
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "wrapperConfig";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrapperStats";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    115,
                                    116,
                                    97,
                                    116,
                                    115
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "vault";
                    "writable": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "authority";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "authorityTokenAccount";
                    "docs": [
                        "Authority's token account to receive fees"
                    ];
                    "writable": true;
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                }
            ];
            "args": [];
        },
        {
            "name": "wrap";
            "discriminator": [
                178,
                40,
                10,
                189,
                228,
                129,
                186,
                140
            ];
            "accounts": [
                {
                    "name": "user";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "originalMint";
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "wrapperConfig";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrapperStats";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    115,
                                    116,
                                    97,
                                    116,
                                    115
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                },
                {
                    "name": "wrappedMint";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    109,
                                    105,
                                    110,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "originalMint";
                            }
                        ];
                    };
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "userOriginalAccount";
                    "writable": true;
                },
                {
                    "name": "vault";
                    "writable": true;
                    "relations": [
                        "wrapperConfig"
                    ];
                },
                {
                    "name": "userWrappedAccount";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account";
                                "path": "user";
                            },
                            {
                                "kind": "account";
                                "path": "token2022Program";
                            },
                            {
                                "kind": "account";
                                "path": "wrappedMint";
                            }
                        ];
                        "program": {
                            "kind": "const";
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ];
                        };
                    };
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "token2022Program";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                },
                {
                    "name": "associatedTokenProgram";
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
                }
            ];
            "args": [
                {
                    "name": "amount";
                    "type": "u64";
                }
            ];
        }
    ];
    "accounts": [
        {
            "name": "wrapperConfig";
            "discriminator": [
                83,
                239,
                35,
                66,
                9,
                218,
                15,
                226
            ];
        },
        {
            "name": "wrapperStats";
            "discriminator": [
                191,
                29,
                61,
                226,
                30,
                48,
                243,
                211
            ];
        }
    ];
    "events": [
        {
            "name": "accountFrozenEvent";
            "discriminator": [
                83,
                200,
                223,
                28,
                165,
                34,
                41,
                80
            ];
        },
        {
            "name": "authorityUpdatedEvent";
            "discriminator": [
                44,
                40,
                20,
                115,
                145,
                198,
                95,
                200
            ];
        },
        {
            "name": "feesUpdatedEvent";
            "discriminator": [
                132,
                181,
                254,
                193,
                136,
                177,
                41,
                20
            ];
        },
        {
            "name": "feesWithdrawnEvent";
            "discriminator": [
                93,
                177,
                0,
                69,
                15,
                156,
                73,
                194
            ];
        },
        {
            "name": "pauseEvent";
            "discriminator": [
                32,
                51,
                61,
                169,
                156,
                104,
                130,
                43
            ];
        },
        {
            "name": "unwrapEvent";
            "discriminator": [
                73,
                129,
                203,
                215,
                50,
                111,
                179,
                20
            ];
        },
        {
            "name": "wrapEvent";
            "discriminator": [
                148,
                134,
                198,
                142,
                20,
                51,
                173,
                180
            ];
        }
    ];
    "errors": [
        {
            "code": 6000;
            "name": "wrapperPaused";
            "msg": "Wrapper is paused";
        },
        {
            "code": 6001;
            "name": "zeroAmount";
            "msg": "Amount cannot be zero";
        },
        {
            "code": 6002;
            "name": "unauthorized";
            "msg": "Unauthorized access";
        },
        {
            "code": 6003;
            "name": "invalidMintPair";
            "msg": "Invalid mint pair";
        },
        {
            "code": 6004;
            "name": "overflow";
            "msg": "Arithmetic overflow";
        },
        {
            "code": 6005;
            "name": "feeTooHigh";
            "msg": "Fee too high (max 10%)";
        },
        {
            "code": 6006;
            "name": "invalidAuthority";
            "msg": "Invalid authority";
        },
        {
            "code": 6007;
            "name": "feeCalculationError";
            "msg": "Fee calculation error";
        },
        {
            "code": 6008;
            "name": "insufficientVaultBalance";
            "msg": "Insufficient vault balance";
        }
    ];
    "types": [
        {
            "name": "accountFrozenEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "account";
                        "type": "pubkey";
                    },
                    {
                        "name": "frozen";
                        "type": "bool";
                    }
                ];
            };
        },
        {
            "name": "authorityUpdatedEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "oldAuthority";
                        "type": "pubkey";
                    },
                    {
                        "name": "newAuthority";
                        "type": "pubkey";
                    }
                ];
            };
        },
        {
            "name": "feesUpdatedEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "wrapFeeBps";
                        "type": "u16";
                    },
                    {
                        "name": "unwrapFeeBps";
                        "type": "u16";
                    }
                ];
            };
        },
        {
            "name": "feesWithdrawnEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "pauseEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "isPaused";
                        "type": "bool";
                    }
                ];
            };
        },
        {
            "name": "unwrapEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "user";
                        "type": "pubkey";
                    },
                    {
                        "name": "originalMint";
                        "type": "pubkey";
                    },
                    {
                        "name": "wrappedMint";
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "fee";
                        "type": "u64";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "wrapEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "user";
                        "type": "pubkey";
                    },
                    {
                        "name": "originalMint";
                        "type": "pubkey";
                    },
                    {
                        "name": "wrappedMint";
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "fee";
                        "type": "u64";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "wrapperConfig";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "authority";
                        "type": "pubkey";
                    },
                    {
                        "name": "originalMint";
                        "type": "pubkey";
                    },
                    {
                        "name": "wrappedMint";
                        "type": "pubkey";
                    },
                    {
                        "name": "vault";
                        "type": "pubkey";
                    },
                    {
                        "name": "auditor";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "wrapFeeBps";
                        "type": "u16";
                    },
                    {
                        "name": "unwrapFeeBps";
                        "type": "u16";
                    },
                    {
                        "name": "isPaused";
                        "type": "bool";
                    },
                    {
                        "name": "bump";
                        "type": "u8";
                    }
                ];
            };
        },
        {
            "name": "wrapperStats";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "totalWrapped";
                        "type": "u64";
                    },
                    {
                        "name": "totalUnwrapped";
                        "type": "u64";
                    },
                    {
                        "name": "totalDeposited";
                        "type": "u64";
                    },
                    {
                        "name": "totalFeesCollected";
                        "type": "u64";
                    },
                    {
                        "name": "bump";
                        "type": "u8";
                    }
                ];
            };
        }
    ];
};
