//! Tests for contract event emissions (issue #6).
//!
//! These tests verify that event emission helper functions work correctly.
//! The helpers are used throughout the contract to emit structured events
//! for off-chain indexers and frontend tracking.

#![cfg(test)]

use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env, String};

use crate::events;

// ── helpers ──────────────────────────────────────────────────────────────────

fn setup() -> Env {
    Env::default()
}

// ── emit_profile_registered tests ────────────────────────────────────────────

#[test]
fn emit_profile_registered_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);
    let username = String::from_str(&env, "alice");

    // Should not panic
    events::emit_profile_registered(&env, &address, &username);
}

#[test]
fn emit_profile_registered_with_different_usernames_does_not_panic() {
    let env = setup();
    let address1 = Address::generate(&env);
    let address2 = Address::generate(&env);

    events::emit_profile_registered(&env, &address1, &String::from_str(&env, "alice"));
    events::emit_profile_registered(&env, &address2, &String::from_str(&env, "bob"));
}

// ── emit_profile_updated tests ───────────────────────────────────────────────

#[test]
fn emit_profile_updated_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);

    events::emit_profile_updated(&env, &address);
}

#[test]
fn emit_profile_updated_multiple_times_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);

    events::emit_profile_updated(&env, &address);
    events::emit_profile_updated(&env, &address);
    events::emit_profile_updated(&env, &address);
}

// ── emit_tip_sent tests ──────────────────────────────────────────────────────

#[test]
fn emit_tip_sent_does_not_panic() {
    let env = setup();
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let amount = 1_000_000i128;

    events::emit_tip_sent(&env, &from, &to, amount);
}

#[test]
fn emit_tip_sent_with_zero_amount_does_not_panic() {
    let env = setup();
    let from = Address::generate(&env);
    let to = Address::generate(&env);

    events::emit_tip_sent(&env, &from, &to, 0);
}

#[test]
fn emit_tip_sent_with_large_amount_does_not_panic() {
    let env = setup();
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let large_amount = i128::MAX / 2;

    events::emit_tip_sent(&env, &from, &to, large_amount);
}

// ── emit_tips_withdrawn tests ────────────────────────────────────────────────

#[test]
fn emit_tips_withdrawn_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);
    let amount = 10_000_000i128;
    let fee = 200_000i128;

    events::emit_tips_withdrawn(&env, &address, amount, fee);
}

#[test]
fn emit_tips_withdrawn_with_zero_fee_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);
    let amount = 5_000_000i128;

    events::emit_tips_withdrawn(&env, &address, amount, 0);
}

#[test]
fn emit_tips_withdrawn_multiple_withdrawals_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);

    events::emit_tips_withdrawn(&env, &address, 1_000_000, 20_000);
    events::emit_tips_withdrawn(&env, &address, 2_000_000, 40_000);
}

// ── emit_credit_score_updated tests ──────────────────────────────────────────

#[test]
fn emit_credit_score_updated_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);
    let old_score = 40u32;
    let new_score = 65u32;

    events::emit_credit_score_updated(&env, &address, old_score, new_score);
}

#[test]
fn emit_credit_score_updated_score_increase_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);

    events::emit_credit_score_updated(&env, &address, 40, 50);
    events::emit_credit_score_updated(&env, &address, 50, 60);
    events::emit_credit_score_updated(&env, &address, 60, 75);
}

#[test]
fn emit_credit_score_updated_score_decrease_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);

    events::emit_credit_score_updated(&env, &address, 80, 60);
}

#[test]
fn emit_credit_score_updated_same_score_does_not_panic() {
    let env = setup();
    let address = Address::generate(&env);

    events::emit_credit_score_updated(&env, &address, 50, 50);
}

// ── emit_admin_changed tests ─────────────────────────────────────────────────

#[test]
fn emit_admin_changed_does_not_panic() {
    let env = setup();
    let old_admin = Address::generate(&env);
    let new_admin = Address::generate(&env);

    events::emit_admin_changed(&env, &old_admin, &new_admin);
}

#[test]
fn emit_admin_changed_multiple_transfers_does_not_panic() {
    let env = setup();
    let admin1 = Address::generate(&env);
    let admin2 = Address::generate(&env);
    let admin3 = Address::generate(&env);

    events::emit_admin_changed(&env, &admin1, &admin2);
    events::emit_admin_changed(&env, &admin2, &admin3);
}

// ── emit_fee_updated tests ───────────────────────────────────────────────────

#[test]
fn emit_fee_updated_does_not_panic() {
    let env = setup();
    let old_bps = 200u32;
    let new_bps = 300u32;

    events::emit_fee_updated(&env, old_bps, new_bps);
}

#[test]
fn emit_fee_updated_fee_increase_does_not_panic() {
    let env = setup();

    events::emit_fee_updated(&env, 100, 200);
}

#[test]
fn emit_fee_updated_fee_decrease_does_not_panic() {
    let env = setup();

    events::emit_fee_updated(&env, 300, 150);
}

#[test]
fn emit_fee_updated_to_zero_does_not_panic() {
    let env = setup();

    events::emit_fee_updated(&env, 200, 0);
}

// ── multiple events tests ────────────────────────────────────────────────────

#[test]
fn multiple_different_events_do_not_panic() {
    let env = setup();
    let address = Address::generate(&env);
    let username = String::from_str(&env, "charlie");
    let from = Address::generate(&env);
    let to = Address::generate(&env);

    // Emit various events
    events::emit_profile_registered(&env, &address, &username);
    events::emit_tip_sent(&env, &from, &to, 1_000_000);
    events::emit_credit_score_updated(&env, &address, 40, 50);
    events::emit_profile_updated(&env, &address);
}

#[test]
fn events_emitted_in_order_do_not_panic() {
    let env = setup();
    let address = Address::generate(&env);

    // Emit events in specific order
    events::emit_profile_updated(&env, &address);
    events::emit_credit_score_updated(&env, &address, 40, 50);
    events::emit_tips_withdrawn(&env, &address, 1_000_000, 20_000);
}

#[test]
fn all_event_types_can_be_emitted_without_panic() {
    let env = setup();
    let addr1 = Address::generate(&env);
    let addr2 = Address::generate(&env);
    let username = String::from_str(&env, "test");

    // Emit one of each event type
    events::emit_profile_registered(&env, &addr1, &username);
    events::emit_profile_updated(&env, &addr1);
    events::emit_tip_sent(&env, &addr1, &addr2, 1_000_000);
    events::emit_tips_withdrawn(&env, &addr1, 500_000, 10_000);
    events::emit_credit_score_updated(&env, &addr1, 40, 60);
    events::emit_admin_changed(&env, &addr1, &addr2);
    events::emit_fee_updated(&env, 200, 300);
}

// ── topic verification tests ─────────────────────────────────────────────────

#[test]
fn verify_topic_symbols_are_valid() {
    // Verify that all symbol_short! macros compile correctly
    let _ = symbol_short!("profile");
    let _ = symbol_short!("register");
    let _ = symbol_short!("updated");
    let _ = symbol_short!("tip");
    let _ = symbol_short!("sent");
    let _ = symbol_short!("withdrawn");
    let _ = symbol_short!("credit");
    let _ = symbol_short!("admin");
    let _ = symbol_short!("changed");
    let _ = symbol_short!("fee");
}
