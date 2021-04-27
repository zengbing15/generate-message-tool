#!/usr/bin/env node

'use strict';
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

/* Read tx.json file */
const fs = require('fs');
let rawdata = fs.readFileSync('wholetx.json');
let wholetx = JSON.parse(rawdata);

/* Generate plain object of TransactionSkeleton */

// Get the input cells info from the wholetx
const INPUT_TX_HASH = "0xa3dbfc7b2089f4bd6141342e25f21b03bcdd13f2b8600384aca37625a3a8735e";

async function main() {
  const rpc = new toolkit.RPC("http://127.0.0.1:8114");
  const transaction = (await rpc.get_transaction(INPUT_TX_HASH)).transaction;
  const txstatus = (await rpc.get_transaction(INPUT_TX_HASH)).tx_status;
  const blockheader = (await rpc.get_block(txstatus.block_hash)).header;

// TODO: for now witness = {lock is 0, input_type is null, output_type is null},will deal with that input_type/output_type isn't null later. 
  const obj = new Object();
  obj.cellProvider = { indexer };
  obj.cellDeps = transaction.cell_deps;
  obj.headerDeps = transaction.header_deps;
  obj.inputs = List([
    { "cell_output": transaction.outputs[1], 
      "out_point": wholetx.inputs[0].previous_output,
      "block_hash": txstatus.block_hash ,
      "block_number": blockheader.number, 
      "data": transaction.outputs_data[1]}]);

  obj.outputs = List([
    { "cell_output": wholetx.outputs[0],"data":wholetx.outputs_data[0]},
    {"cell_output":wholetx.outputs[1],"data":wholetx.outputs_data[1]}]);
  obj.witnesses = List(["0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"]);
  obj.fixedEntries = [];
  obj.signingEntries = [];
  obj.inputSinces = {};

  /* Convert js object to TransactionSkeleton */
  let txSkeleton = objectToTransactionSkeleton(obj);


  // Use `common.prepareSigningEntries` to generate `message`
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  console.log(JSON.stringify(txSkeleton.signingEntries));
}
main();
