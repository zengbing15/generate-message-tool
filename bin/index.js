const { RPC } = require("@ckb-lumos/rpc");
const { common } = require('@ckb-lumos/common-scripts');
const { Indexer } = require("@ckb-lumos/indexer");
const { initializeConfig, 
    getConfig 
} = require("@ckb-lumos/config-manager");
const {objectToTransactionSkeleton,} = require("@ckb-lumos/helpers");
const { List } = require("immutable");
const { Reader } = require("ckb-js-toolkit");
const fs = require('fs');
const UnsignedTransaction = require ("../schema/UnsignedTransaction.umd.js");


process.env.LUMOS_CONFIG_FILE = process.env.LUMOS_CONFIG_FILE || './config.json'
initializeConfig();
const CKB_CONFIG = getConfig();

const CKB_RPC_URI = process.env.CKB_RPC_URI || "http://localhost:8114";
const CKB_INDEXER_DATA = process.env.CKB_INDEXER_DATA || "./indexer-data";
const indexer = new Indexer(CKB_RPC_URI, CKB_INDEXER_DATA);
indexer.startForever();

/* Read UnsignedTx.json file */

let rawdata = fs.readFileSync('UnsignedTx.json');
let unsignedtx = rawdata.toString();
const wholetx = new Object();
const UnsignedTx = new UnsignedTransaction.UnsignedTransaction(new Reader(unsignedtx));

const tx = UnsignedTx.getTx();


wholetx.version = "0x"+tx.getRaw().getVersion().toBigEndianUint32().toString(16);

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

for ( var i=0; i < tx.getRaw().getHeaderDeps().length(); i++){
  outputsData_arraybuffer.push(tx.getRaw().getHeaderDeps().indexAt(i).raw());
   }
// Because headerDeps_arraybuffer = []
wholetx.header_deps = [];

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

async function main() {
    
    const rpc = new RPC("http://localhost:8114");
    const INPUT_TX_HASH = wholetx.inputs[0].previous_output.tx_hash;

    const transaction = (await rpc.get_transaction(INPUT_TX_HASH)).transaction;

    const txstatus = (await rpc.get_transaction(INPUT_TX_HASH)).tx_status;
    const blockheader = (await rpc.get_block(txstatus.block_hash)).header;

    // witness = {lock is 0, input_type is null, output_type is null}
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

  let txSkeleton = objectToTransactionSkeleton(obj);
  console.log(JSON.stringify(txSkeleton.toJS(),null,2));

  txSkeleton = common.prepareSigningEntries(txSkeleton);
  //console.log(JSON.stringify(txSkeleton.toJS(),null,2));

  const signingEntriesArray = txSkeleton.signingEntries.toArray();

  console.log("The generated message is "+ signingEntriesArray[0].message);
}

main();