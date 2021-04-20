
const toolkit = require("ckb-js-toolkit");
const { common } = require('@ckb-lumos/common-scripts');
const { Indexer } = require("@ckb-lumos/indexer");
const {
  TransactionSkeleton,
  objectToTransactionSkeleton,
} = require("@ckb-lumos/helpers");

// use `config-manager` to get node info
const { initializeConfig, getConfig } = require("@ckb-lumos/config-manager");
const { List } = require("immutable");

//TODO：for now we directly set up as testnet, will deal with this later. 
process.env.LUMOS_CONFIG_NAME = "AGGRON4";
initializeConfig();

const CKB_CONFIG = getConfig();

// Get the node info and connect to the node.
const CKB_RPC_URI = process.env.CKB_RPC_URI || "http://127.0.0.1:8114";
const CKB_INDEXER_DATA = process.env.CKB_INDEXER_DATA || "./indexer-data";
const indexer = new Indexer(CKB_RPC_URI, CKB_INDEXER_DATA);
indexer.startForever();


/* Generate plain object of TransactionSkeleton */
// TODO: Write a script to get the content of the transaction and call CKB JSON-RPC.


const TX_HASH = "0xb91a9893f65373d4a69baa43eb5dbbe55e54c1c6c87f404994a6f8622e36c139";

async function main() {
  const rpc = new toolkit.RPC("http://127.0.0.1:8114");
  const transaction = (await rpc.get_transaction(TX_HASH)).transaction;
  const txstatus = (await rpc.get_transaction(TX_HASH)).tx_status;
  const blockheader = (await rpc.get_block(txstatus.block_hash)).header;

  /**  console.log for debugging
  console.log(typeof transaction);
  console.log(JSON.stringify(transaction.outputs[1]));
  console.log(JSON.stringify(txstatus.block_hash));
  console.log(JSON.stringify(blockheader.number));
**/

// TODO: for now witness = {lock is 0, input_type is null, output_type is null},will deal with that input_type/output_type isn't null later. 
  const obj = new Object();
  obj.cellProvider = { indexer };
  obj.cellDeps = List([{ "out_point": { "tx_hash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37", "index": "0x0" }, "dep_type": "dep_group" }]);
  obj.headerDeps = List([]);
  obj.inputs = List([{ "cell_output": transaction.outputs[1], "out_point": {"tx_hash":"0xb91a9893f65373d4a69baa43eb5dbbe55e54c1c6c87f404994a6f8622e36c139","index":"0x1"},"block_hash": txstatus.block_hash ,"block_number": blockheader.number, "data": "0x"}]);
  //obj.inputs = List([{ "cell_output": { "capacity": "0x5a07b819e92c", "lock": { "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", "hash_type": "type", "args": "0xd6838b5e725103f2f1bfb58dbe64b930a857a263" } }, "out_point": { "tx_hash": "0xb91a9893f65373d4a69baa43eb5dbbe55e54c1c6c87f404994a6f8622e36c139", "index": "0x1" }, "block_hash": "0x4780f397efc7fbe525d6fa0b2f700283c7a55e9d349ae76b1b2fef3ffe5ebb73", "block_number": "0x17adbc", "data": "0x" }]);
  obj.outputs = List([{ "cell_output": { "capacity": "0xba43b7400", "lock": { "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", "hash_type": "type", "args": "0x70e4d583965fa93e8329f09bd7ed7b600be7c766" } }, "data": "0x" }, { "cell_output": { "capacity": "0x59fc13de735c", "lock": { "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", "hash_type": "type", "args": "0xd6838b5e725103f2f1bfb58dbe64b930a857a263" } }, "data": "0x" }]);
  obj.witnesses = List(["0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"]);
  obj.fixedEntries = [];
  obj.signingEntries = [];
  obj.inputSinces = {};

  /* Convert js object to TransactionSkeleton */
  let txSkeleton = objectToTransactionSkeleton(obj);

/**  
  console.log(txSkeleton);
  console.log(typeof txSkeleton);
  console.log(JSON.stringify(txSkeleton));
  **/

  // Use `common.prepareSigningEntries` to generate `message`
  txSkeleton = common.prepareSigningEntries(txSkeleton //{ config: CKB_CONFIG }
  );

  console.log(JSON.stringify(txSkeleton.signingEntries));
}
main();
