// CRYPTO CONDITIONS EXAMPLE:
// - utils js-driver: https://github.com/bigchaindb/js-bigchaindb-driver/blob/master/src/transaction/utils/ccJsonLoad.js
// - Python example (outdated): https://docs.bigchaindb.com/projects/server/en/v0.6.0/drivers-clients/python-server-api-examples.html#introduction
// - Handcrafted Python crypto-conditions example: https://docs.bigchaindb.com/projects/py-driver/en/latest/handcraft.html
// - Kyber cryptoconditions complex example: https://github.com/bigchaindb/kyber/blob/master/tutorials/04_cryptoconditions_transactions/cryptoconditions_transactions.py
// - Crypto conditions JS (five-bells IPL) (more examples I think): https://github.com/interledgerjs/five-bells-condition
// - Five-bells on NPM: https://www.npmjs.com/package/five-bells-condition


import * as driver from 'bigchaindb-driver'
import * as cc from 'five-bells-condition'
import base58 from 'bs58'
import * as sha3 from 'js-sha3'

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
  {'asset': 'bicycle'},
  {'purchase_price': '€240'},
  [ 
    driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey))
  ],
  alice.publicKey
)

// Sign the transaction with private keys of Alice to fulfill it
const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, alice.privateKey)

conn.postTransaction(txCreateAliceSimpleSigned)
  // Check status of transaction every 0.5 seconds until fulfilled
  .then(() => (conn.pollStatusAndFetchTransaction(txCreateAliceSimpleSigned.id)))

  // Create transfer to Carly with specific condition (treshold 2: so 2 out of 3 family memebers (alice, bob, carly) have to sign to sell the bike)
  .then(() => {
      
    /* const thresholdFulfillment = new cc.ThresholdSha256()

    // Possible fulfillment from Alice: 
    const ed25519FulfillmentAlice = new cc.Ed25519Sha256()
    ed25519FulfillmentAlice.setPublicKey(new Buffer(base58.decode(alice.publicKey)))
    console.log('Fulfillment uri Alice: ', ed25519FulfillmentAlice.getConditionUri())

    thresholdFulfillment.addSubfulfillmentUri(ed25519FulfillmentAlice.getConditionUri()) */


    /* // Possible fulfillment from Bob: 
    const ed25519FulfillmentBob = new cc.Ed25519Sha256()
    ed25519FulfillmentBob.setPublicKey(new Buffer(base58.decode(alice.publicKey)))
    console.log('Fulfillment uri Bob: ', ed25519FulfillmentBob.getConditionUri())
    thresholdFulfillment.addSubfulfillmentUri(ed25519FulfillmentBob.getConditionUri())

    // Possible fulfillment from Carly: 
    const ed25519FulfillmentCarly = new cc.Ed25519Sha256()
    ed25519FulfillmentCarly.setPublicKey(new Buffer(base58.decode(alice.publicKey)))
    console.log('Fulfillment uri Carly: ', ed25519FulfillmentCarly.getConditionUri())
    thresholdFulfillment.addSubfulfillmentUri(ed25519FulfillmentCarly.getConditionUri()) */


    /* thresholdFulfillment.setThreshold(2) // defaults to subconditions.length 
    console.log(thresholdFulfillment.getConditionUri()) */


    let subConditionFrom = driver.Transaction.makeEd25519Condition(alice.publicKey, false)
    let subConditionTo = driver.Transaction.makeEd25519Condition(carly.publicKey, false)

    let condition = driver.Transaction.makeThresholdCondition(1, [subConditionFrom, subConditionTo])

    let output = driver.Transaction.makeOutput(condition)
    output.public_keys = [carly.publicKey]

    let transaction = driver.Transaction.makeTransferTransaction(
        txCreateAliceSimpleSigned,
        {'meta': 'Transfer to new user with conditions'},
        [output],
        0
    )

    transaction.inputs[0].owners_before = [alice.publicKey]
    /* delete transaction.id
    
    transaction.id = sha3.sha3_256
        .create()
        .update(driver.Transaction.serializeTransactionIntoCanonicalString(transaction))
        .hex() */

    let signedCryptoConditionTx = driver.Transaction.signTransaction(transaction, alice.privateKey)



    /* const ed25519FulfillmentAlice = new cc.Ed25519Sha256()
    ed25519FulfillmentAlice.setPublicKey(new Buffer(base58.decode(alice.publicKey)))

    const ed25519FulfillmentBob = new cc.Ed25519Sha256()
    ed25519FulfillmentBob.setPublicKey(new Buffer(base58.decode(bob.publicKey)))

    const ed25519FulfillmentCarly = new cc.Ed25519Sha256()
    ed25519FulfillmentCarly.setPublicKey(new Buffer(base58.decode(carly.publicKey)))



    // Create TresholdCondition Obj
    const tresholdCondition = driver.Transaction.makeThresholdCondition(1, [ed25519FulfillmentAlice, ed25519FulfillmentBob])







    // ADD CONDITION TO TRANSFER TX
    const txTransferCarly = driver.Transaction.makeTransferTransaction(
      txCreateAliceSimpleSigned,
      {price: '100 euro'},
      [
        driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(carly.publicKey))
      ],
      0)

      threshold_tx['transaction']['conditions'][0]['condition'] = {
        'details': threshold_condition.to_dict(),
        'uri': threshold_condition.condition.serialize_uri()
    } 

    // Sign with alice's private key
    let txTransferCarlySigned = driver.Transaction.signTransaction(txTransferCarly, alice.privateKey)
    console.log('Posting signed transaction: ', txTransferCarlySigned)*/

    // Post and poll status
    return conn.postTransaction(signedCryptoConditionTx)
  })
  .then(res => {
    console.log('Response from BDB server:', res)
    return conn.pollStatusAndFetchTransaction(res.id)
  })

  // Transfer bicycle because the mother found a buyer
  // Buyer is Bob
  .then(res => {
    console.log("transfer to Bob")
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
    console.log('end')
    return conn.pollStatusAndFetchTransaction(res.id)
  })
  .catch(err => console.log(err))
