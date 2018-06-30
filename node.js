var net = require('net');	
var sha=require("js-sha256");
var fs = require('fs');
//Polymer (Atom-Chain) V0.0.0.0

function block(data,prevhash=chain[index-1].hash)
{
	this.index=++index;
	this.timestamp=new Date().getTime()/1000;
	this.prevhash=prevhash;
	this.data=data;
	this.hash=sha.sha256(data).toString();
}

function valid(block)
{
	return (block.index==index+1)&&(sha.sha256(block.data).toString()==block.hash)&&(block.prevhash=chain[index].hash);
}

var index=-1;
var chain=[new block("Starting chain",0)];

peers=[]

function broadcast(data)
{
	console.log("Block valid.\r\nBroadcasting update:\r\n"+data);
	var keys=Object.keys(peers);
	for(var i=0;i<keys.length;i++)
	{
		peers[keys[i]].write(data);
	}
}

console.log("Starting Polymer\r\n");
var server = net.createServer(function(socket) {
	console.log("Connection.");
	socket.name=socket.remoteAddress;
	socket.ID=Math.random();
	peers[socket.name]=socket;
	socket.write(JSON.stringify(chain));
	socket.on('data',(data)=>
	{
		console.log("Block received from ("+socket.name+" ["+socket.ID+"]):\r\n"+data);
		var b=JSON.parse(data);
		if(valid(b))chain.push(b);
		else
		{
			console.log("Invalid block.Ignoring.");
			return;
		}
		index++;
		broadcast(JSON.stringify(chain));
		fs.writeFile("blockchain", JSON.stringify(chain), function(err) {
			if(err) {
				return console.log(err);
			}
		
			console.log("Blockchain image saved.");
		});
	});
	socket.on('error',(data)=>{console.log("Peer connection failed suddenly. Eliminating.");peers[socket.name]=undefined;});
});

server.listen(80, '127.0.0.1');