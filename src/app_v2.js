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

// Sign the transaction with private key of Alice to fulfill it
const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, alice.privateKey)

conn.postTransaction(txCreateAliceSimpleSigned)
  .then(() => (conn.pollStatusAndFetchTransaction(txCreateAliceSimpleSigned.id)))
  .then(transaction => {
    let fulfillmentFrom = driver.Transaction.makeEd25519Condition(alice.publicKey, false)
    let subConditionTo = driver.Transaction.makeEd25519Condition(carly.publicKey, false)
    fulfillmentFrom.sign(
        new Buffer(driver.Transaction.serializeTransactionIntoCanonicalString(transaction)),
        new Buffer(base58.decode(alice.privateKey))
    )
    
    let fulfillment = driver.Transaction.makeThresholdCondition(1, undefined, false )
    fulfillment.addSubfulfillment(fulfillmentFrom);
    fulfillment.addCondition(subConditionTo);
    transaction.inputs[0].fulfillment = fulfillment.serializeUri(); */



    /* let subConditionFrom = driver.Transaction.makeEd25519Condition(alice.publicKey, false)
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
    delete transaction.id
    
    transaction.id = sha3.sha3_256
        .create()
        .update(driver.Transaction.serializeTransactionIntoCanonicalString(transaction))
        .hex()

    let signedCryptoConditionTx = driver.Transaction.signTransaction(transaction, alice.privateKey)

    return conn.postTransaction(transaction)
  })
  .then(res => {
    console.log('Response from BDB server:', res)
    return conn.pollStatusAndFetchTransaction(res.id)
    console.log('Going to transfer to Bob\n\n')
  })

  // Transfer bicycle because Carly (mother) found a buyer
  // Buyer is Bob
  .then(res => {
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
