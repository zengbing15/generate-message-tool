# generate-message-tool
Generate `message` from a whole transaction.
For securely signing CKB transactions we provide a tool to generate message from the whole transaction,so you can compare it with the message generated from felix. Please refer to [github repo](https://github.com/zengbing15/felix#use-generate-message-tool-to-validate-the-messages) for more details.

## How to Run

* [Run a CKB Testnet node](https://docs.nervos.org/docs/basics/guides/testnet).
* Copy the transaction JSON code generated by [felix](https://github.com/zengbing15/felix) into this repo (such as `wholetx.json` in this repo)
* Fill in the tx_hash in `inputs` from the whole transaction

```bash
wholetx.json:
    "inputs": [
      {
        "since": "0x0",
        "previous_output": {
          "tx_hash": "0xa3dbfc7b2089f4bd6141342e25f21b03bcdd13f2b8600384aca37625a3a8735e",
          "index": "0x1"
        }
      }
    ],

index.js:
const INPUT_TX_HASH = "0xa3dbfc7b2089f4bd6141342e25f21b03bcdd13f2b8600384aca37625a3a8735e";

``` 

* Install dependencies
 `npm install`
* Run generate-message-tool
`npm start`
* Comprare the `message` with the message generated by [felix](https://github.com/zengbing15/felix)

```bash
the message generated by this tool:

[{"type":"witness_args_lock","index":0,"message":"0xec745fb6f19f9b3c0502d30a6dcdeca733ff5d835fbfe506e949bb88f17b6d5c"}]


the message generated by felix:

Please sign the following messages required by the transaction:

Address: ckt1qyqddquttee9zqlj7xlmtrd7vjunp2zh5f3spa2vjy
Message: 0xec745fb6f19f9b3c0502d30a6dcdeca733ff5d835fbfe506e949bb88f17b6d5c

Signatures must be in hex string format with 0x prefix, each different signature should occupy its own line.

```
