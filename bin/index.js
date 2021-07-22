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
const fs = require('fs');
const UnsignedTransaction = require ("../schema/UnsignedTransaction.umd.js");
const arrayBufferToHex = require('array-buffer-to-hex');

//TODO：for now we directly set up as testnet, will deal with this later. 
process.env.LUMOS_CONFIG_NAME = "AGGRON4";
initializeConfig();

const CKB_CONFIG = getConfig();

// Get the node info and connect to the node.
const CKB_RPC_URI = process.env.CKB_RPC_URI || "http://127.0.0.1:8114";
const CKB_INDEXER_DATA = process.env.CKB_INDEXER_DATA || "./indexer-data";
const indexer = new Indexer(CKB_RPC_URI, CKB_INDEXER_DATA);
indexer.startForever();

// generate wholetx

/* Read UnsignedTx.json file */

let rawdata = fs.readFileSync('UnsignedTx.json');
//console.log (typeof rawdata);

let unsignedtx = rawdata.toString();
//console.log(unsignedtx)


const wholetx = new Object();
const UnsignedTx = new UnsignedTransaction.UnsignedTransaction(new toolkit.Reader(unsignedtx));
//console.log(UnsignedTx);

const tx = UnsignedTx.getTx();


wholetx.version = "0x"+tx.getRaw().getVersion().toBigEndianUint32().toString(16);
console.log(tx.getRaw().getVersion().raw())
console.log(typeof tx.getRaw().getVersion().raw())

const cellDeps_arraybuffer = new Array();
for ( var i=0; i < tx.getRaw().getCellDeps().length(); i++){
  cellDeps_arraybuffer.push({
    "out_point":{
      "tx_hash":tx.getRaw().getCellDeps().indexAt(i).getOutPoint().getTxHash().raw(),
      "index":tx.getRaw().getCellDeps().indexAt(i).getOutPoint().getIndex()
    },
    "dep_type":tx.getRaw().getCellDeps().indexAt(i).getDepType() 
   });
  }
//console.log(cellDeps_arraybuffer);

// "dep_type" = uint8(1) means that "dep_type" is "dep_group"
wholetx.cell_deps = new Array();
for ( var i=0; i < tx.getRaw().getCellDeps().length(); i++){
  wholetx.cell_deps.push({
    "out_point":{
      "tx_hash":"0x"+ Buffer.from(cellDeps_arraybuffer[i].out_point.tx_hash).toString("hex"),
      "index":"0x"+cellDeps_arraybuffer[i].out_point.index.toBigEndianUint32().toString(16)
    },
    "dep_type":"dep_group"
   });
  }
//console.log(wholetx.cell_deps);



const headerDeps_arraybuffer = new Array();
for ( var i=0; i < tx.getRaw().getHeaderDeps().length(); i++){
  outputsData_arraybuffer.push(tx.getRaw().getHeaderDeps().indexAt(i).raw());
   }
// Becuase headerDeps_arraybuffer = []
//console.log(headerDeps_arraybuffer);
wholetx.header_deps = [];


//console.log(tx.getRaw().getInputs());
const inputs_arraybuffer = new Array();
for ( var i=0; i < tx.getRaw().getInputs().length(); i++){
  inputs_arraybuffer.push({
    "since":tx.getRaw().getInputs().indexAt(i).getSince().raw(),
    "previous_output":{
      "tx_hash":tx.getRaw().getInputs().indexAt(i).getPreviousOutput().getTxHash().raw(),
      "index":tx.getRaw().getInputs().indexAt(i).getPreviousOutput().getIndex()
    },  
   });
  }
//console.log(inputs_arraybuffer);
wholetx.inputs = new Array();

for ( var i=0; i < tx.getRaw().getInputs().length(); i++){
  wholetx.inputs.push({
    "since":"0x"+Buffer.from(inputs_arraybuffer[i].since).toString("hex"),
    "previous_output":{
      "tx_hash":"0x"+Buffer.from(inputs_arraybuffer[i].previous_output.tx_hash).toString('hex'),
      "index":"0x"+inputs_arraybuffer[i].previous_output.index.toLittleEndianUint32().toString(16)
    },
    
   });
  }
//console.log(wholetx.inputs);


//console.log(tx.getRaw().getOutputs());
const outputs_arraybuffer = new Array();
for ( var i=0; i < tx.getRaw().getOutputs().length(); i++){
  outputs_arraybuffer.push({
    "capacity":tx.getRaw().getOutputs().indexAt(i).getCapacity().toLittleEndianBigUint64(),
    "lock": {
      "code_hash":tx.getRaw().getOutputs().indexAt(i).getLock().getCodeHash().raw(),
      "hash_type":tx.getRaw().getOutputs().indexAt(i).getLock().getHashType(),
      "args":tx.getRaw().getOutputs().indexAt(i).getLock().getArgs().raw()
    }, 
    
   });
  }
console.log(outputs_arraybuffer);

wholetx.outputs = new Array();
for ( var i=0; i < tx.getRaw().getOutputs().length(); i++){
  wholetx.outputs.push({
    "capacity":"0x"+ outputs_arraybuffer[i].capacity.toString(16),
    "lock": {
      "code_hash":"0x"+Buffer.from(outputs_arraybuffer[i].lock.code_hash).toString("hex"),
      "hash_type":"type",
      "args":"0x"+Buffer.from(outputs_arraybuffer[i].lock.args).toString("hex")
    },
   });
  }
console.log(wholetx.outputs);


const outputsData_arraybuffer = new Array();
for ( var i=0; i < tx.getRaw().getOutputsData().length(); i++){
  outputsData_arraybuffer.push(tx.getRaw().getOutputsData().indexAt(i).raw());
   }

wholetx.outputs_data = new Array()
for ( var i=0; i < tx.getRaw().getOutputsData().length(); i++){
  wholetx.outputs_data.push("0x"+Buffer.from(outputsData_arraybuffer[i]).toString("hex"));
   }

const witness_arraybuffer =  new Array();
for ( var i=0; i < tx.getWitnesses().length(); i++){
  witness_arraybuffer.push(tx.getWitnesses().indexAt(i).raw());
   }

wholetx.witnesses = new Array()
for (var i=0; i < tx.getWitnesses().length(); i++){
wholetx.witnesses.push("0x"+Buffer.from(witness_arraybuffer[i]).toString("hex"));
}

console.log(JSON.stringify(wholetx,null,2));


// Get the input cells info from the wholetx
const INPUT_TX_HASH = wholetx.inputs[0].previous_output.tx_hash;
//console.log(INPUT_TX_HASH);

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
   obj.outputs = new Array();
   for ( var i=0; i < wholetx.outputs.length; i++){
    obj.outputs.push({ "cell_output": wholetx.outputs[i],"data":wholetx.outputs_data[i]});
     }
  obj.witnesses = List(["0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"]);
  obj.fixedEntries = [];
  obj.signingEntries = [];
  obj.inputSinces = {};

  
  //Convert js object to TransactionSkeleton 
  let txSkeleton = objectToTransactionSkeleton(obj);


  // Use `common.prepareSigningEntries` to generate `message`
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntriesArray = txSkeleton.signingEntries.toArray();

  console.log("The generated message is "+ signingEntriesArray[0].message);
}

main();
