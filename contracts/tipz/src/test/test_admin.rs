//! Tests for admin functions.
//!
//! Test cases covered:
//! - Initialize: sets admin, fee_collector, fee_bps correctly
//! - Initialize twice → AlreadyInitialized
//! - Initialize with fee > 1000 → InvalidFee
//! - Initialize with boundary fee_bps = 1000 succeeds
//! - Initialize with fee_bps = 0 succeeds
//! - Counters are initialized to zero

#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::errors::ContractError;
use crate::storage::DataKey;
use crate::TipzContract;
use crate::TipzContractClient;

/// Helper: create an env + client for the Tipz contract.
fn setup_env() -> (Env, TipzContractClient<'static>) {
    let env = Env::default();
    let contract_id = env.register_contract(None, TipzContract);
    let client = TipzContractClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn test_initialize_sets_state_correctly() {
    let (env, client) = setup_env();
    let admin = Address::generate(&env);
    let fee_collector = Address::generate(&env);
    let fee_bps: u32 = 200; // 2%

    client.initialize(&admin, &fee_collector, &fee_bps);

    // Verify stored values via raw storage access
    let stored_admin: Address = env.as_contract(&client.address, || {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    });
    assert_eq!(stored_admin, admin);

    let stored_collector: Address = env.as_contract(&client.address, || {
        env.storage()
            .instance()
            .get(&DataKey::FeeCollector)
            .unwrap()
    });
    assert_eq!(stored_collector, fee_collector);

    let stored_fee: u32 = env.as_contract(&client.address, || {
        env.storage().instance().get(&DataKey::FeePercent).unwrap()
    });
    assert_eq!(stored_fee, fee_bps);

    let initialized: bool = env.as_contract(&client.address, || {
        env.storage().instance().get(&DataKey::Initialized).unwrap()
    });
    assert!(initialized);
}

#[test]
fn test_initialize_counters_are_zero() {
    let (env, client) = setup_env();
    let admin = Address::generate(&env);
    let fee_collector = Address::generate(&env);

    client.initialize(&admin, &fee_collector, &200_u32);

    let total_creators: u32 = env.as_contract(&client.address, || {
        env.storage()
            .instance()
            .get(&DataKey::TotalCreators)
            .unwrap()
    });
    assert_eq!(total_creators, 0);

    let tip_count: u32 = env.as_contract(&client.address, || {
        env.storage().instance().get(&DataKey::TipCount).unwrap()
    });
    assert_eq!(tip_count, 0);

    let total_volume: i128 = env.as_contract(&client.address, || {
        env.storage()
            .instance()
            .get(&DataKey::TotalTipsVolume)
            .unwrap()
    });
    assert_eq!(total_volume, 0);

    let total_fees: i128 = env.as_contract(&client.address, || {
        env.storage()
            .instance()
            .get(&DataKey::TotalFeesCollected)
            .unwrap()
    });
    assert_eq!(total_fees, 0);
}

#[test]
fn test_initialize_twice_returns_already_initialized() {
    let (env, client) = setup_env();
    let admin = Address::generate(&env);
    let fee_collector = Address::generate(&env);

    client.initialize(&admin, &fee_collector, &200_u32);

    let result = client.try_initialize(&admin, &fee_collector, &200_u32);
    assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));
}

#[test]
fn test_initialize_fee_too_high_returns_invalid_fee() {
    let (env, client) = setup_env();
    let admin = Address::generate(&env);
    let fee_collector = Address::generate(&env);

    let result = client.try_initialize(&admin, &fee_collector, &1001_u32);
    assert_eq!(result, Err(Ok(ContractError::InvalidFee)));
}

#[test]
fn test_initialize_max_fee_succeeds() {
    let (env, client) = setup_env();
    let admin = Address::generate(&env);
    let fee_collector = Address::generate(&env);

    // 1000 bps = 10%, which is the maximum allowed
    client.initialize(&admin, &fee_collector, &1000_u32);

    let stored_fee: u32 = env.as_contract(&client.address, || {
        env.storage().instance().get(&DataKey::FeePercent).unwrap()
    });
    assert_eq!(stored_fee, 1000);
}

#[test]
fn test_initialize_zero_fee_succeeds() {
    let (env, client) = setup_env();
    let admin = Address::generate(&env);
    let fee_collector = Address::generate(&env);

    client.initialize(&admin, &fee_collector, &0_u32);

    let stored_fee: u32 = env.as_contract(&client.address, || {
        env.storage().instance().get(&DataKey::FeePercent).unwrap()
    });
    assert_eq!(stored_fee, 0);
}
