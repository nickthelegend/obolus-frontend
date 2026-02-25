pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";

template ShieldedWithdraw() {
    // Private
    signal input secret;

    // Public
    signal input amount;
    signal input recipient;
    signal input commitment;
    signal input nullifier;
    
    // Callback Public Inputs (Programmable Actions)
    signal input callbackTarget;
    signal input callbackSelector;
    signal input callbackArgsHash;

    // 1. Verify Commitment: commitment == Poseidon(secret, amount, callbackTarget, callbackSelector, callbackArgsHash)
    component cHasher = Poseidon(5);
    cHasher.inputs[0] <== secret;
    cHasher.inputs[1] <== amount;
    cHasher.inputs[2] <== callbackTarget;
    cHasher.inputs[3] <== callbackSelector;
    cHasher.inputs[4] <== callbackArgsHash;
    cHasher.out === commitment;

    // 2. Verify Nullifier: nullifier == Poseidon(secret, commitment)
    component nHasher = Poseidon(2);
    nHasher.inputs[0] <== secret;
    nHasher.inputs[1] <== commitment;
    nHasher.out === nullifier;

    // 3. Bind recipient to the proof
    signal recipient_squared <== recipient * recipient;
}

component main {public [amount, recipient, commitment, nullifier, callbackTarget, callbackSelector, callbackArgsHash]} = ShieldedWithdraw();
