#!/usr/bin/env node
'use strict';
const toolkit = require("ckb-js-toolkit");
const { common } = require('@ckb-lumos/common-scripts');
const { Indexer } = require("@ckb-lumos/indexer");
const { TransactionSkeleton, objectToTransactionSkeleton, } = require("@ckb-lumos/helpers");
// use `config-manager` to get node info
const { initializeConfig, getConfig } = require("@ckb-lumos/config-manager");
const { List } = require("immutable");
const UnsignedTransaction = require("../schema/UnsignedTransaction.umd.js");
const toArrayBuffer = require('to-arraybuffer');
//TODO：for now we directly set up as testnet, will deal with this later. 
process.env.LUMOS_CONFIG_NAME = "AGGRON4";
initializeConfig();
const CKB_CONFIG = getConfig();
// Get the node info and connect to the node.
const CKB_RPC_URI = process.env.CKB_RPC_URI || "http://127.0.0.1:8114";
const CKB_INDEXER_DATA = process.env.CKB_INDEXER_DATA || "./indexer-data";
const indexer = new Indexer(CKB_RPC_URI, CKB_INDEXER_DATA);
indexer.startForever();
// generate unsignedtx
/* Read UnsignedTx.json file */
const fs = require('fs');
let rawdata = fs.readFileSync('UnsignedTx.json');
let unsignedtx = toArrayBuffer(Buffer.from(JSON.stringify(rawdata)));
console.log(rawdata);
//console.log (typeof unsignedtx);
const UnsignedTx = new UnsignedTransaction.UnsignedTransaction(unsignedtx);
console.log(UnsignedTx);
/* Generate plain object of TransactionSkeleton */
// Get the input cells info from the wholetx
const INPUT_TX_HASH = "0x64dfa49d9ccdbae3ba4c5f1da5ac531940417a65d0ec12fcbbc26cae6a79d567";
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
            "block_hash": txstatus.block_hash,
            "block_number": blockheader.number,
            "data": transaction.outputs_data[1] }
    ]);
    obj.outputs = new Array();
    for (var i = 0; i < wholetx.outputs.length; i++) {
        obj.outputs.push({ "cell_output": wholetx.outputs[i], "data": wholetx.outputs_data[i] });
    }
    obj.witnesses = List(["0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"]);
    obj.fixedEntries = [];
    obj.signingEntries = [];
    obj.inputSinces = {};
    // generate serialized unsignedtx file
    const Unsigned_Transction = require("../schema/Unsigned_Transaction");
    var buffer = new ArrayBuffer();
    buffer = instanceOfFileReader.readAsArrayBuffer(rawdata);
    console.log(buffer);
    let results = Unsigned_Transction.SerializeUnsignedTransaction(buffer);
    console.log(results);
    /* Convert js object to TransactionSkeleton */
    let txSkeleton = objectToTransactionSkeleton(obj);
    // Use `common.prepareSigningEntries` to generate `message`
    txSkeleton = common.prepareSigningEntries(txSkeleton);
    console.log(JSON.stringify(txSkeleton.signingEntries));
}
main();
