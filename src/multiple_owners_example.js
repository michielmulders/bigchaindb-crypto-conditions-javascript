// MULTIPLe OWNERS EXAMPLe: https://docs.bigchaindb.com/projects/py-driver/en/latest/advanced-usage.html#multiple-owners

import * as driver from 'bigchaindb-driver'
import * as cc from 'five-bells-condition'

const API_PATH = 'https://test.ipdb.io/api/v1/'
const conn = new driver.Connection(API_PATH, { 
  app_id: 'dfa777d5',
  app_key: '7208ea9bf95b43ce3a95f7c727e33fb9'
})

// Create family members
const alice = new driver.Ed25519Keypair()
const bob = new driver.Ed25519Keypair()
const carly = new driver.Ed25519Keypair()

console.log('Alice: ', alice.publicKey)
console.log('Bob: ', bob.publicKey)
console.log('Carly: ', carly.publicKey)

// Define the asset to store, in this example
// we store a bicycle with its serial number and manufacturer
const assetdata = {
  'bicycle': {
    'serial_number': 'cde553239qf65',
    'manufacturer': 'Bicycle Inc.',
  }
}

// Metadata contains information about the transaction itself
// (can be `null` if not needed)
// E.g. the bicycle is fabricated on earth
const metadata = {'planet': 'earth'}

// Construct a transaction payload
const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
  assetdata,
  metadata,

  // A transaction needs an output
  [ 
    driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey)),
    driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))
  ],
  alice.publicKey
)

// Sign the transaction with private keys of Alice to fulfill it
const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, alice.privateKey)

conn.postTransaction(txCreateAliceSimpleSigned)
  // Check status of transaction every 0.5 seconds until fulfilled
  .then(() => (conn.pollStatusAndFetchTransaction(txCreateAliceSimpleSigned.id)))

  // Transfer bicycle to Bob where both Bob and his mother Carly have to sign the transaction
  .then(() => {
    const txTransferCarly = driver.Transaction.makeTransferTransaction(
      txCreateAliceSimpleSigned,
      {price: '100 euro'},
      [
        driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(carly.publicKey))
      ],
      0)

    // Sign with alice's private key
    let txTransferCarlySigned = driver.Transaction.signTransaction(txTransferCarly, alice.privateKey, bob.privateKey)
    console.log('Posting signed transaction: ', txTransferCarlySigned)

    // Post and poll status
    return conn.postTransaction(txTransferCarlySigned)
  })
  .then(res => {
    console.log('Response from BDB server:', res)
    console.log('\n\n\nReached ENDDDDDDD')
    return conn.pollStatusAndFetchTransaction(res.id)
  })
  .catch(err => console.log(err))