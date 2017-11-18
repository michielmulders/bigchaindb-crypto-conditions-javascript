import * as driver from 'bigchaindb-driver'
import * as sha3 from 'js-sha3'
import base58 from 'base58'

const API_PATH = 'https://test.ipdb.io/api/v1/'
const conn = new driver.Connection(API_PATH, { 
  app_id: 'dfa777d5',
  app_key: '7208ea9bf95b43ce3a95f7c727e33fb9'
})

// Create family members
const alice = new driver.Ed25519Keypair() // Daughter
const bob = new driver.Ed25519Keypair() // Buyer
const carly = new driver.Ed25519Keypair() // Mother

console.log('Alice: ', alice.publicKey)
console.log('Bob: ', bob.publicKey)
console.log('Carly: ', carly.publicKey)

// Construct a transaction payload
const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
  {'asset': 'bicycle'},
  {'purchase_price': '€240'},
  [ 
    driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey))
  ],
  alice.publicKey
)

let fulfillmentFrom = driver.Transaction.makeEd25519Condition(alice.publicKey, false)
let subConditionTo = driver.Transaction.makeEd25519Condition(carly.publicKey, false)
fulfillmentFrom.sign(
    new Buffer(driver.Transaction.serializeTransactionIntoCanonicalString(transaction)),
    new Buffer(base58.decode(alice.privateKey))
)

let fulfillment = driver.Transaction.makeThresholdCondition(1, undefined, false )
fulfillment.addSubfulfillment(fulfillmentFrom);
fulfillment.addCondition(subConditionTo);
txCreateAliceSimple.inputs[0].fulfillment = fulfillment.serializeUri();

// Sign the transaction with private key of Alice to fulfill it
const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, alice.privateKey)

conn.postTransaction(txCreateAliceSimpleSigned)
  .then(() => (conn.pollStatusAndFetchTransaction(txCreateAliceSimpleSigned.id)))
  
  // Transfer bicycle because Carly (mother) found a buyer
  // Buyer is Bob
  .then(res => {
    console.log('hierrrr')
    const txTransferBob = driver.Transaction.makeTransferTransaction(
        txCreateAliceSimpleSigned,
        {'sell_price': '100 euro'},
        [
            driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))
        ],
        0)

    const txTransferBobSigned = driver.Transaction.signTransaction(txTransferBob, alice.privateKey)

    return conn.postTransaction(txTransferBobSigned)
  })
  .then(res => {
    console.log('Response from BDB server:', res)
    return conn.pollStatusAndFetchTransaction(res.id)
    console.log('Going to transfer to Bob\n\n')
  })
  .catch(err => console.log(err))
