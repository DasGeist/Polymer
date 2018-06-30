var net = require('net');	
var sha=require("js-sha256");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function block(data,prevhash=chain[index-1].hash)
{
	this.index=index++;
	this.timestamp=new Date().getTime()/1000;
	this.prevhash=prevhash;
	this.data=data;
	this.hash=sha.sha256(data).toString();
}
var index=-1;
var chain=[];
var client = new net.Socket();
rl.question('IP:\r\n', (ip) => {
	client.connect(80, ip, function() {
		console.log('Client Connected');
	});
});

client.on('data', function(data) {
	console.log('Blockchain update');
	nchain=JSON.parse(data);
	chain=nchain;
	index=chain.length;
	rl.question('Data:\r\n', (data) => {
		console.log('Block created. Sending to polymer');
		bl=JSON.stringify(new block(data));
		console.log("Sending block:\r\n"+bl);
		client.write(bl);
	});
});

client.on('close', function() {
	console.log('Connection closed');
});